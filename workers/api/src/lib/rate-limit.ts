import type { Env } from '../types';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

export type RateLimitInfo = {
  allowed: boolean;
  remaining: number;
  resetTime: number; // epoch ms
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
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

export async function checkRateLimit(request: Request, env: Env): Promise<RateLimitInfo> {
  const clientIP =
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

  const key = `ratelimit:${clientIP}`;
  const now = Date.now();

  try {
    if (!env.SESSIONS) {
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS,
        resetTime: now + RATE_LIMIT_WINDOW,
      };
    }

    const sessions = env.SESSIONS;

    // Wrap KV operations in retry logic
    const data = await retryKVOperation(() => sessions.get(key));
    const rateLimitData: { count: number; resetTime: number } = data
      ? JSON.parse(data)
      : { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 1;
      rateLimitData.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      rateLimitData.count++;
    }

    const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimitData.count);
    const allowed = rateLimitData.count <= RATE_LIMIT_MAX_REQUESTS;

    await retryKVOperation(() =>
      sessions.put(key, JSON.stringify(rateLimitData), {
        expirationTtl: Math.max(60, Math.ceil((rateLimitData.resetTime - now) / 1000)),
      })
    );

    return { allowed, remaining, resetTime: rateLimitData.resetTime };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`Rate limiting check failed after retries: ${errorMessage}`);
    // Graceful degradation: allow request but with reduced rate limit
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS,
      resetTime: now + RATE_LIMIT_WINDOW,
    };
  }
}

export function attachRateLimitHeaders(headers: Headers, info: RateLimitInfo) {
  headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
  headers.set('X-RateLimit-Remaining', String(info.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(info.resetTime / 1000)));
}
