/**
 * Analytics Logger for Cloudflare Analytics Engine
 *
 * Provides structured logging for:
 * - Rate limit violations
 * - Security events (session creation, denial, suspicious activity)
 * - Circuit breaker state changes
 */

import { redactTelemetryValue } from './request-context';

export interface AnalyticsEventData {
  type:
    | 'rate_limit'
    | 'circuit_breaker'
    | 'session_created'
    | 'session_check'
    | 'session_unavailable'
    | 'suspicious_activity'
    | 'session_denied'
    | 'auth_failure'
    | 'mcp_tools_list'
    | 'mcp_tools_call'
    | 'mcp_request';
  fingerprint: string;
  trustScore: number;
  flags: string[];
  allowed: boolean;
  /** Shared run/audit envelope. Values must already be opaque identifiers. */
  requestId?: string;
  runId?: string;
  principalId?: string;
  source?: string;
  scopes?: readonly string[];
  capability?: string;
  policyVersion?: string;
  resourceScope?: string;
  outcome?: 'allowed' | 'denied' | 'degraded' | 'error';
  correlationId?: string;
  ipAddress?: string;
  endpoint?: string;
  statusCode?: number;
  durationMs?: number;
}

function safeTelemetryIdentifier(value: string): string {
  const candidate = value.trim();
  if (!candidate || candidate.length > 256 || candidate.includes('@')) {
    return '[REDACTED_IDENTIFIER]';
  }
  return String(redactTelemetryValue(candidate));
}

function buildAuditEnvelopeBlobs(event: AnalyticsEventData): string[] {
  const values: Array<[string, string | undefined]> = [
    ['request_id', event.requestId],
    ['run_id', event.runId],
    ['principal_id', event.principalId],
    ['source', event.source],
    ['capability', event.capability],
    ['policy_version', event.policyVersion],
    ['resource_scope', event.resourceScope],
    ['outcome', event.outcome],
    ['correlation_id', event.correlationId],
  ];

  const blobs = values.flatMap(([name, value]) =>
    value ? [`${name}:${safeTelemetryIdentifier(value)}`] : []
  );
  if (event.scopes?.length) {
    blobs.push(`scopes:${event.scopes.map(safeTelemetryIdentifier).join(' ')}`);
  }
  return blobs;
}

/**
 * Write a security event to Analytics Engine
 * Safe to call even if analytics is not configured
 */
export function writeAnalyticsEvent(
  analytics: AnalyticsEngineDataset | undefined,
  event: AnalyticsEventData
): void {
  if (!analytics) {
    return;
  }

  try {
    const safeEndpoint = redactTelemetryValue(event.endpoint ?? 'unknown') as string;
    const safeFlags = event.flags.slice(0, 20).map((flag) => String(redactTelemetryValue(flag)));
    const safeFingerprint = safeTelemetryIdentifier(event.fingerprint);

    analytics.writeDataPoint({
      // The fingerprint is already a pseudonymous hash of IP/user-agent. Never
      // place the raw client IP in Analytics Engine indexes or blobs.
      indexes: [
        safeFingerprint,
        event.type,
        event.ipAddress ? 'ip_present' : 'ip_unknown',
        safeEndpoint,
      ],
      // Store numeric values: trustScore, allowed (1/0), statusCode, duration
      doubles: [
        event.trustScore,
        event.allowed ? 1 : 0,
        event.statusCode || 0,
        event.durationMs || 0,
      ],
      // Store bounded flags and the shared metadata envelope. Payloads and
      // provider credentials never cross this telemetry boundary.
      blobs: [...safeFlags, ...buildAuditEnvelopeBlobs(event)].slice(0, 20),
    });
  } catch (error) {
    // Don't fail request if analytics fails
    console.warn(
      'Analytics Engine write failed:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Log a rate limit violation
 */
export function logRateLimitViolation(
  analytics: AnalyticsEngineDataset | undefined,
  fingerprint: string,
  ipAddress: string,
  endpoint: string,
  trustScore: number
): void {
  writeAnalyticsEvent(analytics, {
    type: 'rate_limit',
    fingerprint,
    ipAddress,
    endpoint,
    trustScore,
    flags: ['rate_limit_exceeded'],
    allowed: false,
    statusCode: 429,
  });
}

/**
 * Log a security event (session created, denied, suspicious activity, etc.)
 */
export function logSecurityEventAnalytics(
  analytics: AnalyticsEngineDataset | undefined,
  eventType:
    | 'session_created'
    | 'session_check'
    | 'session_unavailable'
    | 'session_denied'
    | 'suspicious_activity',
  fingerprint: string,
  ipAddress: string,
  trustScore: number,
  flags: string[],
  allowed: boolean,
  endpoint: string = 'unknown',
  auditContext: Pick<
    AnalyticsEventData,
    'requestId' | 'runId' | 'principalId' | 'source' | 'scopes' | 'outcome' | 'correlationId'
  > = {}
): void {
  writeAnalyticsEvent(analytics, {
    type: eventType,
    fingerprint,
    ipAddress,
    endpoint,
    trustScore,
    flags,
    allowed,
    statusCode: allowed ? 200 : 403,
    ...auditContext,
  });
}

/**
 * Log a circuit breaker state change
 */
export function logCircuitBreakerEvent(
  analytics: AnalyticsEngineDataset | undefined,
  fingerprint: string,
  ipAddress: string,
  endpoint: string,
  state: 'open' | 'half_open' | 'closed',
  failureCount: number,
  auditContext: Pick<
    AnalyticsEventData,
    'requestId' | 'runId' | 'principalId' | 'source' | 'scopes' | 'outcome' | 'correlationId'
  > = {}
): void {
  writeAnalyticsEvent(analytics, {
    type: 'circuit_breaker',
    fingerprint,
    ipAddress,
    endpoint,
    trustScore: failureCount > 0 ? Math.max(0, 100 - failureCount * 10) : 100,
    flags: [`circuit_breaker_${state}`, `failures_${failureCount}`],
    allowed: state !== 'open',
    statusCode: state === 'open' ? 503 : 200,
    ...auditContext,
  });
}

/**
 * Log authentication failure
 */
export function logAuthFailure(
  analytics: AnalyticsEngineDataset | undefined,
  fingerprint: string,
  ipAddress: string,
  endpoint: string,
  reason: string
): void {
  writeAnalyticsEvent(analytics, {
    type: 'auth_failure',
    fingerprint,
    ipAddress,
    endpoint,
    trustScore: 0,
    flags: ['auth_failed', reason],
    allowed: false,
    statusCode: 401,
  });
}

/**
 * Helper to extract request metrics for analytics
 */
export function extractRequestMetrics(request: Request): {
  ipAddress: string;
  endpoint: string;
  userAgent: string;
} {
  const clientIP =
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';

  const url = new URL(request.url);
  const endpoint = url.pathname;
  const userAgent = request.headers.get('User-Agent') || 'unknown';

  return { ipAddress: clientIP, endpoint, userAgent };
}
