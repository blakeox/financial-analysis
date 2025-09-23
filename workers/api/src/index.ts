import {
  AmortizationAnalyzer,
  AmortizationInputSchema,
  FinancialInputSchema,
  LeaseAnalyzer,
} from '@financial-analysis/analysis';
import { handleMCPRequest } from '@financial-analysis/tools';
import { Router } from 'itty-router';
import { z } from 'zod';
import { getOpenApiDocument } from './openapi';
import type { Env } from './types';
// Lib barrel export consolidates helpers in one place for tidy imports
import {
  getCorsHeaders,
  getSecurityHeaders,
  buildDefaultHeaders,
  getDefaultCache,
  sha256Hex,
  stableStringify,
  getAnalysisCacheTtl,
  getMaxJsonBytes,
  getThresholds,
  checkRateLimit,
  attachRateLimitHeaders,
  type RateLimitInfo,
  getApproxBytes,
  isQuotaLocked,
  setQuotaLocked,
  adjustApproxBytes,
  reconcileBucketUsage,
} from './lib';
import { registerHealthRoute } from './routes/health';

// Helper: get Cloudflare Workers default Cache if available
const router = Router();

// ---- Headers helpers ----

// ---- Chat types (minimal, OpenAI-compatible-ish) ----
type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type ChatRequest = {
  messages: ChatMessage[];
  model?: string;
  tools?: Array<{ name: string; description?: string; input_schema?: unknown }>;
  // Optional server-side MCP tool invocation (bypasses model)
  tool_call?: { name: string; arguments: unknown };
};
type ChatResponse = {
  role: 'assistant';
  content: string;
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

// Rate limiting now lives in ./lib/rate-limit

// ---- R2 quota guardrails (KV-backed approximate counters) ----
// Quota helpers now live in ./lib/quota

function hasControlChars(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if ((code >= 0 && code <= 31) || code === 127) return true;
  }
  return false;
}

// Quota helpers moved to ./lib/quota

// ---- Error handling wrapper ----
type RouteHandler = (request: Request, env: Env) => Response | Promise<Response>;

function withErrorHandler(handler: RouteHandler) {
  return async (request: Request, env: Env): Promise<Response> => {
    try {
      return await handler(request, env);
    } catch (error) {
      console.error('API Error:', error);

      const isDevelopment = env.ENVIRONMENT === 'development';

      return new Response(
        JSON.stringify({
          error: {
            message:
              isDevelopment && error instanceof Error ? error.message : 'Internal server error',
            code: 'INTERNAL_ERROR',
            ...(isDevelopment && error instanceof Error && { stack: error.stack }),
          },
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  };
}

// ---- Logging ----
function logRequest(request: Request, env: Env, startTime?: number, requestId?: string) {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const clientIP =
    request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  // Cloudflare edge metadata (may be undefined in tests/local)
  const cfRay = request.headers.get('CF-RAY') || undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const colo = (request as any).cf?.colo as string | undefined;

  const logEntry = {
    ...(requestId && { requestId }),
    timestamp,
    method,
    path: url.pathname,
    userAgent,
    clientIP,
    ...(cfRay && { cfRay }),
    ...(colo && { colo }),
    environment: env.ENVIRONMENT,
    ...(startTime && { duration: Date.now() - startTime }),
  };

  console.log(JSON.stringify(logEntry));
}

// ---- Routes ----
// Health check endpoint (registered from routes module)
registerHealthRoute(router as unknown as import('itty-router').RouterType);

// Lightweight ping endpoint for uptime checks
router.get('/ping', (_req: Request, env: Env) => {
  const headers = new Headers({
    ...getCorsHeaders(env),
    ...getSecurityHeaders(env),
    'Content-Type': 'text/plain; charset=utf-8',
  });
  return new Response('pong', { headers });
});

// Version endpoint exposing environment and optional commit SHA
router.get('/version', (_req: Request, env: Env) => {
  return new Response(
    JSON.stringify({
      service: 'financial-analysis-api',
      version: 'v1',
      environment: env.ENVIRONMENT,
      commit: env.COMMIT_SHA ?? 'unknown',
      timestamp: new Date().toISOString(),
    }),
    { headers: buildDefaultHeaders(env) }
  );
});

// Root route -> health (friendly JSON + links)
router.get('/', async (request: Request, env: Env) => {
  const payload = {
    status: 'ok',
    service: 'financial-analysis-api',
    environment: env.ENVIRONMENT,
    docs: '/docs',
    openapi: '/openapi.json',
    health: '/health',
    storage: '/v1/storage/status',
  } as const;
  const json = JSON.stringify(payload);
  const etagHex = await sha256Hex(json);
  const etag = `"${etagHex}"`;
  const inm = request.headers.get('if-none-match');
  const matches = (a: string, b: string) => {
    const norm = (s: string) => s.trim().replace(/^W\//i, '').replace(/^"|"$/g, '');
    return norm(a) === norm(b);
  };
  if (inm && matches(inm, etag)) {
    return new Response(null, {
      status: 304,
      headers: {
        ...getCorsHeaders(env),
        ...getSecurityHeaders(env),
        'Content-Type': 'application/json',
        ETag: etag,
        'Cache-Control': 'public, max-age=60',
      },
    });
  }

  return new Response(json, {
    headers: {
      ...buildDefaultHeaders(env),
      'Content-Type': 'application/json',
      ETag: etag,
      'Cache-Control': 'public, max-age=60',
    },
  });
});

// CORS preflight for API and MCP endpoints
router.options('/mcp', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'POST, OPTIONS');
  return new Response(null, { headers });
});
router.options('/api/*', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
  return new Response(null, { headers });
});
router.options('/v1/*', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
  return new Response(null, { headers });
});
router.options('/openapi.json', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, OPTIONS');
  return new Response(null, { headers });
});
router.options('/docs', (_req: Request, env: Env) => {
  const headers = new Headers(getCorsHeaders(env));
  headers.set('Allow', 'GET, OPTIONS');
  return new Response(null, { headers });
});

// ---- Workers AI Chat endpoint ----
router.post(
  '/v1/chat',
  withErrorHandler(async (request: Request, env: Env) => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: { message: 'Content-Type must be application/json', code: 'INVALID_CONTENT_TYPE' },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }

    const body = (await request.json().catch(() => null)) as ChatRequest | null;
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: { message: 'messages[] required', code: 'BAD_REQUEST' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    // Optional: server-side tool call through MCP, no AI required.
    if (body.tool_call && typeof body.tool_call.name === 'string') {
      try {
        const result = await handleMCPRequest('tools/call', {
          name: body.tool_call.name,
          arguments: body.tool_call.arguments,
        });
        const reply: ChatResponse = {
          role: 'assistant',
          content: typeof result === 'string' ? result : JSON.stringify(result),
        };
        return new Response(JSON.stringify(reply), {
          status: 200,
          headers: buildDefaultHeaders(env),
        });
      } catch (err) {
        return new Response(
          JSON.stringify({
            error: {
              message: err instanceof Error ? err.message : 'Tool call failed',
              code: 'TOOL_CALL_FAILED',
            },
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }
    }

    // Optional tool: basic deterministic analysis call (amortization) when user asks for amortization and provides JSON payload.
    // This keeps costs at zero and demonstrates tool-use without requiring AI.
    const last = body.messages[body.messages.length - 1];
    if (last && last.role === 'user' && /amortization/i.test(last.content)) {
      try {
        const jsonMatch = last.content.match(/\{[\s\S]*\}$/);
        if (jsonMatch) {
          const maybe = JSON.parse(jsonMatch[0]);
          const parseResult = AmortizationInputSchema.safeParse(maybe);
          if (parseResult.success) {
            const result = AmortizationAnalyzer.analyze(parseResult.data);
            const reply: ChatResponse = {
              role: 'assistant',
              content: `Computed amortization. Monthly payment: ${result.monthlyPayment.toFixed(2)}; total interest: ${result.totalInterest.toFixed(2)}.`,
            };
            return new Response(JSON.stringify(reply), {
              status: 200,
              headers: buildDefaultHeaders(env),
            });
          }
        }
      } catch {
        // fall through to model reply or canned response
      }
    }

    // If AI binding is absent, provide a lightweight deterministic response.
    if (!env.AI) {
      const reply: ChatResponse = {
        role: 'assistant',
        content:
          'AI model is not configured in this environment. You can still call analysis endpoints directly (e.g., POST /v1/api/analysis/amortization).',
      };
      return new Response(JSON.stringify(reply), {
        status: 200,
        headers: buildDefaultHeaders(env),
      });
    }

    const model = body.model || env.WORKERS_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct';

    // Compose a prompt from messages
    const system = body.messages.find((m) => m.role === 'system');
    const userParts = body.messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join('\n');
    const prompt = `${system ? system.content + '\n\n' : ''}${userParts}`.slice(0, 10000);

    // Call Workers AI text generation endpoint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = env.AI as any;
    const aiRes = await ai.run(model, { prompt });
    const text: string = aiRes?.response || aiRes?.text || JSON.stringify(aiRes);
    const reply: ChatResponse = {
      role: 'assistant',
      content: String(text || '').slice(0, 12000),
      model,
    };
    return new Response(JSON.stringify(reply), { status: 200, headers: buildDefaultHeaders(env) });
  })
);

// ---- Storage endpoints (R2) ----
// Note: This implementation is conservative and designed for free-tier safety.
// It requires a Content-Length header for uploads and enforces soft/hard quotas.

router.get(
  '/v1/storage/status',
  withErrorHandler(async (_request: Request, env: Env) => {
    const { softLimit, hardLimit } = getThresholds(env);
    const approx = await getApproxBytes(env);
    const locked = await isQuotaLocked(env);
    const hasBucket = Boolean(env.DOCUMENTS);
    return new Response(
      JSON.stringify({
        bucket: hasBucket ? 'configured' : 'absent',
        approxBytes: approx,
        softLimit,
        hardLimit,
        locked,
      }),
      { headers: buildDefaultHeaders(env) }
    );
  })
);

router.get(
  '/v1/storage/usage',
  withErrorHandler(async (_request: Request, env: Env) => {
    const { softLimit, hardLimit, maxObjectSize } = getThresholds(env);
    const usedBytes = await getApproxBytes(env);
    const locked = await isQuotaLocked(env);
    return new Response(
      JSON.stringify({
        usedBytes,
        softLimit,
        hardLimit,
        maxObjectSize,
        locked,
        timestamp: new Date().toISOString(),
      }),
      { headers: buildDefaultHeaders(env) }
    );
  })
);

// Admin-only reconcile endpoint (requires Authorization: Bearer <ADMIN_API_TOKEN>)
router.post(
  '/v1/storage/reconcile',
  withErrorHandler(async (request: Request, env: Env) => {
    const auth = request.headers.get('authorization') || '';
    const token = (auth.startsWith('Bearer ') && auth.slice(7)) || '';
    if (!env.ADMIN_API_TOKEN || token !== env.ADMIN_API_TOKEN) {
      return new Response(
        JSON.stringify({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } }),
        { status: 401, headers: buildDefaultHeaders(env) }
      );
    }
    const result = await reconcileBucketUsage(env);
    return new Response(
      JSON.stringify({
        usedBytes: result.bytes,
        locked: result.locked,
        scanned: result.scanned,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: buildDefaultHeaders(env) }
    );
  })
);

router.put(
  '/v1/storage/object/:key',
  withErrorHandler(async (request: Request, env: Env) => {
    if (!env.DOCUMENTS) {
      return new Response(
        JSON.stringify({ error: { message: 'Storage not configured', code: 'NO_BUCKET' } }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }

    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^.*\/object\//, ''));
    // Basic key hygiene: non-empty, no trailing slash, length cap, safe charset, and no dot segments
    if (!key || key.endsWith('/')) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid object key', code: 'BAD_KEY' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }
    if (key.length > 1024 || hasControlChars(key) || /(^|\/)\.\.(\/|$)/.test(key)) {
      return new Response(
        JSON.stringify({ error: { message: 'Unsafe object key', code: 'BAD_KEY' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    // Enforce lock and thresholds
    const { softLimit, hardLimit, maxObjectSize } = getThresholds(env);
    // Prefer Content-Length; allow X-Content-Length as a fallback (browsers can't set Content-Length)
    const contentLengthHeader =
      request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
    if (!contentLengthHeader) {
      return new Response(
        JSON.stringify({ error: { message: 'Content-Length required', code: 'LENGTH_REQUIRED' } }),
        { status: 411, headers: buildDefaultHeaders(env) }
      );
    }
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid Content-Length', code: 'BAD_LENGTH' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }
    if (contentLength > maxObjectSize) {
      return new Response(
        JSON.stringify({
          error: {
            message: `Object too large. Max ${maxObjectSize} bytes`,
            code: 'OBJECT_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      );
    }

    const approx = await getApproxBytes(env);
    const locked = await isQuotaLocked(env);
    const willBe = approx + contentLength;
    if (locked || willBe > hardLimit) {
      await setQuotaLocked(env, true);
      return new Response(
        JSON.stringify({ error: { message: 'Storage locked due to quota', code: 'QUOTA_LOCKED' } }),
        { status: 403, headers: buildDefaultHeaders(env) }
      );
    }
    if (willBe > softLimit) {
      // Flip the lock and reject to prevent crossing soft limit.
      await setQuotaLocked(env, true);
      return new Response(
        JSON.stringify({ error: { message: 'Approaching quota', code: 'SOFT_LIMIT' } }),
        { status: 403, headers: buildDefaultHeaders(env) }
      );
    }

    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    // Optional MIME allowlist
    if (env.ALLOWED_UPLOAD_MIME_PREFIXES) {
      const allowed = String(env.ALLOWED_UPLOAD_MIME_PREFIXES)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const ok = allowed.length === 0 || allowed.some((p) => contentType.startsWith(p));
      if (!ok) {
        return new Response(
          JSON.stringify({
            error: { message: 'Unsupported media type', code: 'UNSUPPORTED_MEDIA_TYPE' },
          }),
          { status: 415, headers: buildDefaultHeaders(env) }
        );
      }
    }

    // Conditional semantics (minimal): support If-None-Match: * (create-only) and If-Match: * (update-only)
    const ifNoneMatch = request.headers.get('If-None-Match');
    const ifMatch = request.headers.get('If-Match');
    const existingHead = await env.DOCUMENTS.head(key);
    if (ifNoneMatch === '*' && existingHead) {
      return new Response(
        JSON.stringify({
          error: { message: 'Precondition failed (exists)', code: 'PRECONDITION_FAILED' },
        }),
        { status: 412, headers: buildDefaultHeaders(env) }
      );
    }
    if (ifMatch === '*' && !existingHead) {
      return new Response(
        JSON.stringify({
          error: { message: 'Precondition failed (missing)', code: 'PRECONDITION_FAILED' },
        }),
        { status: 412, headers: buildDefaultHeaders(env) }
      );
    }

    const putRes = await env.DOCUMENTS.put(key, request.body as ReadableStream, {
      httpMetadata: { contentType },
    });
    // Adjust approximate counter by delta (new - old) to avoid double counting overwrites
    const prevSize = existingHead && typeof existingHead.size === 'number' ? existingHead.size : 0;
    await adjustApproxBytes(env, contentLength - prevSize);
    return new Response(JSON.stringify({ key, etag: putRes?.etag ?? null, size: contentLength }), {
      status: 201,
      headers: buildDefaultHeaders(env),
    });
  })
);

router.delete(
  '/v1/storage/object/:key',
  withErrorHandler(async (request: Request, env: Env) => {
    if (!env.DOCUMENTS) {
      return new Response(
        JSON.stringify({ error: { message: 'Storage not configured', code: 'NO_BUCKET' } }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
    const url = new URL(request.url);
    const key = decodeURIComponent(url.pathname.replace(/^.*\/object\//, ''));
    if (!key || key.endsWith('/')) {
      return new Response(
        JSON.stringify({ error: { message: 'Invalid object key', code: 'BAD_KEY' } }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }
    const head = await env.DOCUMENTS.head(key);
    await env.DOCUMENTS.delete(key);
    if (head && typeof head.size === 'number') {
      await adjustApproxBytes(env, -head.size);
    }
    return new Response(JSON.stringify({ key, deleted: true }), {
      status: 200,
      headers: buildDefaultHeaders(env),
    });
  })
);

// MCP server endpoint for LLM integration
router.post(
  '/mcp',
  withErrorHandler(async (request: Request, env: Env) => {
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
      params: z.any().optional(),
    });

    const mcpRequest = mcpRequestSchema.parse(body);

    // Use the MCP tools handler
    const result = await handleMCPRequest(mcpRequest.method, mcpRequest.params, env);

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result,
      }),
      {
        headers: buildDefaultHeaders(env),
      }
    );
  })
);

// API routes for financial analysis (v1)
router.get(
  '/v1/api/analysis',
  withErrorHandler(async (request: Request, env: Env) => {
    // Parse and validate query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    // Basic validation for analysis type
    const validTypes = ['lease', 'amortization', 'cashflow'];
    if (type && !validTypes.includes(type)) {
      throw new Error(`Invalid analysis type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Placeholder for analysis endpoints
    return new Response(
      JSON.stringify({
        message: 'Analysis API endpoint',
        version: 'v1',
        environment: env.ENVIRONMENT,
        ...(type && { requestedType: type }),
      }),
      { headers: buildDefaultHeaders(env) }
    );
  })
);

// Lease analysis endpoint
router.post(
  '/v1/api/analysis/lease',
  withErrorHandler(async (request: Request, env: Env) => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE',
          },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }

    // Enforce JSON body size cap
    const maxBytes = getMaxJsonBytes(env);
    const declaredLen =
      request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
    if (declaredLen && Number(declaredLen) > maxBytes) {
      return new Response(
        JSON.stringify({
          error: {
            message: `JSON body too large (max ${maxBytes} bytes)`,
            code: 'PAYLOAD_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      );
    }
    const text = await request.text();
    if (text.length > maxBytes) {
      return new Response(
        JSON.stringify({
          error: {
            message: `JSON body too large (max ${maxBytes} bytes)`,
            code: 'PAYLOAD_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      );
    }
    const body = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return undefined;
      }
    })();

    const parseResult = FinancialInputSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid request body',
            code: 'BAD_REQUEST',
            issues,
          },
        }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    // Optional deterministic caching (Cache API)
    const ttl = getAnalysisCacheTtl(env);
    const cache = ttl > 0 ? getDefaultCache() : undefined;
    if (ttl > 0 && cache) {
      const keyStr = await sha256Hex(stableStringify({ route: 'lease', input: parseResult.data }));
      const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
      const cached = await cache.match(cacheReq);
      if (cached) {
        const hitHeaders = new Headers(cached.headers);
        hitHeaders.set('X-Cache', 'HIT');
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: hitHeaders,
        });
      }
      const result = LeaseAnalyzer.analyze(parseResult.data);
      const res = new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          ...buildDefaultHeaders(env),
          'Cache-Control': `public, max-age=${ttl}`,
          'X-Cache': 'MISS',
        },
      });
      void cache.put(cacheReq, res.clone());
      return res;
    }

    const result = LeaseAnalyzer.analyze(parseResult.data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
    });
  })
);

// Amortization analysis endpoint
router.post(
  '/v1/api/analysis/amortization',
  withErrorHandler(async (request: Request, env: Env) => {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Content-Type must be application/json',
            code: 'INVALID_CONTENT_TYPE',
          },
        }),
        { status: 415, headers: buildDefaultHeaders(env) }
      );
    }
    // Enforce JSON body size cap
    const maxBytes = getMaxJsonBytes(env);
    const declaredLen =
      request.headers.get('Content-Length') || request.headers.get('X-Content-Length');
    if (declaredLen && Number(declaredLen) > maxBytes) {
      return new Response(
        JSON.stringify({
          error: {
            message: `JSON body too large (max ${maxBytes} bytes)`,
            code: 'PAYLOAD_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      );
    }
    const text = await request.text();
    if (text.length > maxBytes) {
      return new Response(
        JSON.stringify({
          error: {
            message: `JSON body too large (max ${maxBytes} bytes)`,
            code: 'PAYLOAD_TOO_LARGE',
          },
        }),
        { status: 413, headers: buildDefaultHeaders(env) }
      );
    }
    const body = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return undefined;
      }
    })();

    const parseResult = AmortizationInputSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((i: z.ZodIssue) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      }));
      return new Response(
        JSON.stringify({
          error: {
            message: 'Invalid request body',
            code: 'BAD_REQUEST',
            issues,
          },
        }),
        { status: 400, headers: buildDefaultHeaders(env) }
      );
    }

    // Optional deterministic caching (Cache API)
    const ttl = getAnalysisCacheTtl(env);
    const cache = ttl > 0 ? getDefaultCache() : undefined;
    if (ttl > 0 && cache) {
      const keyStr = await sha256Hex(
        stableStringify({ route: 'amortization', input: parseResult.data })
      );
      const cacheReq = new Request(`https://cache.local/analysis/${keyStr}`);
      const cached = await cache.match(cacheReq);
      if (cached) {
        const hitHeaders = new Headers(cached.headers);
        hitHeaders.set('X-Cache', 'HIT');
        return new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: hitHeaders,
        });
      }
      const result = AmortizationAnalyzer.analyze(parseResult.data);
      const res = new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          ...buildDefaultHeaders(env),
          'Cache-Control': `public, max-age=${ttl}`,
          'X-Cache': 'MISS',
        },
      });
      void cache.put(cacheReq, res.clone());
      return res;
    }

    const result = AmortizationAnalyzer.analyze(parseResult.data);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...buildDefaultHeaders(env), 'X-Cache': 'BYPASS' },
    });
  })
);

// Legacy route (redirect to v1)
router.get(
  '/api/analysis',
  withErrorHandler(async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const params = url.searchParams.toString();
    const location = `/v1/api/analysis${params ? `?${params}` : ''}`;
    return new Response(null, {
      status: 308,
      headers: { ...buildDefaultHeaders(env), Location: location },
    });
  })
);

// OpenAPI document
router.get(
  '/openapi.json',
  withErrorHandler(async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const doc = getOpenApiDocument(baseUrl);
    const json = JSON.stringify(doc, null, 2);
    const etagHex = await sha256Hex(json);
    const etag = `"${etagHex}"`;
    const inm = request.headers.get('if-none-match');
    if (inm && inm.replace(/^W\//, '') === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...getCorsHeaders(env),
          ...getSecurityHeaders(env),
          ETag: etag,
          'Cache-Control': 'public, max-age=300',
          'Content-Type': 'application/json',
        },
      });
    }
    return new Response(json, {
      headers: {
        ...buildDefaultHeaders(env),
        'Content-Type': 'application/json',
        ETag: etag,
        'Cache-Control': 'public, max-age=300',
      },
    });
  })
);

// API docs viewer (RapiDoc)
router.get(
  '/docs',
  withErrorHandler(async (request: Request, env: Env) => {
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
      "frame-ancestors 'none'",
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

    const etagHex = await sha256Hex(html);
    const etag = `"${etagHex}"`;
    const inm = request.headers.get('if-none-match');
    if (inm && inm.replace(/^W\//, '') === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ...getCorsHeaders(env),
          ...getSecurityHeaders(env),
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Security-Policy': docsCsp,
          ETag: etag,
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    return new Response(html, {
      headers: {
        ...getCorsHeaders(env),
        ...getSecurityHeaders(env),
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': docsCsp,
        ETag: etag,
        'Cache-Control': 'public, max-age=300',
      },
    });
  })
);

// 404 handler
router.all(
  '*',
  (_req: Request, env: Env) =>
    new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: buildDefaultHeaders(env),
    })
);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

    logRequest(request, env, undefined, requestId);

    let rateInfo: RateLimitInfo | undefined;
    if (
      request.url.includes('/api/') ||
      request.url.includes('/mcp') ||
      request.url.includes('/v1/chat')
    ) {
      rateInfo = await checkRateLimit(request, env);
      if (!rateInfo.allowed) {
        logRequest(request, env, startTime, requestId);
        const headers = new Headers({
          ...buildDefaultHeaders(env),
          'Retry-After': String(Math.ceil((rateInfo.resetTime - Date.now()) / 1000)),
        });
        headers.set('X-Request-ID', requestId);
        attachRateLimitHeaders(headers, rateInfo);
        return new Response(
          JSON.stringify({
            error: {
              message: 'Rate limit exceeded. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
            },
          }),
          { status: 429, headers }
        );
      }
    }

    let response = await router.handle(request, env, ctx);

    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-Request-ID', requestId);
    // Echo Cloudflare tracing info for correlation (if present)
    const cfRay = request.headers.get('CF-RAY');
    if (cfRay) newHeaders.set('CF-RAY', cfRay);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colo = (request as any).cf?.colo as string | undefined;
    if (colo) newHeaders.set('X-Colo', colo);
    if (rateInfo) attachRateLimitHeaders(newHeaders, rateInfo);
    response = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });

    logRequest(request, env, startTime, requestId);

    return response;
  },
  // Scheduled reconciliation of approximate bucket usage to keep KV counters honest.
  // Runs based on wrangler.toml [triggers.crons] schedule.
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // In production, run reconciliation asynchronously; in tests, await so assertions see updates.
    const promise = reconcileBucketUsage(env);
    ctx.waitUntil(promise);
    if (env.ENVIRONMENT === 'test') {
      await promise;
    }
  },
};
