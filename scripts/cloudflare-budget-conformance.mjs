#!/usr/bin/env node
/* eslint-env node */

import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const apiUrl = process.env.API_URL?.trim().replace(/\/$/, '');
const environment = process.env.ENVIRONMENT?.trim() || 'unknown';
const expectedSha = process.env.EXPECTED_SHA?.trim() || null;
const expectedEnabled = process.env.EXPECTED_BUDGET_ENFORCEMENT_ENABLED === 'true';
const budgetConformanceToken = process.env.BUDGET_CONFORMANCE_TOKEN?.trim();
const receiptPath =
  process.env.CLOUDFLARE_BUDGET_RECEIPT?.trim() || 'cloudflare-budget-conformance.json';

if (!apiUrl || !budgetConformanceToken) {
  console.error('API_URL and BUDGET_CONFORMANCE_TOKEN are required.');
  process.exit(2);
}

const checks = [];

function record(name, passed, details = {}) {
  const check = { name, passed, ...details };
  checks.push(check);
  if (!passed) console.error(`Budget conformance failed: ${name}`, details);
  return passed;
}

async function fetchJson(path, init = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'x-budget-conformance-token': budgetConformanceToken,
      ...init.headers,
    },
    signal: AbortSignal.timeout(30_000),
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Keep the receipt bounded and never retain arbitrary response bodies.
  }
  return { response, json };
}

async function main() {
  const startedAt = new Date().toISOString();
  try {
    const version = await fetchJson('/version');
    record(
      'version budget control',
      version.response.status === 200 &&
        version.json?.environment === environment &&
        version.json?.controls?.budgetEnforcementEnabled === expectedEnabled,
      {
        status: version.response.status,
        reportedEnvironment: version.json?.environment,
        reportedCommit: version.json?.commit,
        expectedSha,
        expectedEnabled,
        reportedEnabled: version.json?.controls?.budgetEnforcementEnabled,
      }
    );
    record('version commit', expectedSha === null || version.json?.commit === expectedSha, {
      expectedSha,
      reportedCommit: version.json?.commit,
    });

    if (expectedEnabled) {
      const runId = randomUUID();
      const idempotencyKey = randomUUID();
      const call = await fetchJson('/mcp', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-analysis-run-id': runId,
          'idempotency-key': idempotencyKey,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'budget-conformance',
          method: 'tools/call',
          params: {
            name: 'analyze_amortization',
            arguments: { principal: 100000, annualRate: 0.06, termMonths: 12 },
          },
        }),
      });
      record(
        'MCP reservation and settlement',
        call.response.status === 200 &&
          call.json?.jsonrpc === '2.0' &&
          call.json?.result !== undefined &&
          call.json?.error === undefined,
        {
          status: call.response.status,
          jsonrpc: call.json?.jsonrpc,
          hasResult: call.json?.result !== undefined,
          hasError: call.json?.error !== undefined,
          runIdReturned: call.response.headers.get('x-analysis-run-id') === runId,
        }
      );
    } else {
      record('MCP reservation canary disabled', true, { expectedEnabled });
    }
  } catch (error) {
    record('budget conformance execution', false, {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const receipt = {
    schemaVersion: '1.0.0',
    kind: 'cloudflare-budget-conformance',
    apiUrl,
    environment,
    expectedSha,
    expectedEnabled,
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
