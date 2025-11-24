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
  logInfo,
  logWarn,
  logError,
  withErrorHandler,
} from '../lib';
import { canCreateOrchestrator, createLLMOrchestrator } from '../services/llm-service-factory';

export function registerChatRoutes(router: RouterType) {
  // ---- Simple contextual chat endpoint (AI Orchestrator) ----
  router.post(
    '/v1/chat/enhanced',
    withErrorHandler(async (request: Request, env: Env) => {
      // Build request context for logging
      const requestContext = buildRequestContext(request, env.ENVIRONMENT || 'production');
      logInfo(requestContext, 'Contextual chat request received');

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
              headers: buildChatHeaders(env, requestContext.requestId, requestContext.correlationId),
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
              headers: buildChatHeaders(env, requestContext.requestId, requestContext.correlationId),
            }
          );
        }

        const body = (await request.json()) as {
          message: string;
          context?: string;
          currentModel?: Record<string, unknown>;
          availableTools?: Array<{ name: string; description: string }>;
          toolOutputs?: Record<string, unknown>;
          contextData?: Record<string, unknown>;
          contextLabel?: string | null;
          memoryContext?: {
            conversationHistory?: string;
            modelStates?: string;
          };
          negative_constraints?: string[];
        };
        const {
          message,
          context = 'general',
          currentModel = {},
          availableTools = [],
          toolOutputs = {},
          contextData = {},
          contextLabel = null,
          memoryContext = {},
          negative_constraints = [],
        } = body;

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
              headers: buildChatHeaders(env, requestContext.requestId, requestContext.correlationId),
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
            };

            const result = await orchestrator.handle(orchestratorRequest);

            logInfo(requestContext, 'AI orchestrator completed', {
              intent: result.metadata?.intent || 'unknown',
              fromCache: result.fromCache || false,
              availableTools: result.tooling?.availableTools?.length || 0,
              toolOutputs: result.tooling?.toolOutputsIncluded || 0,
            });

            const responseBody: Record<string, unknown> = {
              response: result.response,
              context,
              fromCache: result.fromCache || false,
              thinking: [`AI: ${result.metadata?.intent || 'general query'}`],
              requestId: requestContext.requestId,
              metadata: result.metadata,
              tooling: result.tooling,
            };

            if (result.toolUsed) {
              responseBody.toolUsed = result.toolUsed;
            }

            // Return AI response
            return new Response(
              JSON.stringify(responseBody),
              {
                status: 200,
                headers: buildChatHeaders(
                  env,
                  requestContext.requestId,
                  requestContext.correlationId
                ),
              }
            );
          } catch (orchestratorError) {
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
              const errorMessage = orchestratorError instanceof Error ? orchestratorError.message : String(orchestratorError);

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
        return new Response(
          JSON.stringify({
            response: 'AI assistant is not available. Please contact support.',
            requestId: requestContext.requestId,
          }),
          {
            status: 200,
            headers: buildChatHeaders(env, requestContext.requestId, requestContext.correlationId),
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
            headers: buildChatHeaders(env, requestContext.requestId, requestContext.correlationId),
          }
        );
      }
    })
  );

  // ---- Streaming chat endpoint ----
  router.post(
    '/v1/chat/stream',
    withErrorHandler(async (request: Request, env: Env) => {
      const requestContext = buildRequestContext(request, env.ENVIRONMENT || 'production');

      try {
        const body = (await request.json()) as {
          message: string;
          context?: string;
          currentModel?: Record<string, unknown>;
          availableTools?: Array<{ name: string; description: string }>;
          toolOutputs?: Record<string, unknown>;
          contextData?: Record<string, unknown>;
          contextLabel?: string | null;
          memoryContext?: {
            conversationHistory?: string;
            modelStates?: string;
          };
        };
        const {
          message,
          context = 'general',
          currentModel = {},
          availableTools = [],
          toolOutputs = {},
          contextData = {},
          contextLabel = null,
          memoryContext = {},
        } = body;

        if (!canCreateOrchestrator(env)) {
          return new Response('AI not configured', { status: 503 });
        }

        const orchestrator = createLLMOrchestrator(env);
        const orchestratorRequest = {
          message,
          context,
          contextData,
          currentModel,
          availableTools,
          toolOutputs,
          memoryContext,
          contextLabel,
          requestId: requestContext.requestId,
        };

        const stream = orchestrator.stream(orchestratorRequest);
        const encoder = new TextEncoder();

        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of stream) {
                const sseMessage = `data: ${JSON.stringify({ token: chunk })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
              }
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (err) {
              // Fallback: If AI fails (e.g. local dev) but user asks for tools
              if (
                availableTools.length > 0 &&
                /tools|help|capabilities|what can you do/i.test(message || '')
              ) {
                const toolList = formatToolList(availableTools);
                const errorMessage = err instanceof Error ? err.message : String(err);

                const fallbackResponse = `I'm currently running in offline mode (Error: ${errorMessage}), but I can still help you with the following tools:\n\n${toolList}\n\nPlease try asking specifically about one of these topics.`;

                // Stream the fallback response
                const sseMessage = `data: ${JSON.stringify({ token: fallbackResponse })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
                return;
              }

              controller.error(err);
            }
          },
        });

        return new Response(readable, {
          headers: {
            ...buildChatHeaders(env, requestContext.requestId, requestContext.correlationId),
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      } catch (error) {
        logError(requestContext, error instanceof Error ? error : new Error(String(error)));
        return new Response(JSON.stringify({ error: 'Internal Error' }), { status: 500 });
      }
    })
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
