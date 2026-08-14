/**
 * Enhanced MCP Server with improved error handling and monitoring
 * Implements MCP best practices for production deployment
 */

import {
  handleMCPRequest,
  MCP_PAYLOAD_TOO_LARGE_ERROR_CODE,
  MCP_POLICY_ERROR_CODE,
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_VERSION,
  MCP_SCOPES,
  MCP_CAPABILITY_POLICY_VERSION,
  getMCPCapabilityPolicy,
  type MCPAuthorizationContext,
} from '@financial-analysis/tools';
import {
  createResultIntegrityReceipt,
  type ResultIntegrityReceipt,
} from '@financial-analysis/capabilities';
import { z } from 'zod';
import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { recordMCPAuditEvent, type MCPAuditEvent } from './mcp-audit';
import { writeAnalyticsEvent } from './analytics-logger';
import { logError, logInfo, logWarn, type RequestContext } from './request-context';
import {
  commitBudgetReservation,
  getDefaultBudgetLimits,
  getDefaultReservationTtlSeconds,
  releaseBudgetReservation,
  reserveBudget,
} from './usage-budget';

// Enhanced MCP request schema with better validation
const mcpRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.enum(['initialize', 'tools/list', 'tools/call']),
  params: z.unknown().optional(),
});

const mcpCallParamsSchema = z.object({
  name: z.string().min(1).max(128),
  arguments: z.unknown().optional(),
});

export const MCP_MAX_REQUEST_BYTES = 512 * 1024;

// Enhanced MCP response schema
const mcpResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional(),
    })
    .optional(),
});

// MCP error codes following specification
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  SERVER_ERROR: -32000,
  TOOL_NOT_FOUND: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  RATE_LIMITED: -32003,
} as const;

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPMetrics {
  requestId: string;
  method: string;
  toolName?: string;
  executionTimeMs: number;
  success: boolean;
  errorCode?: number;
}

async function readMCPRequestBody(request: Request): Promise<unknown> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0) {
      throw createMCPError(MCP_ERROR_CODES.INVALID_REQUEST, 'Invalid Content-Length');
    }
    if (declaredLength > MCP_MAX_REQUEST_BYTES) {
      throw createMCPError(MCP_PAYLOAD_TOO_LARGE_ERROR_CODE, 'Request body is too large');
    }
  }

  if (!request.body) throw new SyntaxError('Request body is empty');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MCP_MAX_REQUEST_BYTES) {
        await reader.cancel();
        throw createMCPError(MCP_PAYLOAD_TOO_LARGE_ERROR_CODE, 'Request body is too large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes));
  } catch {
    throw new SyntaxError('Invalid JSON format');
  }
}

/**
 * Enhanced MCP handler with comprehensive error handling and monitoring
 */
export async function handleEnhancedMCPRequest(
  request: Request,
  env: Env,
  requestContext: RequestContext
): Promise<Response> {
  const startTime = Date.now();
  let metrics: MCPMetrics;
  let parsedRequest: z.infer<typeof mcpRequestSchema> | undefined;
  let auditEvent: MCPAuditEvent | undefined;
  let budgetReservationId: string | undefined;
  let budgetCommitted = false;
  let authorization: MCPAuthorizationContext = requestContext.auth
    ? {
        source:
          requestContext.auth.source ??
          (requestContext.auth.tier === 'internal' ? 'internal' : 'api-key'),
        subject: requestContext.auth.customerId,
        scopes: requestContext.auth.scopes,
        mcpAnalysisEnabled: requestContext.auth.mcpAnalysisEnabled !== false,
        auditCorrelationId: requestContext.runId,
        budgetDecision: 'not-evaluated',
      }
    : {
        source: env.ENVIRONMENT === 'production' ? 'api-key' : 'development',
        scopes: env.ENVIRONMENT === 'production' ? [] : [MCP_SCOPES.ANALYSIS_READ],
        auditCorrelationId: requestContext.runId,
        budgetDecision: 'not-evaluated',
      };

  try {
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw createMCPError(
        MCP_ERROR_CODES.INVALID_REQUEST,
        'Content-Type must be application/json'
      );
    }

    // Parse and validate request body
    const body = await readMCPRequestBody(request);
    parsedRequest = mcpRequestSchema.parse(body);
    if (parsedRequest.method === 'tools/call') {
      const callParams = mcpCallParamsSchema.safeParse(parsedRequest.params);
      if (!callParams.success) {
        throw createMCPError(MCP_ERROR_CODES.INVALID_PARAMS, 'Invalid tools/call parameters');
      }
    }

    if (env.BUDGET_ENFORCEMENT_ENABLED === 'true' && parsedRequest.method === 'tools/call') {
      const toolName = getMCPToolName(parsedRequest.params) ?? 'unknown';
      const now = new Date();
      const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const ttlSeconds = getDefaultReservationTtlSeconds(env.BUDGET_RESERVATION_TTL_SECONDS);
      const reservation = await reserveBudget(env, {
        identity: {
          principalId: requestContext.auth?.customerId ?? 'anonymous',
          clientId: requestContext.auth?.clientId ?? requestContext.auth?.source ?? 'mcp',
        },
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        runId: requestContext.runId,
        capability: toolName,
        idempotencyKey: request.headers.get('Idempotency-Key') ?? requestContext.requestId,
        units: {
          requestBytes: getSerializedByteLength(parsedRequest) ?? 0,
          toolCalls: 1,
        },
        limits: getDefaultBudgetLimits(env),
        expiresAt: new Date(now.getTime() + ttlSeconds * 1000).toISOString(),
        degradedMode: 'deterministic',
      });

      if (!reservation.allowed) {
        authorization = { ...authorization, budgetDecision: 'denied' };
        throw createMCPError(MCP_ERROR_CODES.RATE_LIMITED, 'MCP budget unavailable or exceeded');
      }
      if (reservation.reservationId) {
        budgetReservationId = reservation.reservationId;
        authorization = { ...authorization, budgetDecision: 'reserved' };
      }
    }

    const result = await handleMCPRequest(
      parsedRequest.method,
      parsedRequest.params,
      env,
      authorization
    );

    // Build successful response
    const response = {
      jsonrpc: '2.0',
      id: parsedRequest.id,
      result,
    };

    // Validate response structure
    mcpResponseSchema.parse(response);

    if (budgetReservationId) {
      const committed = await commitBudgetReservation(env, budgetReservationId, {
        requestBytes: getSerializedByteLength(parsedRequest) ?? 0,
        toolCalls: 1,
      });
      if (!committed.committed) {
        authorization = { ...authorization, budgetDecision: 'released' };
        throw createMCPError(MCP_ERROR_CODES.INTERNAL_ERROR, 'MCP budget commit failed');
      }
      budgetCommitted = true;
      authorization = { ...authorization, budgetDecision: 'committed' };
    }

    const toolName = getMCPToolName(parsedRequest.params);
    metrics = {
      requestId: requestContext.requestId,
      method: parsedRequest.method,
      ...(toolName === undefined ? {} : { toolName }),
      executionTimeMs: Date.now() - startTime,
      success: true,
    };

    const resultIntegrity = await createResultIntegrityReceipt(
      parsedRequest.params,
      result,
      response
    );

    auditEvent = createMCPAuditEvent(
      requestContext,
      authorization,
      parsedRequest,
      200,
      startTime,
      undefined,
      result,
      resultIntegrity
    );

    // Log successful request
    logInfo(
      requestContext,
      'MCP request completed successfully',
      metrics as unknown as Record<string, unknown>
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...buildDefaultHeaders(env),
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const executionTime = Date.now() - startTime;

    if (error instanceof SyntaxError) {
      metrics = {
        requestId: requestContext.requestId,
        method: 'unknown',
        executionTimeMs: executionTime,
        success: false,
        errorCode: MCP_ERROR_CODES.PARSE_ERROR,
      };
      auditEvent = createMCPAuditEvent(
        requestContext,
        authorization,
        parsedRequest,
        400,
        startTime,
        MCP_ERROR_CODES.PARSE_ERROR
      );

      logWarn(
        requestContext,
        'MCP request JSON parsing failed',
        metrics as unknown as Record<string, unknown>
      );

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 'unknown',
          error: createMCPError(MCP_ERROR_CODES.PARSE_ERROR, 'Invalid JSON format'),
        }),
        {
          status: 400,
          headers: buildDefaultHeaders(env),
        }
      );
    }

    // Handle different error types
    if (error instanceof z.ZodError) {
      metrics = {
        requestId: requestContext.requestId,
        method: 'unknown',
        executionTimeMs: executionTime,
        success: false,
        errorCode: MCP_ERROR_CODES.INVALID_REQUEST,
      };
      auditEvent = createMCPAuditEvent(
        requestContext,
        authorization,
        parsedRequest,
        400,
        startTime,
        MCP_ERROR_CODES.INVALID_REQUEST
      );

      const mcpError = createMCPError(MCP_ERROR_CODES.INVALID_REQUEST, 'Invalid request format');

      logWarn(requestContext, 'MCP request validation failed', {
        ...metrics,
        issueCount: error.issues.length,
      });

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 'unknown',
          error: mcpError,
        }),
        {
          status: 400,
          headers: buildDefaultHeaders(env),
        }
      );
    }

    // Handle MCP-specific errors
    if (isMCPError(error)) {
      metrics = {
        requestId: requestContext.requestId,
        method: 'unknown',
        executionTimeMs: executionTime,
        success: false,
        errorCode: error.code,
      };

      logWarn(requestContext, 'MCP request failed', { ...metrics, error: error.message });

      auditEvent = createMCPAuditEvent(
        requestContext,
        authorization,
        parsedRequest,
        getStatusCodeForMCPError(error.code),
        startTime,
        error.code
      );

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: parsedRequest?.id ?? 'unknown',
          error: {
            code: error.code,
            message: 'Request failed',
          },
        }),
        {
          status: getStatusCodeForMCPError(error.code),
          headers: buildDefaultHeaders(env),
        }
      );
    }

    // Handle unexpected errors
    metrics = {
      requestId: requestContext.requestId,
      method: 'unknown',
      executionTimeMs: executionTime,
      success: false,
      errorCode: MCP_ERROR_CODES.INTERNAL_ERROR,
    };

    const mcpError = createMCPError(MCP_ERROR_CODES.INTERNAL_ERROR, 'Internal server error');

    auditEvent = createMCPAuditEvent(
      requestContext,
      authorization,
      parsedRequest,
      500,
      startTime,
      MCP_ERROR_CODES.INTERNAL_ERROR
    );

    logError(requestContext, new Error(error instanceof Error ? error.message : String(error)));

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: parsedRequest?.id ?? 'unknown',
        error: {
          code: mcpError.code,
          message: 'Internal server error',
        },
      }),
      {
        status: 500,
        headers: buildDefaultHeaders(env),
      }
    );
  } finally {
    if (budgetReservationId && !budgetCommitted) {
      await releaseBudgetReservation(env, budgetReservationId);
    }
    if (auditEvent) {
      await recordMCPAuditEvent(env, auditEvent);
      writeAnalyticsEvent(env.ANALYTICS, {
        type:
          auditEvent.method === 'tools/call'
            ? 'mcp_tools_call'
            : auditEvent.method === 'tools/list'
              ? 'mcp_tools_list'
              : 'mcp_request',
        fingerprint: auditEvent.principalId ?? 'anonymous',
        trustScore: auditEvent.decision === 'allowed' ? 100 : 0,
        flags: [auditEvent.decision, `status_${auditEvent.statusCode}`],
        allowed: auditEvent.decision === 'allowed',
        requestId: auditEvent.requestId,
        runId: auditEvent.runId,
        principalId: auditEvent.principalId ?? 'anonymous',
        source: auditEvent.source,
        scopes: auditEvent.scopes,
        ...(auditEvent.capability ? { capability: auditEvent.capability } : {}),
        ...(auditEvent.policyVersion ? { policyVersion: auditEvent.policyVersion } : {}),
        ...(auditEvent.resourceScope ? { resourceScope: auditEvent.resourceScope } : {}),
        outcome:
          auditEvent.statusCode >= 500
            ? 'error'
            : auditEvent.decision === 'allowed'
              ? 'allowed'
              : 'denied',
        ...(auditEvent.auditCorrelationId ? { correlationId: auditEvent.auditCorrelationId } : {}),
        endpoint: new URL(request.url).pathname,
        statusCode: auditEvent.statusCode,
        durationMs: auditEvent.durationMs,
      });
    }
  }
}

function getMCPToolName(params: unknown): string | undefined {
  if (typeof params !== 'object' || params === null || !('name' in params)) {
    return undefined;
  }
  const name = (params as { name?: unknown }).name;
  return typeof name === 'string' ? name : undefined;
}

function getSerializedByteLength(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  try {
    const serialized = JSON.stringify(value ?? null);
    return encodeURIComponent(serialized).replace(/%[0-9A-F]{2}/gi, 'x').length;
  } catch {
    return undefined;
  }
}

function createMCPAuditEvent(
  requestContext: RequestContext,
  authorization: MCPAuthorizationContext,
  parsedRequest: z.infer<typeof mcpRequestSchema> | undefined,
  statusCode: number,
  startTime: number,
  errorCode?: number,
  result?: unknown,
  resultIntegrity?: ResultIntegrityReceipt
): MCPAuditEvent {
  const apiKeyId =
    requestContext.auth?.apiKeyId && requestContext.auth.apiKeyId > 0
      ? requestContext.auth.apiKeyId
      : undefined;
  const customerId = requestContext.auth?.customerId;
  const capability = getMCPToolName(parsedRequest?.params);
  const inputBytes = getSerializedByteLength(parsedRequest?.params);
  const outputBytes = result === undefined ? undefined : getSerializedByteLength(result);
  const policy = capability ? getMCPCapabilityPolicy(capability) : undefined;

  return {
    requestId: requestContext.requestId,
    runId: requestContext.runId,
    occurredAt: new Date().toISOString(),
    ...(apiKeyId === undefined ? {} : { apiKeyId }),
    ...(customerId === undefined ? {} : { customerId }),
    source: authorization.source,
    scopes: authorization.scopes,
    method: parsedRequest?.method ?? 'unknown',
    ...(capability === undefined ? {} : { capability }),
    policyVersion: policy?.policyVersion ?? MCP_CAPABILITY_POLICY_VERSION,
    principalId: authorization.subject ?? 'anonymous',
    resourceScope: policy?.resourceScope ?? 'system',
    budgetDecision: authorization.budgetDecision ?? 'not-evaluated',
    auditCorrelationId: authorization.auditCorrelationId ?? requestContext.runId,
    decision: errorCode === undefined ? 'allowed' : 'denied',
    ...(errorCode === undefined ? {} : { errorCode }),
    statusCode,
    ...(inputBytes === undefined ? {} : { inputBytes }),
    ...(outputBytes === undefined ? {} : { outputBytes }),
    durationMs: Date.now() - startTime,
    ...(resultIntegrity === undefined
      ? {}
      : {
          resultIntegrityVersion: resultIntegrity.version,
          inputDigest: resultIntegrity.inputDigest,
          outputDigest: resultIntegrity.outputDigest,
          resultDigest: resultIntegrity.resultDigest,
        }),
  };
}

/**
 * Create standardized MCP error object
 */
function createMCPError(code: number, message: string, data?: unknown): MCPError {
  return { code, message, data };
}

/**
 * Check if error is MCP error type
 */
function isMCPError(error: unknown): error is MCPError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as any).code === 'number' &&
    typeof (error as any).message === 'string'
  );
}

/**
 * Get appropriate HTTP status code for MCP error
 */
function getStatusCodeForMCPError(code: number): number {
  switch (code) {
    case MCP_ERROR_CODES.PARSE_ERROR:
    case MCP_ERROR_CODES.INVALID_REQUEST:
    case MCP_ERROR_CODES.INVALID_PARAMS:
      return 400;
    case MCP_ERROR_CODES.METHOD_NOT_FOUND:
      return 404;
    case MCP_ERROR_CODES.TOOL_NOT_FOUND:
      return 404;
    case MCP_ERROR_CODES.RATE_LIMITED:
      return 429;
    case MCP_POLICY_ERROR_CODE:
      return 403;
    case MCP_PAYLOAD_TOO_LARGE_ERROR_CODE:
      return 413;
    case MCP_ERROR_CODES.INTERNAL_ERROR:
    case MCP_ERROR_CODES.SERVER_ERROR:
    case MCP_ERROR_CODES.TOOL_EXECUTION_ERROR:
    default:
      return 500;
  }
}

/**
 * Enhanced MCP tools listing with caching and metadata
 */
export async function handleMCPToolsList(
  env: Env,
  requestContext: RequestContext,
  authorization: MCPAuthorizationContext
): Promise<Response> {
  try {
    const result = await handleMCPRequest('tools/list', undefined, env, authorization);

    // Add metadata for better client experience
    const enhancedResult = {
      ...(typeof result === 'object' && result !== null ? result : {}),
      metadata: {
        serverVersion: MCP_SERVER_VERSION,
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {
          tools: true,
          resources: false,
          prompts: false,
        },
        lastUpdated: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(enhancedResult), {
      headers: {
        ...buildDefaultHeaders(env),
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        Vary: 'Authorization, X-API-Key, X-Internal-API-Token',
      },
    });
  } catch (error) {
    const logErr = error instanceof Error ? error : new Error(String(error), { cause: error });
    logError(requestContext, logErr);

    return new Response(
      JSON.stringify({
        error: 'Failed to retrieve tools list',
        code: 'TOOLS_LIST_ERROR',
      }),
      {
        status: 500,
        headers: buildDefaultHeaders(env),
      }
    );
  }
}
