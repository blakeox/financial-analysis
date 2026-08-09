#!/usr/bin/env node

/**
 * Protected hosted OAuth lifecycle receipt for the preview MCP boundary.
 *
 * The session cookie must be created by a maintainer's interactive Clerk/OIDC
 * login and supplied only through a protected environment secret. This script
 * exercises the hosted consent, token, MCP, and grant-revocation paths without
 * printing or persisting the cookie, authorization code, or bearer tokens.
 */

import { createHash, randomBytes } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
const environment = process.env.ENVIRONMENT || 'unknown';
const sessionCookie = process.env.FANALYX_OIDC_SESSION_COOKIE?.trim() || '';
const receiptPath =
  process.env.CLOUDFLARE_OAUTH_HOSTED_RECEIPT || 'cloudflare-oauth-hosted-lifecycle.json';
const callbackUri = 'https://example.com/fanalyx-oauth/callback';
const resourceUri = `${apiUrl}/oauth/mcp`;
const checks = [];
const startedAt = new Date().toISOString();
let registeredClientId = null;
let sessionGrantId = null;
let grantMayExist = false;
let grantRevoked = false;
let cleanup = { required: false, attempted: false, grantRevoked: true };

function safeRequestId(value) {
  return value && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null;
}

function record(name, passed, result = {}, details = {}) {
  checks.push({
    name,
    passed,
    status: result.status ?? null,
    durationMs: result.durationMs ?? null,
    requestId: safeRequestId(result.requestId),
    ...details,
  });
}

function fail(stage) {
  throw new Error(`hosted lifecycle failed at ${stage}`);
}

function base64Url(value) {
  return value.toString('base64url');
}

function pkceChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url');
}

function cookieValue(setCookie, name) {
  const match = setCookie?.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] || null;
}

async function request(path, options = {}) {
  const started = Date.now();
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      redirect: 'manual',
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      signal: AbortSignal.timeout(20_000),
    });
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // The receipt records status only for non-JSON responses.
    }
    return {
      status: response.status,
      durationMs: Date.now() - started,
      requestId: response.headers.get('x-request-id'),
      json,
      location: response.headers.get('location'),
      setCookie: response.headers.get('set-cookie'),
    };
  } catch {
    return { status: null, durationMs: Date.now() - started, requestId: null, json: null };
  }
}

function tokenIsUsable(result) {
  return (
    result.status === 200 &&
    typeof result.json?.access_token === 'string' &&
    typeof result.json?.refresh_token === 'string' &&
    result.json.access_token.length > 0 &&
    result.json.refresh_token.length > 0
  );
}

function oauthError(result) {
  const value = result.json?.error;
  return typeof value === 'string' && /^[a-z_]+$/.test(value) ? value : null;
}

async function main() {
  if (
    !apiUrl ||
    !/^https:\/\/fanalyx-api-preview\.blakeoxford\.workers\.dev$/.test(apiUrl) ||
    environment !== 'preview'
  ) {
    fail('preview-only configuration');
  }
  if (!/^__Host-FANALYX_OIDC_SESSION=[A-Za-z0-9_-]{32,128}$/.test(sessionCookie)) {
    fail('protected session cookie configuration');
  }

  const registration = await request('/oauth/register', {
    method: 'POST',
    body: JSON.stringify({
      client_name: `Fanalyx hosted lifecycle ${new Date().toISOString().slice(0, 10)}`,
      redirect_uris: [callbackUri],
      token_endpoint_auth_method: 'none',
    }),
  });
  const clientId = registration.json?.client_id;
  const registered =
    registration.status === 201 &&
    typeof clientId === 'string' &&
    /^[A-Za-z0-9_-]{8,256}$/.test(clientId);
  record('dynamic MCP client registration', registered, registration);
  if (!registered) fail('dynamic client registration');
  registeredClientId = clientId;

  const verifier = base64Url(randomBytes(48));
  const state = base64Url(randomBytes(24));
  const authorizeUrl = new URL('/oauth/authorize', apiUrl);
  authorizeUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: callbackUri,
    scope: 'analysis:read',
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: 'S256',
    resource: resourceUri,
  }).toString();

  const consentPage = await request(`${authorizeUrl.pathname}?${authorizeUrl.searchParams}`, {
    headers: { Cookie: sessionCookie },
  });
  const csrf = cookieValue(consentPage.setCookie, '__Host-FANALYX_OAUTH_CSRF');
  const consentReady = consentPage.status === 200 && Boolean(csrf);
  record('authenticated consent page', consentReady, consentPage);
  if (!consentReady) fail('authenticated consent page');

  const consent = await request('/oauth/authorize', {
    method: 'POST',
    headers: {
      Cookie: `${sessionCookie}; __Host-FANALYX_OAUTH_CSRF=${csrf}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callbackUri,
      scope: 'analysis:read',
      state,
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: 'S256',
      resource: resourceUri,
      csrf,
      decision: 'approve',
    }).toString(),
  });
  let code = null;
  let callbackState = null;
  try {
    const callback = new URL(consent.location || 'https://example.com/invalid');
    code = callback.searchParams.get('code');
    callbackState = callback.searchParams.get('state');
  } catch {
    // The check below records a failed callback without exposing the location.
  }
  const consentCompleted =
    consent.status >= 300 &&
    consent.status < 400 &&
    typeof code === 'string' &&
    code.length > 0 &&
    callbackState === state;
  record('explicit consent and S256 callback', consentCompleted, consent, {
    stateMatched: callbackState === state,
    authorizationCodeIssued: typeof code === 'string' && code.length > 0,
  });
  if (!consentCompleted) fail('explicit consent');
  grantMayExist = true;

  const token = await request('/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      redirect_uri: callbackUri,
      code_verifier: verifier,
      resource: resourceUri,
    }).toString(),
  });
  const initialTokenOk = tokenIsUsable(token) && token.json.scope === 'analysis:read';
  record('authorization code exchange', initialTokenOk, token, {
    scope: token.json?.scope === 'analysis:read' ? 'analysis:read' : null,
  });
  if (!initialTokenOk) fail('authorization code exchange');

  const accessToken = token.json.access_token;
  const refreshToken = token.json.refresh_token;
  const mcpRequest = (bearer, id, method, params) =>
    request('/oauth/mcp', {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    });

  const initialize = await mcpRequest(accessToken, 1, 'initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'fanalyx-hosted-lifecycle', version: '1.0.0' },
  });
  record(
    'protected MCP initialize',
    initialize.status === 200 && initialize.json?.result?.protocolVersion === '2024-11-05',
    initialize,
    { protocolVersion: initialize.json?.result?.protocolVersion || null }
  );

  const tools = await mcpRequest(accessToken, 2, 'tools/list', {});
  record(
    'protected MCP tools/list',
    tools.status === 200 && Array.isArray(tools.json?.result?.tools),
    tools,
    {
      toolCount: Array.isArray(tools.json?.result?.tools) ? tools.json.result.tools.length : null,
    }
  );

  const refresh = (refreshValue) =>
    request('/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshValue,
        client_id: clientId,
        resource: resourceUri,
      }).toString(),
    });

  const firstRefresh = await refresh(refreshToken);
  const firstRefreshOk =
    tokenIsUsable(firstRefresh) && firstRefresh.json.refresh_token !== refreshToken;
  record('refresh token rotation', firstRefreshOk, firstRefresh, {
    rotated: firstRefresh.json?.refresh_token !== refreshToken,
  });
  if (!firstRefreshOk) fail('refresh token rotation');

  const rotatedRefreshToken = firstRefresh.json.refresh_token;
  const recoveryRefresh = await refresh(refreshToken);
  const recoveryOk =
    tokenIsUsable(recoveryRefresh) && recoveryRefresh.json.refresh_token !== refreshToken;
  record('documented refresh recovery grace', recoveryOk, recoveryRefresh, {
    rotated: recoveryRefresh.json?.refresh_token !== refreshToken,
  });
  if (!recoveryOk) fail('refresh recovery grace');

  const supersededRefresh = await refresh(rotatedRefreshToken);
  record(
    'superseded refresh rejection',
    supersededRefresh.status === 400 && oauthError(supersededRefresh) === 'invalid_grant',
    supersededRefresh,
    {
      error: oauthError(supersededRefresh),
    }
  );

  const grants = await request('/oauth/grants?limit=100', {
    headers: { Cookie: sessionCookie },
  });
  const grant = Array.isArray(grants.json?.items)
    ? grants.json.items.find((item) => item?.clientId === clientId)
    : null;
  const grantListed = grants.status === 200 && typeof grant?.id === 'string';
  record('authenticated grant listing', grantListed, grants, {
    matchingGrant: Boolean(grantListed),
  });
  if (!grantListed) fail('authenticated grant listing');
  sessionGrantId = grant.id;

  const revoke = await request(`/oauth/grants/${encodeURIComponent(grant.id)}`, {
    method: 'DELETE',
    headers: { Cookie: sessionCookie },
  });
  record('authenticated grant revocation', revoke.status === 204, revoke);
  grantRevoked = revoke.status === 204;
  cleanup = { required: true, attempted: true, grantRevoked, status: revoke.status };
  if (revoke.status !== 204) fail('authenticated grant revocation');

  const grantsAfterRevoke = await request('/oauth/grants?limit=100', {
    headers: { Cookie: sessionCookie },
  });
  const stillListed = Array.isArray(grantsAfterRevoke.json?.items)
    ? grantsAfterRevoke.json.items.some((item) => item?.clientId === clientId)
    : true;
  record(
    'revoked grant absent from owner listing',
    grantsAfterRevoke.status === 200 && !stillListed,
    grantsAfterRevoke
  );

  const accessAfterRevoke = await mcpRequest(
    recoveryRefresh.json.access_token,
    3,
    'tools/list',
    {}
  );
  record('revoked access token rejected', accessAfterRevoke.status === 401, accessAfterRevoke);

  const refreshAfterRevoke = await refresh(recoveryRefresh.json.refresh_token);
  record(
    'revoked refresh token rejected',
    refreshAfterRevoke.status === 400 && oauthError(refreshAfterRevoke) === 'invalid_grant',
    refreshAfterRevoke,
    { error: oauthError(refreshAfterRevoke) }
  );
}

async function cleanupHostedGrant() {
  if (!grantMayExist || !registeredClientId || !sessionCookie) return;

  cleanup = { required: true, attempted: true, grantRevoked, status: null };
  if (grantRevoked) return;

  try {
    if (!sessionGrantId) {
      const grants = await request('/oauth/grants?limit=100', {
        headers: { Cookie: sessionCookie },
      });
      const grant = Array.isArray(grants.json?.items)
        ? grants.json.items.find((item) => item?.clientId === registeredClientId)
        : null;
      sessionGrantId = typeof grant?.id === 'string' ? grant.id : null;
    }

    if (!sessionGrantId) {
      cleanup = { ...cleanup, grantRevoked: false, status: 'grant_not_found_for_cleanup' };
      return;
    }

    const revoke = await request(`/oauth/grants/${encodeURIComponent(sessionGrantId)}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    grantRevoked = revoke.status === 204;
    cleanup = { ...cleanup, grantRevoked, status: revoke.status };
  } catch {
    cleanup = { ...cleanup, grantRevoked: false, status: 'cleanup_request_failed' };
  }
}

let fatalStage = null;
try {
  await main();
} catch (error) {
  fatalStage =
    error instanceof Error ? error.message.replace(/^hosted lifecycle failed at /, '') : 'unknown';
} finally {
  await cleanupHostedGrant();
}

const passed =
  !fatalStage &&
  checks.length > 0 &&
  checks.every((check) => check.passed) &&
  cleanup.grantRevoked === true;
const receipt = {
  schemaVersion: '1.0.0',
  kind: 'cloudflare-oauth-hosted-lifecycle',
  environment,
  apiOrigin: apiUrl,
  generatedAt: new Date().toISOString(),
  startedAt,
  passed,
  mutatesOAuthState: true,
  consentMode: 'authenticated-session-plus-explicit-approve',
  credentialSource: 'protected-environment-secret',
  fatalStage,
  cleanup,
  checks,
};

await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(receipt, null, 2));
if (!passed) process.exitCode = 1;
