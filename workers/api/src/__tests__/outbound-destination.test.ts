import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  connectorEgressPolicyFromConfig,
  fetchConnector,
  OutboundPolicyError,
  parseAllowedConnectorHosts,
  validateConnectorDestination,
} from '../lib/outbound-destination';

const enabledPolicy = (allowedHosts: readonly string[] = ['api.example.com']) => ({
  enabled: true,
  allowedHosts,
  maxRedirects: 2,
});

describe('connector outbound destination policy', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps connector egress disabled until explicitly enabled', () => {
    expect(() =>
      validateConnectorDestination('https://api.example.com/data', {
        enabled: false,
        allowedHosts: ['api.example.com'],
      })
    ).toThrowError(new OutboundPolicyError('CONNECTORS_DISABLED', 'Connector egress is disabled.'));
  });

  it('parses and normalizes the configured host allowlist', () => {
    expect(parseAllowedConnectorHosts(' API.EXAMPLE.COM, *.vendor.example, , ')).toEqual([
      'api.example.com',
      '*.vendor.example',
    ]);
  });

  it('fails closed for invalid environment configuration', () => {
    expect(
      connectorEgressPolicyFromConfig({
        enabled: 'TRUE',
        allowedHosts: 'api.example.com',
        maxRedirects: '6',
      })
    ).toEqual({ enabled: false, allowedHosts: ['api.example.com'], maxRedirects: 3 });
    expect(
      connectorEgressPolicyFromConfig({
        enabled: 'true',
        allowedHosts: 'api.example.com',
        maxRedirects: '2',
      })
    ).toEqual({ enabled: true, allowedHosts: ['api.example.com'], maxRedirects: 2 });
    expect(
      connectorEgressPolicyFromConfig({ enabled: 'true', allowedHosts: 'api.example.com' })
    ).toEqual({ enabled: true, allowedHosts: ['api.example.com'], maxRedirects: 3 });
  });

  it('requires HTTPS, no credentials, and the default port', () => {
    for (const destination of [
      'http://api.example.com/data',
      'https://user:password@api.example.com/data',
      'https://api.example.com:8443/data',
    ]) {
      expect(() => validateConnectorDestination(destination, enabledPolicy())).toThrow(
        OutboundPolicyError
      );
    }
  });

  it('blocks local, private, link-local, and metadata destinations before allowlist evaluation', () => {
    for (const destination of [
      'https://localhost/data',
      'https://127.0.0.1/data',
      'https://10.0.0.1/data',
      'https://169.254.169.254/data',
      'https://metadata.google.internal/data',
      'https://internal.local/data',
      'https://[::1]/data',
    ]) {
      expect(() => validateConnectorDestination(destination, enabledPolicy(['*']))).toThrowError(
        /Private, local, metadata/
      );
    }
  });

  it('requires an exact or subdomain allowlist match', () => {
    expect(
      validateConnectorDestination('https://api.example.com/data', enabledPolicy()).hostname
    ).toBe('api.example.com');
    expect(() =>
      validateConnectorDestination('https://other.example.com/data', enabledPolicy())
    ).toThrowError(/not present in the configured host allowlist/);
    expect(
      validateConnectorDestination(
        'https://tenant.vendor.example/data',
        enabledPolicy(['*.vendor.example'])
      ).hostname
    ).toBe('tenant.vendor.example');
    expect(() =>
      validateConnectorDestination(
        'https://vendor.example/data',
        enabledPolicy(['*.vendor.example'])
      )
    ).toThrowError(/not present in the configured host allowlist/);
  });

  it('revalidates each redirect and never passes connector policy metadata to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { Location: 'https://other.example.com/data' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      fetchConnector('https://api.example.com/data', {
        policy: enabledPolicy(),
        headers: { Accept: 'application/json' },
      })
    ).rejects.toThrowError(/not present in the configured host allowlist/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[1]).toEqual({
      headers: { Accept: 'application/json' },
      redirect: 'manual',
    });
  });

  it('follows only allowed redirects and enforces the redirect ceiling', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { Location: 'https://api.example.com/next' },
        })
      )
      .mockResolvedValueOnce(new Response('ok', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await fetchConnector('https://api.example.com/data', {
      policy: enabledPolicy(),
    });

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      'https://api.example.com/data',
      'https://api.example.com/next',
    ]);
  });

  it('rejects an unsafe caller-provided redirect ceiling', async () => {
    await expect(
      fetchConnector('https://api.example.com/data', {
        policy: { ...enabledPolicy(), maxRedirects: 6 },
      })
    ).rejects.toThrowError(/redirect limit must be an integer from 0 to 5/);
  });
});
