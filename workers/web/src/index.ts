export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  COMMIT_SHA?: string;
  // Dev-only: base origin for the local API worker (e.g., http://localhost:8787)
  API_DEV_ORIGIN?: string;
  // Optional: explicit API origin for non-development environments
  API_ORIGIN?: string;
}

const corsHeaders = {
  // Static assets are generally safe to allow broadly; tighten if needed
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getSecurityHeaders(env: Env): Record<string, string> {
  const isProd = env.ENVIRONMENT === 'production';
  // CSP: Allow self assets, inline styles for Astro/SSR outputs, block object/frame ancestors
  const csp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
  ].join('; ');

  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': csp,
    ...(isProd
      ? { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload' }
      : {}),
  };
}

function buildDefaultHeaders(env: Env) {
  return {
    ...corsHeaders,
    ...getSecurityHeaders(env),
  } as Record<string, string>;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const defaults = buildDefaultHeaders(env);
    const isProduction = env.ENVIRONMENT === 'production';
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: defaults });
    }

    // Serve static assets built by Astro from apps/web/dist
    const url = new URL(request.url);

    // Dev-only proxy: forward API routes to the local API worker to avoid 404/405 from ASSETS.
    // This keeps the web worker origin as the single frontend origin while ensuring API is reachable in dev.
    const isDev = env.ENVIRONMENT === 'development';
    const pathname = url.pathname;
    const isApiPath =
      pathname === '/openapi.json' ||
      pathname === '/docs' ||
      pathname === '/mcp' ||
      pathname.startsWith('/v1/');
    // Development proxy path: forward only in dev when API_DEV_ORIGIN is configured
    if (isDev && isApiPath && env.API_DEV_ORIGIN) {
      const base = env.API_DEV_ORIGIN.replace(/\/$/, '');
      const forwardUrl = `${base}${pathname}${url.search}`;
      const apiReq = new Request(forwardUrl, request);
      const apiRes = await fetch(apiReq);
      const headers = new Headers(apiRes.headers);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('x-dev-proxy', 'web->api');
      for (const [key, value] of Object.entries(getSecurityHeaders(env))) {
        headers.set(key, value);
      }
      return new Response(apiRes.body, { status: apiRes.status, headers });
    }

    // In dev, if API path requested but no API_DEV_ORIGIN is configured, return helpful JSON
    if (isDev && isApiPath && !env.API_DEV_ORIGIN) {
      return new Response(
        JSON.stringify({ error: 'API_DEV_ORIGIN not configured for development' }),
        {
          status: 502,
          headers: { ...defaults, 'Content-Type': 'application/json; charset=utf-8' },
        }
      );
    }

    // Special route: version info for web worker
    if (url.pathname === '/version') {
      const body = JSON.stringify({
        service: 'financial-analysis-web',
        version: 'v1',
        environment: env.ENVIRONMENT,
        commit: env.COMMIT_SHA ?? 'unknown',
        timestamp: new Date().toISOString(),
      });
      return new Response(body, {
        status: 200,
        headers: { ...defaults, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    const rewritten = new Request(url.toString(), request);
  const resp = await env.ASSETS.fetch(rewritten);

    // Merge headers
    const headers = new Headers(resp.headers);
    for (const [k, v] of Object.entries(defaults)) headers.set(k, v);

    // Set caching for static assets based on path; respect upstream for HTML
    const path = url.pathname;
    if (resp.status === 200) {
      if (
        path.startsWith('/_astro/') ||
        /\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(path)
      ) {
        // Long cache for hashed assets in production, disable in dev to avoid stale assets
        headers.set(
          'Cache-Control',
          isProduction ? 'public, max-age=31536000, immutable' : 'no-store'
        );
      } else if (path.endsWith('.html') || path === '/') {
        // No cache for HTML entrypoints
        headers.set('Cache-Control', 'no-store');
      }
    }

    return new Response(resp.body, { status: resp.status, headers });
  },
};
