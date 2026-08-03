#!/usr/bin/env node
/* eslint-env node */

import { writeFile } from 'node:fs/promises';

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, '');
const environment = process.env.ENVIRONMENT?.trim() || 'unknown';
const expectedSha = process.env.EXPECTED_SHA?.trim() || null;
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
  if (!passed) console.error(`Boundary check failed: ${name}`, details);
  return passed;
}

async function fetchWithRetry(path, init = {}) {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${apiUrl}${path}`, {
        ...init,
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
    },
    json,
  };
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
    const health = await readResponse(await fetchWithRetry('/health'));
    record('health', health.status === 200 && health.json?.status === 'ok', {
      status: health.status,
      reportedEnvironment: health.json?.environment,
    });
    record('health environment', health.json?.environment === environment, {
      reportedEnvironment: health.json?.environment,
      expectedEnvironment: environment,
    });

    const version = await readResponse(await fetchWithRetry('/version'));
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
      version.json?.controls?.oauthEnabled === false &&
        version.json?.controls?.budgetEnforcementEnabled === false &&
        version.json?.controls?.connectorEgressEnabled === false &&
        version.json?.controls?.codeModeEnabled === false,
      { controls: version.json?.controls ?? null }
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
    record(
      'method allow-list',
      method.status === 405 && method.json?.code === 'METHOD_NOT_ALLOWED',
      { status: method.status, code: method.json?.code, allow: method.headers.allow }
    );

    const oauth = await readResponse(
      await fetchWithRetry('/.well-known/oauth-authorization-server')
    );
    record('OAuth kill switch', oauth.status === 404, { status: oauth.status });

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
  } catch (error) {
    record('boundary smoke execution', false, {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const receipt = {
    schemaVersion: '1.0.0',
    kind: 'cloudflare-boundary-smoke',
    apiUrl,
    environment,
    expectedSha,
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
