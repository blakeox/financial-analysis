import { describe, expect, it } from 'vitest';

declare global {
  var testWorkerEndpoint: (path: string, options?: { method?: string; headers?: Record<string, string>; body?: unknown }) => Promise<Response>;
}

describe('Miniflare Environment Test', () => {
  it('should handle a basic request', async () => {
    const response = await global.testWorkerEndpoint('/version');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('version');
  });
});