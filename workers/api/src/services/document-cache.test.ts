import { describe, it, expect, vi } from 'vitest';
import { DocumentCache } from './document-cache';
import type { Ai, VectorizeIndex, KVNamespace } from '@cloudflare/workers-types';

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
        matches: [
          { metadata: { url: 'https://example.com/doc1' } },
        ],
      }),
    } as unknown as VectorizeIndex;

    const mockKv = {
      get: vi.fn().mockResolvedValue(JSON.stringify({
        url: 'https://example.com/doc1',
        content: 'Document content',
        expiresAt: Date.now() + 10000,
      })),
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
});
