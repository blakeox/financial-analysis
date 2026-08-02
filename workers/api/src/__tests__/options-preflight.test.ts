import { describe, expect, it } from 'vitest';
import api from '../index';
import { makeTestEnv } from './helpers/env';

describe('OPTIONS preflight headers', () => {
  it('uses the production origin when no explicit origin variable is configured', async () => {
    const { env, ctx } = makeTestEnv({ environment: 'production' });
    const req = new Request('https://example.com/mcp', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('https://fanalyx.com');
  });

  it('OPTIONS /mcp exposes CORS and Allow: POST, OPTIONS', async () => {
    const { env, ctx } = makeTestEnv();
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
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/api/analysis', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, POST, PUT, DELETE, OPTIONS');
  });

  it('OPTIONS /v1/api/analysis exposes CORS and broad Allow', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/v1/api/analysis', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, POST, PUT, DELETE, OPTIONS');
  });

  it('OPTIONS /openapi.json exposes CORS and Allow: GET, OPTIONS', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/openapi.json', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });

  it('OPTIONS /docs exposes CORS and Allow: GET, OPTIONS', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/docs', { method: 'OPTIONS' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('allow')).toBe('GET, OPTIONS');
  });
});
