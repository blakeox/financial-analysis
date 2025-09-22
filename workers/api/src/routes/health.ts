import type { RouterType } from 'itty-router';
import type { Env } from '../types';
import { buildDefaultHeaders } from '../lib/headers';

export function registerHealthRoute(router: RouterType) {
  router.get('/health', (_req: Request, env: Env) => {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT,
        version: 'v1',
      }),
      { headers: buildDefaultHeaders(env) }
    );
  });
}
