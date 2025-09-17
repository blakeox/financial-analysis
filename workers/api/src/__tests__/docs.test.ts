import { describe, it, expect } from 'vitest';
import api from '../index';

describe('/docs route', () => {
  it('returns HTML with a strict CSP header', async () => {
    const req = new Request('https://example.com/docs', { method: 'GET' });

  // Minimal Env and ExecutionContext stubs using explicit types
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

    const res = await api.fetch(req, env, ctx);

    expect(res.status).toBe(200);
    const contentType = res.headers.get('content-type') || '';
    expect(contentType.toLowerCase()).toContain('text/html');

    const csp = res.headers.get('content-security-policy');
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");

    const html = await res.text();
    expect(html).toContain('<rapi-doc');
    expect(html).toContain('/openapi.json');
  });
});
