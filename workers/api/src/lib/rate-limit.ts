import type { Env } from '../types';
import { logRateLimitViolation } from './analytics-logger';
import { generateFingerprint } from './security-middleware';

const LIMITS = {
  CHAT: { window: 60 * 1000, max: 20 },
  ANALYSIS: { window: 60 * 1000, max: 50 },
  MCP: { window: 60 * 1000, max: 100 },
  DEFAULT: { window: 60 * 1000, max: 100 },
};

export type RateLimitInfo = {
  allowed: boolean;
  remaining: number;
  resetTime: number; // epoch ms
  limit: number;
};

/**
 * Retry KV operation with exponential backoff for transient failures
 */
async function retryKVOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 10
): Promise<T> {
  let lastError: Error | unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Retry on transient errors (SQLITE_BUSY, 500 errors, etc.)
      if (errorMessage.includes('SQLITE_BUSY') || errorMessage.includes('500')) {
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

export async function checkRateLimit(request: Request, env: Env): Promise<RateLimitInfo> {
  const environment = env.ENVIRONMENT || 'production';
  const isProduction = environment === 'production';

  const clientIP =
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

  const url = new URL(request.url);
  let limitConfig = LIMITS.DEFAULT;
  let keyPrefix = 'default';

  if (url.pathname.includes('/v1/chat')) {
    limitConfig = LIMITS.CHAT;
    keyPrefix = 'chat';
  } else if (url.pathname.includes('/api/analysis')) {
    limitConfig = LIMITS.ANALYSIS;
    keyPrefix = 'analysis';
  } else if (url.pathname.includes('/mcp')) {
    limitConfig = LIMITS.MCP;
    keyPrefix = 'mcp';
  }

  // In non-production (local dev/preview), keep rate limiting enabled but much higher.
  // NOTE: do not inflate in `test` env; unit tests assert specific 429 behavior.
  const shouldInflateLimits = !isProduction && environment !== 'test';
  if (shouldInflateLimits) {
    if (keyPrefix === 'chat') {
      limitConfig = { ...limitConfig, max: Math.max(limitConfig.max, 1000) };
    } else {
      limitConfig = { ...limitConfig, max: Math.max(limitConfig.max, 5000) };
    }
  }

  const key = `ratelimit:${keyPrefix}:${clientIP}`;
  const now = Date.now();
  const degradedRateLimit: RateLimitInfo = {
    allowed: !isProduction,
    remaining: isProduction ? 0 : limitConfig.max,
    resetTime: now + limitConfig.window,
    limit: limitConfig.max,
  };

  try {
    if (!env.SESSIONS) {
      console.error('Rate limiting unavailable: SESSIONS binding is not configured');
      return degradedRateLimit;
    }

    const sessions = env.SESSIONS;

    // Wrap KV operations in retry logic
    const data = await retryKVOperation(() => sessions.get(key));
    const rateLimitData: { count: number; resetTime: number } = data
      ? JSON.parse(data)
      : { count: 0, resetTime: now + limitConfig.window };

    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 1;
      rateLimitData.resetTime = now + limitConfig.window;
    } else {
      rateLimitData.count++;
    }

    const remaining = Math.max(0, limitConfig.max - rateLimitData.count);
    const allowed = rateLimitData.count <= limitConfig.max;

    // Log rate limit violations to Analytics Engine
    if (!allowed) {
      const userAgent = request.headers.get('User-Agent') || 'unknown';
      const fingerprint = await generateFingerprint(clientIP, userAgent);
      logRateLimitViolation(
        env.ANALYTICS,
        fingerprint,
        clientIP,
        url.pathname,
        0 // Trust score drops to 0 on rate limit
      );
    }

    await retryKVOperation(() =>
      sessions.put(key, JSON.stringify(rateLimitData), {
        expirationTtl: Math.max(60, Math.ceil((rateLimitData.resetTime - now) / 1000)),
      })
    );

    return { allowed, remaining, resetTime: rateLimitData.resetTime, limit: limitConfig.max };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Rate limiting check failed after retries: ${errorMessage}`);
    // Preview/test can degrade gracefully; production must not bypass abuse controls.
    return degradedRateLimit;
  }
}

export function attachRateLimitHeaders(headers: Headers, info: RateLimitInfo) {
  headers.set('X-RateLimit-Limit', String(info.limit));
  headers.set('X-RateLimit-Remaining', String(info.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(info.resetTime / 1000)));
}
