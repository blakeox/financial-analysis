import { describe, expect, it, vi } from 'vitest';
import { MCP_SCOPES } from '@financial-analysis/tools';
import api from '../index';
import { makeTestEnv } from './helpers/env';

interface ApiKeyRow {
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
}

async function hashApiKey(apiKey: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function createApiKeyDb(rows: ApiKeyRow[]) {
  const rowsByHash = new Map(rows.map((row) => [row.key_hash, row]));
  const boundCalls: Array<{ sql: string; values: unknown[] }> = [];
  const prepare = vi.fn((sql: string) => ({
    bind: vi.fn((...values: unknown[]) => {
      boundCalls.push({ sql, values });
      return {
        first: async () =>
          sql.includes('FROM api_keys') ? (rowsByHash.get(String(values[0])) ?? null) : null,
        run: async () => ({ success: true, meta: { changes: 1 } }),
      };
    }),
  }));

  return {
    db: { prepare } as unknown as D1Database,
    boundCalls,
  };
}

async function makeKeyRow(
  id: number,
  customerId: string,
  keySuffix: string,
  mcpScopes?: string[]
): Promise<{ key: string; row: ApiKeyRow }> {
  const key = `fk_live_${keySuffix}`;
  return {
    key,
    row: {
      id,
      key_hash: await hashApiKey(key),
      key_prefix: key.slice(0, 12),
      customer_id: customerId,
      customer_email: `${customerId}@example.com`,
      tier: 'pro',
      active: 1,
      monthly_quota: 1000,
      rate_limit_per_sec: 100,
      created_at: '2026-08-02T00:00:00.000Z',
      last_used_at: null,
      metadata: mcpScopes === undefined ? null : JSON.stringify({ mcpScopes }),
    },
  };
}

function mcpRequest(key: string, body: unknown): Request {
  return new Request('https://example.com/mcp', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('MCP cross-tenant authorization', () => {
  it('isolates discovery, execution, and audit identity by API-key scope', async () => {
    const tenantA = await makeKeyRow(11, 'tenant-a', 'a'.repeat(32), [MCP_SCOPES.ANALYSIS_READ]);
    const tenantB = await makeKeyRow(12, 'tenant-b', 'b'.repeat(32), []);
    const { db, boundCalls } = createApiKeyDb([tenantA.row, tenantB.row]);
    const { env, ctx } = makeTestEnv({ environment: 'production', db });

    const tenantAList = await api.fetch(
      mcpRequest(tenantA.key, {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {},
      }),
      env,
      ctx
    );
    const tenantAJson = (await tenantAList.json()) as {
      result: { tools: Array<{ name: string }> };
    };

    const tenantBList = await api.fetch(
      mcpRequest(tenantB.key, {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
      env,
      ctx
    );
    const tenantBJson = (await tenantBList.json()) as {
      result: { tools: Array<{ name: string }> };
    };

    const tenantBDenied = await api.fetch(
      mcpRequest(tenantB.key, {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'analyze_lease',
          arguments: { customerId: 'tenant-a', principal: 10000 },
        },
      }),
      env,
      ctx
    );

    expect(tenantAList.status).toBe(200);
    expect(tenantAJson.result.tools.map((tool) => tool.name)).toContain('analyze_lease');
    expect(tenantBList.status).toBe(200);
    expect(tenantBJson.result.tools).toEqual([]);
    expect(tenantBDenied.status).toBe(403);
    await expect(tenantBDenied.json()).resolves.toMatchObject({
      error: { code: -32004 },
    });

    const auditCalls = boundCalls.filter(({ sql }) => sql.includes('mcp_audit_events'));
    expect(auditCalls.length).toBeGreaterThanOrEqual(3);
    expect(auditCalls.some(({ values }) => values.includes('tenant-a'))).toBe(true);
    expect(auditCalls.some(({ values }) => values.includes('tenant-b'))).toBe(true);
    expect(
      auditCalls.every(({ values }) => !values.includes('https://private.example/sensitive-report'))
    ).toBe(true);
  });
});
