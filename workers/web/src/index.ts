export interface Env {
  ASSETS: Fetcher;
  ENVIRONMENT: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};

const defaultHeaders = {
  ...corsHeaders,
  ...securityHeaders,
};

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: defaultHeaders });
    }

    // Serve static assets built by Astro from apps/web/dist
    const url = new URL(request.url);
    const rewritten = new Request(url.toString(), request);
    const resp = await env.ASSETS.fetch(rewritten);

    // Merge headers
    const headers = new Headers(resp.headers);
    for (const [k, v] of Object.entries(defaultHeaders)) headers.set(k, v);
    return new Response(resp.body, { status: resp.status, headers });
  },
};
