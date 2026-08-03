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
      mcp: {
        serverVersion: string;
        protocolVersion: string;
        capabilityPolicyVersion: string;
      };
      controls: {
        oauthEnabled: boolean;
        modelEgressEnabled: boolean;
        budgetEnforcementEnabled: boolean;
        connectorEgressEnabled: boolean;
        codeModeEnabled: boolean;
      };
    };
    expect(json.commit).toBe('abc123');
    expect(json.environment).toBe('test');
    expect(json.mcp.serverVersion).toBe('1.0.0');
    expect(json.mcp.protocolVersion).toBe('2024-11-05');
    expect(json.mcp.capabilityPolicyVersion).toBe('1.0.0');
    expect(json.controls.oauthEnabled).toBe(false);
    expect(json.controls.modelEgressEnabled).toBe(true);
    expect(json.controls.budgetEnforcementEnabled).toBe(false);
    expect(json.controls.connectorEgressEnabled).toBe(false);
    expect(json.controls.codeModeEnabled).toBe(false);
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
