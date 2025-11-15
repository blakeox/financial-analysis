import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createChatTransport } from '../chat/transport';
import type { ChatRequestPayload, ChatResponsePayload } from '../chat/types';

describe('createChatTransport', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      // @ts-ignore
      delete global.fetch;
    }
  });

  it('returns metadata-rich responses from the server', async () => {
    const payload: ChatRequestPayload = {
      message: 'Review my lease terms',
      context: 'lease',
      currentModel: {} as any,
      availableTools: [{ name: 'analyze_lease', description: 'Lease analyzer' }],
      toolOutputs: {} as any,
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
      endpoint: '/api/v1/chat/enhanced',
      timeoutMs: 5000,
      maxAttempts: 1,
      backoffMs: 50,
    });

    const result = await transport.send(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/chat/enhanced',
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
