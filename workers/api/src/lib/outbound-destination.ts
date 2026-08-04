/**
 * Deny-by-default policy for future Code Mode and connector egress.
 *
 * Cloudflare Workers do not expose a portable DNS-resolution API. Production
 * connector execution must therefore use a controlled egress proxy/resolver
 * when post-resolution IP policy or rebinding resistance is required.
 */

export interface ConnectorEgressPolicy {
  enabled: boolean;
  allowedHosts: readonly string[];
  maxRedirects?: number;
}

export interface ConnectorEgressConfig {
  enabled?: string;
  allowedHosts?: string;
  maxRedirects?: string;
}

export interface ConnectorFetchOptions extends RequestInit {
  policy: ConnectorEgressPolicy;
}

export class OutboundPolicyError extends Error {
  constructor(
    public readonly code:
      | 'CONNECTORS_DISABLED'
      | 'INVALID_DESTINATION'
      | 'DESTINATION_NOT_ALLOWED'
      | 'REDIRECT_LIMIT_EXCEEDED',
    message: string
  ) {
    super(message);
    this.name = 'OutboundPolicyError';
  }
}

const DEFAULT_MAX_REDIRECTS = 3;
const MAX_MAX_REDIRECTS = 5;

export function parseAllowedConnectorHosts(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function connectorEgressPolicyFromConfig(
  config: ConnectorEgressConfig
): ConnectorEgressPolicy {
  const rawRedirects = config.maxRedirects?.trim();
  const parsedRedirects = rawRedirects ? Number(rawRedirects) : DEFAULT_MAX_REDIRECTS;
  const validRedirects =
    Number.isInteger(parsedRedirects) &&
    parsedRedirects >= 0 &&
    parsedRedirects <= MAX_MAX_REDIRECTS;

  return {
    enabled: config.enabled?.trim().toLowerCase() === 'true' && validRedirects,
    allowedHosts: parseAllowedConnectorHosts(config.allowedHosts),
    maxRedirects: validRedirects ? parsedRedirects : DEFAULT_MAX_REDIRECTS,
  };
}

function isPrivateIpv4(hostname: string): boolean {
  const octets = hostname.split('.').map(Number);
  if (
    octets.length !== 4 ||
    octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)
  ) {
    return false;
  }

  const [first, second] = octets;
  if (first === undefined || second === undefined) return false;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  );
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('::ffff:')
  );
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal') ||
    normalized === 'metadata.google.internal' ||
    isPrivateIpv4(normalized) ||
    isPrivateIpv6(normalized)
  );
}

function hostMatchesAllowlist(hostname: string, allowedHosts: readonly string[]): boolean {
  const normalized = hostname.toLowerCase();
  return allowedHosts.some((allowed) => {
    const entry = allowed.toLowerCase().replace(/\.$/, '');
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1);
      return normalized.endsWith(suffix) && normalized !== suffix.slice(1);
    }
    return normalized === entry;
  });
}

export function validateConnectorDestination(
  input: string | URL,
  policy: ConnectorEgressPolicy
): URL {
  if (!policy.enabled) {
    throw new OutboundPolicyError('CONNECTORS_DISABLED', 'Connector egress is disabled.');
  }

  let url: URL;
  try {
    url = input instanceof URL ? new URL(input.toString()) : new URL(input);
  } catch {
    throw new OutboundPolicyError(
      'INVALID_DESTINATION',
      'Connector destination must be a valid URL.'
    );
  }

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443')
  ) {
    throw new OutboundPolicyError(
      'INVALID_DESTINATION',
      'Connector destinations require HTTPS, no URL credentials, and the default HTTPS port.'
    );
  }

  if (isBlockedHostname(url.hostname)) {
    throw new OutboundPolicyError(
      'INVALID_DESTINATION',
      'Private, local, metadata, and link-local destinations are blocked.'
    );
  }

  if (!hostMatchesAllowlist(url.hostname, policy.allowedHosts)) {
    throw new OutboundPolicyError(
      'DESTINATION_NOT_ALLOWED',
      'Connector destination is not present in the configured host allowlist.'
    );
  }

  return url;
}

/** Fetch without ambient redirect authority; every redirect is revalidated. */
export async function fetchConnector(
  input: string | URL,
  options: ConnectorFetchOptions
): Promise<Response> {
  const { policy, ...requestInit } = options;
  const maxRedirects = policy.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  if (!Number.isInteger(maxRedirects) || maxRedirects < 0 || maxRedirects > MAX_MAX_REDIRECTS) {
    throw new OutboundPolicyError(
      'INVALID_DESTINATION',
      `Connector redirect limit must be an integer from 0 to ${MAX_MAX_REDIRECTS}.`
    );
  }
  let destination = validateConnectorDestination(input, policy);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(destination, { ...requestInit, redirect: 'manual' });
    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers.get('Location');
    if (!location) {
      throw new OutboundPolicyError('INVALID_DESTINATION', 'Redirect response omitted a location.');
    }
    if (redirectCount === maxRedirects) {
      throw new OutboundPolicyError(
        'REDIRECT_LIMIT_EXCEEDED',
        'Connector redirect limit exceeded.'
      );
    }
    destination = validateConnectorDestination(new URL(location, destination), policy);
  }

  throw new OutboundPolicyError('REDIRECT_LIMIT_EXCEEDED', 'Connector redirect limit exceeded.');
}
