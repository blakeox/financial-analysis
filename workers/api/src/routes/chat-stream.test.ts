import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RouterType } from 'itty-router';
import { registerChatRoutes } from './chat';
import type { Env } from '../types';
import type { RouteHandler } from '../lib/error-handler';
import { createStreamingSSEStream } from './chat-sse-helpers';

// Mock dependencies
const { mockOrchestrator, mockReserveBudget, mockCommitBudget, mockReleaseBudget } = vi.hoisted(
  () => {
    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        yield 'Hello';
        yield ' ';
        yield 'World';
      },
    };

    const mockOrchestrator = {
      stream: vi.fn().mockReturnValue(mockStream),
      handle: vi.fn(),
    };

    return {
      mockOrchestrator,
      mockReserveBudget: vi.fn(),
      mockCommitBudget: vi.fn(),
      mockReleaseBudget: vi.fn(),
    };
  }
);

vi.mock('../services/llm-service-factory', () => ({
  canCreateOrchestrator: vi.fn().mockReturnValue(true),
  createLLMOrchestrator: vi.fn(() => mockOrchestrator),
}));

vi.mock('../lib', async () => {
  const actual = await vi.importActual<typeof import('../lib')>('../lib');
  return {
    ...actual,
    reserveBudget: mockReserveBudget,
    commitBudgetReservation: mockCommitBudget,
    releaseBudgetReservation: mockReleaseBudget,
  };
});

/*
vi.mock('../lib', async () => {
  const actual = await vi.importActual('../lib');
  return {
    ...actual,
    checkRateLimit: vi.fn().mockResolvedValue({ limited: false }),
    validateChatMessage: vi.fn().mockReturnValue({ valid: true, sanitizedValue: 'test message' }),
    detectThreats: vi.fn().mockReturnValue([]),
    validateRequestSize: vi.fn().mockReturnValue({ valid: true }),
    buildRequestContext: vi.fn().mockReturnValue({ requestId: 'test-req-id' }),
    logInfo: vi.fn(),
    logWarn: vi.fn(),
    logError: vi.fn(),
  };
});
*/

describe('Chat Stream Route', () => {
  let capturedHandler: RouteHandler;
  let env: Env;

  beforeEach(() => {
    const mockRouter = {
      post: (path: string, handler: RouteHandler) => {
        if (path === '/v1/chat/stream') {
          capturedHandler = handler;
        }
      },
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      all: vi.fn(),
    } as unknown as RouterType;

    registerChatRoutes(mockRouter);

    env = {
      ENVIRONMENT: 'test',
      AI: {} as unknown,
    } as Env;
    mockReserveBudget.mockResolvedValue({
      allowed: true,
      reservationId: 'stream-reservation',
      state: 'reserved',
    });
    mockCommitBudget.mockResolvedValue({ committed: true, state: 'committed' });
    mockReleaseBudget.mockResolvedValue(undefined);
    vi.clearAllMocks();
  });

  it('should stream response in SSE format', async () => {
    const request = new Request('http://localhost/v1/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await capturedHandler(request, env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const result = await response.text();

    // Verify SSE format
    expect(result).toContain('data: {"token":"Hello"}\n\n');
    expect(result).toContain('data: {"token":" "}\n\n');
    expect(result).toContain('data: {"token":"World"}\n\n');
    expect(result).toContain('data: [DONE]\n\n');
  });

  it('runs completion and error hooks around an async stream', async () => {
    const completed = vi.fn();
    const failed = vi.fn();
    const chunks: string[] = [];
    const stream = createStreamingSSEStream(
      new TextEncoder(),
      {
        async *[Symbol.asyncIterator]() {
          yield 'one';
          yield 'two';
        },
      },
      {
        availableTools: [],
        message: '',
        formatToolList: () => '',
        onChunk: (chunk) => chunks.push(chunk),
        onComplete: completed,
        onError: failed,
      }
    );

    expect(await new Response(stream).text()).toContain('data: [DONE]\n\n');
    expect(chunks).toEqual(['one', 'two']);
    expect(completed).toHaveBeenCalledOnce();
    expect(failed).not.toHaveBeenCalled();
  });

  it('reserves and commits the stream budget after the SSE completes', async () => {
    const request = new Request('http://localhost/v1/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Budgeted stream' }),
    });
    const budgetedEnv = {
      ...env,
      BUDGET_ENFORCEMENT_ENABLED: 'true',
      BUDGET_MAX_MODEL_TOKENS: '100',
    } as Env;

    const response = await capturedHandler(request, budgetedEnv);
    await response.text();

    expect(mockReserveBudget).toHaveBeenCalledWith(
      budgetedEnv,
      expect.objectContaining({ capability: 'chat.stream.model' })
    );
    expect(mockCommitBudget).toHaveBeenCalledWith(
      budgetedEnv,
      'stream-reservation',
      expect.objectContaining({ requestBytes: expect.any(Number), modelTokens: expect.any(Number) })
    );
    expect(mockReleaseBudget).not.toHaveBeenCalled();
  });

  it('releases the stream budget when the model stream fails', async () => {
    mockOrchestrator.stream.mockReturnValueOnce({
      async *[Symbol.asyncIterator]() {
        yield 'partial';
        throw new Error('stream failed');
      },
    });
    const request = new Request('http://localhost/v1/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failing budgeted stream' }),
    });

    const budgetedEnv = {
      ...env,
      BUDGET_ENFORCEMENT_ENABLED: 'true',
    } as Env;
    const response = await capturedHandler(request, budgetedEnv);

    await expect(response.text()).rejects.toThrow();
    expect(mockReleaseBudget).toHaveBeenCalledWith(budgetedEnv, 'stream-reservation');
    expect(mockCommitBudget).not.toHaveBeenCalled();
  });
});
