#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const path = new URL('../docs/MCP_CLIENT_COMPATIBILITY.json', import.meta.url);
const document = JSON.parse(await readFile(path, 'utf8'));
const failures = [];

function requireValue(condition, message) {
  if (!condition) failures.push(message);
}

requireValue(document.schemaVersion === '1.0.0', 'schemaVersion must be 1.0.0');
requireValue(document.kind === 'mcp-client-compatibility', 'kind is incorrect');
requireValue(
  document.contract?.transport === 'streamable-http',
  'transport must be streamable-http'
);
requireValue(document.contract?.resourcePath === '/oauth/mcp', 'resourcePath must be /oauth/mcp');
requireValue(
  document.contract?.authorization === 'oauth-2.1-authorization-code',
  'authorization contract is incorrect'
);
requireValue(document.contract?.pkce === 'S256', 'only S256 PKCE is permitted');
requireValue(
  document.contract?.dynamicClientRegistration === true,
  'dynamic registration must be enabled'
);
requireValue(
  document.contract?.clientAuthentication === 'none',
  'MCP clients must be public clients'
);
requireValue(
  JSON.stringify(document.contract?.scopes) === JSON.stringify(['analysis:read']),
  'the external contract must expose only analysis:read'
);
requireValue(
  document.contract?.memoryExposure === 'none-by-default',
  'memory exposure must be none-by-default'
);
requireValue(
  document.contract?.requestPersistence === 'none-by-default',
  'request persistence must be none-by-default'
);

const environments = Array.isArray(document.environments) ? document.environments : [];
const environmentIds = new Set(environments.map((environment) => environment.id));
requireValue(environmentIds.size === environments.length, 'environment IDs must be unique');
requireValue(environmentIds.has('preview'), 'preview environment is required');
requireValue(environmentIds.has('production'), 'production environment is required');

for (const environment of environments) {
  requireValue(
    /^https:\/\//.test(environment.resourceUrl),
    `${environment.id} resourceUrl must be HTTPS`
  );
  requireValue(
    environment.oauthStatus === (environment.id === 'preview' ? 'enabled' : 'disabled'),
    `${environment.id} OAuth status must match the staged rollout contract`
  );
  requireValue(
    Array.isArray(environment.verification),
    `${environment.id} verification must be an array`
  );
}

const requiredClients = ['chatgpt', 'codex', 'claude', 'local-mcp'];
const clients = Array.isArray(document.clients) ? document.clients : [];
const clientIds = new Set(clients.map((client) => client.id));
requireValue(clientIds.size === clients.length, 'client IDs must be unique');
for (const clientId of requiredClients) {
  requireValue(clientIds.has(clientId), `required client is missing: ${clientId}`);
}

const supportedStatuses = new Set(['protocol-verified', 'bridge-shipped', 'vendor-accepted']);
for (const client of clients) {
  requireValue(
    typeof client.displayName === 'string' && client.displayName.length > 0,
    `${client.id} displayName is required`
  );
  requireValue(supportedStatuses.has(client.status), `${client.id} has an unsupported status`);
  requireValue(
    Array.isArray(client.supportedFeatures),
    `${client.id} supportedFeatures must be an array`
  );
  requireValue(Array.isArray(client.verification), `${client.id} verification must be an array`);
  requireValue(
    Array.isArray(client.knownLimitations) && client.knownLimitations.length > 0,
    `${client.id} limitations are required`
  );
  requireValue(
    client.status === 'vendor-accepted' ? client.verification.length > 0 : true,
    `${client.id} vendor acceptance requires explicit verification evidence`
  );
  requireValue(
    client.status === 'bridge-shipped'
      ? client.verification.includes('local-stdio-bridge-tests')
      : true,
    `${client.id} bridge-shipped status requires local bridge test evidence`
  );
}

const serialized = JSON.stringify(document);
requireValue(
  !/sk_(live|test)_[A-Za-z0-9]+/.test(serialized),
  'document contains a provider secret pattern'
);
requireValue(
  !/Bearer\s+[A-Za-z0-9._~-]{12,}/i.test(serialized),
  'document contains a bearer credential'
);
requireValue(
  !/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(serialized),
  'document contains a JWT-like value'
);

if (failures.length > 0) {
  console.error('MCP client compatibility contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  JSON.stringify({
    kind: 'mcp-client-compatibility-check',
    passed: true,
    clients: clients.map(({ id, status }) => ({ id, status })),
    environments: environments.map(({ id, oauthStatus }) => ({ id, oauthStatus })),
  })
);
