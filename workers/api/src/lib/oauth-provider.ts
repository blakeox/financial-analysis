import { OAuthProvider } from '@cloudflare/workers-oauth-provider';
import type { ExportedHandler } from '@cloudflare/workers-types';
import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { handleEnhancedMCPRequest } from './enhanced-mcp';
import { buildRequestContext } from './request-context';
import { handleOAuthAuthorizeRequest } from './oauth-consent';
import { handleOAuthGrantsRequest, isOAuthGrantsRoute } from './oauth-grants';
import { handleOidcLoginRequest } from './oauth-oidc-login';
import {
  OAUTH_AUTHORIZE_ROUTE,
  OAUTH_MCP_ROUTE,
  OAUTH_REGISTER_ROUTE,
  OAUTH_SUPPORTED_SCOPES,
  OAUTH_TOKEN_ROUTE,
  OIDC_CALLBACK_ROUTE,
  OIDC_LOGIN_ROUTE,
  parseOAuthMcpGrantProps,
} from './oauth-policy';

type OAuthExecutionContext = ExecutionContext & { props?: unknown };
type HandlerWithFetch = Pick<Required<ExportedHandler<Env>>, 'fetch'>;

const oauthMcpHandler: HandlerWithFetch = {
  async fetch(request, env, ctx) {
    const identity = parseOAuthMcpGrantProps((ctx as OAuthExecutionContext).props);
    if (!identity) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'OAuth grant is missing a valid financial-analysis identity.',
            code: 'INVALID_OAUTH_GRANT',
          },
        }),
        {
          status: 403,
          headers: {
            ...buildDefaultHeaders(env),
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const requestContext = buildRequestContext(request, env.ENVIRONMENT);
    requestContext.auth = {
      apiKeyId: 0,
      customerId: identity.customerId,
      clientId: 'oauth-mcp',
      tier: 'oauth',
      scopes: identity.mcpScopes,
      mcpAnalysisEnabled: env.MCP_ANALYSIS_ENABLED !== 'false',
      source: 'oauth',
    };

    return handleEnhancedMCPRequest(request, env, requestContext);
  },
};

/**
 * Build the Cloudflare-maintained OAuth provider as a canary boundary.
 *
 * The provider is deliberately mounted at /oauth/mcp while API-key clients
 * continue using /mcp. The authorization handler requires a verified
 * resource-owner identity and explicit consent; no synthetic user identity
 * is accepted here.
 */
export function createOAuthProvider(defaultHandler: HandlerWithFetch) {
  return new OAuthProvider<Env>({
    apiRoute: OAUTH_MCP_ROUTE,
    apiHandler: oauthMcpHandler,
    defaultHandler: {
      async fetch(request, env, ctx) {
        const pathname = new URL(request.url).pathname;
        if (pathname === OIDC_LOGIN_ROUTE || pathname === OIDC_CALLBACK_ROUTE) {
          return handleOidcLoginRequest(request, env);
        }
        if (pathname === OAUTH_AUTHORIZE_ROUTE) {
          return handleOAuthAuthorizeRequest(request, env);
        }
        if (isOAuthGrantsRoute(new URL(request.url).pathname)) {
          return handleOAuthGrantsRequest(request, env);
        }
        return defaultHandler.fetch(request, env, ctx);
      },
    },
    authorizeEndpoint: OAUTH_AUTHORIZE_ROUTE,
    tokenEndpoint: OAUTH_TOKEN_ROUTE,
    clientRegistrationEndpoint: OAUTH_REGISTER_ROUTE,
    scopesSupported: [...OAUTH_SUPPORTED_SCOPES],
    allowImplicitFlow: false,
    allowPlainPKCE: false,
    accessTokenTTL: 3600,
    refreshTokenTTL: 2_592_000,
    clientRegistrationTTL: 7_776_000,
  });
}
