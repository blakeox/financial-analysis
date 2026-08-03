import { MCP_SCOPES, type MCPPolicyScope } from '@financial-analysis/tools';
import type { Env } from '../types';

/**
 * OAuth is staged behind a separate route so API-key clients keep their
 * existing contract while resource-owner authentication is completed.
 */
export const OAUTH_MCP_ROUTE = '/oauth/mcp';
export const OAUTH_AUTHORIZE_ROUTE = '/oauth/authorize';
export const OAUTH_TOKEN_ROUTE = '/oauth/token';
export const OAUTH_REGISTER_ROUTE = '/oauth/register';
export const OAUTH_GRANTS_ROUTE = '/oauth/grants';
export const OIDC_LOGIN_ROUTE = '/oauth/login';
export const OIDC_CALLBACK_ROUTE = '/oauth/callback';

/** Only stateless, read-only financial analysis is eligible for OAuth first. */
export const OAUTH_SUPPORTED_SCOPES = [MCP_SCOPES.ANALYSIS_READ] as const;

export type OAuthSupportedScope = (typeof OAUTH_SUPPORTED_SCOPES)[number];

export interface OAuthMcpGrantProps {
  userId: string;
  customerId: string;
  mcpScopes: readonly OAuthSupportedScope[];
}

const supportedScopes = new Set<string>(OAUTH_SUPPORTED_SCOPES);

export function isOAuthEnabled(env: Pick<Env, 'OAUTH_ENABLED'>): boolean {
  return env.OAUTH_ENABLED === 'true';
}

/**
 * Convert provider-encrypted grant props into the minimum trusted identity
 * needed by the MCP policy. Any malformed or over-privileged grant fails
 * closed instead of silently widening access.
 */
export function parseOAuthMcpGrantProps(props: unknown): OAuthMcpGrantProps | null {
  if (typeof props !== 'object' || props === null) return null;

  const candidate = props as {
    userId?: unknown;
    customerId?: unknown;
    mcpScopes?: unknown;
  };

  if (
    typeof candidate.userId !== 'string' ||
    candidate.userId.length === 0 ||
    candidate.userId.length > 128 ||
    typeof candidate.customerId !== 'string' ||
    candidate.customerId.length === 0 ||
    candidate.customerId.length > 128 ||
    !Array.isArray(candidate.mcpScopes) ||
    candidate.mcpScopes.length === 0 ||
    candidate.mcpScopes.some((scope) => typeof scope !== 'string' || !supportedScopes.has(scope))
  ) {
    return null;
  }

  const scopes = [...new Set(candidate.mcpScopes)] as OAuthSupportedScope[];
  return {
    userId: candidate.userId,
    customerId: candidate.customerId,
    mcpScopes: scopes,
  };
}

export function isOAuthSupportedScope(scope: string): scope is MCPPolicyScope {
  return supportedScopes.has(scope);
}
