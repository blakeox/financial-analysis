/**
 * Security Middleware for Cloudflare Workers
 *
 * Provides withSecurityContext wrapper that:
 * - Generates request fingerprint from IP + User-Agent
 * - Consults Session Durable Object for rate limiting and replay detection
 * - Enforces security policies before allowing requests to proceed
 * - Adds security headers to responses
 */

import type { DurableObjectNamespace } from '@cloudflare/workers-types';
import type { Env } from '../types';
import { buildRequestContext, type RequestContext } from './request-context';
import { logSecurityEventAnalytics, logCircuitBreakerEvent } from './analytics-logger';

export interface SecurityContext extends RequestContext {
  sessionId: string;
  fingerprint: string;
  trustScore: number;
  securityFlags: string[];
  isAllowed: boolean;
  denyReason?: string | undefined;
  retryAfter?: number | undefined;
}

export interface SecurityMiddlewareOptions {
  skipReplayCheck?: boolean;
  isMessageRequest?: boolean;
  customFingerprint?: string;
}

/**
 * Generate SHA-256 fingerprint from IP and User-Agent
 */
export async function generateFingerprint(ip: string, userAgent: string): Promise<string> {
  const data = `${ip}:${userAgent}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Log security event to Analytics Engine
 */
export function logSecurityEvent(
  analytics: AnalyticsEngineDataset | undefined,
  event: {
    type:
      | 'rate_limit'
      | 'circuit_breaker'
      | 'session_created'
      | 'session_check'
      | 'suspicious_activity'
      | 'session_denied';
    fingerprint: string;
    trustScore: number;
    flags: string[];
    allowed: boolean;
    ipAddress?: string;
  }
): void {
  if (!analytics) return;

  try {
    analytics.writeDataPoint({
      indexes: [event.fingerprint, event.type, event.ipAddress || 'unknown'],
      doubles: [event.trustScore, event.allowed ? 1 : 0],
      blobs: event.flags,
    });
  } catch (error) {
    // Don't fail request if analytics fails
    console.warn('Analytics Engine write failed:', error);
  }
}

/**
 * Circuit breaker state for Session DO operations
 */
let sessionDOFailureCount = 0;
let sessionDOLastFailure = 0;
const SESSION_DO_FAILURE_THRESHOLD = 5;
const SESSION_DO_RECOVERY_WINDOW = 60000; // 1 minute

function shouldSkipSessionDO(): boolean {
  const now = Date.now();
  if (now - sessionDOLastFailure > SESSION_DO_RECOVERY_WINDOW) {
    // Reset after recovery window
    sessionDOFailureCount = 0;
    return false;
  }
  return sessionDOFailureCount >= SESSION_DO_FAILURE_THRESHOLD;
}

function recordSessionDOFailure(): void {
  sessionDOFailureCount++;
  sessionDOLastFailure = Date.now();
}

function resetSessionDOFailures(): void {
  sessionDOFailureCount = 0;
}

/**
 * Generate a request hash for replay detection
 */
async function generateRequestHash(
  method: string,
  path: string,
  body: string | null
): Promise<string> {
  const data = `${method}:${path}:${body || ''}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create a Session Durable Object stub
 */
function getSessionStub(namespace: DurableObjectNamespace, sessionId: string) {
  const id = namespace.idFromName(sessionId);
  return namespace.get(id);
}

/**
 * Initialize a new session in the Durable Object
 */
async function initializeSession(
  stub: DurableObjectStub,
  sessionId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  const response = await stub.fetch('http://do/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, ipAddress, userAgent }),
  });

  if (!response.ok) {
    throw new Error(`Failed to initialize session: ${response.status}`);
  }
}

/**
 * Check if request is allowed by Session DO
 */
async function checkSession(
  stub: DurableObjectStub,
  requestHash?: string,
  isMessage?: boolean
): Promise<{
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  trustScore: number;
  flags: string[];
}> {
  const response = await stub.fetch('http://do/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestHash, isMessage }),
  });

  if (response.status === 404) {
    // Session not found, needs initialization
    return { allowed: false, reason: 'session_not_found', trustScore: 0, flags: [] };
  }

  if (!response.ok) {
    throw new Error(`Session check failed: ${response.status}`);
  }

  return (await response.json()) as {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    trustScore: number;
    flags: string[];
  };
}

/**
 * Increment session counters after successful request
 */
async function incrementSession(
  stub: DurableObjectStub,
  requestHash?: string,
  isMessage?: boolean
): Promise<void> {
  const response = await stub.fetch('http://do/increment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestHash, isMessage }),
  });

  if (!response.ok) {
    throw new Error(`Failed to increment session: ${response.status}`);
  }
}

/**
 * Add security flag to session
 */
export async function flagSession(
  namespace: DurableObjectNamespace,
  sessionId: string,
  flag: string,
  scoreAdjustment?: number
): Promise<void> {
  const stub = getSessionStub(namespace, sessionId);
  const response = await stub.fetch('http://do/flag', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ flag, scoreAdjustment }),
  });

  if (!response.ok) {
    console.error(`Failed to flag session: ${response.status}`);
  }
}

/**
 * Build security context by consulting Session DO
 */
export async function buildSecurityContext(
  request: Request,
  env: Env,
  options: SecurityMiddlewareOptions = {}
): Promise<SecurityContext> {
  const requestContext = buildRequestContext(request, env.ENVIRONMENT || 'production');

  // Generate fingerprint
  const ipAddress = requestContext.clientIP || 'unknown';
  const userAgent = requestContext.userAgent || 'unknown';
  const fingerprint =
    options.customFingerprint || (await generateFingerprint(ipAddress, userAgent));

  // Get Session DO stub
  if (!env.SESSION_DO) {
    // If SESSION_DO binding isn't configured, we can't reliably enforce security policies.
    // Treat this as a denial so callers can fail closed (tests rely on this behavior).
    console.warn('SESSION_DO binding not found');
    const context = {
      ...requestContext,
      sessionId: fingerprint,
      fingerprint,
      trustScore: 0,
      securityFlags: ['session_unavailable'],
      isAllowed: false,
      denyReason: 'session_unavailable',
      retryAfter: 60,
    };

    // Log to Analytics Engine
    logSecurityEventAnalytics(
      env.ANALYTICS,
      'session_unavailable',
      fingerprint,
      ipAddress,
      0,
      ['session_unavailable'],
      false,
      requestContext.path,
      {
        requestId: requestContext.requestId,
        runId: requestContext.runId,
        principalId: fingerprint,
        source: 'security-middleware',
        outcome: 'denied',
        ...(requestContext.correlationId ? { correlationId: requestContext.correlationId } : {}),
      }
    );

    return context;
  }

  const stub = getSessionStub(env.SESSION_DO, fingerprint);

  // Circuit breaker: skip Session DO if it's failing repeatedly
  if (shouldSkipSessionDO()) {
    const isProduction = env.ENVIRONMENT === 'production';
    console.warn(
      `Session DO circuit breaker open; ${isProduction ? 'denying' : 'allowing degraded'} request`
    );
    const context = {
      ...requestContext,
      sessionId: fingerprint,
      fingerprint,
      trustScore: isProduction ? 0 : 50,
      securityFlags: ['circuit-breaker-open'],
      isAllowed: !isProduction,
      denyReason: isProduction ? 'security_backend_unavailable' : undefined,
      retryAfter: isProduction ? 60 : undefined,
    };

    // Log to Analytics Engine
    logCircuitBreakerEvent(
      env.ANALYTICS,
      fingerprint,
      ipAddress,
      requestContext.path,
      'open',
      sessionDOFailureCount,
      {
        requestId: requestContext.requestId,
        runId: requestContext.runId,
        principalId: fingerprint,
        source: 'security-middleware',
        outcome: isProduction ? 'denied' : 'degraded',
        ...(requestContext.correlationId ? { correlationId: requestContext.correlationId } : {}),
      }
    );

    return context;
  }

  // Generate request hash for replay detection
  let requestHash: string | undefined;
  if (!options.skipReplayCheck && request.method === 'POST') {
    const url = new URL(request.url);
    const body = request.headers.get('content-type')?.includes('application/json')
      ? await request.clone().text()
      : null;
    requestHash = await generateRequestHash(request.method, url.pathname, body);
  }

  try {
    // Check session
    const checkResult = await checkSession(stub, requestHash, options.isMessageRequest);

    // Initialize if not found
    if (checkResult.reason === 'session_not_found') {
      await initializeSession(stub, fingerprint, ipAddress, userAgent);
      // Re-check after initialization
      const recheckResult = await checkSession(stub, requestHash, options.isMessageRequest);
      resetSessionDOFailures(); // Success, reset failures

      const context = {
        ...requestContext,
        sessionId: fingerprint,
        fingerprint,
        trustScore: recheckResult.trustScore,
        securityFlags: recheckResult.flags,
        isAllowed: recheckResult.allowed,
        denyReason: recheckResult.reason,
        retryAfter: recheckResult.retryAfter,
      };

      // Log to Analytics Engine
      logSecurityEventAnalytics(
        env.ANALYTICS,
        'session_created',
        fingerprint,
        ipAddress,
        recheckResult.trustScore,
        recheckResult.flags,
        recheckResult.allowed,
        requestContext.path,
        {
          requestId: requestContext.requestId,
          runId: requestContext.runId,
          principalId: fingerprint,
          source: 'security-middleware',
          outcome: recheckResult.allowed ? 'allowed' : 'denied',
          ...(requestContext.correlationId ? { correlationId: requestContext.correlationId } : {}),
        }
      );

      return context;
    }

    resetSessionDOFailures(); // Success, reset failures

    const context = {
      ...requestContext,
      sessionId: fingerprint,
      fingerprint,
      trustScore: checkResult.trustScore,
      securityFlags: checkResult.flags,
      isAllowed: checkResult.allowed,
      denyReason: checkResult.reason,
      retryAfter: checkResult.retryAfter,
    };

    // Log to Analytics Engine
    logSecurityEventAnalytics(
      env.ANALYTICS,
      checkResult.allowed ? 'session_check' : 'session_denied',
      fingerprint,
      ipAddress,
      checkResult.trustScore,
      checkResult.flags,
      checkResult.allowed,
      requestContext.path,
      {
        requestId: requestContext.requestId,
        runId: requestContext.runId,
        principalId: fingerprint,
        source: 'security-middleware',
        outcome: checkResult.allowed ? 'allowed' : 'denied',
        ...(requestContext.correlationId ? { correlationId: requestContext.correlationId } : {}),
      }
    );

    return context;
  } catch (error) {
    // Record failure and potentially open circuit breaker
    recordSessionDOFailure();
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Session DO operation failed: ${errorMessage}`, {
      fingerprint,
      failureCount: sessionDOFailureCount,
    });

    const isProduction = env.ENVIRONMENT === 'production';
    const context = {
      ...requestContext,
      sessionId: fingerprint,
      fingerprint,
      trustScore: isProduction ? 0 : 50,
      securityFlags: ['session-do-error'],
      isAllowed: !isProduction,
      denyReason: isProduction ? 'security_backend_unavailable' : undefined,
      retryAfter: isProduction ? 60 : undefined,
    };

    // Log to Analytics Engine
    logSecurityEventAnalytics(
      env.ANALYTICS,
      'suspicious_activity',
      fingerprint,
      ipAddress,
      isProduction ? 0 : 50,
      ['session-do-error'],
      !isProduction,
      requestContext.path,
      {
        requestId: requestContext.requestId,
        runId: requestContext.runId,
        principalId: fingerprint,
        source: 'security-middleware',
        outcome: isProduction ? 'denied' : 'degraded',
        ...(requestContext.correlationId ? { correlationId: requestContext.correlationId } : {}),
      }
    );

    return context;
  }
}

/**
 * Commit request to Session DO (increment counters)
 */
export async function commitSecurityContext(
  env: Env,
  securityContext: SecurityContext,
  requestHash?: string,
  isMessage?: boolean
): Promise<void> {
  if (!env.SESSION_DO) return;

  const stub = getSessionStub(env.SESSION_DO, securityContext.sessionId);
  await incrementSession(stub, requestHash, isMessage);
}

/**
 * Middleware wrapper for routes
 *
 * Usage:
 * router.post('/api/chat', withSecurityContext(async (request, env, securityContext) => {
 *   if (!securityContext.isAllowed) {
 *     return new Response(JSON.stringify({ error: securityContext.denyReason }), {
 *       status: 429,
 *       headers: { 'Retry-After': String(securityContext.retryAfter || 60) }
 *     });
 *   }
 *   // ... handle request
 *   await commitSecurityContext(env, securityContext, undefined, true);
 *   return response;
 * }));
 */
export function withSecurityContext(
  handler: (request: Request, env: Env, securityContext: SecurityContext) => Promise<Response>,
  options?: SecurityMiddlewareOptions
) {
  return async (request: Request, env: Env): Promise<Response> => {
    const securityContext = await buildSecurityContext(request, env, options);
    return handler(request, env, securityContext);
  };
}
