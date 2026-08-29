/**
 * Stateless public MCP edge boundary (scaffold; no production traffic)
 *
 * Parallel boundary for #438 / #450. Health plus Streamable HTTP `/mcp` via
 * `createMcpHandler`. Legacy live MCP remains on workers/api until cutover.
 *
 * Named constants live in `worker-meta.ts` so Wrangler does not treat them as
 * service exports on the worker module map.
 */

import { authorizationFromRequest } from './authorization.js';
import { createStatelessMcpServer } from './mcp-server.js';
import { WORKER_ROLE, WORKER_VERSION, type Env } from './worker-meta.js';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/version')) {
      return json({
        ok: true,
        role: WORKER_ROLE,
        version: WORKER_VERSION,
        environment: env.ENVIRONMENT ?? 'unknown',
        commitSha: env.COMMIT_SHA ?? null,
        productionTraffic: false,
        mcpRoute: '/mcp',
      });
    }

    if (url.pathname === '/mcp' || url.pathname.startsWith('/mcp/')) {
      // Dynamic import keeps `/health` unit-testable in Node (agents uses cloudflare:).
      const { createMcpHandler } = await import('agents/mcp');
      const authorization = authorizationFromRequest(
        request,
        env.ENVIRONMENT ?? 'production',
        env.MCP_DEV_AUTH_ENABLED === 'true'
      );
      const handler = createMcpHandler(createStatelessMcpServer(authorization), {
        route: '/mcp',
      });
      return handler(request, env, ctx);
    }

    return new Response('Not Found', { status: 404 });
  },
};
