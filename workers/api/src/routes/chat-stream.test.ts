import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RouterType } from 'itty-router';
import { registerChatRoutes } from './chat';
import type { Env } from '../types';
import type { RouteHandler } from '../lib/error-handler';

// Mock dependencies
const { mockOrchestrator } = vi.hoisted(() => {
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

  return { mockOrchestrator };
});

vi.mock('../services/llm-service-factory', () => ({
  canCreateOrchestrator: vi.fn().mockReturnValue(true),
  createLLMOrchestrator: vi.fn(() => mockOrchestrator),
}));

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
});
