import { describe, expect, it, vi } from 'vitest';
import { MCP_SCOPES } from '@financial-analysis/tools';
import { handleEnhancedMCPRequest } from '../lib/enhanced-mcp';
import {
  getMCPAuditExpiration,
  getMCPAuditRetentionDays,
  purgeExpiredMCPAuditEvents,
  recordMCPAuditEvent,
} from '../lib/mcp-audit';
import { buildRequestContext } from '../lib/request-context';
import type { Env } from '../types';

function createAuditDb() {
  const run = vi.fn(async () => ({}));
  const bind = vi.fn(() => ({ run }));
  const prepare = vi.fn(() => ({ bind }));

  return {
    db: { prepare } as unknown as D1Database,
    prepare,
    bind,
    run,
  };
}

describe('MCP audit events', () => {
  it('uses bounded configurable retention with a safe default', () => {
    expect(getMCPAuditRetentionDays({ ENVIRONMENT: 'test' })).toBe(90);
    expect(getMCPAuditRetentionDays({ ENVIRONMENT: 'test', MCP_AUDIT_RETENTION_DAYS: '30' })).toBe(
      30
    );
    expect(getMCPAuditRetentionDays({ ENVIRONMENT: 'test', MCP_AUDIT_RETENTION_DAYS: '0' })).toBe(
      90
    );
    expect(
      getMCPAuditExpiration(
        { ENVIRONMENT: 'test', MCP_AUDIT_RETENTION_DAYS: '30' },
        '2026-08-02T00:00:00.000Z'
      )
    ).toBe('2026-09-01T00:00:00.000Z');
  });

  it('persists decision metadata without payload content', async () => {
    const { db, prepare, bind, run } = createAuditDb();

    await recordMCPAuditEvent(
      { ENVIRONMENT: 'test', DB: db },
      {
        requestId: 'request-1',
        runId: 'run-1',
        occurredAt: '2026-08-02T00:00:00.000Z',
        apiKeyId: 7,
        customerId: 'customer-1',
        source: 'api-key',
        scopes: [MCP_SCOPES.ANALYSIS_READ],
        method: 'tools/call',
        capability: 'analyze_lease',
        policyVersion: '1.0.0',
        principalId: 'oidc-audit-principal',
        resourceScope: 'caller',
        budgetDecision: 'reserved',
        auditCorrelationId: 'run-audit-1',
        decision: 'allowed',
        statusCode: 200,
        inputBytes: 128,
        outputBytes: 512,
        durationMs: 4,
      }
    );

    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('mcp_audit_events'));
    expect(bind).toHaveBeenCalledOnce();
    expect(run).toHaveBeenCalledOnce();
    expect(bind.mock.calls[0]).not.toContain('raw-sensitive-input');
    expect(bind.mock.calls[0]).toContain('run-audit-1');
  });

  it('purges only events whose expiration has passed', async () => {
    const run = vi.fn(async () => ({ meta: { changes: 3 } }));
    const bind = vi.fn(() => ({ run }));
    const prepare = vi.fn(() => ({ bind }));

    const purged = await purgeExpiredMCPAuditEvents(
      { ENVIRONMENT: 'test', DB: { prepare } as unknown as D1Database },
      new Date('2026-08-02T00:00:00.000Z')
    );

    expect(purged).toBe(3);
    expect(prepare).toHaveBeenCalledWith(expect.stringContaining('expires_at <= ?'));
    expect(bind).toHaveBeenCalledWith('2026-08-02T00:00:00.000Z');
  });

  it('records denied policy calls without storing arguments', async () => {
    const { db, bind } = createAuditDb();
    const writeDataPoint = vi.fn();
    const analytics = { writeDataPoint } as unknown as AnalyticsEngineDataset;
    const request = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'cache_document',
          arguments: { url: 'https://private.example/sensitive-report' },
        },
      }),
    });
    const requestContext = buildRequestContext(request, 'production');
    requestContext.auth = {
      apiKeyId: 7,
      customerId: 'customer-1',
      tier: 'pro',
      scopes: [MCP_SCOPES.ANALYSIS_READ],
      mcpAnalysisEnabled: true,
    };

    const response = await handleEnhancedMCPRequest(
      request,
      { ENVIRONMENT: 'production', DB: db, ANALYTICS: analytics } as Env,
      requestContext
    );

    expect(response.status).toBe(403);
    const values = bind.mock.calls[0] ?? [];
    expect(values).toContain('denied');
    expect(values).toContain('cache_document');
    expect(values).not.toContain('https://private.example/sensitive-report');

    const point = writeDataPoint.mock.calls[0]?.[0] as {
      indexes: string[];
      blobs: string[];
    };
    expect(point.indexes).toContain('mcp_tools_call');
    expect(point.blobs).toContain(`run_id:${requestContext.runId}`);
    expect(point.blobs).toContain('capability:cache_document');
    expect(JSON.stringify(point)).not.toContain('https://private.example/sensitive-report');
  });

  it('records integrity digests for successful responses without payload content', async () => {
    const { db, bind } = createAuditDb();
    const request = new Request('https://example.com/mcp', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    });
    const requestContext = buildRequestContext(request, 'development');

    const response = await handleEnhancedMCPRequest(
      request,
      { ENVIRONMENT: 'development', DB: db } as Env,
      requestContext
    );

    expect(response.status).toBe(200);
    const values = bind.mock.calls[0] ?? [];
    expect(values).toContain('1.0.0');
    const digestValues = (values as unknown[]).filter(
      (value): value is string => typeof value === 'string' && value.startsWith('sha256:')
    );
    expect(digestValues).toHaveLength(3);
    expect(JSON.stringify(values)).not.toContain('analyze_amortization');
  });
});
