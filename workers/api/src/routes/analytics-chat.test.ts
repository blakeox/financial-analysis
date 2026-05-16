import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerAnalyticsRoutes } from './analytics';
import type { Env } from '../types';

describe('Chat Analytics Routes', () => {
  let mockRouter: {
    post: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };
  let mockEnv: Env;

  beforeEach(() => {
    mockRouter = {
      post: vi.fn(),
      get: vi.fn(),
    };

    mockEnv = {
      ENVIRONMENT: 'test',
      ANALYTICS: {
        writeDataPoint: vi.fn(),
      } as unknown as AnalyticsEngineDataset,
    } as Env;
  });

  it('registers POST /v1/api/analytics/chat route', () => {
    registerAnalyticsRoutes(mockRouter);

    expect(mockRouter.post).toHaveBeenCalledWith('/v1/api/analytics/chat', expect.any(Function));
  });

  describe('POST /v1/api/analytics/chat', () => {
    it('accepts valid chat analytics payload', async () => {
      registerAnalyticsRoutes(mockRouter);
      // Find the handler for /v1/api/analytics/chat
      const call = mockRouter.post.mock.calls.find((call) => call[0] === '/v1/api/analytics/chat');
      const handler = call?.[1];
      if (!handler) throw new Error('Handler not registered');

      const payload = {
        analytics: {
          sessionId: 'chat_123',
          startTime: new Date().toISOString(),
          messageCount: 5,
          toolUsage: { calculator: 2 },
          errorCount: 0,
          averageResponseTime: 150,
          contextSwitches: 1,
          offlineTime: 0,
        },
        behaviorMetrics: {
          sessionId: 'chat_123',
          pageContext: '/analysis',
          messageLength: 50,
          timeToFirstMessage: 2000,
          messagesPerMinute: 2,
          toolRequestsPerSession: 2,
          errorRate: 0,
        },
        performanceMetrics: [],
        recentMetrics: [],
      };

      const request = new Request('http://localhost/v1/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await handler(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('writes chat metrics to Analytics Engine', async () => {
      registerAnalyticsRoutes(mockRouter);
      const call = mockRouter.post.mock.calls.find((call) => call[0] === '/v1/api/analytics/chat');
      const handler = call?.[1];
      if (!handler) throw new Error('Handler not registered');

      const payload = {
        analytics: {
          sessionId: 'chat_123',
          startTime: new Date().toISOString(),
          messageCount: 5,
          toolUsage: { calculator: 2 },
          errorCount: 0,
          averageResponseTime: 150,
          contextSwitches: 1,
          offlineTime: 0,
        },
        behaviorMetrics: {
          sessionId: 'chat_123',
          pageContext: '/analysis',
          messageLength: 50,
          timeToFirstMessage: 2000,
          messagesPerMinute: 2,
          toolRequestsPerSession: 2,
          errorRate: 0,
        },
        performanceMetrics: [],
        recentMetrics: [],
      };

      const request = new Request('http://localhost/v1/api/analytics/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await handler(request, mockEnv);

      expect(mockEnv.ANALYTICS?.writeDataPoint).toHaveBeenCalled();
    });
  });
});
