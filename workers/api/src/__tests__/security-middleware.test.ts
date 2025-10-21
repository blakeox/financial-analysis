/**
 * Tests for security middleware
 */

import { describe, it, expect } from 'vitest';
import {
  generateFingerprint,
  buildSecurityContext,
  withSecurityContext,
  type SecurityContext,
} from '../lib/security-middleware';
import type { Env } from '../types';

// Mock Session DO
class MockSessionDO {
  private initialized = false;

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Handle both stub.fetch(url, options) and stub.fetch(Request)
    const request = input instanceof Request 
      ? input 
      : new Request(input.toString(), init);
    
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/check') {
      // Return 404 on first check to trigger initialization, then return success
      if (!this.initialized) {
        return new Response('Not found', { status: 404 });
      }
      return new Response(
        JSON.stringify({
          allowed: true,
          trustScore: 100,
          requestCount: 5,
          messageCount: 2,
          flags: [],
        }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (path === '/increment') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/flag') {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/init') {
      this.initialized = true;
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

describe('generateFingerprint', () => {
  it('should generate SHA-256 fingerprint from IP and User-Agent', async () => {
    const ip = '203.0.113.1';
    const userAgent = 'Mozilla/5.0';

    const fingerprint = await generateFingerprint(ip, userAgent);

    expect(fingerprint).toBeTruthy();
    expect(fingerprint).toHaveLength(64); // SHA-256 produces 64 hex chars
  });

  it('should produce different fingerprints for different inputs', async () => {
    const fp1 = await generateFingerprint('203.0.113.1', 'Mozilla/5.0');
    const fp2 = await generateFingerprint('203.0.113.2', 'Mozilla/5.0');
    const fp3 = await generateFingerprint('203.0.113.1', 'Chrome/95.0');

    expect(fp1).not.toBe(fp2);
    expect(fp1).not.toBe(fp3);
    expect(fp2).not.toBe(fp3);
  });

  it('should produce same fingerprint for same inputs', async () => {
    const fp1 = await generateFingerprint('203.0.113.1', 'Mozilla/5.0');
    const fp2 = await generateFingerprint('203.0.113.1', 'Mozilla/5.0');

    expect(fp1).toBe(fp2);
  });
});

describe('buildSecurityContext', () => {
  it('should build security context from request', async () => {
    const mockDO = new MockSessionDO();
    const mockEnv = {
      SESSION_DO: {
        get: (_id: unknown) => mockDO,
        idFromName: (name: string) => ({ name }),
      },
    } as unknown as Env;

    const request = new Request('https://example.com/test', {
      headers: {
        'CF-Connecting-IP': '203.0.113.1',
        'User-Agent': 'Test/1.0',
      },
    });

    const context = await buildSecurityContext(request, mockEnv);

    expect(context.requestId).toBeTruthy();
    expect(context.fingerprint).toBeTruthy();
    expect(context.sessionId).toBeTruthy();
    expect(context.isAllowed).toBe(true);
    expect(context.trustScore).toBe(100);
  });

  it('should handle missing Session DO binding', async () => {
    const mockEnv = {} as Env;

    const request = new Request('https://example.com/test', {
      headers: {
        'CF-Connecting-IP': '203.0.113.1',
        'User-Agent': 'Test/1.0',
      },
    });

    const context = await buildSecurityContext(request, mockEnv);

    expect(context.isAllowed).toBe(false);
    expect(context.denyReason).toBe('session_unavailable');
  });

  it('should use X-Forwarded-For if CF-Connecting-IP missing', async () => {
    const mockDO = new MockSessionDO();
    const mockEnv = {
      SESSION_DO: {
        get: (_id: unknown) => mockDO,
        idFromName: (name: string) => ({ name }),
      },
    } as unknown as Env;

    const request = new Request('https://example.com/test', {
      headers: {
        'X-Forwarded-For': '203.0.113.99',
        'User-Agent': 'Test/1.0',
      },
    });

    const context = await buildSecurityContext(request, mockEnv);

    expect(context.isAllowed).toBe(true);
    expect(context.fingerprint).toBeTruthy();
  });
});

describe('withSecurityContext', () => {
  it('should wrap handler with security checks', async () => {
    const mockDO = new MockSessionDO();
    const mockEnv = {
      SESSION_DO: {
        get: (_id: unknown) => mockDO,
        idFromName: (name: string) => ({ name }),
      },
    } as unknown as Env;

    const mockHandler = async (_request: Request, _env: Env, context: SecurityContext) => {
      return new Response(JSON.stringify({ allowed: context.isAllowed }), {
        headers: { 'Content-Type': 'application/json' },
      });
    };

    const wrappedHandler = withSecurityContext(mockHandler);

    const request = new Request('https://example.com/test', {
      headers: {
        'CF-Connecting-IP': '203.0.113.1',
        'User-Agent': 'Test/1.0',
      },
    });

    const response = await wrappedHandler(request, mockEnv);

    expect(response.status).toBe(200);
    const data = await response.json() as { allowed: boolean };
    expect(data.allowed).toBe(true);
  });

  it('should block denied requests', async () => {
    // Mock that returns denied
    class DenyingSessionDO {
      async fetch(_request: Request): Promise<Response> {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: 'rate_limit_exceeded',
            retryAfter: 30,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const mockEnv = {
      SESSION_DO: {
        get: (_id: unknown) => new DenyingSessionDO(),
        idFromName: (name: string) => ({ name }),
      },
    } as unknown as Env;

    const mockHandler = async (_request: Request, _env: Env, context: SecurityContext) => {
      if (!context.isAllowed) {
        return new Response(
          JSON.stringify({ error: context.denyReason, retryAfter: context.retryAfter }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response('OK');
    };

    const wrappedHandler = withSecurityContext(mockHandler);

    const request = new Request('https://example.com/test', {
      headers: {
        'CF-Connecting-IP': '203.0.113.1',
        'User-Agent': 'Test/1.0',
      },
    });

    const response = await wrappedHandler(request, mockEnv);

    expect(response.status).toBe(429);
    const data = await response.json() as { error: string; retryAfter?: number };
    expect(data.error).toBe('rate_limit_exceeded');
    expect(data.retryAfter).toBe(30);
  });
});
