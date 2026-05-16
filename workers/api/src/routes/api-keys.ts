/**
 * API Key Management Routes
 *
 * Endpoints for developers to:
 * - Create API keys
 * - List their API keys
 * - Revoke API keys
 * - View usage statistics
 */

import type { Env } from '../types';
import { generateApiKey, type ApiTier } from '../lib/auth';
import { z } from 'zod';

/**
 * SHA-256 hash helper (duplicate from auth.ts to avoid circular import)
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Input validation schemas
 */
const CreateKeySchema = z.object({
  customerEmail: z.string().email(),
  customerId: z.string().min(1),
  tier: z.enum(['free', 'pro', 'enterprise', 'test']).default('free'),
  description: z.string().optional(),
});

/**
 * POST /v1/keys
 * Create a new API key
 */
export async function createApiKey(request: Request, env: Env): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as unknown;
    const validated = CreateKeySchema.parse(body);

    // Generate new API key
    const isTest = validated.tier === 'test';
    const apiKey = generateApiKey(isTest);
    const keyHash = await sha256(apiKey);
    const keyPrefix = apiKey.substring(0, 12); // Show first 12 chars (e.g., "fk_live_ABC1")

    // Determine tier quotas
    const tierConfig = getTierConfig(validated.tier);

    // Insert into database
    const metadata = validated.description
      ? JSON.stringify({ description: validated.description })
      : null;

    await env.DB.prepare(
      `
      INSERT INTO api_keys 
        (key_hash, key_prefix, customer_id, customer_email, tier, monthly_quota, rate_limit_per_sec, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
      .bind(
        keyHash,
        keyPrefix,
        validated.customerId,
        validated.customerEmail,
        validated.tier,
        tierConfig.monthlyQuota,
        tierConfig.rateLimitPerSec,
        metadata
      )
      .run();

    // Return the full key only once (won't be shown again)
    return new Response(
      JSON.stringify({
        success: true,
        key: apiKey, // Only shown once!
        keyPrefix,
        tier: validated.tier,
        monthlyQuota: tierConfig.monthlyQuota,
        rateLimitPerSec: tierConfig.rateLimitPerSec,
        message: 'Store this API key securely. It will not be shown again.',
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating API key:', error);

    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: 'Validation error',
          details: error.issues,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to create API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /v1/keys?customerId={id}
 * List API keys for a customer
 */
export async function listApiKeys(request: Request, env: Env): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get('customerId');

  if (!customerId) {
    return new Response(
      JSON.stringify({
        error: 'customerId query parameter required',
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const results = await env.DB.prepare(
      `
      SELECT 
        id, key_prefix, customer_email, tier, active, 
        monthly_quota, rate_limit_per_sec, created_at, 
        last_used_at, metadata
      FROM api_keys 
      WHERE customer_id = ?
      ORDER BY created_at DESC
    `
    )
      .bind(customerId)
      .all<{
        id: number;
        key_prefix: string;
        customer_email: string;
        tier: string;
        active: number;
        monthly_quota: number;
        rate_limit_per_sec: number;
        created_at: string;
        last_used_at: string | null;
        metadata: string | null;
      }>();

    const keys = results.results.map((row) => ({
      id: row.id,
      keyPrefix: row.key_prefix,
      customerEmail: row.customer_email,
      tier: row.tier,
      active: row.active === 1,
      monthlyQuota: row.monthly_quota,
      rateLimitPerSec: row.rate_limit_per_sec,
      createdAt: row.created_at,
      lastUsedAt: row.last_used_at,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        keys,
        total: keys.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error listing API keys:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to list API keys',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * DELETE /v1/keys/:keyId
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, env: Env): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await env.DB.prepare(
      `
      UPDATE api_keys 
      SET active = 0, revoked_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `
    )
      .bind(parseInt(keyId, 10))
      .run();

    if (result.meta.changes === 0) {
      return new Response(
        JSON.stringify({
          error: 'API key not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'API key revoked successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error revoking API key:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to revoke API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * GET /v1/keys/:keyId/usage
 * Get usage statistics for an API key
 */
export async function getKeyUsage(keyId: string, env: Env): Promise<Response> {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: 'Database not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get current month usage
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const monthly = await env.DB.prepare(
      `
      SELECT 
        total_requests, successful_requests, failed_requests,
        total_response_time_ms, total_tokens_used, total_cost_cents
      FROM api_key_usage_monthly
      WHERE api_key_id = ? AND year_month = ?
    `
    )
      .bind(parseInt(keyId, 10), yearMonth)
      .first<{
        total_requests: number;
        successful_requests: number;
        failed_requests: number;
        total_response_time_ms: number;
        total_tokens_used: number;
        total_cost_cents: number;
      }>();

    // Get recent requests (last 24 hours)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const recent = await env.DB.prepare(
      `
      SELECT 
        endpoint, method, status_code, response_time_ms, created_at
      FROM api_key_usage
      WHERE api_key_id = ? AND created_at >= ?
      ORDER BY created_at DESC
      LIMIT 100
    `
    )
      .bind(parseInt(keyId, 10), oneDayAgo)
      .all<{
        endpoint: string;
        method: string;
        status_code: number;
        response_time_ms: number;
        created_at: string;
      }>();

    // Get key info for quota
    const keyInfo = await env.DB.prepare(
      `
      SELECT monthly_quota, tier
      FROM api_keys
      WHERE id = ?
    `
    )
      .bind(parseInt(keyId, 10))
      .first<{
        monthly_quota: number;
        tier: string;
      }>();

    if (!keyInfo) {
      return new Response(
        JSON.stringify({
          error: 'API key not found',
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const totalRequests = monthly?.total_requests || 0;
    const percentUsed = (totalRequests / keyInfo.monthly_quota) * 100;

    return new Response(
      JSON.stringify({
        success: true,
        currentMonth: {
          yearMonth,
          totalRequests,
          successfulRequests: monthly?.successful_requests || 0,
          failedRequests: monthly?.failed_requests || 0,
          avgResponseTime:
            totalRequests > 0
              ? Math.round((monthly?.total_response_time_ms || 0) / totalRequests)
              : 0,
          totalTokensUsed: monthly?.total_tokens_used || 0,
          totalCostCents: monthly?.total_cost_cents || 0,
        },
        quota: {
          limit: keyInfo.monthly_quota,
          used: totalRequests,
          remaining: Math.max(0, keyInfo.monthly_quota - totalRequests),
          percentUsed: Math.round(percentUsed * 100) / 100,
        },
        tier: keyInfo.tier,
        recentRequests: recent.results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting key usage:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to get usage statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Helper: Get tier configuration
 */
function getTierConfig(tier: ApiTier): { monthlyQuota: number; rateLimitPerSec: number } {
  switch (tier) {
    case 'free':
      return { monthlyQuota: 1000, rateLimitPerSec: 1 };
    case 'pro':
      return { monthlyQuota: 50000, rateLimitPerSec: 10 };
    case 'enterprise':
      return { monthlyQuota: 1000000, rateLimitPerSec: 100 };
    case 'test':
      return { monthlyQuota: 10000, rateLimitPerSec: 5 };
    default:
      return { monthlyQuota: 1000, rateLimitPerSec: 1 };
  }
}
