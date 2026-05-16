import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildKnowledgeReindexUrls,
  enqueueKnowledgeReindex,
  handleKnowledgeQueue,
  processKnowledgeReindex,
} from './knowledge-reindex';
import type { Env, KnowledgeReindexMessage } from '../types';

describe('knowledge reindex service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds absolute URLs and deduplicates them', () => {
    expect(
      buildKnowledgeReindexUrls('https://fanalyx.com/', [
        '/developers',
        'developers',
        '/developers',
      ])
    ).toEqual(['https://fanalyx.com/developers']);
  });

  it('enqueues a knowledge reindex job', async () => {
    const send = vi.fn().mockResolvedValue({
      metadata: {
        metrics: {
          backlogCount: 4,
          backlogBytes: 512,
        },
      },
    });

    const result = await enqueueKnowledgeReindex(
      {
        KNOWLEDGE_JOBS: { send } as unknown as Queue<KnowledgeReindexMessage>,
      } as Pick<Env, 'KNOWLEDGE_JOBS' | 'ANALYTICS'>,
      {
        source: 'manual',
        paths: ['/developers'],
        warmCache: true,
      }
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'site-reindex',
        source: 'manual',
        paths: ['/developers'],
        warmCache: true,
      }),
      expect.objectContaining({ contentType: 'json' })
    );
    expect(result.backlogCount).toBe(4);
  });

  it('processes a knowledge reindex job by warming cache and triggering AI Search', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async () =>
        new Response('Developer docs body', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
    );

    const jobsCreate = vi.fn().mockResolvedValue({ id: 'job-123' });
    const info = vi.fn().mockResolvedValue({ id: 'fanalyx-site' });

    const result = await processKnowledgeReindex(
      {
        type: 'site-reindex',
        source: 'manual',
        requestedAt: '2026-04-22T00:00:00.000Z',
        paths: ['/developers', '/agent'],
      },
      {
        BROWSER_RENDERING_ENABLED: 'true',
        BROWSER_RENDERING_PATH_PREFIXES: '/developers,/agent',
        AI_SEARCH: {
          get: vi.fn().mockReturnValue({
            info,
            jobs: { create: jobsCreate },
          }),
        } as unknown as Env['AI_SEARCH'],
        AI_SEARCH_INSTANCE_NAME: 'fanalyx-site',
        AI_SEARCH_SOURCE_DOMAIN: 'https://fanalyx.com',
      } as Pick<
        Env,
        | 'AI'
        | 'KV'
        | 'DOCUMENTS'
        | 'VECTORIZE'
        | 'BROWSER'
        | 'BROWSER_RENDERING_ENABLED'
        | 'BROWSER_RENDERING_PATH_PREFIXES'
        | 'AI_SEARCH'
        | 'AI_SEARCH_INSTANCE_NAME'
        | 'AI_SEARCH_SOURCE_DOMAIN'
        | 'BASE_URL'
        | 'ANALYTICS'
      >
    );

    expect(result.urls).toEqual(['https://fanalyx.com/developers', 'https://fanalyx.com/agent']);
    expect(result.warmedCount).toBe(2);
    expect(result.aiSearchJobId).toBe('job-123');
    expect(jobsCreate).toHaveBeenCalledWith({
      description: 'knowledge-reindex:manual:2026-04-22T00:00:00.000Z',
    });
  });

  it('retries failed queue messages before eventually acknowledging them', async () => {
    const retry = vi.fn();
    const ack = vi.fn();

    await handleKnowledgeQueue(
      {
        messages: [
          {
            id: 'msg-1',
            timestamp: new Date('2026-04-22T00:00:00.000Z'),
            attempts: 1,
            body: {
              type: 'site-reindex',
              source: 'manual',
              requestedAt: '2026-04-22T00:00:00.000Z',
            },
            retry,
            ack,
          },
        ],
        queue: 'fanalyx-knowledge-jobs',
        metadata: {
          metrics: {
            retryCount: 0,
          },
        },
      } as unknown as MessageBatch<KnowledgeReindexMessage>,
      {} as Pick<
        Env,
        | 'AI'
        | 'KV'
        | 'DOCUMENTS'
        | 'VECTORIZE'
        | 'BROWSER'
        | 'BROWSER_RENDERING_ENABLED'
        | 'BROWSER_RENDERING_PATH_PREFIXES'
        | 'AI_SEARCH'
        | 'AI_SEARCH_INSTANCE_NAME'
        | 'AI_SEARCH_SOURCE_DOMAIN'
        | 'BASE_URL'
        | 'ANALYTICS'
      >
    );

    expect(retry).toHaveBeenCalledWith({ delaySeconds: 30 });
    expect(ack).not.toHaveBeenCalled();
  });
});
