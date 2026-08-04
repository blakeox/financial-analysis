#!/usr/bin/env node

/**
 * Provision the Clerk OAuth application used by the Fanalyx Worker OIDC login.
 *
 * Safe defaults:
 * - dry-run unless --apply is supplied;
 * - never prints CLERK_SECRET_KEY or an OAuth client secret;
 * - does not create users or mark email addresses verified;
 * - fails when more than one exact-name application exists.
 */

const environments = {
  preview: {
    redirectUri: 'https://fanalyx-api-preview.blakeoxford.workers.dev/oauth/callback',
    name: 'Fanalyx Worker OIDC (preview)',
  },
  production: {
    redirectUri: 'https://api.fanalyx.com/oauth/callback',
    name: 'Fanalyx Worker OIDC (production)',
  },
};

const args = new Set(process.argv.slice(2));
const environmentFlag = process.argv.find((value) => value.startsWith('--environment='));
const environment = environmentFlag?.split('=')[1];
const config = environment ? environments[environment] : undefined;
const apply = args.has('--apply');

if (!config || (environment !== 'preview' && environment !== 'production')) {
  console.error(
    'Usage: CLERK_SECRET_KEY=... node scripts/provision-clerk-oauth.mjs --environment=preview|production [--apply]'
  );
  process.exit(2);
}

const secretKey = process.env.CLERK_SECRET_KEY?.trim();
const apiBaseUrl = (process.env.CLERK_API_BASE_URL || 'https://api.clerk.com/v1').replace(
  /\/$/,
  ''
);
// Clerk's OAuth application API configures user-info scopes as profile/email.
// The OIDC login request separately asks for the standard `openid` scope.
const scopes = process.env.CLERK_OAUTH_SCOPES?.trim() || 'profile email';

if (!secretKey) {
  console.error(
    'CLERK_SECRET_KEY is required in the process environment; it is never read from Git or printed.'
  );
  process.exit(1);
}

async function clerkRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secretKey}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: 'Clerk returned a non-JSON response.' };
  }

  if (!response.ok) {
    const error = new Error(`Clerk API ${response.status} ${response.statusText}`);
    error.details = body?.errors || body?.message || undefined;
    throw error;
  }
  return body;
}

function summarize(application) {
  const value = (camelCase, snakeCase) => application[camelCase] ?? application[snakeCase];
  return {
    id: application.id,
    name: application.name,
    clientId: value('clientId', 'client_id'),
    discoveryUrl: value('discoveryUrl', 'discovery_url'),
    authorizeUrl: value('authorizeUrl', 'authorize_url'),
    tokenFetchUrl: value('tokenFetchUrl', 'token_fetch_url'),
    redirectUris: value('redirectUris', 'redirect_uris'),
    scopes: application.scopes,
    isPublic: value('isPublic', 'is_public'),
    pkceRequired: value('pkceRequired', 'pkce_required'),
    consentScreenEnabled: value('consentScreenEnabled', 'consent_screen_enabled'),
  };
}

function normalizedScopes(value) {
  return new Set(
    String(value || '')
      .split(/\s+/)
      .map((scope) => scope.trim().toLowerCase())
      .filter(Boolean)
  );
}

function validateProvisionedApplication(application) {
  const summary = summarize(application);
  const failures = [];
  if (summary.isPublic !== true) failures.push('application is not public');
  if (summary.pkceRequired !== true) failures.push('PKCE is not required');
  if (summary.consentScreenEnabled !== true) failures.push('consent screen is not enabled');

  const redirectUris = Array.isArray(summary.redirectUris) ? summary.redirectUris : [];
  if (redirectUris.length !== 1 || redirectUris[0] !== config.redirectUri) {
    failures.push('redirect URI does not exactly match the environment callback');
  }

  const scopes = normalizedScopes(summary.scopes);
  for (const requiredScope of ['profile', 'email']) {
    if (!scopes.has(requiredScope)) failures.push(`missing ${requiredScope} scope`);
  }

  if (failures.length > 0) {
    throw new Error(`Clerk OAuth application failed safety checks: ${failures.join('; ')}`);
  }
}

async function readDiscovery(application) {
  const discoveryUrl = summarize(application).discoveryUrl;
  if (!discoveryUrl) return null;
  const response = await fetch(discoveryUrl, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`Clerk discovery ${response.status} ${response.statusText}`);
  }
  const metadata = await response.json();
  const discovery = {
    issuer: metadata.issuer,
    authorizationEndpoint: metadata.authorization_endpoint,
    tokenEndpoint: metadata.token_endpoint,
    jwksUri: metadata.jwks_uri,
  };
  for (const [name, value] of Object.entries(discovery)) {
    if (typeof value !== 'string' || !value.startsWith('https://')) {
      throw new Error(`Clerk discovery metadata has an invalid ${name}.`);
    }
  }
  return discovery;
}

const requested = {
  name: config.name,
  public: true,
  pkce_required: true,
  consent_screen_enabled: true,
  redirect_uris: [config.redirectUri],
  scopes,
};

const applications = await clerkRequest('/oauth_applications?limit=500');
const matches = (applications?.data || []).filter(
  (application) => application.name === config.name
);

if (matches.length > 1) {
  console.error(
    `More than one Clerk OAuth application is named ${JSON.stringify(config.name)}; refusing to choose one.`
  );
  process.exit(1);
}

let application = matches[0];
if (!application) {
  if (apply) {
    application = await clerkRequest('/oauth_applications', {
      method: 'POST',
      body: JSON.stringify(requested),
    });
    console.log(`Created Clerk OAuth application for ${environment}.`);
  } else {
    console.log(`Would create Clerk OAuth application for ${environment}.`);
  }
} else if (apply) {
  application = await clerkRequest(`/oauth_applications/${encodeURIComponent(application.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      redirect_uris: requested.redirect_uris,
      scopes: requested.scopes,
      public: requested.public,
      pkce_required: requested.pkce_required,
      consent_screen_enabled: requested.consent_screen_enabled,
    }),
  });
  console.log(`Updated Clerk OAuth application for ${environment}.`);
} else {
  console.log(`Would reconcile Clerk OAuth application for ${environment}.`);
}

let discovery = null;
if (application) {
  validateProvisionedApplication(application);
  try {
    discovery = await readDiscovery(application);
  } catch (error) {
    console.error(`Unable to read Clerk discovery metadata: ${error.message}`);
    process.exit(1);
  }
}

console.log(
  JSON.stringify(
    {
      environment,
      apply,
      requested,
      application: application ? summarize(application) : null,
      oidcWorkerConfig: discovery
        ? {
            OIDC_ISSUER: discovery.issuer,
            OIDC_AUDIENCE: summarize(application).clientId,
            OIDC_JWKS_URI: discovery.jwksUri,
            OIDC_AUTHORIZATION_ENDPOINT: discovery.authorizationEndpoint,
            OIDC_TOKEN_ENDPOINT: discovery.tokenEndpoint,
            OIDC_REDIRECT_URI: config.redirectUri,
            OIDC_CLIENT_ID: summarize(application).clientId,
            OIDC_SCOPES: 'openid profile email',
            OIDC_LOGIN_HINT: process.env.OIDC_LOGIN_HINT || '(optional deployment variable)',
            OIDC_SESSION_TTL_SECONDS: '28800',
            OIDC_CLIENT_SECRET: '(omit for public PKCE application)',
          }
        : null,
      next: application
        ? 'Populate the displayed OIDC_* Worker configuration; do not copy a client secret into Git or Wrangler vars.'
        : 'Run again with --apply to create the application after reviewing the requested redirect URI and scopes.',
    },
    null,
    2
  )
);
