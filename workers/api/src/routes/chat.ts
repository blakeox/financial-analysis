/**
 * Chat Routes
 * Handles all AI chat endpoints with LLM orchestration
 */

import type { RouterType } from 'itty-router';
import type { Env } from '../types';
import {
  buildChatHeaders,
  buildRequestContext,
  validateChatMessage,
  detectThreats,
  validateRequestSize,
  getTurnstileTokenFromRequest,
  verifyTurnstileToken,
  logInfo,
  logWarn,
  logError,
  withErrorHandler,
  withSecurityContext,
  commitSecurityContext,
  commitBudgetReservation,
  getDefaultBudgetLimits,
  getDefaultReservationTtlSeconds,
  releaseBudgetReservation,
  reserveBudget,
  type SecurityContext,
} from '../lib';
import { canCreateOrchestrator, createLLMOrchestrator } from '../services/llm-service-factory';
import { estimateTokens } from '../utils/tokens';
import {
  createStructuredSSEStream,
  createStreamingSSEStream,
  buildSSEHeaders,
} from './chat-sse-helpers';

interface ChatBudgetReservation {
  reservationId: string | null;
  requestBytes: number;
  reservedModelTokens: number;
}

function getCurrentBudgetPeriod(now: Date): { periodStart: string; periodEnd: string } {
  return {
    periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString(),
    periodEnd: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString(),
  };
}

async function reserveChatBudget(
  request: Request,
  env: Env,
  requestContext: SecurityContext,
  requestBytes: number,
  capability: string
): Promise<ChatBudgetReservation | null> {
  if (env.BUDGET_ENFORCEMENT_ENABLED !== 'true') return null;

  const now = new Date();
  const limits = getDefaultBudgetLimits(env);
  const period = getCurrentBudgetPeriod(now);
  const reservation = await reserveBudget(env, {
    identity: {
      principalId: requestContext.auth?.customerId ?? `anonymous:${requestContext.fingerprint}`,
      clientId: requestContext.auth?.clientId ?? 'first-party-chat',
    },
    ...period,
    runId: requestContext.runId,
    capability,
    idempotencyKey: request.headers.get('Idempotency-Key') ?? requestContext.runId,
    units: {
      requestBytes,
      modelTokens: limits.modelTokens,
    },
    limits,
    expiresAt: new Date(
      now.getTime() + getDefaultReservationTtlSeconds(env.BUDGET_RESERVATION_TTL_SECONDS) * 1000
    ).toISOString(),
    degradedMode: 'fail-closed',
  });

  if (!reservation.allowed) {
    throw new Error(`CHAT_BUDGET_DENIED:${reservation.reason}`);
  }

  return {
    reservationId: reservation.reservationId,
    requestBytes,
    reservedModelTokens: limits.modelTokens,
  };
}

export function registerChatRoutes(router: RouterType) {
  // ---- Simple contextual chat endpoint (AI Orchestrator) ----
  router.post(
    '/v1/chat/enhanced',
    withErrorHandler(
      withSecurityContext(
        async (request: Request, env: Env, securityContext: SecurityContext) => {
          // Check security context
          const environment = env.ENVIRONMENT ?? 'development';
          const isNonProduction = environment !== 'production';
          if (!securityContext.isAllowed) {
            // In local/test runs the Durable Object binding may be missing (wrangler unstable_dev without config).
            // Keep the strict fail-closed semantics in `buildSecurityContext` (unit-tested), but don't block
            // chat flows in non-production when the only reason is session state being unavailable/stale.
            // In local dev/integration tests the Session DO can persist state across runs (alarms may not fire),
            // causing unexpected denials like `session_timeout`.
            if (isNonProduction && (securityContext.denyReason?.startsWith('session_') ?? false)) {
              logWarn(
                buildRequestContext(request, environment),
                'SESSION_DO unavailable; allowing chat request in non-production',
                { denyReason: securityContext.denyReason }
              );
            } else {
              return new Response(JSON.stringify({ error: securityContext.denyReason }), {
                status: 429,
                headers: { 'Retry-After': String(securityContext.retryAfter || 60) },
              });
            }
          }

          // Build request context for logging
          const requestContext = buildRequestContext(request, environment);
          logInfo(requestContext, 'Contextual chat request received');
          let budgetReservation: ChatBudgetReservation | null = null;

          try {
            // SECURITY: Validate Content-Type
            const contentType = request.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
              return new Response(
                JSON.stringify({
                  error: 'Unsupported Media Type',
                  message: 'Content-Type must be application/json',
                  requestId: requestContext.requestId,
                }),
                {
                  status: 415,
                  headers: buildChatHeaders(
                    env,
                    requestContext.requestId,
                    requestContext.correlationId
                  ),
                }
              );
            }

            // SECURITY: Validate request size before parsing body
            const contentLength = request.headers.get('Content-Length');
            const sizeValidation = validateRequestSize(contentLength);
            if (!sizeValidation.valid) {
              logWarn(requestContext, 'Request size validation failed', {
                error: sizeValidation.error,
                code: sizeValidation.code,
                contentLength,
              });
              return new Response(
                JSON.stringify({
                  error: sizeValidation.error,
                  code: sizeValidation.code,
                  requestId: requestContext.requestId,
                }),
                {
                  status: 413,
                  headers: buildChatHeaders(
                    env,
                    requestContext.requestId,
                    requestContext.correlationId
                  ),
                }
              );
            }

            const body = (await request.json()) as {
              message: string;
              context?: string;
              currentModel?: Record<string, unknown>;
              availableTools?: Array<{ name: string; description: string }>;
              toolOutputs?: Record<string, unknown> | null;
              contextData?: Record<string, unknown>;
              contextLabel?: string | null;
              memoryContext?: {
                conversationHistory?: string;
                modelStates?: string;
              };
              negative_constraints?: string[];
              /** Enable function calling for tool execution */
              enableFunctionCalling?: boolean;
              /** Optional Turnstile token (if you add it on the client) */
              turnstileToken?: string;
              /** Optional alias for Turnstile token */
              turnstileResponse?: string;
            };
            const {
              message,
              context = 'general',
              currentModel = {},
              availableTools = [],
              toolOutputs: rawToolOutputs,
              contextData = {},
              contextLabel = null,
              memoryContext = {},
              negative_constraints = [],
              enableFunctionCalling = false,
            } = body;

            // Optional Turnstile verification (no-op unless TURNSTILE_SECRET is set)
            const headerToken = getTurnstileTokenFromRequest(request);
            const token = body.turnstileToken || body.turnstileResponse || headerToken;
            if (env.TURNSTILE_SECRET) {
              const outcome = await verifyTurnstileToken(env, token, requestContext.clientIP);
              const enforce = env.TURNSTILE_ENFORCE_CHAT === '1';
              if (enforce && outcome.status !== 'PASS') {
                return new Response(
                  JSON.stringify({
                    error: 'Turnstile verification failed',
                    code: 'TURNSTILE_FAILED',
                    requestId: requestContext.requestId,
                  }),
                  {
                    status: 403,
                    headers: buildChatHeaders(
                      env,
                      requestContext.requestId,
                      requestContext.correlationId
                    ),
                  }
                );
              }
            }

            // Handle explicit null values (JS destructuring defaults don't apply to null)
            const toolOutputs = rawToolOutputs ?? {};

            // SECURITY: Comprehensive message validation and sanitization
            const validation = validateChatMessage(message);
            if (!validation.valid) {
              logWarn(requestContext, 'Message validation failed', {
                error: validation.error,
                code: validation.code,
                messageLength: message?.length || 0,
              });
              return new Response(
                JSON.stringify({
                  error: validation.error,
                  code: validation.code,
                  requestId: requestContext.requestId,
                }),
                {
                  status: 400,
                  headers: buildChatHeaders(
                    env,
                    requestContext.requestId,
                    requestContext.correlationId
                  ),
                }
              );
            }

            // Use sanitized message for processing
            const sanitizedMessage = validation.sanitizedValue || '';

            // SECURITY: Detect and log potential threats
            const threats = detectThreats(sanitizedMessage);
            if (threats.length > 0) {
              logWarn(requestContext, 'Potential security threats detected in message', {
                threats,
                sanitizedMessage: sanitizedMessage.substring(0, 100),
              });
              // Continue processing but log the threat for monitoring
            }

            try {
              budgetReservation = await reserveChatBudget(
                request,
                env,
                securityContext,
                new TextEncoder().encode(JSON.stringify(body)).byteLength,
                enableFunctionCalling ? 'chat.function_calling' : 'chat.model'
              );
            } catch (budgetError) {
              const reason =
                budgetError instanceof Error ? budgetError.message : String(budgetError);
              const deniedByLimit = reason.includes('BUDGET_EXCEEDED');
              logWarn(requestContext, 'Chat budget reservation denied', {
                reason: reason.split(':')[1] || 'unknown',
              });
              return new Response(
                JSON.stringify({
                  error: deniedByLimit ? 'Chat budget exceeded' : 'Chat budget unavailable',
                  code: deniedByLimit ? 'BUDGET_EXCEEDED' : 'BUDGET_STORE_UNAVAILABLE',
                  requestId: requestContext.requestId,
                }),
                {
                  status: deniedByLimit ? 429 : 503,
                  headers: buildChatHeaders(
                    env,
                    requestContext.requestId,
                    requestContext.correlationId
                  ),
                }
              );
            }

            // Log available tools for debugging
            if (availableTools.length > 0) {
              logInfo(requestContext, 'Chat has access to MCP tools', {
                tools: availableTools.map((t) => t.name),
              });
            }

            // ==========================================================================
            // PURE AI-FIRST ARCHITECTURE
            // ==========================================================================
            // All queries handled by AI orchestrator with dynamic MCP tool discovery
            // No keyword matching, no hardcoded responses, no legacy fallbacks
            // ==========================================================================

            // Use AI orchestrator for ALL queries
            if (canCreateOrchestrator(env)) {
              try {
                const orchestrator = createLLMOrchestrator(env);

                const orchestratorRequest = {
                  message: sanitizedMessage,
                  context,
                  contextData,
                  currentModel,
                  availableTools,
                  toolOutputs,
                  memoryContext,
                  contextLabel,
                  requestId: requestContext.requestId,
                  negative_constraints,
                  enableFunctionCalling,
                };

                const result = await orchestrator.handle(orchestratorRequest);

                if (budgetReservation?.reservationId) {
                  const commit = await commitBudgetReservation(
                    env,
                    budgetReservation.reservationId,
                    {
                      requestBytes: budgetReservation.requestBytes,
                      modelTokens: result.fromCache
                        ? 0
                        : Math.min(
                            budgetReservation.reservedModelTokens,
                            estimateTokens(result.response)
                          ),
                    }
                  );
                  if (!commit.committed) {
                    throw new Error(`CHAT_BUDGET_COMMIT_FAILED:${commit.state}`);
                  }
                  budgetReservation = null;
                }

                logInfo(requestContext, 'AI orchestrator completed', {
                  intent: result.metadata?.intent || 'unknown',
                  fromCache: result.fromCache || false,
                  availableTools: result.tooling?.availableTools?.length || 0,
                  toolOutputs: result.tooling?.toolOutputsIncluded || 0,
                  functionCallingUsed: !!result.functionCallingResults,
                });

                const responseBody: Record<string, unknown> = {
                  response: result.response,
                  context,
                  fromCache: result.fromCache || false,
                  thinking: [`AI: ${result.metadata?.intent || 'general query'}`],
                  requestId: requestContext.requestId,
                  metadata: result.metadata,
                  tooling: result.tooling,
                  // Debug info - remove after testing
                  _debug: {
                    bodyEnableFunctionCalling: body.enableFunctionCalling,
                    enableFunctionCalling,
                    orchestratorRequestEnableFunctionCalling:
                      orchestratorRequest.enableFunctionCalling,
                    // Pass orchestrator debug info
                    orchestratorDebug: (result as unknown as Record<string, unknown>)
                      ._orchestratorDebug,
                    functionCallingError: (result as unknown as Record<string, unknown>)
                      ._functionCallingError,
                  },
                };

                if (result.toolUsed) {
                  responseBody.toolUsed = result.toolUsed;
                }

                // Include function calling results for GUI updates
                if (result.functionCallingResults) {
                  responseBody.functionCallingResults = result.functionCallingResults;
                  // Extract modelChanges for easy frontend access
                  if (result.functionCallingResults.modelChanges) {
                    responseBody.modelChanges = result.functionCallingResults.modelChanges;
                  }
                }

                // Return AI response
                await commitSecurityContext(env, securityContext, undefined, true);

                return new Response(JSON.stringify(responseBody), {
                  status: 200,
                  headers: buildChatHeaders(
                    env,
                    requestContext.requestId,
                    requestContext.correlationId
                  ),
                });
              } catch (orchestratorError) {
                if (budgetReservation?.reservationId) {
                  await releaseBudgetReservation(env, budgetReservation.reservationId);
                  budgetReservation = null;
                }
                logError(
                  requestContext,
                  orchestratorError instanceof Error
                    ? orchestratorError
                    : new Error(String(orchestratorError))
                );

                // Fallback: If AI fails (e.g. local dev without auth) but user asks for tools
                if (
                  availableTools.length > 0 &&
                  /tools|help|capabilities|what can you do/i.test(sanitizedMessage)
                ) {
                  const toolList = formatToolList(availableTools);
                  const errorMessage =
                    orchestratorError instanceof Error
                      ? orchestratorError.message
                      : String(orchestratorError);

                  return new Response(
                    JSON.stringify({
                      response: `I'm currently running in offline mode (Error: ${errorMessage}), but I can still help you with the following tools:\n\n${toolList}\n\nPlease try asking specifically about one of these topics.`,
                      context,
                      fromCache: false,
                      requestId: requestContext.requestId,
                      metadata: { intent: 'fallback_tool_list' },
                      tooling: {
                        availableTools: availableTools.map((t) => t.name),
                        toolOutputsIncluded: 0,
                        contextKey: context,
                      },
                    }),
                    {
                      status: 200,
                      headers: buildChatHeaders(
                        env,
                        requestContext.requestId,
                        requestContext.correlationId
                      ),
                    }
                  );
                }

                return new Response(
                  JSON.stringify({
                    error: 'AI service error',
                    response: 'I apologize, but I encountered an error. Please try again.',
                    requestId: requestContext.requestId,
                  }),
                  {
                    status: 500,
                    headers: buildChatHeaders(
                      env,
                      requestContext.requestId,
                      requestContext.correlationId
                    ),
                  }
                );
              }
            }

            // If no AI available (shouldn't happen in production)
            if (budgetReservation?.reservationId) {
              await releaseBudgetReservation(env, budgetReservation.reservationId);
              budgetReservation = null;
            }
            return new Response(
              JSON.stringify({
                response: 'AI assistant is not available. Please contact support.',
                requestId: requestContext.requestId,
              }),
              {
                status: 200,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          } catch (error) {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            logError(requestContext, errorObj);
            return new Response(
              JSON.stringify({
                error: 'Internal server error',
                response:
                  'I apologize, but I encountered an error processing your request. Please try again.',
                requestId: requestContext.requestId,
              }),
              {
                status: 500,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          }
        },
        { isMessageRequest: true }
      )
    )
  );

  // ---- Streaming chat endpoint ----
  router.post(
    '/v1/chat/stream',
    withErrorHandler(
      withSecurityContext(async (request: Request, env: Env, securityContext: SecurityContext) => {
        // Check security context
        const environment = env.ENVIRONMENT ?? 'development';
        const isNonProduction = environment !== 'production';
        if (!securityContext.isAllowed) {
          if (isNonProduction && (securityContext.denyReason?.startsWith('session_') ?? false)) {
            logWarn(
              buildRequestContext(request, environment),
              'SESSION_DO unavailable; allowing chat request in non-production',
              { denyReason: securityContext.denyReason }
            );
          } else {
            return new Response(JSON.stringify({ error: securityContext.denyReason }), {
              status: 429,
              headers: { 'Retry-After': String(securityContext.retryAfter || 60) },
            });
          }
        }

        const requestContext = buildRequestContext(request, environment);
        let budgetReservation: ChatBudgetReservation | null = null;
        let streamedModelTokens = 0;

        try {
          // SECURITY: Validate Content-Type
          const contentType = request.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            return new Response(
              JSON.stringify({
                error: 'Unsupported Media Type',
                message: 'Content-Type must be application/json',
                requestId: requestContext.requestId,
              }),
              {
                status: 415,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          }

          // SECURITY: Validate request size before parsing body
          const contentLength = request.headers.get('Content-Length');
          const sizeValidation = validateRequestSize(contentLength);
          if (!sizeValidation.valid) {
            logWarn(requestContext, 'Request size validation failed', {
              error: sizeValidation.error,
              code: sizeValidation.code,
              contentLength,
            });
            return new Response(
              JSON.stringify({
                error: sizeValidation.error,
                code: sizeValidation.code,
                requestId: requestContext.requestId,
              }),
              {
                status: 413,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          }

          const body = (await request.json()) as {
            message: string;
            context?: string;
            currentModel?: Record<string, unknown>;
            availableTools?: Array<{ name: string; description: string }>;
            toolOutputs?: Record<string, unknown> | null;
            contextData?: Record<string, unknown>;
            contextLabel?: string | null;
            memoryContext?: {
              conversationHistory?: string;
              modelStates?: string;
            };
            negative_constraints?: string[];
            enableFunctionCalling?: boolean;
            /** Optional Turnstile token (if you add it on the client) */
            turnstileToken?: string;
            /** Optional alias for Turnstile token */
            turnstileResponse?: string;
          };
          const {
            message,
            context = 'general',
            currentModel = {},
            availableTools = [],
            toolOutputs: rawToolOutputs,
            contextData = {},
            contextLabel = null,
            memoryContext = {},
            negative_constraints = [],
            enableFunctionCalling = false,
          } = body;

          // Optional Turnstile verification (no-op unless TURNSTILE_SECRET is set)
          const headerToken = getTurnstileTokenFromRequest(request);
          const token = body.turnstileToken || body.turnstileResponse || headerToken;
          if (env.TURNSTILE_SECRET) {
            const outcome = await verifyTurnstileToken(env, token, requestContext.clientIP);
            const enforce = env.TURNSTILE_ENFORCE_CHAT_STREAM === '1';
            if (enforce && outcome.status !== 'PASS') {
              return new Response(
                JSON.stringify({
                  error: 'Turnstile verification failed',
                  code: 'TURNSTILE_FAILED',
                  requestId: requestContext.requestId,
                }),
                {
                  status: 403,
                  headers: buildChatHeaders(
                    env,
                    requestContext.requestId,
                    requestContext.correlationId
                  ),
                }
              );
            }
          }
          // Handle explicit null values (JS destructuring defaults don't apply to null)
          const toolOutputs = rawToolOutputs ?? {};

          // SECURITY: Comprehensive message validation and sanitization
          const validation = validateChatMessage(message);
          if (!validation.valid) {
            logWarn(requestContext, 'Message validation failed', {
              error: validation.error,
              code: validation.code,
              messageLength: message?.length || 0,
            });
            return new Response(
              JSON.stringify({
                error: validation.error,
                code: validation.code,
                requestId: requestContext.requestId,
              }),
              {
                status: 400,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          }

          // Use sanitized message for processing
          const sanitizedMessage = validation.sanitizedValue || '';

          // SECURITY: Detect and log potential threats
          const threats = detectThreats(sanitizedMessage);
          if (threats.length > 0) {
            logWarn(requestContext, 'Potential security threats detected in message', {
              threats,
              sanitizedMessage: sanitizedMessage.substring(0, 100),
            });
            // Continue processing but log the threat for monitoring
          }

          try {
            budgetReservation = await reserveChatBudget(
              request,
              env,
              securityContext,
              new TextEncoder().encode(JSON.stringify(body)).byteLength,
              enableFunctionCalling ? 'chat.stream.function_calling' : 'chat.stream.model'
            );
          } catch (budgetError) {
            const reason = budgetError instanceof Error ? budgetError.message : String(budgetError);
            const deniedByLimit = reason.includes('BUDGET_EXCEEDED');
            logWarn(requestContext, 'Streaming chat budget reservation denied', {
              reason: reason.split(':')[1] || 'unknown',
            });
            return new Response(
              JSON.stringify({
                error: deniedByLimit ? 'Chat budget exceeded' : 'Chat budget unavailable',
                code: deniedByLimit ? 'BUDGET_EXCEEDED' : 'BUDGET_STORE_UNAVAILABLE',
                requestId: requestContext.requestId,
              }),
              {
                status: deniedByLimit ? 429 : 503,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          }

          if (!canCreateOrchestrator(env)) {
            if (budgetReservation?.reservationId) {
              await releaseBudgetReservation(env, budgetReservation.reservationId);
              budgetReservation = null;
            }
            return new Response('AI not configured', { status: 503 });
          }

          const orchestrator = createLLMOrchestrator(env);
          const orchestratorRequest = {
            message: sanitizedMessage,
            context,
            contextData,
            currentModel,
            availableTools,
            toolOutputs,
            memoryContext,
            contextLabel,
            requestId: requestContext.requestId,
            negative_constraints,
            enableFunctionCalling,
          };

          // Commit security context (increment counters)
          await commitSecurityContext(env, securityContext, undefined, true);

          const encoder = new TextEncoder();
          let readable: ReadableStream;

          // Route to appropriate handler based on function calling flag
          if (enableFunctionCalling) {
            // Structured mode: Execute tools and return structured results
            const result = await orchestrator.handle(orchestratorRequest);
            if (budgetReservation?.reservationId) {
              const commit = await commitBudgetReservation(env, budgetReservation.reservationId, {
                requestBytes: budgetReservation.requestBytes,
                modelTokens: Math.min(
                  budgetReservation.reservedModelTokens,
                  estimateTokens(result.response)
                ),
              });
              if (!commit.committed) throw new Error(`CHAT_BUDGET_COMMIT_FAILED:${commit.state}`);
              budgetReservation = null;
            }
            readable = createStructuredSSEStream(
              encoder,
              result.response,
              result.functionCallingResults
            );
          } else {
            // Streaming mode: Stream text tokens only
            const stream = orchestrator.stream(orchestratorRequest);
            readable = createStreamingSSEStream(encoder, stream, {
              availableTools,
              message: message || '',
              formatToolList,
              onChunk: (chunk) => {
                streamedModelTokens += estimateTokens(chunk);
              },
              onComplete: async () => {
                if (!budgetReservation?.reservationId) return;
                const commit = await commitBudgetReservation(env, budgetReservation.reservationId, {
                  requestBytes: budgetReservation.requestBytes,
                  modelTokens: Math.min(budgetReservation.reservedModelTokens, streamedModelTokens),
                });
                if (!commit.committed) throw new Error(`CHAT_BUDGET_COMMIT_FAILED:${commit.state}`);
                budgetReservation = null;
              },
              onError: async () => {
                if (!budgetReservation?.reservationId) return;
                await releaseBudgetReservation(env, budgetReservation.reservationId);
                budgetReservation = null;
              },
            });
          }

          return new Response(readable, {
            headers: buildSSEHeaders(
              buildChatHeaders(env, requestContext.requestId, requestContext.correlationId)
            ),
          });
        } catch (error) {
          if (budgetReservation?.reservationId) {
            await releaseBudgetReservation(env, budgetReservation.reservationId);
            budgetReservation = null;
          }
          logError(requestContext, error instanceof Error ? error : new Error(String(error)));
          return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
        }
      })
    )
  );
}

function formatToolList(tools: Array<{ name: string; description: string }>): string {
  const groups: Record<string, Array<{ name: string; description: string }>> = {};

  for (const tool of tools) {
    const prefix = tool.name.split('_')[0] || 'Other';
    const category = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category]?.push(tool);
  }

  const sortedCategories = Object.keys(groups).sort();

  let output = '';
  for (const category of sortedCategories) {
    output += `### ${category}\n`;
    const categoryTools = groups[category];
    if (categoryTools) {
      for (const tool of categoryTools) {
        output += `- **${tool.name}**: ${tool.description}\n`;
      }
    }
    output += '\n';
  }
  return output.trim();
}
