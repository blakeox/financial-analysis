import { describe, expect, it } from 'vitest';
import api from '../index';

function makeEnvWithKV(kvImpl: Partial<KVNamespace> = {}) {
  const base = {
    get: (async () => null) as unknown as KVNamespace['get'],
    put: (async () => undefined) as unknown as KVNamespace['put'],
    delete: (async () => undefined) as unknown as KVNamespace['delete'],
    list: (async () => ({ keys: [], list_complete: true })) as unknown as KVNamespace['list'],
  } satisfies Partial<KVNamespace>;
  const kv = { ...base, ...kvImpl } as KVNamespace;

  const env: { ENVIRONMENT: string; DB: D1Database; SESSIONS: KVNamespace; DOCUMENTS: R2Bucket } = {
    ENVIRONMENT: 'test',
    DB: {} as unknown as D1Database,
    SESSIONS: kv,
    DOCUMENTS: {} as unknown as R2Bucket,
  };
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { env, ctx };
}

describe('Rate limit headers', () => {
  it('includes X-RateLimit-Remaining and X-RateLimit-Reset on success for API route', async () => {
    const { env, ctx } = makeEnvWithKV();
    const body = { principal: 10000, annualRate: 0.05, termMonths: 12, residualValue: 1000 };
    const req = new Request('https://example.com/v1/api/analysis/lease', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    // API responses should include RL headers when hitting /api/
    expect(res.headers.get('x-ratelimit-remaining')).toBeTruthy();
    expect(res.headers.get('x-ratelimit-reset')).toBeTruthy();
    // Request ID is always set
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('returns 429 with Retry-After and X-RateLimit-* when over limit', async () => {
    // Simulate a KV that always returns count over max
    // Implementation: store a JSON and always increment past threshold on first call
    let stored: { count: number; resetTime: number } | null = null;
    const now = Date.now();
    const kvImpl: Partial<KVNamespace> = {
      get: (async () => JSON.stringify(stored ?? { count: 100, resetTime: now + 60_000 })) as unknown as KVNamespace['get'],
      put: (async (_k: string, v: string) => {
        stored = JSON.parse(v);
      }) as unknown as KVNamespace['put'],
    };
    const { env, ctx } = makeEnvWithKV(kvImpl);
    const req = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize' }),
    });

    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(res.headers.get('x-ratelimit-reset')).toBeTruthy();
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});
