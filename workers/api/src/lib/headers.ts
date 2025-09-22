import type { Env } from '../types';

export function getCorsHeaders(env: Env): Record<string, string> {
  const origin = env.ALLOWED_ORIGIN || '*';
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
