import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChatTransport } from '../chat/transport';
import type { ChatRequestPayload, ChatResponsePayload } from '../chat/types';

describe('createChatTransport', () => {
  const globalWithMutableFetch = globalThis as typeof globalThis & { fetch?: typeof fetch };
  const originalFetch = globalWithMutableFetch.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalFetch) {
      globalWithMutableFetch.fetch = originalFetch;
    } else if ('fetch' in globalWithMutableFetch) {
      delete globalWithMutableFetch.fetch;
    }
  });

  it('returns metadata-rich responses from the server', async () => {
    const payload: ChatRequestPayload = {
      message: 'Review my lease terms',
      context: 'lease',
      currentModel: {} as ChatRequestPayload['currentModel'],
      availableTools: [{ name: 'analyze_lease', description: 'Lease analyzer' }],
      toolOutputs: null,
      memoryContext: {
        conversationHistory: 'user: hi',
        modelStates: '{}',
      },
    };

    const mockResponse: ChatResponsePayload = {
      response: 'Here is your analysis.',
      context: 'lease',
      fromCache: false,
      metadata: {
        intent: 'llm_question',
        latency: 1200,
        attempt: 1,
      },
      tooling: {
        availableTools: ['analyze_lease'],
        toolOutputsIncluded: 1,
        contextKey: 'lease',
        hasWebsiteContent: true,
        hasConversationHistory: true,
        cacheKey: 'v1:lease:hash',
      },
      thinking: ['AI: lease analysis'],
      requestId: 'req-123',
    };

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponse),
    });
    global.fetch = fetchMock as typeof fetch;

    const transport = createChatTransport({
      endpoint: '/v1/chat/enhanced',
      timeoutMs: 5000,
      maxAttempts: 1,
      backoffMs: 50,
    });

    const result = await transport.send(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      '/v1/chat/enhanced',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
    expect(result.metadata?.intent).toBe('llm_question');
    expect(result.tooling?.availableTools).toEqual(['analyze_lease']);
    expect(result.tooling?.toolOutputsIncluded).toBe(1);
    expect(result.thinking).toEqual(['AI: lease analysis']);
  });
});
