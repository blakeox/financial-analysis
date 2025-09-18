import type { RouterType } from 'itty-router';

interface Env {
  ENVIRONMENT: string;
}

export function registerHealthRoute(router: RouterType) {
  router.get('/health', (_req: Request, env: Env) => {
    return new Response(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: env.ENVIRONMENT,
        version: 'v1',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  });
}
