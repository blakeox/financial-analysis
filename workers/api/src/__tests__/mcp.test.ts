import { describe, it, expect } from 'vitest';
import api from '../index';

function makeEnv() {
  const env: { ENVIRONMENT: string; DB: D1Database; SESSIONS: KVNamespace; DOCUMENTS: R2Bucket } = {
    ENVIRONMENT: 'test',
    DB: {} as unknown as D1Database,
    SESSIONS: {
      get: async () => null,
      put: async () => undefined,
      delete: async () => undefined,
      list: async () => ({ keys: [], list_complete: true })
    } as unknown as KVNamespace,
    DOCUMENTS: {} as unknown as R2Bucket,
  };
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {}
  } as unknown as ExecutionContext;
  return { env, ctx };
}

describe('MCP endpoint', () => {
  it('supports initialize', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
  const json = (await res.json()) as unknown as { result?: { protocolVersion?: string } };
  expect(json.result?.protocolVersion).toBeDefined();
  });

  it('lists tools', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
  const json = (await res.json()) as unknown as { result?: { tools?: Array<{ name: string }> } };
  const tools = json.result?.tools ?? [];
    expect(Array.isArray(tools)).toBe(true);
  const leaseTool = tools.find((t) => t.name === 'analyze_lease');
    expect(leaseTool).toBeTruthy();
  });

  it('calls analyze_lease tool', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'analyze_lease',
          arguments: { principal: 10000, annualRate: 0.05, termMonths: 12, residualValue: 1000 },
        },
      }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
  const json = (await res.json()) as unknown as { result: { monthlyPayment: number; schedule: unknown[] } };
  const result = json.result;
    expect(result).toHaveProperty('monthlyPayment');
    expect(Array.isArray(result.schedule)).toBe(true);
  });
});
