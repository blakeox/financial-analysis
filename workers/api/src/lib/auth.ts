/**
 * API Authentication and Authorization
 *
 * Provides middleware for validating API keys, enforcing rate limits,
 * and tracking usage for the developer API tiers.
 */

import type { Env } from '../types';

export type ApiTier = 'free' | 'pro' | 'enterprise' | 'test' | 'internal';

export interface ApiKeyInfo {
  id: number;
  keyHash: string;
  keyPrefix: string;
  customerId: string;
  customerEmail: string;
  tier: ApiTier;
  active: boolean;
  monthlyQuota: number;
  rateLimitPerSec: number;
  createdAt: string;
  lastUsedAt: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuthResult {
  success: boolean;
  keyInfo?: ApiKeyInfo;
  error?: string;
  errorCode?: 'MISSING_KEY' | 'INVALID_KEY' | 'REVOKED_KEY' | 'QUOTA_EXCEEDED' | 'RATE_LIMITED';
}

/**
 * Generate a SHA-256 hash of the API key for storage
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a new API key
 * Format: fk_{env}_{32_random_chars}
 * - fk = fanalyx key
 * - env = test or live
 * - 32 chars = base62 encoded random bytes
 */
export function generateApiKey(isTest = false): string {
  const prefix = isTest ? 'fk_test_' : 'fk_live_';
  const randomBytes = crypto.getRandomValues(new Uint8Array(24));
  const base62Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let key = '';
  for (let i = 0; i < 32; i++) {
    const byte = randomBytes[i % 24];
    if (byte !== undefined) {
      key += base62Chars[byte % 62];
    }
  }

  return prefix + key;
}

/**
 * Validate API key format
 */
export function isValidApiKeyFormat(key: string): boolean {
  return /^fk_(test|live)_[A-Za-z0-9]{32}$/.test(key);
}

/**
 * Extract API key from request headers
 * Supports both Authorization: Bearer <key> and X-API-Key: <key>
 */
export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return request.headers.get('X-API-Key');
}

/**
 * Look up API key information from database
 */
async function lookupApiKey(keyHash: string, env: Env): Promise<ApiKeyInfo | null> {
  if (!env.DB) {
    console.error('DB not available');
    return null;
  }

  try {
    const result = await env.DB.prepare(
      `
      SELECT 
        id, key_hash, key_prefix, customer_id, customer_email, tier, 
        active, monthly_quota, rate_limit_per_sec, created_at, 
        last_used_at, metadata
      FROM api_keys 
      WHERE key_hash = ? AND active = 1
    `
    )
      .bind(keyHash)
      .first<{
        id: number;
        key_hash: string;
        key_prefix: string;
        customer_id: string;
        customer_email: string;
        tier: string;
        active: number;
        monthly_quota: number;
        rate_limit_per_sec: number;
        created_at: string;
        last_used_at: string | null;
        metadata: string | null;
      }>();

    if (!result) return null;

    return {
      id: result.id,
      keyHash: result.key_hash,
      keyPrefix: result.key_prefix,
      customerId: result.customer_id,
      customerEmail: result.customer_email,
      tier: result.tier as ApiTier,
      active: result.active === 1,
      monthlyQuota: result.monthly_quota,
      rateLimitPerSec: result.rate_limit_per_sec,
      createdAt: result.created_at,
      lastUsedAt: result.last_used_at,
      metadata: result.metadata ? JSON.parse(result.metadata) : undefined,
    };
  } catch (error) {
    console.error('Error looking up API key:', error);
    return null;
  }
}

/**
 * Check rate limit using KV with sliding window
 * Key format: rate_limit:{key_id}:{timestamp_bucket}
 */
async function checkRateLimit(
  keyInfo: ApiKeyInfo,
  env: Env
): Promise<{ allowed: boolean; remaining: number }> {
  if (!env.SESSIONS) {
    return { allowed: true, remaining: keyInfo.rateLimitPerSec };
  }

  const now = Date.now();
  const bucketSize = 1000; // 1 second buckets
  const currentBucket = Math.floor(now / bucketSize);
  const windowSize = 1; // 1 second window

  // Get counts for current and previous buckets
  const buckets = [];
  for (let i = 0; i < windowSize; i++) {
    buckets.push(`rate_limit:${keyInfo.id}:${currentBucket - i}`);
  }

  const sessions = env.SESSIONS;

  try {
    const counts = await Promise.all(
      buckets.map(async (key) => {
        const val = await sessions.get(key);
        return val ? parseInt(val, 10) : 0;
      })
    );

    const totalRequests = counts.reduce((sum, count) => sum + count, 0);
    const allowed = totalRequests < keyInfo.rateLimitPerSec;

    if (allowed) {
      // Increment current bucket with 2-second expiry
      const currentKey = `rate_limit:${keyInfo.id}:${currentBucket}`;
      const currentCount = await sessions.get(currentKey);
      await sessions.put(currentKey, String((currentCount ? parseInt(currentCount, 10) : 0) + 1), {
        expirationTtl: 2,
      });
    }

    return {
      allowed,
      remaining: Math.max(0, keyInfo.rateLimitPerSec - totalRequests - 1),
    };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // On error, allow the request but log
    return { allowed: true, remaining: keyInfo.rateLimitPerSec };
  }
}

/**
 * Check monthly quota
 */
async function checkMonthlyQuota(
  keyInfo: ApiKeyInfo,
  env: Env
): Promise<{ allowed: boolean; used: number; limit: number }> {
  if (!env.DB) {
    return { allowed: true, used: 0, limit: keyInfo.monthlyQuota };
  }

  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const db = env.DB;

  try {
    const result = await db
      .prepare(
        `
      SELECT total_requests 
      FROM api_key_usage_monthly 
      WHERE api_key_id = ? AND year_month = ?
    `
      )
      .bind(keyInfo.id, yearMonth)
      .first<{ total_requests: number }>();

    const used = result?.total_requests || 0;
    const allowed = used < keyInfo.monthlyQuota;

    return {
      allowed,
      used,
      limit: keyInfo.monthlyQuota,
    };
  } catch (error) {
    console.error('Error checking monthly quota:', error);
    // On error, allow the request
    return { allowed: true, used: 0, limit: keyInfo.monthlyQuota };
  }
}

/**
 * Validate API key and enforce rate limits/quotas
 */
export async function validateApiKey(request: Request, env: Env): Promise<AuthResult> {
  // Allow internal requests from the web worker
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const internalRequestHeader = request.headers.get('x-internal-request');

  console.log('API Auth Debug:', {
    origin,
    referer,
    internalRequestHeader,
    allHeaders: Object.fromEntries(request.headers.entries()),
  });

  const isInternalRequest =
    origin === 'https://fanalyx.com' ||
    referer?.includes('fanalyx.com') ||
    internalRequestHeader === 'true';

  console.log('Internal request check:', { isInternalRequest });

  if (isInternalRequest) {
    const mockKeyInfo: ApiKeyInfo = {
      id: 0,
      keyHash: 'internal-web-worker',
      keyPrefix: 'internal_',
      customerId: 'fanalyx-web',
      customerEmail: 'internal@fanalyx.com',
      tier: 'internal',
      active: true,
      monthlyQuota: 100000,
      rateLimitPerSec: 1000,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };
    return {
      success: true,
      keyInfo: mockKeyInfo,
    };
  }

  const apiKey = extractApiKey(request);

  if (!apiKey) {
    return {
      success: false,
      error:
        'API key required. Provide via Authorization: Bearer <key> or X-API-Key: <key> header.',
      errorCode: 'MISSING_KEY',
    };
  }

  if (!isValidApiKeyFormat(apiKey)) {
    return {
      success: false,
      error: 'Invalid API key format.',
      errorCode: 'INVALID_KEY',
    };
  }

  // Hash the key for lookup
  const keyHash = await sha256(apiKey);
  const keyInfo = await lookupApiKey(keyHash, env);

  if (!keyInfo) {
    return {
      success: false,
      error: 'Invalid or revoked API key.',
      errorCode: 'INVALID_KEY',
    };
  }

  if (!keyInfo.active) {
    return {
      success: false,
      error: 'API key has been revoked.',
      errorCode: 'REVOKED_KEY',
    };
  }

  // Check monthly quota
  const quotaCheck = await checkMonthlyQuota(keyInfo, env);
  if (!quotaCheck.allowed) {
    return {
      success: false,
      error: `Monthly quota exceeded. Used ${quotaCheck.used}/${quotaCheck.limit} requests.`,
      errorCode: 'QUOTA_EXCEEDED',
    };
  }

  // Check rate limit
  const rateLimitCheck = await checkRateLimit(keyInfo, env);
  if (!rateLimitCheck.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Maximum ${keyInfo.rateLimitPerSec} requests per second.`,
      errorCode: 'RATE_LIMITED',
    };
  }

  // Update last used timestamp (async, don't wait)
  const db = env.DB;
  if (db) {
    db.prepare(
      `
      UPDATE api_keys 
      SET last_used_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
    )
      .bind(keyInfo.id)
      .run()
      .catch((err) => {
        console.error('Error updating last_used_at:', err);
      });
  }

  return {
    success: true,
    keyInfo,
  };
}

/**
 * Track API usage for billing and analytics
 */
export async function trackApiUsage(
  keyInfo: ApiKeyInfo,
  request: Request,
  statusCode: number,
  responseTimeMs: number,
  env: Env
): Promise<void> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const url = new URL(request.url);
  const endpoint = url.pathname;
  const method = request.method;

  if (!env.DB) {
    return;
  }

  const db = env.DB;

  try {
    // Insert detailed usage record
    await db
      .prepare(
        `
      INSERT INTO api_key_usage 
        (api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
      )
      .bind(
        keyInfo.id,
        endpoint,
        method,
        statusCode,
        responseTimeMs,
        request.headers.get('CF-Connecting-IP') || 'unknown',
        request.headers.get('User-Agent') || 'unknown'
      )
      .run();

    // Update monthly aggregate (upsert)
    const isSuccess = statusCode >= 200 && statusCode < 400;
    await db
      .prepare(
        `
      INSERT INTO api_key_usage_monthly 
        (api_key_id, year_month, total_requests, successful_requests, failed_requests, total_response_time_ms, updated_at)
      VALUES (?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(api_key_id, year_month) DO UPDATE SET
        total_requests = total_requests + 1,
        successful_requests = successful_requests + ?,
        failed_requests = failed_requests + ?,
        total_response_time_ms = total_response_time_ms + ?,
        updated_at = CURRENT_TIMESTAMP
    `
      )
      .bind(
        keyInfo.id,
        yearMonth,
        isSuccess ? 1 : 0,
        isSuccess ? 0 : 1,
        responseTimeMs,
        isSuccess ? 1 : 0,
        isSuccess ? 0 : 1,
        responseTimeMs
      )
      .run();
  } catch (error) {
    console.error('Error tracking API usage:', error);
    // Don't fail the request if tracking fails
  }
}

/**
 * Create auth error response
 */
export function createAuthErrorResponse(authResult: AuthResult): Response {
  const statusCode =
    authResult.errorCode === 'RATE_LIMITED'
      ? 429
      : authResult.errorCode === 'QUOTA_EXCEEDED'
        ? 403
        : 401;

  return new Response(
    JSON.stringify({
      error: authResult.error,
      code: authResult.errorCode,
      timestamp: new Date().toISOString(),
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Code': authResult.errorCode || 'UNAUTHORIZED',
      },
    }
  );
}
