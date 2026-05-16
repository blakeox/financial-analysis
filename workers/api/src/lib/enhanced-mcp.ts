/**
 * Enhanced MCP Server with improved error handling and monitoring
 * Implements MCP best practices for production deployment
 */

import { handleMCPRequest } from '@financial-analysis/tools';
import { z } from 'zod';
import type { Env } from '../types';
import { buildDefaultHeaders } from './headers';
import { logError, logInfo, logWarn, type RequestContext } from './request-context';

// Enhanced MCP request schema with better validation
const mcpRequestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.enum(['initialize', 'tools/list', 'tools/call']),
  params: z.unknown().optional(),
});

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
    const body = await request.json();
    const mcpRequest = mcpRequestSchema.parse(body);

    // Execute MCP request
    const result = await handleMCPRequest(mcpRequest.method, mcpRequest.params, env);

    // Build successful response
    const response = {
      jsonrpc: '2.0',
      id: mcpRequest.id,
      result,
    };

    // Validate response structure
    mcpResponseSchema.parse(response);

    metrics = {
      requestId: requestContext.requestId,
      method: mcpRequest.method,
      toolName: mcpRequest.method === 'tools/call' ? (mcpRequest.params as any)?.name : undefined,
      executionTimeMs: Date.now() - startTime,
      success: true,
    };

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

    // Handle different error types
    if (error instanceof z.ZodError) {
      metrics = {
        requestId: requestContext.requestId,
        method: 'unknown',
        executionTimeMs: executionTime,
        success: false,
        errorCode: MCP_ERROR_CODES.INVALID_REQUEST,
      };

      const mcpError = createMCPError(
        MCP_ERROR_CODES.INVALID_REQUEST,
        'Invalid request format',
        error.issues
      );

      logWarn(requestContext, 'MCP request validation failed', {
        ...metrics,
        errors: error.issues,
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

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 'unknown',
          error,
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

    const mcpError = createMCPError(MCP_ERROR_CODES.INTERNAL_ERROR, 'Internal server error', {
      originalError: error instanceof Error ? error.message : String(error),
    });

    logError(requestContext, new Error(error instanceof Error ? error.message : String(error)));

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 'unknown',
        error: mcpError,
      }),
      {
        status: 500,
        headers: buildDefaultHeaders(env),
      }
    );
  }
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
  requestContext: RequestContext
): Promise<Response> {
  try {
    const result = await handleMCPRequest('tools/list', undefined, env);

    // Add metadata for better client experience
    const enhancedResult = {
      ...(typeof result === 'object' && result !== null ? result : {}),
      metadata: {
        serverVersion: '1.0.0',
        protocolVersion: '2024-11-05',
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
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    const logErr =
      error instanceof Error
        ? error
        : new Error(String(error), { cause: error });
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
