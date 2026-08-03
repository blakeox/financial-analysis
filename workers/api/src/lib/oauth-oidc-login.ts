import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { OIDC_CALLBACK_ROUTE, OIDC_LOGIN_ROUTE } from './oauth-policy';
import {
  OIDC_SESSION_COOKIE,
  OIDC_SESSION_PREFIX,
  type ResourceOwnerIdentity,
  verifyOidcIdentityToken,
} from './resource-owner-identity';

const OIDC_STATE_PREFIX = 'oauth:oidc-state:';
const OIDC_STATE_TTL_SECONDS = 600;
const DEFAULT_SESSION_TTL_SECONDS = 28_800;
const MAX_SESSION_TTL_SECONDS = 86_400;
const MAX_RETURN_TO_LENGTH = 2_048;

type OidcState = {
  returnTo: string;
  nonce: string;
  codeVerifier: string;
};

function base64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function randomToken(byteLength = 32): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function parseHttpsUrl(value: string | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

function getConfiguredRedirectUri(env: Env): URL | null {
  return parseHttpsUrl(env.OIDC_REDIRECT_URI);
}

export function isOidcBrowserLoginConfigured(env: Env): boolean {
  return Boolean(
    env.SESSIONS &&
    env.OIDC_ISSUER &&
    env.OIDC_AUDIENCE &&
    env.OIDC_JWKS_URI &&
    env.OIDC_AUTHORIZATION_ENDPOINT &&
    env.OIDC_TOKEN_ENDPOINT &&
    env.OIDC_CLIENT_ID &&
    getConfiguredRedirectUri(env)
  );
}

function validateReturnTo(request: Request, env: Env, value: string | null): string | null {
  if (!value || value.length > MAX_RETURN_TO_LENGTH) return null;
  try {
    const returnTo = new URL(value);
    const requestUrl = new URL(request.url);
    if (returnTo.origin === requestUrl.origin && returnTo.pathname === '/oauth/authorize') {
      return returnTo.toString();
    }

    const frontendOrigin = env.ALLOWED_ORIGIN?.trim();
    if (frontendOrigin && returnTo.origin === frontendOrigin && returnTo.pathname === '/agent') {
      return returnTo.toString();
    }

    return null;
  } catch {
    return null;
  }
}

function sessionTtl(env: Env): number {
  const configured = Number.parseInt(env.OIDC_SESSION_TTL_SECONDS ?? '', 10);
  if (!Number.isInteger(configured) || configured < 300 || configured > MAX_SESSION_TTL_SECONDS) {
    return DEFAULT_SESSION_TTL_SECONDS;
  }
  return configured;
}

function redirectResponse(env: Env, location: string, cookie?: string): Response {
  const headers = new Headers(buildDefaultHeaders(env));
  headers.set('Location', location);
  headers.set('Cache-Control', 'no-store');
  if (cookie) headers.set('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

function errorResponse(env: Env, message: string, code: string, status = 400): Response {
  return new Response(JSON.stringify({ error: { message, code } }), {
    status,
    headers: { ...buildDefaultHeaders(env), 'Cache-Control': 'no-store' },
  });
}

async function startOidcLogin(request: Request, env: Env): Promise<Response> {
  if (!isOidcBrowserLoginConfigured(env) || !env.SESSIONS) {
    return errorResponse(
      env,
      'OIDC browser login is not configured.',
      'OIDC_LOGIN_NOT_CONFIGURED',
      503
    );
  }

  const returnTo = validateReturnTo(
    request,
    env,
    new URL(request.url).searchParams.get('return_to')
  );
  if (!returnTo) return errorResponse(env, 'The OAuth return URL is invalid.', 'INVALID_RETURN_TO');

  const state = randomToken();
  const nonce = randomToken();
  const codeVerifier = randomToken(48);
  await env.SESSIONS.put(
    `${OIDC_STATE_PREFIX}${state}`,
    JSON.stringify({ returnTo, nonce, codeVerifier } satisfies OidcState),
    { expirationTtl: OIDC_STATE_TTL_SECONDS }
  );

  const authorization = new URL(env.OIDC_AUTHORIZATION_ENDPOINT as string);
  authorization.searchParams.set('response_type', 'code');
  authorization.searchParams.set('client_id', env.OIDC_CLIENT_ID as string);
  authorization.searchParams.set(
    'redirect_uri',
    getConfiguredRedirectUri(env)?.toString() as string
  );
  authorization.searchParams.set('scope', env.OIDC_SCOPES?.trim() || 'openid profile email');
  const loginHint = env.OIDC_LOGIN_HINT?.trim();
  if (loginHint && loginHint.length <= 320) {
    authorization.searchParams.set('login_hint', loginHint);
  }
  authorization.searchParams.set('state', state);
  authorization.searchParams.set('nonce', nonce);
  authorization.searchParams.set('code_challenge', await pkceChallenge(codeVerifier));
  authorization.searchParams.set('code_challenge_method', 'S256');
  return redirectResponse(env, authorization.toString());
}

async function readTokenResponse(response: Response): Promise<Record<string, unknown> | null> {
  if (!response.ok) return null;
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > 32 * 1024) return null;
  try {
    const parsed: unknown = JSON.parse(body);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function finishOidcLogin(request: Request, env: Env): Promise<Response> {
  if (!isOidcBrowserLoginConfigured(env) || !env.SESSIONS) {
    return errorResponse(
      env,
      'OIDC browser login is not configured.',
      'OIDC_LOGIN_NOT_CONFIGURED',
      503
    );
  }

  const url = new URL(request.url);
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (!state || !code || state.length > 256 || code.length > 16_384) {
    return errorResponse(env, 'The OIDC callback is incomplete.', 'INVALID_OIDC_CALLBACK');
  }

  const stateKey = `${OIDC_STATE_PREFIX}${state}`;
  const stored = (await env.SESSIONS.get(stateKey, 'json')) as OidcState | null;
  await env.SESSIONS.delete(stateKey);
  if (!stored?.returnTo || !stored.nonce || !stored.codeVerifier) {
    return errorResponse(env, 'The OIDC login state is invalid or expired.', 'INVALID_OIDC_STATE');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: env.OIDC_CLIENT_ID as string,
    redirect_uri: getConfiguredRedirectUri(env)?.toString() as string,
    code_verifier: stored.codeVerifier,
  });
  if (env.OIDC_CLIENT_SECRET) body.set('client_secret', env.OIDC_CLIENT_SECRET);

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(env.OIDC_TOKEN_ENDPOINT as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch {
    return errorResponse(env, 'The OIDC token exchange failed.', 'OIDC_TOKEN_EXCHANGE_FAILED', 502);
  }

  const tokenData = await readTokenResponse(tokenResponse);
  const idToken = tokenData?.id_token;
  if (!tokenData || typeof idToken !== 'string') {
    return errorResponse(
      env,
      'The OIDC provider did not return a valid ID token.',
      'INVALID_OIDC_TOKEN',
      502
    );
  }

  const identity = await verifyOidcIdentityToken(idToken, env, stored.nonce);
  if (!identity)
    return errorResponse(
      env,
      'The OIDC identity could not be verified.',
      'INVALID_OIDC_IDENTITY',
      401
    );

  const sessionId = randomToken();
  await env.SESSIONS.put(
    `${OIDC_SESSION_PREFIX}${sessionId}`,
    JSON.stringify(identity satisfies ResourceOwnerIdentity),
    { expirationTtl: sessionTtl(env) }
  );
  return redirectResponse(
    env,
    stored.returnTo,
    `${OIDC_SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; Path=/; SameSite=None; Max-Age=${sessionTtl(env)}`
  );
}

export async function handleOidcLoginRequest(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  }
  if (pathname === OIDC_LOGIN_ROUTE) return startOidcLogin(request, env);
  if (pathname === OIDC_CALLBACK_ROUTE) return finishOidcLogin(request, env);
  return new Response('Not found', { status: 404 });
}
