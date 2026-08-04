import { describe, expect, it } from 'vitest';
import api from '../index';
import { makeTestEnv } from './helpers/env';
import { MCP_MAX_REQUEST_BYTES } from '../lib/enhanced-mcp';

describe('MCP endpoint', () => {
  it('supports initialize', async () => {
    const { env, ctx } = makeTestEnv();
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
    const { env, ctx } = makeTestEnv();
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
    const amortTool = tools.find((t) => t.name === 'analyze_amortization');
    expect(leaseTool).toBeTruthy();
    expect(amortTool).toBeTruthy();
  });

  it('calls analyze_lease tool', async () => {
    const { env, ctx } = makeTestEnv();
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
    const json = (await res.json()) as unknown as {
      result: { monthlyPayment: number; schedule: unknown[] };
    };
    const result = json.result;
    expect(result).toHaveProperty('monthlyPayment');
    expect(Array.isArray(result.schedule)).toBe(true);
  });

  it('fails closed for discovery when the MCP analysis kill switch is off', async () => {
    const { env, ctx } = makeTestEnv({ mcpAnalysisEnabled: 'false' });
    const res = await api.fetch(
      new Request('https://example.com/mcp', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/list' }),
      }),
      env,
      ctx
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ result: { tools: [] } });
  });
});

describe('MCP amortization tool', () => {
  it('calls analyze_amortization tool', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: {
          name: 'analyze_amortization',
          arguments: { principal: 10000, annualRate: 0.05, termMonths: 12 },
        },
      }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as unknown as {
      result: { monthlyPayment: number; schedule: unknown[] };
    };
    const result = json.result;
    expect(result).toHaveProperty('monthlyPayment');
    expect(Array.isArray(result.schedule)).toBe(true);
  });

  it('requires API-key authentication for MCP in production', async () => {
    const { env, ctx } = makeTestEnv({ environment: 'production' });
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'initialize' }),
    });

    const res = await api.fetch(req, env, ctx);

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'MISSING_KEY' });
  });

  it('requires API-key authentication for the legacy MCP tools listing in production', async () => {
    const { env, ctx } = makeTestEnv({ environment: 'production' });
    const res = await api.fetch(
      new Request('https://example.com/api/v1/mcp/tools', { method: 'GET' }),
      env,
      ctx
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'MISSING_KEY' });
  });

  it('executes authenticated MCP requests and exposes only the key tier', async () => {
    const { env, ctx } = makeTestEnv({ environment: 'production' });
    const authenticatedEnv = { ...env, INTERNAL_API_TOKEN: 'server-secret' };
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-api-token': 'server-secret',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'initialize' }),
    });

    const res = await api.fetch(req, authenticatedEnv, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('X-API-Key-Tier')).toBe('internal');
    await expect(res.json()).resolves.toMatchObject({
      result: { serverInfo: { name: 'financial-analysis-mcp' } },
    });
  });

  it('does not let the web proxy token access user-owned storage', async () => {
    const { env, ctx } = makeTestEnv({ environment: 'production' });
    const authenticatedEnv = { ...env, INTERNAL_API_TOKEN: 'server-secret' };
    const res = await api.fetch(
      new Request('https://example.com/v1/storage/presign', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-internal-api-token': 'server-secret',
        },
        body: JSON.stringify({ operation: 'download', key: 'lease-documents/smoke.txt' }),
      }),
      authenticatedEnv,
      ctx
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ code: 'MISSING_KEY' });
  });

  it('rejects oversized MCP bodies before JSON parsing', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 7,
        method: 'initialize',
        params: { padding: 'x'.repeat(MCP_MAX_REQUEST_BYTES) },
      }),
    });

    const res = await api.fetch(req, env, ctx);

    expect(res.status).toBe(413);
    await expect(res.json()).resolves.toMatchObject({
      id: 'unknown',
      error: { code: -32005, message: 'Request failed' },
    });
  });

  it('returns invalid-params with the original JSON-RPC id', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 8, method: 'tools/call', params: null }),
    });

    const res = await api.fetch(req, env, ctx);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      id: 8,
      error: { code: -32602, message: 'Request failed' },
    });
  });
});
