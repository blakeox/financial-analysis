#!/usr/bin/env node

/**
 * Credential-free conformance checks for the public Fanalyx OAuth boundary.
 *
 * This never performs a browser login, exchanges a token, or stores a grant.
 * It verifies the discovery/resource contracts and dynamic client registration
 * so ChatGPT, Codex, and local MCP clients have a stable preflight receipt.
 */

const apiUrl = (process.env.API_URL || '').replace(/\/$/, '');
const environment = process.env.ENVIRONMENT || 'unknown';
const expectedEnabled = process.env.EXPECT_OAUTH_ENABLED === 'true';
const receiptPath = process.env.CLOUDFLARE_OAUTH_RECEIPT || 'cloudflare-oauth-conformance.json';

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

  const registration = await read('/oauth/register', {
    method: 'POST',
    body: JSON.stringify({
      client_name: 'Fanalyx credential-free conformance probe',
      redirect_uris: ['https://example.com/fanalyx-oauth-callback'],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    }),
  });
  record(
    'dynamic registration accepts a public PKCE client',
    [200, 201].includes(registration.response.status) &&
      typeof registration.json?.client_id === 'string' &&
      Array.isArray(registration.json?.redirect_uris),
    {
      status: registration.response.status,
      clientRegistered: typeof registration.json?.client_id === 'string',
      redirectUriCount: registration.json?.redirect_uris?.length ?? 0,
    }
  );
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
  checks,
};

await import('node:fs/promises').then(({ writeFile }) =>
  writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8')
);
console.log(JSON.stringify(receipt, null, 2));

if (!passed) process.exitCode = 1;
