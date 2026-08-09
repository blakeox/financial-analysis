import { readFile } from 'node:fs/promises';

const inputPath = process.argv[2];
const templateMode = process.argv.includes('--template');

if (!inputPath) {
  console.error('Usage: node scripts/check-mcp-client-acceptance.mjs <receipt.json> [--template]');
  process.exit(2);
}

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const text = await readFile(inputPath, 'utf8');
let receipt;
try {
  receipt = JSON.parse(text);
} catch {
  fail('receipt must be valid JSON');
}

const forbiddenKeys = new Set([
  'accessToken',
  'refreshToken',
  'token',
  'secret',
  'cookie',
  'prompt',
  'toolArguments',
  'arguments',
  'input',
  'inputs',
  'output',
  'outputs',
  'body',
  'email',
  'address',
  'credential',
]);
const forbiddenValue =
  /(bearer\s+|sk-[a-z0-9]|eyJ[a-z0-9_-]{12,}|BEGIN\s+(RSA|OPENSSH|EC|PRIVATE)|@)/i;

function inspect(value, path = '$') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') {
    if (typeof value === 'string') {
      assert(!forbiddenValue.test(value), `${path} contains credential-like or personal data`);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    assert(!forbiddenKeys.has(key), `${path}.${key} is not permitted in a sanitized receipt`);
    inspect(child, `${path}.${key}`);
  }
}

inspect(receipt);
assert(receipt.schemaVersion === '1.0.0', 'schemaVersion must be 1.0.0');
assert(receipt.kind === 'mcp-client-acceptance', 'kind must be mcp-client-acceptance');
assert(
  ['incomplete', 'accepted', 'blocked', 'failed'].includes(receipt.status),
  'status is invalid'
);
assert(
  ['chatgpt', 'codex', 'claude', 'local-mcp'].includes(receipt.client?.id),
  'client.id is invalid'
);
assert(
  typeof receipt.client?.version === 'string' && receipt.client.version.length > 0,
  'client.version is required'
);
assert(receipt.environment === 'preview', 'acceptance receipts must target preview');
assert(receipt.resourcePath === '/oauth/mcp', 'resourcePath must be /oauth/mcp');
assert(typeof receipt.testedAt === 'string' && receipt.testedAt.length > 0, 'testedAt is required');
assert(typeof receipt.humanConfirmed === 'boolean', 'humanConfirmed must be boolean');

const protocolKeys = [
  'protectedResourceDiscovery',
  'authorizationServerDiscovery',
  'dynamicClientRegistration',
  'pkceS256',
  'authorizationCodeExchange',
];
for (const key of protocolKeys) {
  assert(typeof receipt.protocol?.[key] === 'boolean', `protocol.${key} must be boolean`);
}

assert(typeof receipt.consent?.completed === 'boolean', 'consent.completed must be boolean');
assert(typeof receipt.consent?.revoked === 'boolean', 'consent.revoked must be boolean');
assert(
  typeof receipt.readOnlyCall?.capabilityId === 'string',
  'readOnlyCall.capabilityId is required'
);
assert(typeof receipt.readOnlyCall?.passed === 'boolean', 'readOnlyCall.passed must be boolean');
assert(typeof receipt.readOnlyCall?.requestId === 'string', 'readOnlyCall.requestId is required');
assert(Array.isArray(receipt.limitations), 'limitations must be an array');
assert(
  receipt.limitations.every((item) => typeof item === 'string' && item.length <= 240),
  'limitations must be bounded strings'
);
assert(
  typeof receipt.evidenceRef === 'string' && receipt.evidenceRef.length > 0,
  'evidenceRef is required'
);

if (!templateMode && receipt.status === 'accepted') {
  assert(receipt.humanConfirmed, 'accepted receipts require humanConfirmed=true');
  assert(
    protocolKeys.every((key) => receipt.protocol[key]),
    'accepted receipts require all protocol checks'
  );
  assert(receipt.consent.completed, 'accepted receipts require completed consent');
  assert(receipt.consent.revoked, 'accepted receipts require verified revocation');
  assert(receipt.readOnlyCall.passed, 'accepted receipts require a passed read-only call');
  assert(!receipt.client.version.startsWith('replace-'), 'client.version must be completed');
  assert(!receipt.testedAt.startsWith('replace-'), 'testedAt must be completed');
  assert(!receipt.evidenceRef.startsWith('replace-'), 'evidenceRef must be completed');
}

console.log(
  JSON.stringify(
    {
      kind: 'mcp-client-acceptance-check',
      path: inputPath,
      status: receipt.status,
      client: receipt.client.id,
      environment: receipt.environment,
      acceptedEvidence: !templateMode && receipt.status === 'accepted',
      passed: true,
    },
    null,
    2
  )
);
