import { describe, expect, it, vi } from 'vitest';
import { runPublicEdgeSynthetic } from './edge-synthetic';

const baseEnv = {
  ENVIRONMENT: 'production',
  COMMIT_SHA: 'a'.repeat(40),
  EDGE_SYNTHETIC_TARGET_URL: 'https://api.fanalyx.com/',
};

function response(body: unknown, status: number, headers: Record<string, string> = {}) {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      server: 'cloudflare',
      'cf-ray': 'synthetic-ray',
      ...headers,
    },
  });
}

describe('runPublicEdgeSynthetic', () => {
  it('probes the public contract without forwarding credentials and writes a bounded receipt', async () => {
    const writeDataPoint = vi.fn();
    const requests: Request[] = [];
    const fetchImpl = async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(input, init);
      requests.push(request);
      if (request.url.endsWith('/health')) return response({ status: 'ok' }, 200);
      if (request.url.endsWith('/version')) {
        return response(
          {
            commit: baseEnv.COMMIT_SHA,
            environment: 'production',
            mcp: { protocolVersion: '2024-11-05' },
          },
          200
        );
      }
      return response({ code: 'MISSING_KEY' }, 401, {
        'cache-control': 'no-store',
        vary: 'Authorization',
        server: 'cloudflare',
      });
    };

    const receipt = await runPublicEdgeSynthetic(
      { ...baseEnv, ANALYTICS: { writeDataPoint } as unknown as AnalyticsEngineDataset },
      fetchImpl
    );

    expect(receipt.passed).toBe(true);
    expect(receipt.commitSha).toBe(baseEnv.COMMIT_SHA);
    expect(receipt.checks.every((check) => check.failureClass === 'none')).toBe(true);
    expect(receipt.checks.every((check) => check.metadata.cfRay === 'synthetic-ray')).toBe(true);
    expect(requests).toHaveLength(4);
    expect(requests.every((request) => !request.headers.has('authorization'))).toBe(true);
    expect(
      requests.every(
        (request) =>
          request.headers.get('user-agent') === 'FanalyxEdgeSynthetic/1.0 (+https://fanalyx.com)'
      )
    ).toBe(true);
    expect(writeDataPoint).toHaveBeenCalledOnce();
    expect(writeDataPoint.mock.calls[0]?.[0]).toMatchObject({
      indexes: ['edge_synthetic', 'production', 'passed'],
      doubles: [1, 4, 0, expect.any(Number)],
    });
  });

  it('classifies an HTML Cloudflare denial separately from a Worker contract failure', async () => {
    const fetchImpl = async () =>
      response('<html>blocked</html>', 403, {
        'content-type': 'text/html',
        'cf-ray': 'blocked-ray',
      });

    const receipt = await runPublicEdgeSynthetic({ ...baseEnv }, fetchImpl);

    expect(receipt.passed).toBe(false);
    expect(receipt.checks[0]).toMatchObject({
      failureClass: 'waf_or_edge_denial',
      status: 403,
      metadata: { cfRay: 'blocked-ray' },
    });
    expect(receipt.checks[1]?.failureClass).toBe('waf_or_edge_denial');
  });

  it('fails closed when the target is not HTTPS', async () => {
    const writeDataPoint = vi.fn();
    const receipt = await runPublicEdgeSynthetic({
      ...baseEnv,
      EDGE_SYNTHETIC_TARGET_URL: 'http://api.fanalyx.com',
      ANALYTICS: { writeDataPoint } as unknown as AnalyticsEngineDataset,
    });

    expect(receipt.passed).toBe(false);
    expect(receipt.checks).toHaveLength(1);
    expect(receipt.checks[0]?.metadata.code).toBe('INVALID_TARGET_URL');
    expect(writeDataPoint).toHaveBeenCalledOnce();
  });
});
