import type { MCPAuthorizationContext } from '@financial-analysis/tools';

const SCOPE_HEADER = 'x-mcp-scopes';
const SUBJECT_HEADER = 'x-mcp-subject';
const CORRELATION_HEADER = 'x-request-id';

/**
 * Build the transport auth context without treating caller-controlled headers
 * as production credentials. Development header auth must be explicitly
 * enabled by the local Wrangler environment; every other environment returns
 * an unauthenticated external context that fails closed in policy.
 */
export function authorizationFromRequest(
  request: Request,
  environment: string,
  developmentAuthEnabled: boolean
): MCPAuthorizationContext {
  if (environment !== 'development' || !developmentAuthEnabled) {
    return {
      source: 'oauth',
      scopes: [],
    };
  }

  const scopesHeader = request.headers.get(SCOPE_HEADER);
  const scopes = scopesHeader
    ? scopesHeader
        .split(/[,\s]+/)
        .map((scope) => scope.trim())
        .filter(Boolean)
    : [];

  const subject = request.headers.get(SUBJECT_HEADER)?.trim() || undefined;
  const auditCorrelationId = request.headers.get(CORRELATION_HEADER)?.trim() || undefined;

  return {
    source: 'development',
    scopes,
    ...(subject ? { subject } : {}),
    ...(auditCorrelationId ? { auditCorrelationId } : {}),
  };
}
