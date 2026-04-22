import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTestEnv } from './helpers/env';

const mockRouteAgentRequest = vi.hoisted(() => vi.fn());

vi.mock('agents', () => ({
  routeAgentRequest: mockRouteAgentRequest,
}));

const { default: api } = await import('../index');

describe('knowledge reindex admin route', () => {
  beforeEach(() => {
    mockRouteAgentRequest.mockReset();
    mockRouteAgentRequest.mockResolvedValue(null);
  });

  it('rejects unauthorized requests', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/v1/admin/knowledge/reindex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: ['/developers'] }),
    });

    const res = await api.fetch(
      req,
      {
        ...env,
        ADMIN_API_TOKEN: 'secret',
      } as typeof env & { ADMIN_API_TOKEN: string },
      ctx
    );

    expect(res.status).toBe(401);
  });

  it('enqueues a knowledge reindex job when authorized', async () => {
    const { env, ctx } = makeTestEnv();
    const send = vi.fn().mockResolvedValue({
      metadata: {
        metrics: {
          backlogCount: 2,
          backlogBytes: 256,
        },
      },
    });

    const req = new Request('https://example.com/v1/admin/knowledge/reindex', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer secret',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paths: ['/developers'], warmCache: false }),
    });

    const res = await api.fetch(
      req,
      {
        ...env,
        ADMIN_API_TOKEN: 'secret',
        KNOWLEDGE_JOBS: { send } as unknown as Queue,
      } as typeof env & { ADMIN_API_TOKEN: string; KNOWLEDGE_JOBS: Queue },
      ctx
    );

    expect(res.status).toBe(202);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'site-reindex',
        source: 'manual',
        paths: ['/developers'],
        warmCache: false,
      }),
      expect.objectContaining({ contentType: 'json' })
    );

    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        status: 'enqueued',
        backlogCount: 2,
        source: 'manual',
        warmCache: false,
        pathCount: 1,
      })
    );
  });
});
