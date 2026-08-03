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
});
