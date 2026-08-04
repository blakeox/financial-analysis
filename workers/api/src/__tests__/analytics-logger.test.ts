import { describe, expect, it, vi } from 'vitest';
import { writeAnalyticsEvent } from '../lib/analytics-logger';

describe('Analytics Engine privacy boundary', () => {
  it('does not index raw IP addresses or emit sensitive failure reasons', () => {
    const writeDataPoint = vi.fn();
    const analytics = { writeDataPoint } as unknown as AnalyticsEngineDataset;

    writeAnalyticsEvent(analytics, {
      type: 'auth_failure',
      fingerprint: 'pseudonymous-fingerprint',
      trustScore: 0,
      flags: ['auth_failed', 'Bearer eyJhbGciOiJIUzI1NiJ9.secret.signature'],
      allowed: false,
      ipAddress: '203.0.113.42',
      endpoint: '/oauth/authorize',
      statusCode: 401,
    });

    const point = writeDataPoint.mock.calls[0]?.[0] as {
      indexes: string[];
      blobs: string[];
    };
    expect(point.indexes).toContain('ip_present');
    expect(point.indexes).not.toContain('203.0.113.42');
    expect(point.blobs).toEqual(['auth_failed', 'Bearer [REDACTED]']);
    expect(JSON.stringify(point)).not.toContain('203.0.113.42');
  });

  it('records missing IP as a category without changing the event contract', () => {
    const writeDataPoint = vi.fn();
    const analytics = { writeDataPoint } as unknown as AnalyticsEngineDataset;

    writeAnalyticsEvent(analytics, {
      type: 'rate_limit',
      fingerprint: 'pseudonymous-fingerprint',
      trustScore: 20,
      flags: ['rate_limit_exceeded'],
      allowed: false,
    });

    expect(writeDataPoint.mock.calls[0]?.[0].indexes).toContain('ip_unknown');
  });

  it('carries the shared audit envelope without leaking an email principal', () => {
    const writeDataPoint = vi.fn();
    const analytics = { writeDataPoint } as unknown as AnalyticsEngineDataset;

    writeAnalyticsEvent(analytics, {
      type: 'mcp_tools_call',
      fingerprint: 'opaque-principal',
      trustScore: 100,
      flags: ['allowed'],
      allowed: true,
      requestId: 'request-1',
      runId: 'run-1',
      principalId: 'blake@example.com',
      source: 'oauth',
      scopes: ['analysis:read'],
      capability: 'analyze_lease',
      policyVersion: '1.0.0',
      resourceScope: 'caller',
      outcome: 'allowed',
      correlationId: 'run-1',
      endpoint: '/mcp',
      statusCode: 200,
      durationMs: 8,
    });

    const point = writeDataPoint.mock.calls[0]?.[0] as { blobs: string[] };
    expect(point.blobs).toContain('request_id:request-1');
    expect(point.blobs).toContain('run_id:run-1');
    expect(point.blobs).toContain('principal_id:[REDACTED_IDENTIFIER]');
    expect(point.blobs).toContain('capability:analyze_lease');
    expect(point.blobs).toContain('scopes:analysis:read');
    expect(JSON.stringify(point)).not.toContain('blake@example.com');
  });
});
