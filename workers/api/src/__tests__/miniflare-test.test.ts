/**
 * Miniflare Environment Test
 *
 * This test is designed to run with a Miniflare test environment that provides
 * global.testWorkerEndpoint. It's excluded from the normal test run in
 * workers/api/vitest.config.mjs and should only run with a specialized setup.
 *
 * To run this test, you need to configure a Miniflare test pool that provides
 * the testWorkerEndpoint global function.
 */
import { describe, expect, it } from 'vitest';

declare global {
  var testWorkerEndpoint:
    | ((
        path: string,
        options?: { method?: string; headers?: Record<string, string>; body?: unknown }
      ) => Promise<Response>)
    | undefined;
}

describe.skip('Miniflare Environment Test (requires miniflare test pool)', () => {
  it('should handle a basic request', async () => {
    const endpoint = global.testWorkerEndpoint;
    if (!endpoint) {
      throw new Error('global.testWorkerEndpoint is not configured for this test environment');
    }

    const response = await endpoint('/version');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('version');
  });
});