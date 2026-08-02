import { describe, expect, it } from 'vitest';
import web from '../../src/index';

function makeEnv(environment: string) {
  const env: { ASSETS: Fetcher; ENVIRONMENT: string } = {
    ENVIRONMENT: environment,
    ASSETS: {
      fetch: async (_req: Request) =>
        new Response('<html><body>Hello</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    } as unknown as Fetcher,
  };
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { env, ctx };
}

describe('web worker security headers', () => {
  it('sets CSP header in development', async () => {
    const { env, ctx } = makeEnv('development');
    const req = new Request('https://example.com/', { method: 'GET' });
    const res = await web.fetch(req, env, ctx);
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    expect(res.headers.has('strict-transport-security')).toBe(false);
  });

  it('sets CSP and HSTS only in production', async () => {
    const { env, ctx } = makeEnv('production');
    (env as { ALLOWED_ORIGIN?: string }).ALLOWED_ORIGIN = 'https://fanalyx.com';
    const req = new Request('https://example.com/', { method: 'GET' });
    const res = await web.fetch(req, env, ctx);
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    const hsts = res.headers.get('strict-transport-security') || '';
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
    expect(res.headers.get('access-control-allow-origin')).toBe('https://fanalyx.com');
  });
});
