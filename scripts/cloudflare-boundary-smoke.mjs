#!/usr/bin/env node
/* eslint-env node */

import { writeFile } from 'node:fs/promises';

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, '');
const versionUrl = process.env.VERSION_URL?.trim().replace(/\/$/, '') || apiUrl;
const publicUrl = process.env.PUBLIC_URL?.trim().replace(/\/$/, '') || null;
const healthUrl = process.env.HEALTH_URL?.trim().replace(/\/$/, '') || apiUrl;
const publicToolsUrl = process.env.PUBLIC_TOOLS_URL?.trim().replace(/\/$/, '') || publicUrl;
const publicMcpUrl = process.env.PUBLIC_MCP_URL?.trim().replace(/\/$/, '') || publicUrl;
const publicStorageUrl = process.env.PUBLIC_STORAGE_URL?.trim().replace(/\/$/, '') || publicUrl;
const environment = process.env.ENVIRONMENT?.trim() || 'unknown';
const expectedSha = process.env.EXPECTED_SHA?.trim() || null;
const expectedOAuthEnabled = process.env.EXPECTED_OAUTH_ENABLED === 'true';
const expectedBudgetEnforcementEnabled = process.env.EXPECTED_BUDGET_ENFORCEMENT_ENABLED === 'true';
const smokeToken = process.env.FANALYX_SMOKE_TOKEN?.trim() || null;
const smokeUserAgent = 'FanalyxBoundarySmoke/1.0 (+https://fanalyx.com)';
const receiptPath =
  process.env.CLOUDFLARE_BOUNDARY_RECEIPT?.trim() || 'cloudflare-boundary-receipt.json';

if (!apiUrl) {
  console.error('API_URL is required.');
  process.exit(2);
}

const checks = [];

function record(name, passed, details = {}) {
  const check = { name, passed, ...details };
  checks.push(check);
  if (!passed) console.error(`Boundary check failed: ${name}`);
  return passed;
}

function requestHeaders(initHeaders) {
  const headers = new Headers(initHeaders);
  if (!headers.has('user-agent')) headers.set('user-agent', smokeUserAgent);
  if (smokeToken) headers.set('x-fanalyx-smoke-token', smokeToken);
  return headers;
}

async function fetchAgainst(baseUrl, path, init = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: requestHeaders(init.headers),
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status >= 500 || response.status === 408 || response.status === 429) {
        if (attempt < 5) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
          continue;
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}

async function fetchWithRetry(path, init = {}) {
  return fetchAgainst(apiUrl, path, init);
}

async function readResponse(response) {
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Record status and headers without retaining arbitrary response bodies.
  }
  return {
    status: response.status,
    headers: {
      cacheControl: response.headers.get('cache-control'),
      vary: response.headers.get('vary'),
      allow: response.headers.get('allow'),
      cfRay: response.headers.get('cf-ray'),
      server: response.headers.get('server'),
    },
    json,
  };
}

async function readVersionReceipt() {
  const maxAttempts = expectedSha ? 12 : 1;
  let version;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    version = await readResponse(await fetchAgainst(versionUrl, '/version'));
    if (expectedSha === null || version.json?.commit === expectedSha || attempt === maxAttempts) {
      return version;
    }
    await new Promise((resolve) => setTimeout(resolve, 5_000));
  }
  return version;
}

function hasVary(value, expected) {
  return (value || '')
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .includes(expected.toLowerCase());
}

async function main() {
  const startedAt = new Date().toISOString();
  try {
    const health = await readResponse(await fetchAgainst(healthUrl, '/health'));
    record('health', health.status === 200 && health.json?.status === 'ok', {
      status: health.status,
      reportedEnvironment: health.json?.environment,
    });
    record('health environment', health.json?.environment === environment, {
      reportedEnvironment: health.json?.environment,
      expectedEnvironment: environment,
    });

    const version = await readVersionReceipt();
    record(
      'version contract',
      version.status === 200 &&
        version.json?.environment === environment &&
        version.json?.mcp?.protocolVersion === '2024-11-05' &&
        version.json?.mcp?.capabilityPolicyVersion === '1.0.0',
      {
        status: version.status,
        commit: version.json?.commit,
        protocolVersion: version.json?.mcp?.protocolVersion,
        capabilityPolicyVersion: version.json?.mcp?.capabilityPolicyVersion,
      }
    );
    record('version commit', expectedSha === null || version.json?.commit === expectedSha, {
      expectedSha,
      reportedCommit: version.json?.commit,
    });
    record(
      'fail-closed canaries',
      version.json?.controls?.oauthEnabled === expectedOAuthEnabled &&
        version.json?.controls?.budgetEnforcementEnabled === expectedBudgetEnforcementEnabled &&
        version.json?.controls?.connectorEgressEnabled === false &&
        version.json?.controls?.codeModeEnabled === false,
      { controls: version.json?.controls ?? null }
    );
    record(
      'OAuth configuration consistency',
      version.json?.controls?.oauthEnabled !== true ||
        version.json?.controls?.oidcBrowserLoginConfigured === true,
      {
        oauthEnabled: version.json?.controls?.oauthEnabled,
        oidcBrowserLoginConfigured: version.json?.controls?.oidcBrowserLoginConfigured,
      }
    );

    const mcp = await readResponse(await fetchWithRetry('/api/v1/mcp/tools'));
    record('anonymous MCP denied', mcp.status === 401 && mcp.json?.code === 'MISSING_KEY', {
      status: mcp.status,
      code: mcp.json?.code,
    });
    record(
      'protected MCP cache boundary',
      mcp.headers.cacheControl === 'no-store' && hasVary(mcp.headers.vary, 'authorization'),
      { cacheControl: mcp.headers.cacheControl, vary: mcp.headers.vary }
    );

    const presign = await readResponse(
      await fetchWithRetry('/v1/storage/presign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ operation: 'download', key: 'lease-documents/smoke.txt' }),
      })
    );
    record(
      'anonymous storage denied',
      presign.status === 401 && presign.json?.code === 'MISSING_KEY',
      { status: presign.status, code: presign.json?.code }
    );

    const finalize = await readResponse(
      await fetchWithRetry('/v1/storage/finalize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ uploadId: '00000000-0000-4000-8000-000000000000' }),
      })
    );
    record(
      'anonymous storage finalize denied',
      finalize.status === 401 && finalize.json?.code === 'MISSING_KEY',
      { status: finalize.status, code: finalize.json?.code }
    );

    const method = await readResponse(await fetchWithRetry('/health', { method: 'PATCH' }));
    const methodCode = method.json?.code ?? method.json?.error?.code;
    record('method allow-list', method.status === 405 && methodCode === 'METHOD_NOT_ALLOWED', {
      status: method.status,
      code: methodCode,
      allow: method.headers.allow,
    });

    const oauth = await readResponse(
      await fetchWithRetry('/.well-known/oauth-authorization-server')
    );
    const expectedOAuthDiscoveryStatus = expectedOAuthEnabled ? 200 : 404;
    record('OAuth discovery boundary', oauth.status === expectedOAuthDiscoveryStatus, {
      expectedStatus: expectedOAuthDiscoveryStatus,
      status: oauth.status,
    });

    const agent = await readResponse(
      await fetchWithRetry('/agents/FinancialAnalysisAgent/smoke-thread')
    );
    record(
      'anonymous Agent denied',
      agent.status === 401 && agent.json?.error?.code === 'AGENT_AUTH_REQUIRED',
      { status: agent.status, code: agent.json?.error?.code }
    );

    const foreignOriginAgent = await readResponse(
      await fetchWithRetry('/agents/FinancialAnalysisAgent/smoke-thread', {
        headers: { Origin: 'https://boundary-smoke.invalid' },
      })
    );
    record('foreign Agent origin denied', foreignOriginAgent.status === 403, {
      status: foreignOriginAgent.status,
    });

    if (publicUrl) {
      const publicTools = await readResponse(
        await fetchAgainst(publicToolsUrl, '/api/v1/mcp/tools', {
          headers: { Accept: 'application/json' },
        })
      );
      record(
        'public formula MCP catalog',
        publicTools.status === 200 &&
          Array.isArray(publicTools.json?.tools) &&
          publicTools.json.tools.length > 0 &&
          publicTools.headers.cacheControl === 'no-store' &&
          publicTools.headers.server === 'cloudflare',
        {
          status: publicTools.status,
          toolCount: Array.isArray(publicTools.json?.tools) ? publicTools.json.tools.length : 0,
          cacheControl: publicTools.headers.cacheControl,
          server: publicTools.headers.server,
          cfRayPresent: Boolean(publicTools.headers.cfRay),
        }
      );

      const publicInitialize = await readResponse(
        await fetchAgainst(publicMcpUrl, '/mcp', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'boundary-public-initialize',
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'boundary-smoke', version: '1' },
            },
          }),
        })
      );
      record(
        'public formula MCP initialize',
        publicInitialize.status === 200 &&
          publicInitialize.json?.result?.protocolVersion === '2024-11-05' &&
          publicInitialize.headers.cacheControl === 'no-store' &&
          publicInitialize.headers.server === 'cloudflare',
        {
          status: publicInitialize.status,
          protocolVersion: publicInitialize.json?.result?.protocolVersion,
          cacheControl: publicInitialize.headers.cacheControl,
          server: publicInitialize.headers.server,
          cfRayPresent: Boolean(publicInitialize.headers.cfRay),
        }
      );

      const publicStorage = await readResponse(
        await fetchAgainst(publicStorageUrl, '/v1/storage/presign', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ operation: 'download', key: 'lease-documents/smoke.txt' }),
        })
      );
      record(
        'public user-data auth boundary',
        publicStorage.status === 401 && publicStorage.json?.code === 'MISSING_KEY',
        { status: publicStorage.status, code: publicStorage.json?.code }
      );
    }
  } catch (error) {
    record('boundary smoke execution', false, {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const receipt = {
    schemaVersion: '1.0.0',
    kind: 'cloudflare-boundary-smoke',
    apiUrl,
    versionUrl,
    publicUrl,
    healthUrl,
    publicToolsUrl,
    publicMcpUrl,
    publicStorageUrl,
    environment,
    expectedSha,
    expectedOAuthEnabled,
    expectedBudgetEnforcementEnabled,
    startedAt,
    completedAt: new Date().toISOString(),
    passed: checks.length > 0 && checks.every((check) => check.passed),
    checks,
  };
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(receipt, null, 2));
  if (!receipt.passed) process.exitCode = 1;
}

await main();
