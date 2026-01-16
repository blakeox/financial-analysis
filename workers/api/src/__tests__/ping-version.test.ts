import { describe, expect, it } from 'vitest';
import api from '../index';
import { makeTestEnv } from './helpers/env';

describe('/ping', () => {
  it('responds with pong and security headers', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/ping', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('pong');
    expect(res.headers.get('content-type')?.toLowerCase()).toContain('text/plain');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });
});

describe('/version', () => {
  it('returns version metadata with commit when set', async () => {
    const { env, ctx } = makeTestEnv({ commitSha: 'abc123' });
    const req = new Request('https://example.com/version', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      commit: string;
      environment: string;
      service: string;
      version: string;
      timestamp: string;
    };
    expect(json.commit).toBe('abc123');
    expect(json.environment).toBe('test');
  });

  it('returns unknown commit when not set', async () => {
    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/version', { method: 'GET' });
    const res = await api.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { commit: string };
    expect(json.commit).toBe('unknown');
  });
});
