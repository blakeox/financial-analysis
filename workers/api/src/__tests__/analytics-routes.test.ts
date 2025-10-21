import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerAnalyticsRoutes } from '../routes/analytics';
import type { Env } from '../types';

describe('Analytics Routes', () => {
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

  it('registers POST /v1/api/analytics/events route', () => {
    registerAnalyticsRoutes(mockRouter);
    
    expect(mockRouter.post).toHaveBeenCalledWith(
      '/v1/api/analytics/events',
      expect.any(Function)
    );
  });

  it('registers GET /v1/api/analytics/summary route', () => {
    registerAnalyticsRoutes(mockRouter);
    
    expect(mockRouter.get).toHaveBeenCalledWith(
      '/v1/api/analytics/summary',
      expect.any(Function)
    );
  });

  describe('POST /v1/api/analytics/events', () => {
    it('accepts valid analytics payload', async () => {
      registerAnalyticsRoutes(mockRouter);
      const handler = mockRouter.post.mock.calls[0]?.[1];
      if (!handler) throw new Error('Handler not registered');

      const payload = {
        sessionId: 'sess_123',
        visitorId: 'vis_456',
        events: [
          {
            type: 'page_view',
            page: '/analysis',
            timestamp: Date.now(),
          },
        ],
      };

      const request = new Request('http://localhost/v1/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await handler(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.eventsProcessed).toBe(1);
    });

    it('writes events to Analytics Engine', async () => {
      registerAnalyticsRoutes(mockRouter);
      const handler = mockRouter.post.mock.calls[0]?.[1];
      if (!handler) throw new Error('Handler not registered');

      const payload = {
        sessionId: 'sess_123',
        visitorId: 'vis_456',
        events: [
          {
            type: 'api_result',
            page: '/analysis',
            action: 'POST /v1/api/analysis/lease',
            metadata: { duration: 150, success: true },
            timestamp: Date.now(),
          },
        ],
      };

      const request = new Request('http://localhost/v1/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      await handler(request, mockEnv);

      expect(mockEnv.ANALYTICS?.writeDataPoint).toHaveBeenCalledWith(
        expect.objectContaining({
          indexes: expect.arrayContaining(['api_result', '/analysis', 'sess_123', 'vis_456']),
          doubles: expect.any(Array),
          blobs: expect.any(Array),
        })
      );
    });

    it('rejects invalid payload', async () => {
      registerAnalyticsRoutes(mockRouter);
      const handler = mockRouter.post.mock.calls[0]?.[1];
      if (!handler) throw new Error('Handler not registered');

      const invalidPayload = {
        sessionId: 'sess_123',
        // Missing visitorId
        events: [],
      };

      const request = new Request('http://localhost/v1/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidPayload),
      });

      const response = await handler(request, mockEnv);

      expect(response.status).toBe(400);
    });

    it('handles Analytics Engine unavailability gracefully', async () => {
      const envWithoutAnalytics = { ...mockEnv, ANALYTICS: undefined };
      registerAnalyticsRoutes(mockRouter);
      const handler = mockRouter.post.mock.calls[0]?.[1];
      if (!handler) throw new Error('Handler not registered');

      const payload = {
        sessionId: 'sess_123',
        visitorId: 'vis_456',
        events: [
          {
            type: 'page_view',
            page: '/analysis',
            timestamp: Date.now(),
          },
        ],
      };

      const request = new Request('http://localhost/v1/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const response = await handler(request, envWithoutAnalytics);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /v1/api/analytics/summary', () => {
    it('requires sessionId parameter', async () => {
      registerAnalyticsRoutes(mockRouter);
      const handler = mockRouter.get.mock.calls[0]?.[1];
      if (!handler) throw new Error('Handler not registered');

      const request = new Request('http://localhost/v1/api/analytics/summary');

      const response = await handler(request, mockEnv);

      expect(response.status).toBe(400);
    });

    it('returns summary information', async () => {
      registerAnalyticsRoutes(mockRouter);
      const handler = mockRouter.get.mock.calls[0]?.[1];
      if (!handler) throw new Error('Handler not registered');

      const request = new Request('http://localhost/v1/api/analytics/summary?sessionId=sess_123');

      const response = await handler(request, mockEnv);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe('sess_123');
      expect(data.message).toBeTruthy();
    });
  });
});
