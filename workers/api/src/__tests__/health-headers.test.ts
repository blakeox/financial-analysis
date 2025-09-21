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

describe('/health headers', () => {
  it('returns JSON with security headers and no RateLimit headers', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/health', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')?.toLowerCase()).toContain('application/json');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    // Not an API/MCP route: should not include RL headers
    expect(res.headers.has('x-ratelimit-remaining')).toBe(false);
    expect(res.headers.has('x-ratelimit-reset')).toBe(false);
  });
});
