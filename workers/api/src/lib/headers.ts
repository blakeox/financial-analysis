import type { Env } from '../types';

export function getCorsHeaders(env: Env): Record<string, string> {
  // Keep local/test behavior permissive, but never let a missing production
  // variable silently reopen the API to every browser origin.
  const origin =
    env.ALLOWED_ORIGIN || (env.ENVIRONMENT === 'production' ? 'https://fanalyx.com' : '*');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

export function getSecurityHeaders(env: Env): Record<string, string> {
  const isProd = env.ENVIRONMENT === 'production';
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    ...(isProd
      ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' }
      : {}),
  };
}

export function buildDefaultHeaders(env: Env): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...getCorsHeaders(env),
    ...getSecurityHeaders(env),
  };
}

/**
 * Enhanced security headers for chat endpoints
 * Adds stricter CSP to prevent XSS in AI-generated content
 */
export function getChatSecurityHeaders(env: Env): Record<string, string> {
  const baseHeaders = getSecurityHeaders(env);
  return {
    ...baseHeaders,
    'Content-Security-Policy':
      "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
}

/**
 * Build headers for chat responses with enhanced security
 */
export function buildChatHeaders(
  env: Env,
  requestId: string,
  correlationId?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getCorsHeaders(env),
    ...getChatSecurityHeaders(env),
    'X-Request-ID': requestId,
  };

  if (correlationId) {
    headers['X-Correlation-ID'] = correlationId;
  }

  return headers;
}
