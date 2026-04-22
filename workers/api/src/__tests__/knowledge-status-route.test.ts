import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTestEnv } from './helpers/env';
import type { Env } from '../types';

const mockRouteAgentRequest = vi.hoisted(() => vi.fn());

vi.mock('agents', () => ({
  routeAgentRequest: mockRouteAgentRequest,
}));

const { default: api } = await import('../index');

describe('knowledge status admin route', () => {
  beforeEach(() => {
    mockRouteAgentRequest.mockReset();
    mockRouteAgentRequest.mockResolvedValue(null);
  });

  it('rejects unauthorized requests', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/v1/admin/knowledge/status');

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

  it('returns knowledge pipeline status when authorized', async () => {
    const { env, ctx } = makeTestEnv();
    const metrics = vi.fn().mockResolvedValue({
      backlogCount: 3,
      backlogBytes: 1024,
      oldestMessageTimestamp: new Date('2026-04-22T04:00:00.000Z'),
    });
    const info = vi.fn().mockResolvedValue({ id: 'fanalyx-site', type: 'web-crawler' });
    const stats = vi.fn().mockResolvedValue({ queued: 1, completed: 12 });
    const list = vi.fn().mockResolvedValue({
      result: [{ id: 'job-1', source: 'user', description: 'manual reindex' }],
    });

    const req = new Request('https://example.com/v1/admin/knowledge/status', {
      headers: {
        Authorization: 'Bearer secret',
      },
    });

    const statusEnv = {
      ...env,
      ADMIN_API_TOKEN: 'secret',
      KNOWLEDGE_JOBS: { metrics } as unknown as Queue,
      AI_SEARCH: {
        get: vi.fn().mockReturnValue({
          info,
          stats,
          jobs: { list },
        }),
      } as unknown as NonNullable<Env['AI_SEARCH']>,
      AI_SEARCH_INSTANCE_NAME: 'fanalyx-site',
      BROWSER: {} as Fetcher,
      BROWSER_RENDERING_ENABLED: 'true',
      BROWSER_RENDERING_PATH_PREFIXES: '/,/developers,/agent,/docs',
    } as unknown as typeof env & {
      ADMIN_API_TOKEN: string;
      KNOWLEDGE_JOBS: Queue;
      AI_SEARCH: NonNullable<Env['AI_SEARCH']>;
      AI_SEARCH_INSTANCE_NAME: string;
      BROWSER: Fetcher;
      BROWSER_RENDERING_ENABLED: string;
      BROWSER_RENDERING_PATH_PREFIXES: string;
    };

    const res = await api.fetch(req, statusEnv, ctx);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(
      expect.objectContaining({
        queue: expect.objectContaining({
          configured: true,
          backlogCount: 3,
          backlogBytes: 1024,
          oldestMessageTimestamp: '2026-04-22T04:00:00.000Z',
        }),
        aiSearch: expect.objectContaining({
          configured: true,
          instanceName: 'fanalyx-site',
          available: true,
          recentJobs: [{ id: 'job-1', source: 'user', description: 'manual reindex' }],
        }),
        browserRendering: {
          configured: true,
          enabled: true,
          pathPrefixes: ['/', '/developers', '/agent', '/docs'],
        },
      })
    );
  });
});
