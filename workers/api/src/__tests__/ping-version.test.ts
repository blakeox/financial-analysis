import { describe, expect, it } from 'vitest';
import api from '../index';

function makeEnv(commit?: string) {
  const env: {
    ENVIRONMENT: string;
    DB: D1Database;
    SESSIONS: KVNamespace;
    DOCUMENTS: R2Bucket;
    COMMIT_SHA?: string;
  } = {
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
  if (commit !== undefined) env.COMMIT_SHA = commit;
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { env, ctx };
}

describe('/ping', () => {
  it('responds with pong and security headers', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/ping', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('pong');
    expect(res.headers.get('content-type')?.toLowerCase()).toContain('text/plain');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('/version', () => {
  it('returns version metadata with commit when set', async () => {
    const { env, ctx } = makeEnv('abc123');
    const req = new Request('https://example.com/version', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      commit: string;
      environment: string;
      service: string;
      version: string;
      timestamp: string;
    };
    expect(json.commit).toBe('abc123');
    expect(json.environment).toBe('test');
  });

  it('returns unknown commit when not set', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/version', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { commit: string };
    expect(json.commit).toBe('unknown');
  });
});
