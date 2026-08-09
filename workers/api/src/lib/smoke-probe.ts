export interface SmokeProbeConfig {
  SMOKE_PROBE_HOST?: string;
  SMOKE_PROBE_TOKEN?: string;
}

/**
 * The workers.dev probe is a control-plane origin, not a second public API.
 * An unset host leaves normal custom-domain traffic unchanged; a configured
 * host fails closed unless the exact CI secret is presented.
 */
export function isAuthorizedSmokeProbeRequest(request: Request, config: SmokeProbeConfig): boolean {
  const configuredHost = config.SMOKE_PROBE_HOST?.trim().toLowerCase();
  if (!configuredHost || new URL(request.url).hostname.toLowerCase() !== configuredHost) {
    return true;
  }

  const expectedToken = config.SMOKE_PROBE_TOKEN;
  return Boolean(expectedToken && request.headers.get('x-fanalyx-smoke-token') === expectedToken);
}
