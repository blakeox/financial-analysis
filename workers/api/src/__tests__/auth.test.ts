import { describe, expect, it } from 'vitest';

import { resolveMCPScopes, validateApiKey } from '../lib/auth';
import type { Env } from '../types';

describe('validateApiKey', () => {
  it('defaults legacy API keys to analysis-only MCP access', () => {
    expect(
      resolveMCPScopes({
        id: 1,
        keyHash: 'hash',
        keyPrefix: 'fk_live_',
        customerId: 'customer-1',
        customerEmail: 'customer@example.com',
        tier: 'free',
        active: true,
        monthlyQuota: 100,
        rateLimitPerSec: 1,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      })
    ).toEqual(['analysis:read']);
  });

  it('narrows MCP access to recognized configured scopes', () => {
    const scopes = resolveMCPScopes({
      id: 1,
      keyHash: 'hash',
      keyPrefix: 'fk_live_',
      customerId: 'customer-1',
      customerEmail: 'customer@example.com',
      tier: 'pro',
      active: true,
      monthlyQuota: 100,
      rateLimitPerSec: 1,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      metadata: { mcpScopes: ['analysis:read', 'unknown:scope', 'analysis:read'] },
    });

    expect(scopes).toEqual(['analysis:read']);
  });

  it('fails closed for malformed or empty configured scope metadata', () => {
    const baseKey = {
      id: 1,
      keyHash: 'hash',
      keyPrefix: 'fk_live_',
      customerId: 'customer-1',
      customerEmail: 'customer@example.com',
      tier: 'pro' as const,
      active: true,
      monthlyQuota: 100,
      rateLimitPerSec: 1,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    expect(resolveMCPScopes({ ...baseKey, metadata: { mcpScopes: 'analysis:read' } })).toEqual([]);
    expect(resolveMCPScopes({ ...baseKey, metadata: { mcpScopes: [] } })).toEqual([]);
  });

  it('does not trust localhost origins in production', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('does not trust localhost origins outside production', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'development',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('rejects multi-level fanalyx-looking hostnames', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'https://www.app.fanalyx.com',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('does not trust fanalyx subdomains', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        Origin: 'https://app.fanalyx.com',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('accepts a valid server-to-server token', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        'x-internal-api-token': 'server-secret',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
      INTERNAL_API_TOKEN: 'server-secret',
    } as Env);

    expect(result.success).toBe(true);
    expect(result.keyInfo?.tier).toBe('internal');
  });

  it('isolates the preview budget conformance principal from the web worker', async () => {
    const request = new Request('https://fanalyx.com/mcp', {
      headers: { 'x-budget-conformance-token': 'budget-secret' },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'preview',
      BUDGET_CONFORMANCE_TOKEN: 'budget-secret',
      INTERNAL_API_TOKEN: 'server-secret',
    } as Env);

    expect(result.success).toBe(true);
    expect(result.keyInfo).toMatchObject({
      id: -2,
      customerId: 'fanalyx-budget-conformance',
      tier: 'internal',
    });
    expect(result.keyInfo?.metadata).toMatchObject({
      authSource: 'budget-conformance',
      mcpScopes: ['analysis:read'],
    });
  });

  it('does not accept the budget conformance token outside preview MCP', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: { 'x-budget-conformance-token': 'budget-secret' },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
      BUDGET_CONFORMANCE_TOKEN: 'budget-secret',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });

  it('rejects spoofed internal markers and invalid server tokens', async () => {
    const request = new Request('https://fanalyx.com/v1/chat', {
      headers: {
        'x-internal-request': 'true',
        'x-internal-api-token': 'wrong-secret',
      },
    });

    const result = await validateApiKey(request, {
      ENVIRONMENT: 'production',
      INTERNAL_API_TOKEN: 'server-secret',
    } as Env);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('MISSING_KEY');
  });
});
