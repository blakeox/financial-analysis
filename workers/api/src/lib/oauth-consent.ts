import type { AuthRequest, ClientInfo, OAuthHelpers } from '@cloudflare/workers-oauth-provider';
import { OAUTH_SUPPORTED_SCOPES, OAUTH_MCP_ROUTE } from './oauth-policy';
import { getResourceOwnerIdentity, type ResourceOwnerIdentity } from './resource-owner-identity';
import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { getOrCreateRequestId } from './request-context';
import { recordOAuthAuditEvent } from './oauth-audit';
import { isOidcBrowserLoginConfigured } from './oauth-oidc-login';
import { OIDC_LOGIN_ROUTE } from './oauth-policy';

const CSRF_COOKIE = '__Host-FANALYX_OAUTH_CSRF';
const MAX_AUTH_FORM_BYTES = 8 * 1024;

type OAuthEnv = Env & { OAUTH_PROVIDER?: OAuthHelpers };

type ValidatedAuthorization = {
  authRequest: AuthRequest;
  clientInfo: ClientInfo;
  identity: ResourceOwnerIdentity;
  oauth: OAuthHelpers;
};

function jsonResponse(env: Env, body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildDefaultHeaders(env),
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function unavailableResponse(env: Env, message: string, code: string, status = 503): Response {
  return jsonResponse(env, { error: { message, code } }, status);
}

function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get('Cookie')?.split(';') ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split('=');
    if (key === name) return value.join('=') || null;
  }
  return null;
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character
  );
}

function getResourceUri(request: Request): string {
  return `${new URL(request.url).origin}${OAUTH_MCP_ROUTE}`;
}

function isSupportedAuthorization(authRequest: AuthRequest, request: Request): boolean {
  const supported = new Set<string>(OAUTH_SUPPORTED_SCOPES);
  if (authRequest.responseType !== 'code' || authRequest.scope.length === 0) return false;
  if (authRequest.scope.some((scope) => !supported.has(scope))) return false;

  const resources =
    authRequest.resource === undefined
      ? []
      : Array.isArray(authRequest.resource)
        ? authRequest.resource
        : [authRequest.resource];
  return resources.every((resource) => resource === getResourceUri(request));
}

function buildClientErrorRedirect(
  authRequest: AuthRequest,
  clientInfo: ClientInfo,
  error: string,
  description: string
): string | null {
  if (!clientInfo.redirectUris.includes(authRequest.redirectUri)) return null;
  const redirect = new URL(authRequest.redirectUri);
  redirect.searchParams.set('error', error);
  redirect.searchParams.set('error_description', description);
  if (authRequest.state) redirect.searchParams.set('state', authRequest.state);
  return redirect.toString();
}

async function validateAuthorizationRequest(
  request: Request,
  env: Env
): Promise<ValidatedAuthorization | Response> {
  const identity = await getResourceOwnerIdentity(request, env);
  if (!identity) {
    if (request.method === 'GET' && isOidcBrowserLoginConfigured(env)) {
      const loginUrl = new URL(OIDC_LOGIN_ROUTE, request.url);
      loginUrl.searchParams.set('return_to', request.url);
      return Response.redirect(loginUrl.toString(), 302);
    }
    return new Response(
      JSON.stringify({
        error: {
          message: 'A verified resource-owner identity is required for OAuth consent.',
          code: 'OAUTH_IDENTITY_NOT_VERIFIED',
        },
      }),
      {
        status: 401,
        headers: {
          ...buildDefaultHeaders(env),
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
          'WWW-Authenticate': 'Bearer',
        },
      }
    );
  }

  const oauth = (env as OAuthEnv).OAUTH_PROVIDER;
  if (!oauth)
    return unavailableResponse(env, 'OAuth provider is not initialized.', 'OAUTH_NOT_READY');

  let authRequest: AuthRequest;
  try {
    authRequest = await oauth.parseAuthRequest(request);
  } catch {
    return unavailableResponse(
      env,
      'The OAuth authorization request is malformed or incomplete.',
      'INVALID_AUTHORIZATION_REQUEST',
      400
    );
  }

  const clientInfo = await oauth.lookupClient(authRequest.clientId);
  if (!clientInfo || !clientInfo.redirectUris.includes(authRequest.redirectUri)) {
    return unavailableResponse(
      env,
      'The OAuth client or redirect URI is not registered.',
      'INVALID_CLIENT',
      400
    );
  }
  if (!isSupportedAuthorization(authRequest, request)) {
    return unavailableResponse(
      env,
      'Only authorization-code access to the reviewed stateless analysis scope is supported.',
      'INVALID_SCOPE',
      400
    );
  }

  return { authRequest, clientInfo, identity, oauth };
}

function renderConsentPage(
  request: Request,
  auth: ValidatedAuthorization,
  csrfToken: string
): Response {
  const url = new URL(request.url);
  const clientName = auth.clientInfo.clientName || auth.clientInfo.clientId;
  const hiddenFields = [...url.searchParams.entries()]
    .filter(([key]) => key !== 'csrf' && key !== 'decision')
    .map(
      ([key, value]) =>
        `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Authorize Fanalyx analysis</title></head>
  <body>
    <main>
      <h1>Authorize ${escapeHtml(clientName)}</h1>
      <p>This client is requesting access to Fanalyx financial analysis.</p>
      <dl>
        <dt>Resource</dt><dd>${escapeHtml(getResourceUri(request))}</dd>
        <dt>Permission</dt><dd>Run stateless financial formulas using caller-provided inputs.</dd>
        <dt>Data boundary</dt><dd>No Agent memory, workspace documents, or saved user information.</dd>
      </dl>
      <form method="post" action="${escapeHtml(url.pathname)}">
        ${hiddenFields}
        <input type="hidden" name="csrf" value="${escapeHtml(csrfToken)}">
        <button type="submit" name="decision" value="approve">Allow</button>
        <button type="submit" name="decision" value="deny">Deny</button>
      </form>
    </main>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Set-Cookie': `${CSRF_COOKIE}=${csrfToken}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function readAuthForm(request: Request): Promise<URLSearchParams | Response> {
  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return new Response('Unsupported authorization form', { status: 415 });
  }

  const declaredLength = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_AUTH_FORM_BYTES) {
    return new Response('Authorization form too large', { status: 413 });
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > MAX_AUTH_FORM_BYTES) {
    return new Response('Authorization form too large', { status: 413 });
  }
  return new URLSearchParams(body);
}

function buildAuthorizationRequestFromForm(request: Request, form: URLSearchParams): Request {
  const url = new URL(request.url);
  url.search = '';
  for (const [key, value] of form) {
    if (key !== 'csrf' && key !== 'decision') url.searchParams.append(key, value);
  }
  return new Request(url, { method: 'GET', headers: request.headers });
}

export async function handleOAuthAuthorizeRequest(request: Request, env: Env): Promise<Response> {
  if (request.method === 'GET') {
    const validated = await validateAuthorizationRequest(request, env);
    if (validated instanceof Response) return validated;
    const csrfToken = crypto.randomUUID();
    return renderConsentPage(request, validated, csrfToken);
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, POST' } });
  }

  const form = await readAuthForm(request);
  if (form instanceof Response) return form;
  const csrfToken = form.get('csrf');
  if (!csrfToken || csrfToken !== getCookie(request, CSRF_COOKIE)) {
    return unavailableResponse(env, 'OAuth consent validation failed.', 'CSRF_FAILED', 400);
  }

  const authorizationRequest = buildAuthorizationRequestFromForm(request, form);
  const validated = await validateAuthorizationRequest(authorizationRequest, env);
  if (validated instanceof Response) return validated;

  if (form.get('decision') !== 'approve') {
    const redirectTo = buildClientErrorRedirect(
      validated.authRequest,
      validated.clientInfo,
      'access_denied',
      'The resource owner denied access.'
    );
    await recordOAuthAuditEvent(env, {
      requestId: getOrCreateRequestId(request),
      occurredAt: new Date().toISOString(),
      userId: validated.identity.userId,
      clientId: validated.clientInfo.clientId,
      action: 'consent_denied',
      decision: 'denied',
      statusCode: redirectTo ? 302 : 400,
    });
    return redirectTo
      ? Response.redirect(redirectTo, 302)
      : unavailableResponse(
          env,
          'The OAuth redirect URI is not registered.',
          'INVALID_CLIENT',
          400
        );
  }

  const scope = [...validated.authRequest.scope];
  const { redirectTo } = await validated.oauth.completeAuthorization({
    request: validated.authRequest,
    userId: validated.identity.userId,
    metadata: {
      provider: validated.identity.provider,
      clientId: validated.clientInfo.clientId,
      authorizedAt: new Date().toISOString(),
    },
    scope,
    props: {
      userId: validated.identity.userId,
      customerId: validated.identity.customerId,
      mcpScopes: scope,
    },
  });
  await recordOAuthAuditEvent(env, {
    requestId: getOrCreateRequestId(request),
    occurredAt: new Date().toISOString(),
    userId: validated.identity.userId,
    clientId: validated.clientInfo.clientId,
    action: 'consent_approved',
    decision: 'allowed',
    statusCode: 302,
  });
  return Response.redirect(redirectTo, 302);
}
