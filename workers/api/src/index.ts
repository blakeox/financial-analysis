import { Router } from 'itty-router';
import { z } from 'zod';
import { handleMCPRequest } from '@financial-analysis/tools';
import { FinancialInputSchema, LeaseAnalyzer } from '@financial-analysis/analysis';
import { getOpenApiDocument } from './openapi';

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
type RouteHandler = (request: Request, env: Env) => Response | Promise<Response>;

function withErrorHandler(handler: RouteHandler) {
  return async (request: Request, env: Env): Promise<Response> => {
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
function logRequest(request: Request, env: Env, startTime?: number, requestId?: string) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const clientIP = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   'unknown';

  const logEntry = {
    ...(requestId && { requestId }),
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
router.get('/health', (_req: Request, env: Env) => {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.ENVIRONMENT,
    version: 'v1'
  }), {
    headers: defaultHeaders
  });
});

// CORS preflight for API and MCP endpoints
router.options('/mcp', () => new Response(null, { headers: corsHeaders }));
router.options('/api/*', () => new Response(null, { headers: corsHeaders }));
router.options('/v1/*', () => new Response(null, { headers: corsHeaders }));
router.options('/openapi.json', () => new Response(null, { headers: corsHeaders }));
router.options('/docs', () => new Response(null, { headers: corsHeaders }));

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
    method: z.enum(['initialize', 'tools/list', 'tools/call']),
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

// Lease analysis endpoint
router.post('/v1/api/analysis/lease', withErrorHandler(async (request: Request, _env: Env) => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(JSON.stringify({
      error: {
        message: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE'
      }
    }), { status: 415, headers: defaultHeaders });
  }

  const body = await request.json().catch(() => undefined);

  // Validate input using shared schema
  const parseResult = FinancialInputSchema.safeParse(body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    return new Response(JSON.stringify({
      error: {
        message: 'Invalid request body',
        code: 'BAD_REQUEST',
        issues,
      }
    }), { status: 400, headers: defaultHeaders });
  }

  const result = LeaseAnalyzer.analyze(parseResult.data);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: defaultHeaders,
  });
}));

// Legacy route (redirect to v1)
router.get('/api/analysis', withErrorHandler(async (request: Request) => {
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  const location = `/v1/api/analysis${params ? `?${params}` : ''}`;
  return new Response(null, {
    status: 308,
    headers: {
      ...defaultHeaders,
      Location: location,
    },
  });
}));

// OpenAPI document
router.get('/openapi.json', withErrorHandler(async (request: Request, _env: Env) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const doc = getOpenApiDocument(baseUrl);
  return new Response(JSON.stringify(doc, null, 2), {
    headers: {
      ...defaultHeaders,
      'Content-Type': 'application/json',
    },
  });
}));

// API docs viewer (RapiDoc)
router.get('/docs', withErrorHandler(async (request: Request, _env: Env) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  // Tight CSP allowing only our origin and the RapiDoc CDN script
  const docsCsp = [
    "default-src 'self'",
    "script-src 'self' https://unpkg.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'"
  ].join('; ');

  const html = `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>API Docs — Financial Analysis</title>
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <link rel="icon" href="data:," />
      <style>
        html, body { height: 100%; margin: 0; background: #0b1020; }
        rapi-doc { height: 100vh; }
      </style>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js" crossorigin="anonymous"></script>
    </head>
    <body>
      <rapi-doc
        spec-url="${baseUrl}/openapi.json"
        theme="dark"
        render-style="read"
        show-header="false"
        allow-authentication="false"
        allow-spec-url-load="false"
        allow-spec-file-load="false"
      >
      </rapi-doc>
    </body>
  </html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      ...securityHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': docsCsp,
    },
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
    // Generate request id (uuid v4 style without external deps)
    const requestId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;

  // Log incoming request
  logRequest(request, env, undefined, requestId);

    // Apply rate limiting to API routes
    if (request.url.includes('/api/') || request.url.includes('/mcp')) {
      const withinLimit = await checkRateLimit(request, env);
      if (!withinLimit) {
        logRequest(request, env, startTime, requestId);
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

  let response = await router.handle(request, env, ctx);

  // Attach request id header to response
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Request-ID', requestId);
  response = new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });

  // Log response
  logRequest(request, env, startTime, requestId);

    return response;
  },
};