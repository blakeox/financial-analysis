import { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider';

interface Env {
  OAUTH_KV: KVNamespace;
  OAUTH_PROVIDER?: OAuthHelpers;
}

const defaultHandler = {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === '/oauth/authorize') {
      const oauth = env.OAUTH_PROVIDER;
      if (!oauth) return new Response('OAuth provider unavailable', { status: 503 });

      const authRequest = await oauth.parseAuthRequest(request);
      const { redirectTo } = await oauth.completeAuthorization({
        request: authRequest,
        userId: 'test-user',
        metadata: { fixture: true },
        scope: ['analysis:read'],
        props: { userId: 'test-user', customerId: 'test-customer', mcpScopes: ['analysis:read'] },
      });
      return Response.redirect(redirectTo, 302);
    }
    return new Response('not found', { status: 404 });
  },
};

const apiHandler = {
  async fetch(): Promise<Response> {
    return new Response('authorized', { status: 200 });
  },
};

export default new OAuthProvider<Env>({
  apiRoute: '/oauth/mcp',
  apiHandler,
  defaultHandler,
  authorizeEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['analysis:read'],
  allowImplicitFlow: false,
  allowPlainPKCE: false,
  accessTokenTTL: 3600,
  refreshTokenTTL: 3600,
});
