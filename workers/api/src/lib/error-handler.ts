/**
 * Shared route error handler wrapper
 */
import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';

export type RouteHandler = (request: Request, env: Env) => Response | Promise<Response>;

export function withErrorHandler(handler: RouteHandler) {
  return async (request: Request, env: Env): Promise<Response> => {
    try {
      return await handler(request, env);
    } catch (error) {
      console.error('API Error:', error);

      const isDevelopment = env.ENVIRONMENT === 'development';

      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Validation error',
              code: 'VALIDATION_ERROR',
              ...(isDevelopment && { details: error }),
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      if (error instanceof Error) {
        if (error.message.includes('Content-Type must be application/json')) {
          return new Response(
            JSON.stringify({
              error: {
                message: error.message,
                code: 'INVALID_CONTENT_TYPE',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }

        if (
          error.message.includes('Unexpected token') ||
          error.message.includes('is not valid JSON')
        ) {
          return new Response(
            JSON.stringify({
              error: {
                message: 'Invalid JSON format',
                code: 'INVALID_JSON',
              },
            }),
            { status: 400, headers: buildDefaultHeaders(env) }
          );
        }
      }

      return new Response(
        JSON.stringify({
          error: {
            message:
              isDevelopment && error instanceof Error ? error.message : 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(isDevelopment && error instanceof Error && { stack: error.stack }),
          },
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  };
}
