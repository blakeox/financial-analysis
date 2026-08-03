import { describe, expect, it } from 'vitest';
import { authorizeAgentRequest, scopeAgentRequest } from '../lib/agent-access';

describe('Agent owner scoping', () => {
  it('maps the same client thread name to different owner-specific routes', async () => {
    const request = new Request(
      'https://example.com/agents/FinancialAnalysisAgent/default?mode=chat'
    );
    const first = await scopeAgentRequest(request, {
      userId: 'owner-one',
      customerId: 'customer-one',
      provider: 'oidc',
    });
    const second = await scopeAgentRequest(request, {
      userId: 'owner-two',
      customerId: 'customer-two',
      provider: 'oidc',
    });

    expect(first).toBeInstanceOf(Request);
    expect(second).toBeInstanceOf(Request);
    expect(new URL((first as Request).url).pathname).not.toBe(
      new URL((second as Request).url).pathname
    );
    expect(new URL((first as Request).url).pathname).toContain(
      '/agents/FinancialAnalysisAgent/fanalyx-'
    );
    expect(new URL((first as Request).url).search).toBe('?mode=chat');
  });

  it('rejects malformed agent class or thread names', async () => {
    const request = new Request('https://example.com/agents/FinancialAnalysisAgent/bad%2Fname');
    await expect(
      scopeAgentRequest(request, {
        userId: 'owner-one',
        customerId: 'customer-one',
        provider: 'oidc',
      })
    ).resolves.toBeNull();
  });

  it('preserves the WebSocket upgrade headers while rewriting the route', async () => {
    const request = new Request('https://example.com/agents/FinancialAnalysisAgent/default', {
      headers: { Upgrade: 'websocket' },
    });
    const scoped = await scopeAgentRequest(request, {
      userId: 'owner-one',
      customerId: 'customer-one',
      provider: 'oidc',
    });

    expect(scoped).toBeInstanceOf(Request);
    expect((scoped as Request).headers.get('upgrade')).toBe('websocket');
  });

  it('does not treat the web proxy secret as a user identity in production', async () => {
    const result = await authorizeAgentRequest(
      new Request('https://example.com/agents/FinancialAnalysisAgent/default', {
        headers: { 'x-internal-api-token': 'proxy-only-secret' },
      }),
      { ENVIRONMENT: 'production', INTERNAL_API_TOKEN: 'proxy-only-secret' }
    );

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(401);
    expect((result as Response).headers.get('cache-control')).toBe('no-store');
  });

  it('rejects a browser origin outside the configured frontend origin', async () => {
    const result = await authorizeAgentRequest(
      new Request('https://example.com/agents/FinancialAnalysisAgent/default', {
        headers: { Origin: 'https://evil.example' },
      }),
      { ENVIRONMENT: 'production', ALLOWED_ORIGIN: 'https://fanalyx.com' }
    );

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(403);
  });
});
