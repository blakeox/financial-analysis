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
        if (isDevelopment) {
          console.error('Validation error:', error);
        }
        return new Response(
          JSON.stringify({
            error: {
              message: 'Validation error',
              code: 'VALIDATION_ERROR',
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
                message: 'Content-Type must be application/json',
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

      if (isDevelopment && error instanceof Error) {
        console.error('Internal error:', error);
      }

      return new Response(
        JSON.stringify({
          error: {
            message: 'Internal server error',
            code: 'INTERNAL_ERROR',
          },
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  };
}
