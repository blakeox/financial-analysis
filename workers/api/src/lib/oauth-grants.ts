import type { GrantSummary, OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { isOidcBrowserLoginConfigured } from './oauth-oidc-login';
import { getResourceOwnerIdentity } from './resource-owner-identity';
import { getOrCreateRequestId } from './request-context';
import { recordOAuthAuditEvent } from './oauth-audit';

const OAUTH_GRANTS_ROUTE = '/oauth/grants';
const MAX_GRANT_ID_LENGTH = 256;
const MAX_PAGE_SIZE = 100;

type OAuthEnv = Env & { OAUTH_PROVIDER?: OAuthHelpers };

function jsonResponse(env: Env, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildDefaultHeaders(env),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function identityRequired(env: Env): Response {
  return jsonResponse(
    env,
    {
      error: {
        message: 'A verified resource-owner identity is required for OAuth grant management.',
        code: 'OAUTH_IDENTITY_NOT_VERIFIED',
      },
    },
    401
  );
}

function redirectToBrowserLogin(request: Request, env: Env): Response | null {
  if (!isOidcBrowserLoginConfigured(env)) return null;
  const login = new URL('/oauth/login', request.url);
  login.searchParams.set('return_to', new URL(request.url).toString());
  return new Response(null, {
    status: 302,
    headers: {
      ...buildDefaultHeaders(env),
      Location: login.toString(),
      'Cache-Control': 'no-store',
    },
  });
}

function providerUnavailable(env: Env): Response {
  return jsonResponse(
    env,
    { error: { message: 'OAuth provider is not initialized.', code: 'OAUTH_NOT_READY' } },
    503
  );
}

function parseLimit(url: URL): number {
  const value = Number.parseInt(url.searchParams.get('limit') ?? '', 10);
  if (!Number.isInteger(value)) return MAX_PAGE_SIZE;
  return Math.min(Math.max(value, 1), MAX_PAGE_SIZE);
}

function isSafeGrantId(grantId: string): boolean {
  if (grantId.length === 0 || grantId.length > MAX_GRANT_ID_LENGTH) return false;

  for (const character of grantId) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint <= 0x1f || codePoint === 0x7f || '/?#'.includes(character)) return false;
  }

  return true;
}

function publicGrantSummary(grant: GrantSummary) {
  return {
    id: grant.id,
    clientId: grant.clientId,
    scope: grant.scope,
    createdAt: grant.createdAt,
    expiresAt: grant.expiresAt,
  };
}

export function isOAuthGrantsRoute(pathname: string): boolean {
  return pathname === OAUTH_GRANTS_ROUTE || pathname.startsWith(`${OAUTH_GRANTS_ROUTE}/`);
}

export async function handleOAuthGrantsRequest(request: Request, env: Env): Promise<Response> {
  const identity = await getResourceOwnerIdentity(request, env);
  const requestId = getOrCreateRequestId(request);
  if (!identity) {
    if (request.method === 'GET') {
      const loginRedirect = redirectToBrowserLogin(request, env);
      if (loginRedirect) return loginRedirect;
    }
    return identityRequired(env);
  }

  const oauth = (env as OAuthEnv).OAUTH_PROVIDER;
  if (!oauth) return providerUnavailable(env);

  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === OAUTH_GRANTS_ROUTE) {
    const options: { limit: number; cursor?: string } = { limit: parseLimit(url) };
    const cursor = url.searchParams.get('cursor');
    if (cursor) options.cursor = cursor;
    const result = await oauth.listUserGrants(identity.userId, options);
    await recordOAuthAuditEvent(env, {
      requestId,
      occurredAt: new Date().toISOString(),
      userId: identity.userId,
      action: 'grant_listed',
      decision: 'allowed',
      statusCode: 200,
    });
    return jsonResponse(env, {
      items: result.items.map(publicGrantSummary),
      ...(result.cursor ? { cursor: result.cursor } : {}),
    });
  }

  if (request.method === 'DELETE' && url.pathname.startsWith(`${OAUTH_GRANTS_ROUTE}/`)) {
    const grantId = decodeURIComponent(url.pathname.slice(`${OAUTH_GRANTS_ROUTE}/`.length));
    if (!isSafeGrantId(grantId)) {
      return jsonResponse(
        env,
        { error: { message: 'The OAuth grant identifier is invalid.', code: 'INVALID_GRANT_ID' } },
        400
      );
    }

    try {
      await oauth.revokeGrant(grantId, identity.userId);
    } catch {
      await recordOAuthAuditEvent(env, {
        requestId,
        occurredAt: new Date().toISOString(),
        userId: identity.userId,
        grantId,
        action: 'grant_revoke_failed',
        decision: 'denied',
        statusCode: 404,
      });
      return jsonResponse(
        env,
        { error: { message: 'The OAuth grant was not found.', code: 'GRANT_NOT_FOUND' } },
        404
      );
    }

    await recordOAuthAuditEvent(env, {
      requestId,
      occurredAt: new Date().toISOString(),
      userId: identity.userId,
      grantId,
      action: 'grant_revoked',
      decision: 'allowed',
      statusCode: 204,
    });
    return new Response(null, {
      status: 204,
      headers: { ...buildDefaultHeaders(env), 'Cache-Control': 'no-store' },
    });
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: { ...buildDefaultHeaders(env), Allow: 'GET, DELETE' },
  });
}
