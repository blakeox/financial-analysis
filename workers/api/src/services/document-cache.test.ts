import { describe, it, expect, vi } from 'vitest';
import { DocumentCache } from './document-cache';
import type { Ai, AiSearchNamespace, VectorizeIndex, KVNamespace } from '@cloudflare/workers-types';

const mockRenderPageToHtml = vi.hoisted(() => vi.fn());

vi.mock('./browser-render', () => ({
  renderPageToHtml: mockRenderPageToHtml,
}));

describe('DocumentCache', () => {
  it('should use AI for embedding generation when available', async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3]] }),
    } as unknown as Ai;

    const mockVectorize = {
      query: vi.fn().mockResolvedValue({ matches: [] }),
    } as unknown as VectorizeIndex;

    const cache = new DocumentCache({
      ai: mockAi,
      vectorize: mockVectorize,
    });

    await cache.search('test query');

    expect(mockAi.run).toHaveBeenCalledWith('@cf/baai/bge-small-en-v1.5', {
      text: ['test query'],
    });
  });

  it('should fallback to hash when AI fails', async () => {
    const mockAi = {
      run: vi.fn().mockRejectedValue(new Error('AI failed')),
    } as unknown as Ai;

    const mockVectorize = {
      query: vi.fn().mockResolvedValue({ matches: [] }),
    } as unknown as VectorizeIndex;

    const cache = new DocumentCache({
      ai: mockAi,
      vectorize: mockVectorize,
    });

    await cache.search('test query');

    expect(mockAi.run).toHaveBeenCalled();
    // Should still call vectorize with *some* vector (the hash based one)
    expect(mockVectorize.query).toHaveBeenCalled();
  });

  it('should return documents when matches are found', async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3]] }),
    } as unknown as Ai;

    const mockVectorize = {
      query: vi.fn().mockResolvedValue({
        matches: [{ metadata: { url: 'https://example.com/doc1' } }],
      }),
    } as unknown as VectorizeIndex;

    const mockKv = {
      get: vi.fn().mockResolvedValue(
        JSON.stringify({
          url: 'https://example.com/doc1',
          content: 'Document content',
          expiresAt: Date.now() + 10000,
        })
      ),
    } as unknown as KVNamespace;

    const cache = new DocumentCache({
      ai: mockAi,
      vectorize: mockVectorize,
      kv: mockKv,
    });

    const results = await cache.search('test query');

    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe('https://example.com/doc1');
    expect(results[0]?.content).toBe('Document content');
  });

  it('should prefer AI Search when configured', async () => {
    const mockInstance = {
      info: vi.fn().mockResolvedValue({ id: 'fanalyx-site' }),
      search: vi.fn().mockResolvedValue({
        search_query: 'developer api',
        chunks: [
          {
            id: 'chunk-1',
            type: 'text',
            score: 0.98,
            text: 'Developer API documentation content',
            item: {
              key: '/developers',
              timestamp: 12345,
              metadata: { title: 'Developer API' },
            },
          },
        ],
      }),
    };

    const mockNamespace = {
      get: vi.fn().mockReturnValue(mockInstance),
    } as unknown as AiSearchNamespace;

    const cache = new DocumentCache({
      aiSearchNamespace: mockNamespace,
      aiSearchInstanceName: 'fanalyx-site',
      aiSearchSourceDomain: 'https://fanalyx.com',
    });

    const results = await cache.search('developer api', 3);

    expect(mockInstance.search).toHaveBeenCalledWith({
      query: 'developer api',
      ai_search_options: {
        retrieval: {
          retrieval_type: 'hybrid',
          keyword_match_mode: 'or',
          max_num_results: 3,
          context_expansion: 1,
          return_on_failure: true,
        },
      },
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.url).toBe('https://fanalyx.com/developers');
    expect(results[0]?.metadata?.title).toBe('Developer API');
  });

  it('should use Browser Rendering for configured site paths', async () => {
    mockRenderPageToHtml.mockResolvedValue('<html><body>Rendered docs</body></html>');

    const cache = new DocumentCache({
      browser: {} as Fetcher,
      browserRenderingEnabled: true,
      browserRenderingPathPrefixes: ['/developers', '/agent'],
      aiSearchSourceDomain: 'https://fanalyx.com',
    });

    const result = await cache.refresh('https://fanalyx.com/developers');

    expect(mockRenderPageToHtml).toHaveBeenCalledWith({
      binding: expect.any(Object),
      url: 'https://fanalyx.com/developers',
    });
    expect(result.content).toContain('Rendered docs');
  });

  it('should fall back to Vectorize when AI Search is unavailable', async () => {
    const mockInstance = {
      info: vi.fn().mockRejectedValue(new Error('missing instance')),
    };
    const mockNamespace = {
      get: vi.fn().mockReturnValue(mockInstance),
    } as unknown as AiSearchNamespace;

    const mockVectorize = {
      query: vi.fn().mockResolvedValue({
        matches: [{ metadata: { url: 'https://example.com/doc1' } }],
      }),
    } as unknown as VectorizeIndex;

    const mockKv = {
      get: vi.fn().mockResolvedValue(
        JSON.stringify({
          url: 'https://example.com/doc1',
          content: 'Fallback document content',
          expiresAt: Date.now() + 10000,
        })
      ),
    } as unknown as KVNamespace;

    const cache = new DocumentCache({
      aiSearchNamespace: mockNamespace,
      aiSearchInstanceName: 'fanalyx-site',
      vectorize: mockVectorize,
      kv: mockKv,
      ai: {
        run: vi.fn().mockResolvedValue({ data: [[0.1, 0.2, 0.3]] }),
      } as unknown as Ai,
    });

    const results = await cache.search('fallback query');

    expect(mockVectorize.query).toHaveBeenCalled();
    expect(results[0]?.content).toBe('Fallback document content');
  });
});
