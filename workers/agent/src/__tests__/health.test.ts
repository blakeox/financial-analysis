import { describe, expect, it } from 'vitest';

import worker, { FORBIDDEN_ENV_KEYS, WORKER_ROLE, WORKER_VERSION, type Env } from '../index.js';

const env: Env = {
  ENVIRONMENT: 'development',
  WORKER_ROLE,
};

describe('agent boundary worker', () => {
  it('serves health without depending on other boundary workers', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/health'),
      env,
      {} as ExecutionContext
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      role: WORKER_ROLE,
      version: WORKER_VERSION,
      productionTraffic: false,
    });
  });

  it('declares forbidden cross-boundary bindings', () => {
    expect(FORBIDDEN_ENV_KEYS.length).toBeGreaterThan(0);
    for (const key of FORBIDDEN_ENV_KEYS) {
      expect(key in env).toBe(false);
    }
  });

  it('returns 404 for non-health routes', async () => {
    const response = await worker.fetch(
      new Request('https://example.test/mcp'),
      env,
      {} as ExecutionContext
    );
    expect(response.status).toBe(404);
  });
});
