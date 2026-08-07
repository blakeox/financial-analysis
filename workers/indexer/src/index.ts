/**
 * Asynchronous retrieval/indexing boundary (scaffold; no production traffic)
 *
 * Parallel boundary scaffold for #450. Health/version only.
 * Legacy MCP/Agent/indexer traffic remains on workers/api until cutover.
 */

export const WORKER_ROLE = 'indexer' as const;
export const WORKER_VERSION = '0.1.0';

/** Bindings that must not appear on this worker's Env for independence. */
export const FORBIDDEN_ENV_KEYS = ['AGENT', 'MEMORY', 'MCP'] as const;

export interface Env {
  ENVIRONMENT: string;
  WORKER_ROLE: typeof WORKER_ROLE;
  COMMIT_SHA?: string;
}

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
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/version')) {
      return json({
        ok: true,
        role: WORKER_ROLE,
        version: WORKER_VERSION,
        environment: env.ENVIRONMENT,
        commitSha: env.COMMIT_SHA ?? null,
        productionTraffic: false,
      });
    }
    return new Response('Not Found', { status: 404 });
  },
};
