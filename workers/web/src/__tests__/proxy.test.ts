import { describe, expect, it, vi } from 'vitest';
import web from '../../src/index';

function makeEnv({
  environment,
  apiDevOrigin,
  apiProdOrigin,
}: {
  environment: string;
  apiDevOrigin?: string;
  apiProdOrigin?: string;
}) {
  const fetchSpy = vi.fn(async (_req: Request) =>
    new Response('<html><body>ASSETS</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  );

  const env: {
    ASSETS: Fetcher;
    ENVIRONMENT: string;
    API_DEV_ORIGIN?: string;
    API_ORIGIN?: string;
  } = {
    ENVIRONMENT: environment,
    API_DEV_ORIGIN: apiDevOrigin,
    API_ORIGIN: apiProdOrigin,
    ASSETS: { fetch: fetchSpy } as unknown as Fetcher,
  };
  const ctx: ExecutionContext = {
    waitUntil: () => {},
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  return { env, ctx, fetchSpy };
}

describe('web worker dev proxy', () => {
  it('forwards /v1 requests to API in development', async () => {
    const { env, ctx, fetchSpy } = makeEnv({
      environment: 'development',
      apiDevOrigin: 'http://127.0.0.1:8787',
    });

    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ principal: 1000, annualRate: 0.05, termMonths: 12 }),
    });

    // Mock global fetch (used by proxy forwarding) to simulate API response
    const apiResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const globalFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(apiResponse);

    const res = await web.fetch(req, env as never, ctx);

    // Should not call ASSETS for API route
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.headers.get('x-dev-proxy')).toBe('web->api');
    expect(await res.json()).toEqual({ ok: true });

    globalFetch.mockRestore();
  });

  it('serves ASSETS for non-API paths in development', async () => {
    const { env, ctx, fetchSpy } = makeEnv({
      environment: 'development',
      apiDevOrigin: 'http://127.0.0.1:8787',
    });

    const req = new Request('https://example.com/index.html', { method: 'GET' });
    const res = await web.fetch(req, env as never, ctx);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('ASSETS');
  });

  it('does not proxy in production', async () => {
    const { env, ctx, fetchSpy } = makeEnv({
      environment: 'production',
      apiProdOrigin: 'https://api.example.com',
    });
    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({}),
    });

    const apiResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const globalFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(apiResponse);

    const res = await web.fetch(req, env as never, ctx);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.headers.get('x-dev-proxy')).toBeNull();

    globalFetch.mockRestore();
  });

  it('returns a helpful error when API origin is missing', async () => {
    const { env, ctx, fetchSpy } = makeEnv({ environment: 'production' });
    const req = new Request('https://example.com/v1/api/analysis/amortization', {
      method: 'GET',
    });

    const res = await web.fetch(req, env as never, ctx);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'API_ORIGIN not configured' });
  });

  it('forwards /api/ requests to API in development', async () => {
    const { env, ctx, fetchSpy } = makeEnv({
      environment: 'development',
      apiDevOrigin: 'http://127.0.0.1:8787',
    });

    const req = new Request('https://example.com/api/v1/chat/enhanced', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    });

    const apiResponse = new Response(JSON.stringify({ response: 'Hello!' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
    const globalFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(apiResponse);

    const res = await web.fetch(req, env as never, ctx);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    expect(res.headers.get('x-dev-proxy')).toBe('web->api');
    expect(await res.json()).toEqual({ response: 'Hello!' });

    globalFetch.mockRestore();
  });
});
