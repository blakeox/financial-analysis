import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkRateLimit } from './rate-limit';
import type { Env } from '../types';

describe('checkRateLimit', () => {
  let env: Env;
  let mockKV: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockKV = {
      get: vi.fn(),
      put: vi.fn(),
    };
    env = {
      SESSIONS: mockKV as unknown as KVNamespace,
    } as unknown as Env;
  });

  it('should apply chat rate limit for chat endpoints', async () => {
    const request = new Request('https://api.example.com/v1/chat/enhanced');
    mockKV.get.mockResolvedValue(null);

    const result = await checkRateLimit(request, env);

    expect(result.limit).toBe(20);
    expect(mockKV.put).toHaveBeenCalledWith(
      expect.stringContaining('ratelimit:chat:'),
      expect.any(String),
      expect.any(Object)
    );
  });

  it('should apply analysis rate limit for analysis endpoints', async () => {
    const request = new Request('https://api.example.com/api/analysis/lease');
    mockKV.get.mockResolvedValue(null);

    const result = await checkRateLimit(request, env);

    expect(result.limit).toBe(50);
    expect(mockKV.put).toHaveBeenCalledWith(
      expect.stringContaining('ratelimit:analysis:'),
      expect.any(String),
      expect.any(Object)
    );
  });

  it('should apply default rate limit for other endpoints', async () => {
    const request = new Request('https://api.example.com/other');
    mockKV.get.mockResolvedValue(null);

    const result = await checkRateLimit(request, env);

    expect(result.limit).toBe(100);
    expect(mockKV.put).toHaveBeenCalledWith(
      expect.stringContaining('ratelimit:default:'),
      expect.any(String),
      expect.any(Object)
    );
  });

  it('should block request when limit exceeded', async () => {
    const request = new Request('https://api.example.com/v1/chat/enhanced');
    const now = Date.now();
    mockKV.get.mockResolvedValue(JSON.stringify({
      count: 20,
      resetTime: now + 60000
    }));

    const result = await checkRateLimit(request, env);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
