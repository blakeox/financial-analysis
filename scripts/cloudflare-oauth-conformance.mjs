#!/usr/bin/env node

/**
 * Credential-free conformance checks for the public Fanalyx OAuth boundary.
 *
 * This never performs a browser login, exchanges a token, or stores a grant.
 * It verifies the discovery/resource contracts so ChatGPT, Codex, and local
 * MCP clients have a stable, state-free preflight receipt. Hosted lifecycle
 * testing uses a separately registered MCP client and is intentionally not
 * mixed with the Clerk browser OIDC client.
 */

const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
const environment = process.env.ENVIRONMENT || 'unknown';
const expectedEnabled = process.env.EXPECT_OAUTH_ENABLED === 'true';
const mcpTestClientId = process.env.MCP_TEST_CLIENT_ID?.trim() || null;
const mcpTestRedirectUri =
  process.env.MCP_TEST_REDIRECT_URI?.trim() || 'http://127.0.0.1:8765/callback';
const receiptPath = process.env.CLOUDFLARE_OAUTH_RECEIPT || 'cloudflare-oauth-conformance.json';

if (process.env.OIDC_TEST_CLIENT_ID?.trim()) {
  console.error(
    'OIDC_TEST_CLIENT_ID is not accepted: Clerk browser client IDs are not MCP client IDs. Use MCP_TEST_CLIENT_ID only with a separately registered MCP client.'
  );
  process.exit(2);
}

if (!apiUrl || !/^https:\/\//.test(apiUrl)) {
  console.error('API_URL must be an HTTPS URL.');
  process.exit(2);
}

const startedAt = new Date().toISOString();
const checks = [];

async function read(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON error bodies are represented by status only.
  }
  return { response, json };
}

function record(name, passed, details = {}) {
  checks.push({ name, passed, ...details });
}

function isHttpsAbsolute(value) {
  return typeof value === 'string' && value.startsWith('https://');
}

function summarizeLocation(location, fallbackOrigin) {
  if (!location) return null;
  try {
    const url = new URL(location, fallbackOrigin);
    return {
      origin: url.origin,
      pathname: url.pathname,
      error: url.searchParams.get('error'),
    };
  } catch {
    return { origin: null, pathname: null, error: 'invalid-location' };
  }
}

async function readRedirect(url) {
  const response = await fetch(url, {
    redirect: 'manual',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  return {
    status: response.status,
    location: response.headers.get('location'),
  };
}

const version = await read('/version');
const actualEnabled = version.json?.controls?.oauthEnabled === true;
record('version control matches expectation', actualEnabled === expectedEnabled, {
  expectedEnabled,
  actualEnabled,
  status: version.response.status,
});

const authorizationDiscovery = await read('/.well-known/oauth-authorization-server');
const resourceDiscovery = await read('/.well-known/oauth-protected-resource/oauth/mcp');

if (!expectedEnabled) {
  record('authorization discovery is disabled', authorizationDiscovery.response.status === 404, {
    status: authorizationDiscovery.response.status,
  });
  record('protected resource discovery is disabled', resourceDiscovery.response.status === 404, {
    status: resourceDiscovery.response.status,
  });
} else {
  const authorization = authorizationDiscovery.json;
  const resource = resourceDiscovery.json;
  const requiredAuthorizationEndpoints = [
    authorization?.authorization_endpoint,
    authorization?.token_endpoint,
    authorization?.registration_endpoint,
  ];
  record(
    'authorization discovery is complete',
    authorizationDiscovery.response.status === 200 &&
      requiredAuthorizationEndpoints.every(isHttpsAbsolute) &&
      Array.isArray(authorization?.scopes_supported) &&
      authorization.scopes_supported.includes('analysis:read'),
    {
      status: authorizationDiscovery.response.status,
      endpoints: requiredAuthorizationEndpoints,
      scopes: authorization?.scopes_supported,
    }
  );
  record(
    'protected resource discovery is complete',
    resourceDiscovery.response.status === 200 &&
      resource?.resource === `${apiUrl}/oauth/mcp` &&
      Array.isArray(resource?.authorization_servers) &&
      resource.authorization_servers.every(isHttpsAbsolute),
    {
      status: resourceDiscovery.response.status,
      resource: resource?.resource,
      authorizationServers: resource?.authorization_servers,
    }
  );

  if (mcpTestClientId) {
    const authorizeUrl = new URL('/oauth/authorize', apiUrl);
    authorizeUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: mcpTestClientId,
      redirect_uri: mcpTestRedirectUri,
      scope: 'analysis:read',
      state: 'oauth-preflight-state',
      code_challenge: 'E9Melhoa2OwvFrEMTJguCHV2B2M5f1L5tStZLZzY1GQ',
      code_challenge_method: 'S256',
      resource: `${apiUrl}/oauth/mcp`,
    }).toString();

    const authorize = await readRedirect(authorizeUrl);
    const workerLoginLocation = authorize.location ? new URL(authorize.location, apiUrl) : null;
    const login = workerLoginLocation ? await readRedirect(workerLoginLocation) : null;
    const providerAuthorizeLocation = login?.location ? new URL(login.location, apiUrl) : null;
    const provider = providerAuthorizeLocation
      ? await readRedirect(providerAuthorizeLocation)
      : null;
    const providerLocation = provider?.location
      ? new URL(provider.location, providerAuthorizeLocation?.origin || apiUrl)
      : null;
    const providerError = provider?.location ? providerLocation?.searchParams.get('error') : null;
    const providerOrigin = providerAuthorizeLocation?.origin || null;

    record(
      'MCP authorization redirect accepts configured scopes',
      authorize.status >= 300 &&
        authorize.status < 400 &&
        login?.status >= 300 &&
        login.status < 400 &&
        workerLoginLocation?.origin === apiUrl &&
        workerLoginLocation.pathname === '/oauth/login' &&
        providerAuthorizeLocation?.protocol === 'https:' &&
        providerAuthorizeLocation.pathname === '/oauth/authorize' &&
        providerAuthorizeLocation.origin !== apiUrl &&
        provider?.status >= 300 &&
        provider.status < 400 &&
        providerLocation?.origin !== apiUrl &&
        providerError !== 'invalid_scope',
      {
        authorizeStatus: authorize.status,
        loginStatus: login?.status ?? null,
        providerStatus: provider?.status ?? null,
        authorizeLocation: summarizeLocation(authorize.location, apiUrl),
        loginLocation: summarizeLocation(login?.location, apiUrl),
        providerLocation: summarizeLocation(
          provider?.location,
          providerAuthorizeLocation?.origin || apiUrl
        ),
        providerOrigin,
        providerError,
      }
    );
  } else {
    record('MCP authorization redirect accepts configured scopes', true, {
      skipped: true,
      reason:
        'MCP_TEST_CLIENT_ID is not configured; hosted lifecycle requires a separately registered MCP client',
    });
  }
}

const passed = checks.every((check) => check.passed);
const receipt = {
  schemaVersion: '1.0.0',
  kind: 'cloudflare-oauth-conformance',
  environment,
  apiOrigin: apiUrl,
  generatedAt: new Date().toISOString(),
  startedAt,
  expectedOAuthEnabled: expectedEnabled,
  passed,
  readOnly: true,
  mutatesOAuthState: false,
  checks,
};

await import('node:fs/promises').then(({ writeFile }) =>
  writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
);
console.log(JSON.stringify(receipt, null, 2));

if (!passed) process.exitCode = 1;
