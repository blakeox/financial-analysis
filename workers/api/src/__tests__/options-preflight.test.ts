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

describe('OPTIONS preflight headers', () => {
  it('OPTIONS /mcp exposes CORS and Allow: POST, OPTIONS', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/mcp', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('access-control-allow-methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
    expect(res.headers.get('access-control-allow-headers')).toBe('Content-Type, Authorization');
    expect(res.headers.get('vary')).toBe('Origin');
    expect(res.headers.get('allow')).toBe('POST, OPTIONS');
  });

  it('OPTIONS /api/analysis exposes CORS and broad Allow', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/api/analysis', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, POST, PUT, DELETE, OPTIONS');
  });

  it('OPTIONS /v1/api/analysis exposes CORS and broad Allow', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/v1/api/analysis', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, POST, PUT, DELETE, OPTIONS');
  });

  it('OPTIONS /openapi.json exposes CORS and Allow: GET, OPTIONS', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/openapi.json', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });

  it('OPTIONS /docs exposes CORS and Allow: GET, OPTIONS', async () => {
    const { env, ctx } = makeEnv();
    const req = new Request('https://example.com/docs', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });
});
