import { describe, expect, it } from 'vitest';
import api from '../index';

function makeEnv() {
  const env: { ENVIRONMENT: string; DB: D1Database; SESSIONS: KVNamespace; DOCUMENTS: R2Bucket } = {
    ENVIRONMENT: 'test',
    DB: {} as unknown as D1Database,
    SESSIONS: {
      get: async () => null,
      put: async () => undefined,
      delete: async () => undefined,
      list: async () => ({ keys: [], list_complete: true }),
    } as unknown as KVNamespace,
    DOCUMENTS: {} as unknown as R2Bucket,
  };
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { env, ctx };
}

describe('POST /v1/chat', () => {
  it('returns 415 when content-type is not JSON', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(415);
  });

  it('returns 400 when messages are missing', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(400);
  });

  it('returns deterministic response when AI binding is absent', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello there' }] }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { role: string; content: string };
    expect(json.role).toBe('assistant');
    expect(typeof json.content).toBe('string');
    expect(json.content).toContain('AI model is not configured');
  });

  it('performs local amortization calc when user asks and provides JSON', async () => {
    const { env, ctx } = makeEnv();
    const content =
      'Can you run an amortization for this? {"principal": 10000, "annualRate": 0.06, "termMonths": 12}';
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content }] }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      role: string;
      content: string;
      analysis?: {
        kind: string;
        result: { monthlyPayment: number; schedule: Array<{ month: number }> };
      };
    };
    expect(json.role).toBe('assistant');
    expect(json.content).toMatch(/Monthly payment:/);
    expect(json.analysis?.kind).toBe('amortization');
    expect(json.analysis?.result.monthlyPayment).toBeGreaterThan(0);
    expect(Array.isArray(json.analysis?.result.schedule)).toBe(true);
  });

  it('supports server-side MCP tool_call for lease analysis', async () => {
    const { env, ctx } = makeEnv();
    const body = {
      messages: [{ role: 'user', content: 'run lease' }],
      tool_call: {
        name: 'analyze_lease',
        arguments: {
          principal: 10000,
          annualRate: 0.05,
          termMonths: 12,
          residualValue: 1000,
        },
      },
    } as const;
    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { role: string; content: string };
    expect(json.role).toBe('assistant');
    expect(json.content).toContain('monthlyPayment');
  });

  it('is rate limited like other API routes', async () => {
    // Simulate KV storing count at maximum already
    let stored: { count: number; resetTime: number } | null = null;
    const now = Date.now();
    const kvImpl: Partial<KVNamespace> = {
      get: (async () =>
        JSON.stringify(
          stored ?? { count: 100, resetTime: now + 60_000 }
        )) as unknown as KVNamespace['get'],
      put: (async (_k: string, v: string) => {
        stored = JSON.parse(v);
      }) as unknown as KVNamespace['put'],
    };
    const env: { ENVIRONMENT: string; DB: D1Database; SESSIONS: KVNamespace; DOCUMENTS: R2Bucket } =
      {
        ENVIRONMENT: 'test',
        DB: {} as unknown as D1Database,
        SESSIONS: kvImpl as KVNamespace,
        DOCUMENTS: {} as unknown as R2Bucket,
      };
    const ctx: ExecutionContext = {
      waitUntil: () => {},
      passThroughOnException: () => {},
    } as unknown as ExecutionContext;

    const req = new Request('https://example.com/v1/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(res.headers.get('x-ratelimit-reset')).toBeTruthy();
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});
