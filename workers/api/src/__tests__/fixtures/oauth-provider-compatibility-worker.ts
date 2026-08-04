import { OAuthProvider } from '@cloudflare/workers-oauth-provider';

const defaultHandler = {
  async fetch(request: Request): Promise<Response> {
    if (new URL(request.url).pathname === '/oauth/authorize') {
      return new Response(
        JSON.stringify({
          error: {
            code: 'OAUTH_AUTHORIZATION_NOT_CONFIGURED',
          },
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response('not found', { status: 404 });
  },
};

const apiHandler = {
  async fetch(): Promise<Response> {
    return new Response('authorized', { status: 200 });
  },
};

export default new OAuthProvider({
  apiRoute: '/oauth/mcp',
  apiHandler,
  defaultHandler,
  authorizeEndpoint: '/oauth/authorize',
  tokenEndpoint: '/oauth/token',
  clientRegistrationEndpoint: '/oauth/register',
  scopesSupported: ['analysis:read'],
  allowImplicitFlow: false,
  allowPlainPKCE: false,
});
