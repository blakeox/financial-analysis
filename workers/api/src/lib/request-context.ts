/**
 * Request Context Tracking
 * 
 * Enhanced request ID tracking and correlation across the API.
 * Provides utilities for generating, validating, and propagating request IDs.
 */

import { randomUUID } from 'crypto';

export interface RequestContext {
  requestId: string;
  timestamp: string;
  method: string;
  path: string;
  userAgent: string;
  clientIP: string;
  environment: string;
  parentRequestId?: string;
  correlationId?: string;
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
  const uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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
 * Build complete request context from Request object
 */
export function buildRequestContext(
  request: Request,
  environment: string
): RequestContext {
  const url = new URL(request.url);
  const parentRequestId = getParentRequestId(request);
  const correlationId = getCorrelationId(request);
  
  const context: RequestContext = {
    requestId: getOrCreateRequestId(request),
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
  const logEntry = {
    level,
    message,
    ...context,
    ...metadata,
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
      stack: error.stack,
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
