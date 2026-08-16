import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

import { describe, expect, it } from 'vitest';

describe('Cloudflare boundary smoke response contracts', () => {
  it('accepts the Worker error envelope for method rejection', () => {
    const response = { error: { code: 'METHOD_NOT_ALLOWED' } };
    const code = response.code ?? response.error?.code;
    expect(code).toBe('METHOD_NOT_ALLOWED');
  });

  it('keeps the smoke credential on control origins, not the public API origin', async () => {
    const externalRequests = [];
    const controlRequests = [];
    const externalServer = createServer((request, response) => {
      externalRequests.push(request.headers);
      const body =
        request.method === 'PATCH'
          ? JSON.stringify({ error: { code: 'METHOD_NOT_ALLOWED' } })
          : request.url === '/agents/FinancialAnalysisAgent/smoke-thread'
            ? request.headers.origin
              ? JSON.stringify({ error: { code: 'FORBIDDEN' } })
              : JSON.stringify({ error: { code: 'AGENT_AUTH_REQUIRED' } })
            : request.url === '/.well-known/oauth-authorization-server'
              ? ''
              : request.url === '/api/v1/mcp/tools'
                ? JSON.stringify({ code: 'MISSING_KEY' })
                : JSON.stringify({ code: 'MISSING_KEY' });
      const status =
        request.method === 'PATCH'
          ? 405
          : request.url === '/agents/FinancialAnalysisAgent/smoke-thread' && request.headers.origin
            ? 403
            : request.url === '/agents/FinancialAnalysisAgent/smoke-thread'
              ? 401
              : request.url === '/.well-known/oauth-authorization-server'
                ? 404
                : 401;
      response.writeHead(status, {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        vary: 'Authorization',
        allow: 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
      });
      response.end(body);
    });
    const controlServer = createServer((request, response) => {
      controlRequests.push(request.headers);
      if (request.url === '/health') {
        response.writeHead(200, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ status: 'ok', environment: 'production' }));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          environment: 'production',
          commit: 'test-commit',
          mcp: { protocolVersion: '2024-11-05', capabilityPolicyVersion: '1.0.0' },
          controls: {
            oauthEnabled: false,
            oidcBrowserLoginConfigured: true,
            budgetEnforcementEnabled: false,
            connectorEgressEnabled: false,
            codeModeEnabled: false,
          },
        })
      );
    });

    await Promise.all([
      new Promise((resolve) => externalServer.listen(0, '127.0.0.1', resolve)),
      new Promise((resolve) => controlServer.listen(0, '127.0.0.1', resolve)),
    ]);
    const externalUrl = `http://127.0.0.1:${externalServer.address().port}`;
    const controlUrl = `http://127.0.0.1:${controlServer.address().port}`;
    const tempDir = await mkdtemp(join(tmpdir(), 'fanalyx-boundary-'));
    const receiptPath = join(tempDir, 'receipt.json');

    try {
      const child = spawn(process.execPath, ['scripts/cloudflare-boundary-smoke.mjs'], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          API_URL: externalUrl,
          VERSION_URL: controlUrl,
          HEALTH_URL: controlUrl,
          ENVIRONMENT: 'production',
          EXPECTED_OAUTH_ENABLED: 'false',
          EXPECTED_BUDGET_ENFORCEMENT_ENABLED: 'false',
          FANALYX_SMOKE_TOKEN: 'test-token',
          CLOUDFLARE_BOUNDARY_RECEIPT: receiptPath,
          PUBLIC_URL: '',
        },
        stdio: 'ignore',
      });
      const exitCode = await new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('exit', (code) => resolve(code));
      });
      const receipt = JSON.parse(await readFile(receiptPath, 'utf8'));

      expect(exitCode).toBe(0);
      expect(receipt.passed).toBe(true);
      expect(externalRequests.length).toBeGreaterThan(0);
      expect(
        externalRequests.every((headers) => headers['x-fanalyx-smoke-token'] === undefined)
      ).toBe(true);
      expect(controlRequests.length).toBeGreaterThan(0);
      expect(
        controlRequests.every((headers) => headers['x-fanalyx-smoke-token'] === 'test-token')
      ).toBe(true);
    } finally {
      externalServer.close();
      controlServer.close();
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
