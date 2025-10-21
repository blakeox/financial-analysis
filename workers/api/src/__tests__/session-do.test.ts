/**
 * Tests for Session Durable Object
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SessionDO } from '../durable-objects/SessionDO';

// Simple mock for Durable Object state
class MockDurableObjectState {
  private _storage = new Map<string, unknown>();

  waitUntil(_promise: Promise<unknown>): void {
    // no-op
  }

  async blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T> {
    return await callback();
  }

  get storage() {
    const storageMap = this._storage;
    return {
      get: async <T = unknown>(key: string): Promise<T | undefined> => {
        return storageMap.get(key) as T | undefined;
      },
      put: async (key: string, value: unknown): Promise<void> => {
        storageMap.set(key, value);
      },
      delete: async (key: string): Promise<boolean> => {
        return storageMap.delete(key);
      },
      deleteAll: async (): Promise<void> => {
        storageMap.clear();
      },
      list: async () => new Map(),
      getAlarm: async () => null,
      setAlarm: async (_time: number | Date) => {},
      deleteAlarm: async () => {},
      sync: async () => {},
      transaction: async <T>(closure: () => Promise<T>) => closure(),
      transactionSync: <T>(closure: () => T) => closure(),
      sql: undefined as never,
    };
  }

  get id() {
    return {
      toString: () => 'test-id',
      equals: () => false,
      name: 'test-session',
    };
  }
}

describe('SessionDO', () => {
  let sessionDO: SessionDO;
  let mockState: MockDurableObjectState;

  beforeEach(() => {
    mockState = new MockDurableObjectState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sessionDO = new SessionDO(mockState as any);
  });

  describe('Session Initialization', () => {
    it('should initialize a new session', async () => {
      const request = new Request('http://do/init', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: 'test-session-123',
          ipAddress: '203.0.113.1',
          userAgent: 'Mozilla/5.0',
        }),
      });

      const response = await sessionDO.fetch(request);
      expect(response.status).toBe(200);

      const data = await response.json() as { ok: boolean; session: Record<string, unknown> };
      expect(data.ok).toBe(true);
      expect(data.session.sessionId).toBe('test-session-123');
      expect(data.session.trustScore).toBe(100);
      expect(data.session.requestCount).toBe(0);
      expect(data.session.messageCount).toBe(0);
    });
  });

  describe('Request Checking', () => {
    beforeEach(async () => {
      // Initialize session
      await sessionDO.fetch(
        new Request('http://do/init', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test-session',
            ipAddress: '203.0.113.1',
            userAgent: 'Test Agent',
          }),
        })
      );
    });

    it('should allow requests within limits', async () => {
      const response = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({ isMessage: false }),
        })
      );

      const data = await response.json() as { allowed: boolean; trustScore: number };
      expect(data.allowed).toBe(true);
      expect(data.trustScore).toBe(100);
    });

    it('should detect replay attacks', async () => {
      const requestHash = 'abc123def456';

      // First request with hash - allowed
      const firstCheck = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({ requestHash }),
        })
      );
      const firstData = await firstCheck.json() as { allowed: boolean };
      expect(firstData.allowed).toBe(true);

      // Increment to add to replay cache
      await sessionDO.fetch(
        new Request('http://do/increment', {
          method: 'POST',
          body: JSON.stringify({ requestHash }),
        })
      );

      // Second request with same hash - blocked
      const secondCheck = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({ requestHash }),
        })
      );
      const secondData = await secondCheck.json() as { allowed: boolean; reason: string };
      expect(secondData.allowed).toBe(false);
      expect(secondData.reason).toBe('replay_detected');
    });

    it('should enforce rate limits', async () => {
      // Make 20 requests rapidly
      for (let i = 0; i < 20; i++) {
        await sessionDO.fetch(
          new Request('http://do/increment', {
            method: 'POST',
            body: JSON.stringify({ isMessage: false }),
          })
        );
      }

      // 21st request should be blocked
      const response = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({ isMessage: false }),
        })
      );

      const data = await response.json() as { allowed: boolean; reason: string; retryAfter?: number };
      expect(data.allowed).toBe(false);
      expect(data.reason).toBe('rate_limit_exceeded');
      expect(data.retryAfter).toBeGreaterThan(0);
    });

    it('should enforce message limits', async () => {
      // Send 50 messages
      for (let i = 0; i < 50; i++) {
        await sessionDO.fetch(
          new Request('http://do/increment', {
            method: 'POST',
            body: JSON.stringify({ isMessage: true }),
          })
        );
      }

      // 51st message should be blocked
      const response = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({ isMessage: true }),
        })
      );

      const data = await response.json() as { allowed: boolean; reason: string };
      expect(data.allowed).toBe(false);
      expect(data.reason).toBe('max_messages_exceeded');
    });

    it('should enforce session request limits', async () => {
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await sessionDO.fetch(
          new Request('http://do/increment', {
            method: 'POST',
            body: JSON.stringify({ isMessage: false }),
          })
        );
      }

      // 101st request should be blocked
      const response = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({ isMessage: false }),
        })
      );

      const data = await response.json() as { allowed: boolean; reason: string };
      expect(data.allowed).toBe(false);
      expect(data.reason).toBe('max_requests_exceeded');
    });
  });

  describe('Security Flags', () => {
    beforeEach(async () => {
      await sessionDO.fetch(
        new Request('http://do/init', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test-session',
            ipAddress: '203.0.113.1',
            userAgent: 'Test Agent',
          }),
        })
      );
    });

    it('should add security flags', async () => {
      const response = await sessionDO.fetch(
        new Request('http://do/flag', {
          method: 'POST',
          body: JSON.stringify({
            flag: 'prompt_injection',
            scoreAdjustment: -20,
          }),
        })
      );

      const data = await response.json() as { session: { flags: string[]; trustScore: number } };
      expect(data.session.flags).toContain('prompt_injection');
      expect(data.session.trustScore).toBe(80); // 100 - 20
    });

    it('should not duplicate flags', async () => {
      // Add same flag twice
      await sessionDO.fetch(
        new Request('http://do/flag', {
          method: 'POST',
          body: JSON.stringify({ flag: 'rate_limit_violation' }),
        })
      );

      const response = await sessionDO.fetch(
        new Request('http://do/flag', {
          method: 'POST',
          body: JSON.stringify({ flag: 'rate_limit_violation' }),
        })
      );

      const data = await response.json() as { session: { flags: string[] } };
      const flagCount = data.session.flags.filter((f) => f === 'rate_limit_violation').length;
      expect(flagCount).toBe(1);
    });

    it('should clamp trust score between 0 and 100', async () => {
      // Reduce trust score to 0
      await sessionDO.fetch(
        new Request('http://do/flag', {
          method: 'POST',
          body: JSON.stringify({ scoreAdjustment: -150 }),
        })
      );

      let response = await sessionDO.fetch(
        new Request('http://do/get', { method: 'GET' })
      );
      let data = await response.json() as { session: { trustScore: number } };
      expect(data.session.trustScore).toBe(0);

      // Try to increase above 100
      await sessionDO.fetch(
        new Request('http://do/flag', {
          method: 'POST',
          body: JSON.stringify({ scoreAdjustment: 250 }),
        })
      );

      response = await sessionDO.fetch(
        new Request('http://do/get', { method: 'GET' })
      );
      data = await response.json() as { session: { trustScore: number } };
      expect(data.session.trustScore).toBe(100);
    });
  });

  describe('Session Management', () => {
    it('should get session state', async () => {
      await sessionDO.fetch(
        new Request('http://do/init', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test',
            ipAddress: '203.0.113.1',
            userAgent: 'Test',
          }),
        })
      );

      const response = await sessionDO.fetch(
        new Request('http://do/get', { method: 'GET' })
      );

      expect(response.status).toBe(200);
      const data = await response.json() as { session: { sessionId: string } };
      expect(data.session.sessionId).toBe('test');
    });

    it('should reset session', async () => {
      await sessionDO.fetch(
        new Request('http://do/init', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test',
            ipAddress: '203.0.113.1',
            userAgent: 'Test',
          }),
        })
      );

      const resetResponse = await sessionDO.fetch(
        new Request('http://do/reset', { method: 'POST' })
      );
      expect(resetResponse.status).toBe(200);

      const getResponse = await sessionDO.fetch(
        new Request('http://do/get', { method: 'GET' })
      );
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await sessionDO.fetch(
        new Request('http://do/check', {
          method: 'POST',
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Increment Operations', () => {
    beforeEach(async () => {
      await sessionDO.fetch(
        new Request('http://do/init', {
          method: 'POST',
          body: JSON.stringify({
            sessionId: 'test',
            ipAddress: '203.0.113.1',
            userAgent: 'Test',
          }),
        })
      );
    });

    it('should increment request counter', async () => {
      await sessionDO.fetch(
        new Request('http://do/increment', {
          method: 'POST',
          body: JSON.stringify({ isMessage: false }),
        })
      );

      const response = await sessionDO.fetch(
        new Request('http://do/get', { method: 'GET' })
      );

      const data = await response.json() as { session: { requestCount: number } };
      expect(data.session.requestCount).toBe(1);
    });

    it('should increment message counter when isMessage=true', async () => {
      await sessionDO.fetch(
        new Request('http://do/increment', {
          method: 'POST',
          body: JSON.stringify({ isMessage: true }),
        })
      );

      const response = await sessionDO.fetch(
        new Request('http://do/get', { method: 'GET' })
      );

      const data = await response.json() as { session: { requestCount: number; messageCount: number } };
      expect(data.session.requestCount).toBe(1);
      expect(data.session.messageCount).toBe(1);
    });
  });
});
