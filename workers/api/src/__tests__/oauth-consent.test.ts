import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handleOAuthAuthorizeRequest } from '../lib/oauth-consent';

const getIdentity = vi.hoisted(() => vi.fn());
vi.mock('../lib/cloudflare-access-identity', () => ({
  getCloudflareAccessIdentity: getIdentity,
}));

const authRequest = {
  responseType: 'code',
  clientId: 'client-1',
  redirectUri: 'http://localhost:3000/callback',
  scope: ['analysis:read'],
  state: 'state-1',
  codeChallenge: 'challenge',
  codeChallengeMethod: 'S256',
  resource: 'https://example.com/oauth/mcp',
} as const;

const clientInfo = {
  clientId: 'client-1',
  clientName: '<Trusted client>',
  redirectUris: ['http://localhost:3000/callback'],
  tokenEndpointAuthMethod: 'none',
};

function makeOAuthHelpers() {
  return {
    parseAuthRequest: vi.fn(async (request: Request) => ({
      ...authRequest,
      resource: new URL(request.url).searchParams.get('resource') ?? authRequest.resource,
    })),
    lookupClient: vi.fn(async () => clientInfo),
    completeAuthorization: vi.fn(async () => ({
      redirectTo: 'http://localhost:3000/callback?code=one-time-code&state=state-1',
    })),
  } as unknown as OAuthHelpers;
}

function makeEnv(oauth: OAuthHelpers) {
  return {
    ENVIRONMENT: 'test',
    OAUTH_PROVIDER: oauth,
  } as unknown as Parameters<typeof handleOAuthAuthorizeRequest>[1];
}

describe('OAuth consent', () => {
  beforeEach(() => {
    getIdentity.mockReset();
  });

  it('requires a verified Cloudflare Access identity', async () => {
    getIdentity.mockResolvedValue(null);
    const oauth = makeOAuthHelpers();
    const response = await handleOAuthAuthorizeRequest(
      new Request('https://example.com/oauth/authorize?response_type=code'),
      makeEnv(oauth)
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toContain('OAUTH_IDENTITY_NOT_VERIFIED');
    expect(oauth.completeAuthorization).not.toHaveBeenCalled();
  });

  it('renders an escaped, no-memory consent page and requires CSRF for approval', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();
    const request = new Request(
      'https://example.com/oauth/authorize?response_type=code&client_id=client-1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=analysis%3Aread&state=state-1&code_challenge=challenge&code_challenge_method=S256&resource=https%3A%2F%2Fexample.com%2Foauth%2Fmcp'
    );

    const page = await handleOAuthAuthorizeRequest(request, makeEnv(oauth));
    const html = await page.text();
    const cookie = page.headers.get('set-cookie');

    expect(html).toContain('name="csrf"');

    expect(page.status).toBe(200);
    expect(html).toContain('&lt;Trusted client&gt;');
    expect(html).toContain('No Agent memory, workspace documents, or saved user information.');
    expect(cookie).toContain('__Host-FANALYX_OAUTH_CSRF=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');

    const csrf = html.match(/name="csrf" value="([^"]+)"/)?.[1];
    expect(csrf).toBeTruthy();
    const denied = new Request(request, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `__Host-FANALYX_OAUTH_CSRF=${csrf}`,
      },
      body: new URLSearchParams({
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: authRequest.redirectUri,
        scope: 'analysis:read',
        state: authRequest.state,
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        resource: authRequest.resource,
        csrf: csrf ?? '',
        decision: 'deny',
      }),
    });

    denied.headers.set('Cookie', `__Host-FANALYX_OAUTH_CSRF=${csrf}`);
    const deniedResponse = await handleOAuthAuthorizeRequest(denied, makeEnv(oauth));
    expect(deniedResponse.status).toBe(302);
    expect(deniedResponse.headers.get('location')).toContain('error=access_denied');
    expect(oauth.completeAuthorization).not.toHaveBeenCalled();
  });

  it('completes authorization only after CSRF and policy validation', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();
    const csrf = 'csrf-token';
    const request = new Request('https://example.com/oauth/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: `__Host-FANALYX_OAUTH_CSRF=${csrf}`,
      },
      body: new URLSearchParams({
        response_type: 'code',
        client_id: 'client-1',
        redirect_uri: authRequest.redirectUri,
        scope: 'analysis:read',
        state: authRequest.state,
        code_challenge: 'challenge',
        code_challenge_method: 'S256',
        resource: authRequest.resource,
        csrf,
        decision: 'approve',
      }),
    });

    request.headers.set('Cookie', `__Host-FANALYX_OAUTH_CSRF=${csrf}`);
    const response = await handleOAuthAuthorizeRequest(request, makeEnv(oauth));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('code=one-time-code');
    expect(oauth.completeAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'access-user',
        scope: ['analysis:read'],
        props: {
          userId: 'access-user',
          customerId: 'access-user',
          mcpScopes: ['analysis:read'],
        },
      })
    );
  });

  it('rejects cross-resource authorization requests', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();
    oauth.parseAuthRequest = vi.fn(async (request: Request) => ({
      ...authRequest,
      clientId: new URL(request.url).searchParams.get('client_id') ?? authRequest.clientId,
      resource: new URL(request.url).searchParams.get('resource') ?? authRequest.resource,
    })) as unknown as OAuthHelpers['parseAuthRequest'];
    const request = new Request(
      'https://example.com/oauth/authorize?response_type=code&client_id=client-1&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=analysis%3Aread&resource=https%3A%2F%2Fevil.example%2Fmcp'
    );

    const response = await handleOAuthAuthorizeRequest(request, makeEnv(oauth));
    expect(response.status).toBe(400);
    expect(await response.text()).toContain('INVALID_SCOPE');
    expect(oauth.completeAuthorization).not.toHaveBeenCalled();
  });

  it('explains that the browser OIDC client is not an MCP client', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();
    oauth.parseAuthRequest = vi.fn(async (request: Request) => ({
      ...authRequest,
      clientId: new URL(request.url).searchParams.get('client_id') ?? authRequest.clientId,
      resource: new URL(request.url).searchParams.get('resource') ?? authRequest.resource,
    })) as unknown as OAuthHelpers['parseAuthRequest'];
    const request = new Request(
      'https://example.com/oauth/authorize?response_type=code&client_id=clerk-oidc-client&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&scope=analysis%3Aread&resource=https%3A%2F%2Fexample.com%2Foauth%2Fmcp'
    );

    const response = await handleOAuthAuthorizeRequest(request, {
      ...makeEnv(oauth),
      OIDC_CLIENT_ID: 'clerk-oidc-client',
    } as unknown as Parameters<typeof handleOAuthAuthorizeRequest>[1]);

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('INVALID_CLIENT');
    expect(oauth.lookupClient).not.toHaveBeenCalled();
  });

  it('rejects Fanalyx browser callback URLs as MCP client redirects', async () => {
    getIdentity.mockResolvedValue({ userId: 'access-user', customerId: 'access-user' });
    const oauth = makeOAuthHelpers();
    oauth.parseAuthRequest = vi.fn(async (request: Request) => ({
      ...authRequest,
      redirectUri: `${new URL(request.url).origin}/oauth/callback`,
      resource: new URL(request.url).searchParams.get('resource') ?? authRequest.resource,
    })) as unknown as OAuthHelpers['parseAuthRequest'];
    oauth.lookupClient = vi.fn(async () => ({
      ...clientInfo,
      redirectUris: ['https://example.com/oauth/callback'],
    })) as unknown as OAuthHelpers['lookupClient'];

    const request = new Request(
      'https://example.com/oauth/authorize?response_type=code&client_id=client-1&redirect_uri=https%3A%2F%2Fexample.com%2Foauth%2Fcallback&scope=analysis%3Aread&resource=https%3A%2F%2Fexample.com%2Foauth%2Fmcp'
    );
    const response = await handleOAuthAuthorizeRequest(request, makeEnv(oauth));

    expect(response.status).toBe(400);
    expect(await response.text()).toContain('INVALID_REDIRECT_URI');
    expect(oauth.completeAuthorization).not.toHaveBeenCalled();
  });
});
