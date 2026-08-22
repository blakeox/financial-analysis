import { describe, expect, it } from 'vitest';
import { isAuthorizedSmokeProbeRequest } from './smoke-probe';

describe('workers.dev smoke probe origin', () => {
  const config = {
    SMOKE_PROBE_HOST: 'fanalyx-api-production.blakeoxford.workers.dev',
    SMOKE_PROBE_TOKEN: 'test-token',
  };

  it('leaves custom-domain traffic unchanged', () => {
    expect(
      isAuthorizedSmokeProbeRequest(new Request('https://api.fanalyx.com/health'), config)
    ).toBe(true);
  });

  it('fails closed without the probe token', () => {
    expect(
      isAuthorizedSmokeProbeRequest(
        new Request('https://fanalyx-api-production.blakeoxford.workers.dev/health'),
        config
      )
    ).toBe(false);
  });

  it('accepts the exact probe token', () => {
    expect(
      isAuthorizedSmokeProbeRequest(
        new Request('https://fanalyx-api-production.blakeoxford.workers.dev/health', {
          headers: { 'x-fanalyx-smoke-token': 'test-token' },
        }),
        config
      )
    ).toBe(true);
  });
});
