/**
 * Analytics Logger for Cloudflare Analytics Engine
 *
 * Provides structured logging for:
 * - Rate limit violations
 * - Security events (session creation, denial, suspicious activity)
 * - Circuit breaker state changes
 */

export interface AnalyticsEventData {
  type: 'rate_limit' | 'circuit_breaker' | 'session_created' | 'session_check' | 'suspicious_activity' | 'session_denied' | 'auth_failure';
  fingerprint: string;
  trustScore: number;
  flags: string[];
  allowed: boolean;
  ipAddress?: string;
  endpoint?: string;
  statusCode?: number;
  durationMs?: number;
}

/**
 * Write a security event to Analytics Engine
 * Safe to call even if analytics is not configured
 */
export function writeAnalyticsEvent(
  analytics: AnalyticsEngineDataset | undefined,
  event: AnalyticsEventData,
): void {
  if (!analytics) {
    return;
  }

  try {
    analytics.writeDataPoint({
      // Use fingerprint, event type, and IP as indexes for efficient querying
      indexes: [event.fingerprint, event.type, event.ipAddress || 'unknown', event.endpoint || 'unknown'],
      // Store numeric values: trustScore, allowed (1/0), statusCode, duration
      doubles: [
        event.trustScore,
        event.allowed ? 1 : 0,
        event.statusCode || 0,
        event.durationMs || 0,
      ],
      // Store flags as blobs for detailed event analysis
      blobs: event.flags,
    });
  } catch (error) {
    // Don't fail request if analytics fails
    console.warn('Analytics Engine write failed:', error instanceof Error ? error.message : String(error));
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
  trustScore: number,
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
  eventType: 'session_created' | 'session_check' | 'session_denied' | 'suspicious_activity',
  fingerprint: string,
  ipAddress: string,
  trustScore: number,
  flags: string[],
  allowed: boolean,
  endpoint: string = 'unknown',
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
  reason: string,
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
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For') ||
    'unknown';

  const url = new URL(request.url);
  const endpoint = url.pathname;
  const userAgent = request.headers.get('User-Agent') || 'unknown';

  return { ipAddress: clientIP, endpoint, userAgent };
}
