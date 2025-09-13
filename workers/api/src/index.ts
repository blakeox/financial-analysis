import { Router } from 'itty-router';
import { z } from 'zod';
import { handleMCPRequest } from '@financial-analysis/tools';

interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  DOCUMENTS: R2Bucket;
  ENVIRONMENT: string;
}

const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};

// Combine headers
const defaultHeaders = {
  'Content-Type': 'application/json',
  ...corsHeaders,
  ...securityHeaders,
};

// Rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

async function checkRateLimit(request: Request, env: Env): Promise<boolean> {
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   'unknown';

  const key = `ratelimit:${clientIP}`;
  const now = Date.now();

  try {
    const data = await env.SESSIONS.get(key);
    const rateLimitData = data ? JSON.parse(data) : { count: 0, resetTime: now + RATE_LIMIT_WINDOW };

    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 1;
      rateLimitData.resetTime = now + RATE_LIMIT_WINDOW;
    } else {
      rateLimitData.count++;
    }

    if (rateLimitData.count > RATE_LIMIT_MAX_REQUESTS) {
      return false; // Rate limit exceeded
    }

    await env.SESSIONS.put(key, JSON.stringify(rateLimitData), {
      expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });

    return true; // Within rate limit
  } catch (error) {
    // If rate limiting fails, allow the request
    console.warn('Rate limiting check failed:', error);
    return true;
  }
}

// Error handling wrapper
function withErrorHandler(handler: Function) {
  return async (request: Request, env: Env) => {
    try {
      return await handler(request, env);
    } catch (error) {
      console.error('API Error:', error);

      const isDevelopment = env.ENVIRONMENT === 'development';

      return new Response(JSON.stringify({
        error: {
          message: isDevelopment && error instanceof Error ? error.message : 'Internal server error',
          code: 'INTERNAL_ERROR',
          ...(isDevelopment && error instanceof Error && { stack: error.stack })
        }
      }), {
        status: 500,
        headers: defaultHeaders
      });
    }
  };
}

// Logging utility
function logRequest(request: Request, env: Env, startTime?: number) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   'unknown';

  const logEntry = {
    timestamp,
    method,
    path: url.pathname,
    userAgent,
    clientIP,
    environment: env.ENVIRONMENT,
    ...(startTime && { duration: Date.now() - startTime })
  };

  console.log(JSON.stringify(logEntry));
}

// Health check endpoint
router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production', // Will be overridden by env var
    version: 'v1'
  }), {
    headers: defaultHeaders
  });
});

// MCP server endpoint for LLM integration
router.post('/mcp', withErrorHandler(async (request: Request, env: Env) => {
  // Validate content type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Content-Type must be application/json');
  }

  const body = await request.json();

  // Enhanced MCP protocol validation
  const mcpRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    id: z.union([z.string(), z.number()]),
    method: z.string().min(1).max(100),
    params: z.any().optional()
  });

  const mcpRequest = mcpRequestSchema.parse(body);

  // Use the MCP tools handler
  const result = await handleMCPRequest(mcpRequest.method, mcpRequest.params, env);

  return new Response(JSON.stringify({
    jsonrpc: '2.0',
    id: mcpRequest.id,
    result
  }), {
    headers: defaultHeaders
  });
}));

// API routes for financial analysis (v1)
router.get('/v1/api/analysis', withErrorHandler(async (request: Request, env: Env) => {
  // Parse and validate query parameters
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  // Basic validation for analysis type
  const validTypes = ['lease', 'amortization', 'cashflow'];
  if (type && !validTypes.includes(type)) {
    throw new Error(`Invalid analysis type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Placeholder for analysis endpoints
  return new Response(JSON.stringify({
    message: 'Analysis API endpoint',
    version: 'v1',
    environment: env.ENVIRONMENT,
    ...(type && { requestedType: type })
  }), {
    headers: defaultHeaders
  });
}));

// Legacy route (redirect to v1)
router.get('/api/analysis', withErrorHandler(async (request: Request, env: Env) => {
  // Parse and validate query parameters
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  // Basic validation for analysis type
  const validTypes = ['lease', 'amortization', 'cashflow'];
  if (type && !validTypes.includes(type)) {
    throw new Error(`Invalid analysis type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Placeholder for analysis endpoints
  return new Response(JSON.stringify({
    message: 'Analysis API endpoint (legacy - use /v1/api/analysis)',
    version: 'v1',
    environment: env.ENVIRONMENT,
    ...(type && { requestedType: type })
  }), {
    headers: defaultHeaders
  });
}));

// API routes for financial analysis
router.get('/api/analysis', withErrorHandler(async (request: Request, env: Env) => {
  // Parse and validate query parameters
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  // Basic validation for analysis type
  const validTypes = ['lease', 'amortization', 'cashflow'];
  if (type && !validTypes.includes(type)) {
    throw new Error(`Invalid analysis type. Must be one of: ${validTypes.join(', ')}`);
  }

  // Placeholder for analysis endpoints
  return new Response(JSON.stringify({
    message: 'Analysis API endpoint',
    environment: env.ENVIRONMENT,
    ...(type && { requestedType: type })
  }), {
    headers: defaultHeaders
  });
}));

// 404 handler
router.all('*', () => new Response(JSON.stringify({ error: 'Not Found' }), {
  status: 404,
  headers: defaultHeaders
}));

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();

    // Log incoming request
    logRequest(request, env);

    // Apply rate limiting to API routes
    if (request.url.includes('/api/') || request.url.includes('/mcp')) {
      const withinLimit = await checkRateLimit(request, env);
      if (!withinLimit) {
        logRequest(request, env, startTime);
        return new Response(JSON.stringify({
          error: {
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED'
          }
        }), {
          status: 429,
          headers: {
            ...defaultHeaders,
            'Retry-After': '60'
          }
        });
      }
    }

    const response = await router.handle(request, env, ctx);

    // Log response
    logRequest(request, env, startTime);

    return response;
  },
};