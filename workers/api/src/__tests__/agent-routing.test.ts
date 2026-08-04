import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeTestEnv } from './helpers/env';

const mockRouteAgentRequest = vi.hoisted(() => vi.fn());
const mockAuthorizeAgentRequest = vi.hoisted(() => vi.fn());

vi.mock('agents', () => ({
  routeAgentRequest: mockRouteAgentRequest,
}));

vi.mock('../agents/FinancialAnalysisAgent', () => ({
  FinancialAnalysisAgent: class FinancialAnalysisAgent {},
}));

vi.mock('../lib/agent-access', () => ({
  authorizeAgentRequest: mockAuthorizeAgentRequest,
}));

const { default: api } = await import('../index');

describe('agent routing', () => {
  beforeEach(() => {
    mockRouteAgentRequest.mockReset();
    mockAuthorizeAgentRequest.mockReset();
    mockAuthorizeAgentRequest.mockImplementation(async (request: Request) => ({
      request,
      props: { userId: 'test-user', customerId: 'test-customer', provider: 'development' },
    }));
  });

  it('routes HTTP agent requests through routeAgentRequest', async () => {
    mockRouteAgentRequest.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/agents/financial-analysis-agent/default', {
      method: 'GET',
    });

    const res = await api.fetch(req, env, ctx);

    expect(mockRouteAgentRequest).toHaveBeenCalledWith(
      req,
      env,
      expect.objectContaining({ props: expect.objectContaining({ userId: 'test-user' }) })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Request-ID')).toBeTruthy();
    expect(await res.json()).toEqual({ ok: true });
  });

  it('returns websocket upgrade responses without rewrapping them', async () => {
    const upgradeResponse = {
      status: 101,
      headers: new Headers(),
      body: null,
    } as Response;
    mockRouteAgentRequest.mockResolvedValue(upgradeResponse);

    const { env, ctx } = makeTestEnv();
    const req = new Request('https://example.com/agents/financial-analysis-agent/default', {
      method: 'GET',
      headers: { Upgrade: 'websocket' },
    });

    const res = await api.fetch(req, env, ctx);

    expect(res).toBe(upgradeResponse);
  });
});
