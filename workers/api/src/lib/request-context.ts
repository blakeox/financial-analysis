/**
 * Request Context Tracking
 *
 * Enhanced request ID tracking and correlation across the API.
 * Provides utilities for generating, validating, and propagating request IDs.
 */

import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  /** Stable correlation key for one analysis across retries and adapters. */
  runId: string;
  timestamp: string;
  method: string;
  path: string;
  userAgent: string;
  clientIP: string;
  environment: string;
  parentRequestId?: string;
  correlationId?: string;
  auth?: RequestAuthContext;
}

/**
 * Non-sensitive identity metadata for request correlation.
 * Never place API keys, hashes, or customer email addresses in this context.
 */
export interface RequestAuthContext {
  apiKeyId: number;
  customerId: string;
  /** Stable authenticated client boundary used for budget accounting. */
  clientId?: string;
  tier: string;
  scopes: readonly string[];
  mcpAnalysisEnabled?: boolean;
  source?: 'api-key' | 'oauth' | 'internal';
}

const TELEMETRY_SENSITIVE_FIELDS = new Set([
  'access_token',
  'accessToken',
  'api_key',
  'apiKey',
  'authorization',
  'body',
  'content',
  'cookie',
  'credential',
  'credentials',
  'document',
  'email',
  'input',
  'memory',
  'password',
  'private_key',
  'privateKey',
  'prompt',
  'query',
  'raw_input',
  'raw_output',
  'refresh_token',
  'refreshToken',
  'secret',
  'session',
  'set_cookie',
  'setCookie',
  'token',
  'provider_token',
  'providerToken',
]);
const MAX_TELEMETRY_STRING_LENGTH = 512;

function isSensitiveTelemetryField(key: string): boolean {
  const normalized = key.replace(/[-_]/g, '').toLowerCase();
  return Array.from(TELEMETRY_SENSITIVE_FIELDS).some(
    (field) => field.replace(/[-_]/g, '').toLowerCase() === normalized
  );
}

function redactTelemetryString(value: string): string {
  const redacted = value
    .replace(/Bearer\s+[A-Za-z0-9._~+\-/]+=*/gi, 'Bearer [REDACTED]')
    .replace(/\b(?:sk|rk|pk|fk)_(?:live|test)_[A-Za-z0-9_-]+\b/g, '[REDACTED_TOKEN]')
    .replace(/\b(?:ghp|github_pat|xoxb|xoxp)[-_][A-Za-z0-9_-]+\b/g, '[REDACTED_TOKEN]')
    .replace(
      /-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g,
      '[REDACTED_PRIVATE_KEY]'
    );
  if (redacted.length <= MAX_TELEMETRY_STRING_LENGTH) return redacted;
  return `${redacted.slice(0, MAX_TELEMETRY_STRING_LENGTH)}…[TRUNCATED]`;
}

/**
 * Remove payloads and credentials before metadata crosses the log boundary.
 * This is intentionally synchronous so every log call has the same fail-closed
 * behavior in Workers and tests.
 */
export function redactTelemetryValue(
  value: unknown,
  key?: string,
  seen = new WeakSet<object>()
): unknown {
  if (key && isSensitiveTelemetryField(key)) return '[REDACTED]';
  if (typeof value === 'string') return redactTelemetryString(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactTelemetryValue(item, undefined, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => [
      entryKey,
      redactTelemetryValue(entryValue, entryKey, seen),
    ])
  );
}

/**
 * Generate a new request ID (UUID v4)
 */
export function generateRequestId(): string {
  return randomUUID();
}

/**
 * Validate request ID format (UUID v4)
 */
export function isValidRequestId(requestId: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(requestId);
}

/**
 * Extract request ID from headers or generate new one
 */
export function getOrCreateRequestId(request: Request): string {
  const existing = request.headers.get('X-Request-ID');
  if (existing && isValidRequestId(existing)) {
    return existing;
  }
  return generateRequestId();
}

/**
 * Extract correlation ID for tracking related requests
 */
export function getCorrelationId(request: Request): string | undefined {
  const correlationId = request.headers.get('X-Correlation-ID');
  return correlationId && isValidRequestId(correlationId) ? correlationId : undefined;
}

/**
 * Extract parent request ID for nested/chained requests
 */
export function getParentRequestId(request: Request): string | undefined {
  const parentId = request.headers.get('X-Parent-Request-ID');
  return parentId && isValidRequestId(parentId) ? parentId : undefined;
}

/**
 * Reuse a caller-supplied analysis run ID when valid; otherwise derive the
 * run from the correlation/request boundary without trusting arbitrary text.
 */
export function getOrCreateAnalysisRunId(request: Request, requestId?: string): string {
  const existing = request.headers.get('X-Analysis-Run-ID');
  if (existing && isValidRequestId(existing)) return existing;

  const correlationId = getCorrelationId(request);
  if (correlationId) return correlationId;

  return requestId ?? getOrCreateRequestId(request);
}

/**
 * Build complete request context from Request object
 */
export function buildRequestContext(request: Request, environment: string): RequestContext {
  const url = new URL(request.url);
  const parentRequestId = getParentRequestId(request);
  const correlationId = getCorrelationId(request);
  const requestId = getOrCreateRequestId(request);

  const context: RequestContext = {
    requestId,
    runId: getOrCreateAnalysisRunId(request, requestId),
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('User-Agent') || 'unknown',
    clientIP: request.headers.get('CF-Connecting-IP') || 'unknown',
    environment,
  };

  if (parentRequestId) {
    context.parentRequestId = parentRequestId;
  }
  if (correlationId) {
    context.correlationId = correlationId;
  }

  return context;
}

/**
 * Add request tracking headers to response
 */
export function addRequestHeaders(
  headers: Record<string, string>,
  requestId: string,
  correlationId?: string
): Record<string, string> {
  const trackingHeaders: Record<string, string> = {
    'X-Request-ID': requestId,
  };

  if (correlationId) {
    trackingHeaders['X-Correlation-ID'] = correlationId;
  }

  return { ...headers, ...trackingHeaders };
}

/**
 * Create structured log entry with request context
 */
export function createLogEntry(
  context: RequestContext,
  level: 'info' | 'warn' | 'error',
  message: string,
  metadata?: Record<string, unknown>
): string {
  const safeMetadata =
    (redactTelemetryValue(metadata) as Record<string, unknown> | undefined) ?? {};
  const safeContext = redactTelemetryValue(context) as RequestContext;
  const logEntry = {
    ...safeMetadata,
    level,
    message: redactTelemetryString(message),
    ...safeContext,
  };
  return JSON.stringify(logEntry);
}

/**
 * Create error log with request context
 */
export function logError(
  context: RequestContext,
  error: Error,
  metadata?: Record<string, unknown>
): void {
  console.error(
    createLogEntry(context, 'error', error.message, {
      error: error.name,
      ...metadata,
    })
  );
}

/**
 * Create info log with request context
 */
export function logInfo(
  context: RequestContext,
  message: string,
  metadata?: Record<string, unknown>
): void {
  console.log(createLogEntry(context, 'info', message, metadata));
}

/**
 * Create warning log with request context
 */
export function logWarn(
  context: RequestContext,
  message: string,
  metadata?: Record<string, unknown>
): void {
  console.warn(createLogEntry(context, 'warn', message, metadata));
}
