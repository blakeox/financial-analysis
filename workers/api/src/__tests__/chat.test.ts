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

describe('POST /v1/chat/enhanced', () => {
  it('returns 415 when content-type is not JSON', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/chat/enhanced', {
      method: 'POST',
      headers: { 'content-type': 'text/plain' },
      body: 'hello',
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(415);
  });

  it('returns 400 when message is missing', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/chat/enhanced', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(400);
  });

  it('returns deterministic response when AI binding is absent', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/chat/enhanced', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'Hello there', context: 'test' }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { response: string };
    expect(typeof json.response).toBe('string');
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

    const req = new Request('https://example.com/v1/chat/enhanced', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'hi', context: 'test' }),
    });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBeTruthy();
    expect(res.headers.get('x-ratelimit-remaining')).toBe('0');
    expect(res.headers.get('x-ratelimit-reset')).toBeTruthy();
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });
});
