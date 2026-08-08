export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT: string;
  COMMIT_SHA?: string;
  // Dev-only: base origin for the local API worker (e.g., http://localhost:8787)
  API_DEV_ORIGIN?: string;
  // Optional: explicit API origin for non-development environments
  API_ORIGIN?: string;
  // Production/preview service binding; avoids routing Worker-to-Worker traffic
  // back through the public zone route.
  API?: Fetcher;
  ALLOWED_ORIGIN?: string;
  // Server-only credential for API worker authentication; never accept this from clients.
  INTERNAL_API_TOKEN?: string;
}

function getCorsHeaders(env: Env): Record<string, string> {
  const origin =
    env.ALLOWED_ORIGIN || (env.ENVIRONMENT === 'production' ? 'https://fanalyx.com' : '*');
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Vary: 'Origin',
  };
}

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
    ...getCorsHeaders(env),
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
    ...getCorsHeaders(env),
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

    // Forward API, MCP, and OAuth routes to the API Worker before the SPA asset fallback.
    // This keeps the web worker origin as the single frontend origin in every environment.
    const isDev = env.ENVIRONMENT === 'development';
    const apiBase = (isDev ? env.API_DEV_ORIGIN : env.API_ORIGIN)?.replace(/\/$/, '');
    const pathname = url.pathname;
    let isApiPath =
      pathname === '/openapi.json' ||
      pathname === '/docs' ||
      pathname === '/mcp' ||
      pathname.startsWith('/agents/') ||
      pathname.startsWith('/v1/') ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/oauth/') ||
      pathname.startsWith('/.well-known/');

    if (isApiPath && (apiBase || env.API)) {
      const forwardUrl = `${apiBase ?? url.origin}${pathname}${url.search}`;
      const forwardHeaders = new Headers(request.headers);
      // Never relay a client-supplied internal credential or marker.
      forwardHeaders.delete('x-internal-api-token');
      forwardHeaders.delete('x-internal-request');
      if (env.INTERNAL_API_TOKEN) {
        forwardHeaders.set('x-internal-api-token', env.INTERNAL_API_TOKEN);
      }

      const apiReq = new Request(forwardUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: request.body,
        // Required for Node.js environments (tests) when body is present
        duplex: 'half',
      } as RequestInit);

      try {
        const apiRes = await (env.API ? env.API.fetch(apiReq) : fetch(apiReq));

        const isWebSocketUpgrade = request.headers.get('Upgrade')?.toLowerCase() === 'websocket';
        if (isWebSocketUpgrade || apiRes.status === 101) {
          return apiRes;
        }

        const headers = new Headers(apiRes.headers);
        for (const [key, value] of Object.entries(getCorsHeaders(env))) {
          headers.set(key, value);
        }
        if (isDev) {
          headers.set('x-dev-proxy', 'web->api');
        }

        // For streaming endpoints, preserve the streaming response
        const isStreamingEndpoint = pathname.includes('/stream');
        if (isStreamingEndpoint) {
          // Don't set CSP/security headers that might interfere with streaming
          headers.set('Content-Type', 'text/event-stream');
          headers.set('Cache-Control', 'no-cache');
          headers.set('Connection', 'keep-alive');
          // Pass through the body directly
          return new Response(apiRes.body, { status: apiRes.status, headers });
        }

        for (const [key, value] of Object.entries(getSecurityHeaders(env))) {
          headers.set(key, value);
        }
        return new Response(apiRes.body, { status: apiRes.status, headers });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('API proxy error:', message);
        return new Response(JSON.stringify({ error: 'API proxy failed' }), {
          status: 502,
          headers: { ...defaults, 'Content-Type': 'application/json; charset=utf-8' },
        });
      }
    }

    if (isApiPath && !apiBase && !env.API) {
      const missingKey = isDev ? 'API_DEV_ORIGIN' : 'API_ORIGIN or API service binding';
      return new Response(JSON.stringify({ error: `${missingKey} not configured` }), {
        status: 502,
        headers: { ...defaults, 'Content-Type': 'application/json; charset=utf-8' },
      });
    }

    // Redirect old calculator URLs to new modular calculator URLs
    const redirectMap: Record<string, string> = {
      '/amortization': '/calculator/amortization',
      '/auto-loan': '/calculator/auto-loan',
      '/retirement': '/calculator/retirement',
      '/savings-goal': '/calculator/savings-goal',
      '/debt-payoff': '/calculator/debt-payoff',
      '/student-loans': '/calculator/student-loans',
      '/budget': '/calculator/budget',
    };

    if (redirectMap[pathname]) {
      return new Response(null, {
        status: 301,
        headers: {
          ...defaults,
          Location: redirectMap[pathname],
          'Cache-Control': 'no-store',
        },
      });
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
