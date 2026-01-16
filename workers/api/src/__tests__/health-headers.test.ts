import { describe, expect, it } from 'vitest';
import api from '../index';
import { makeTestEnv } from './helpers/env';

describe('/health headers', () => {
  it('returns JSON with security headers and no RateLimit headers', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/health', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')?.toLowerCase()).toContain('application/json');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toContain("default-src 'self'");
    // Not an API/MCP route: should not include RL headers
    expect(res.headers.has('x-ratelimit-remaining')).toBe(false);
    expect(res.headers.has('x-ratelimit-reset')).toBe(false);
  });
});
