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
} from '../lib';
import { withErrorHandler } from '../lib/error-handler';
import { canCreateOrchestrator, createLLMOrchestrator } from '../services/llm-service-factory';

export function registerChatRoutes(router: RouterType) {
  // ---- Simple contextual chat endpoint (AI Orchestrator) ----
  router.post(
    '/api/v1/chat/enhanced',
    withErrorHandler(async (request: Request, env: Env) => {
      // Build request context for logging
      const requestContext = buildRequestContext(request, env.ENVIRONMENT || 'production');
      logInfo(requestContext, 'Contextual chat request received');

      try {
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
        };
        const {
          message,
          context = 'general',
          currentModel = {},
          availableTools = [],
          toolOutputs = {},
          contextData = {},
          contextLabel: _contextLabel = null,
          memoryContext = {},
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
              requestId: requestContext.requestId,
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
            error: 'AI not configured',
            response: 'AI assistant is not available. Please contact support.',
            requestId: requestContext.requestId,
          }),
          {
            status: 503,
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
}
