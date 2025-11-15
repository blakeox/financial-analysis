# API Best Practices Roadmap

## Executive Summary

This document outlines a comprehensive roadmap for implementing industry best practices in the Financial Analysis API. The focus is on scalability, maintainability, observability, and developer experience.

**Current Status**: ✅ Good foundation with modular architecture  
**Goal**: 🎯 Production-ready enterprise-grade API

---

## 📊 Current State Analysis

### ✅ Strengths
- **Modular Architecture**: Clean separation (routes, services, lib, utils)
- **Error Handling**: Comprehensive error handling with `withErrorHandler`
- **Type Safety**: TypeScript with proper interfaces
- **Security**: Rate limiting, auth, validation, circuit breakers
- **Testing**: Good test coverage across modules
- **Modern Patterns**: Cloudflare Workers, Durable Objects, R2, KV

### 🔧 Areas for Improvement
1. **Configuration Management** - Environment variable validation
2. **Observability** - Enhanced metrics and tracing
3. **Dependency Injection** - Reduce tight coupling
4. **API Documentation** - Better OpenAPI specs and examples
5. **Performance Optimization** - Caching, compression, edge optimization
6. **Error Taxonomy** - Structured error classes
7. **Service Layer Patterns** - Repository pattern, service composition

---

## 🎯 Priority 1: Configuration Management

### Current Issue
```typescript
// Environment variables accessed directly without validation
const ai = env.AI;
const kvNamespace = env.KV;
```

### Best Practice Solution

**Create**: `lib/config-validator.ts`

```typescript
import { z } from 'zod';

// Define strict schemas for environment configuration
const envSchema = z.object({
  // Required
  ENVIRONMENT: z.enum(['development', 'staging', 'production']),
  
  // Services
  AI: z.custom<Ai>((val) => val !== undefined, 'AI binding required'),
  KV: z.custom<KVNamespace>((val) => val !== undefined).optional(),
  DB: z.custom<D1Database>((val) => val !== undefined).optional(),
  SESSIONS: z.custom<KVNamespace>((val) => val !== undefined).optional(),
  DOCUMENTS: z.custom<R2Bucket>((val) => val !== undefined).optional(),
  
  // Configuration
  ALLOWED_ORIGIN: z.string().url().optional(),
  AI_GATEWAY_ID: z.string().optional(),
  WORKERS_AI_MODEL: z.string().default('@cf/meta/llama-3-8b-instruct'),
  
  // Limits (with defaults)
  R2_SOFT_LIMIT_BYTES: z.string().transform(Number).default('10485760'), // 10MB
  R2_HARD_LIMIT_BYTES: z.string().transform(Number).default('52428800'), // 50MB
  MAX_OBJECT_SIZE_BYTES: z.string().transform(Number).default('10485760'),
  
  // Cache TTLs
  ANALYSIS_CACHE_TTL_SECONDS: z.string().transform(Number).default('3600'),
  ANALYSIS_MAX_JSON_BYTES: z.string().transform(Number).default('102400'),
  
  // Stripe (optional)
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_PRICE_PRO: z.string().startsWith('price_').optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().startsWith('price_').optional(),
  
  BASE_URL: z.string().url().optional(),
  COMMIT_SHA: z.string().optional(),
  ADMIN_API_TOKEN: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly validationErrors: z.ZodError['errors']
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validates and returns typed environment configuration
 * Throws ConfigurationError if validation fails
 */
export function validateConfig(env: unknown): ValidatedEnv {
  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors
        .map(e => `  - ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      
      throw new ConfigurationError(
        `Environment configuration validation failed:\n${errorDetails}`,
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Configuration accessor with type safety and defaults
 */
export class AppConfig {
  constructor(private env: ValidatedEnv) {}
  
  // Service bindings
  get ai(): Ai { return this.env.AI; }
  get kv(): KVNamespace | undefined { return this.env.KV; }
  get db(): D1Database | undefined { return this.env.DB; }
  get sessions(): KVNamespace | undefined { return this.env.SESSIONS; }
  get documents(): R2Bucket | undefined { return this.env.DOCUMENTS; }
  
  // Environment
  get environment(): 'development' | 'staging' | 'production' {
    return this.env.ENVIRONMENT;
  }
  
  get isDevelopment(): boolean { return this.environment === 'development'; }
  get isProduction(): boolean { return this.environment === 'production'; }
  
  // Limits
  get r2SoftLimit(): number { return this.env.R2_SOFT_LIMIT_BYTES; }
  get r2HardLimit(): number { return this.env.R2_HARD_LIMIT_BYTES; }
  get maxObjectSize(): number { return this.env.MAX_OBJECT_SIZE_BYTES; }
  
  // Cache
  get analysisCacheTTL(): number { return this.env.ANALYSIS_CACHE_TTL_SECONDS; }
  get analysisMaxBytes(): number { return this.env.ANALYSIS_MAX_JSON_BYTES; }
  
  // AI
  get aiModel(): string { return this.env.WORKERS_AI_MODEL; }
  get aiGatewayId(): string | undefined { return this.env.AI_GATEWAY_ID; }
  
  // URLs
  get baseUrl(): string | undefined { return this.env.BASE_URL; }
  get allowedOrigin(): string | undefined { return this.env.ALLOWED_ORIGIN; }
  
  // Stripe
  get stripeSecretKey(): string | undefined { return this.env.STRIPE_SECRET_KEY; }
  get stripeWebhookSecret(): string | undefined { return this.env.STRIPE_WEBHOOK_SECRET; }
  
  // Metadata
  get commitSha(): string | undefined { return this.env.COMMIT_SHA; }
}
```

**Benefits**:
- ✅ Catches configuration errors at startup
- ✅ Type-safe access to environment variables
- ✅ Default values for optional configs
- ✅ Clear documentation of required vs optional
- ✅ Prevents runtime errors from misconfiguration

---

## 🎯 Priority 2: Structured Error Handling

### Current Issue
Errors are handled generically without clear classification

### Best Practice Solution

**Create**: `lib/errors.ts`

```typescript
/**
 * Base error class with structured data
 */
export abstract class ApplicationError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  abstract readonly isOperational: boolean;
  
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
    };
  }
}

/**
 * Client errors (4xx)
 */
export class ValidationError extends ApplicationError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;
}

export class AuthenticationError extends ApplicationError {
  readonly statusCode = 401;
  readonly code = 'AUTHENTICATION_ERROR';
  readonly isOperational = true;
}

export class AuthorizationError extends ApplicationError {
  readonly statusCode = 403;
  readonly code = 'AUTHORIZATION_ERROR';
  readonly isOperational = true;
}

export class NotFoundError extends ApplicationError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;
}

export class ConflictError extends ApplicationError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
  readonly isOperational = true;
}

export class RateLimitError extends ApplicationError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly retryAfter?: number,
    context?: Record<string, unknown>
  ) {
    super(message, context);
  }
}

/**
 * Server errors (5xx)
 */
export class InternalServerError extends ApplicationError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;
}

export class ServiceUnavailableError extends ApplicationError {
  readonly statusCode = 503;
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly isOperational = true;
}

export class ExternalServiceError extends ApplicationError {
  readonly statusCode = 502;
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly serviceName: string,
    context?: Record<string, unknown>
  ) {
    super(message, { ...context, serviceName });
  }
}

/**
 * Domain-specific errors
 */
export class QuotaExceededError extends ApplicationError {
  readonly statusCode = 429;
  readonly code = 'QUOTA_EXCEEDED';
  readonly isOperational = true;
  
  constructor(
    message: string,
    public readonly quotaType: string,
    public readonly current: number,
    public readonly limit: number
  ) {
    super(message, { quotaType, current, limit });
  }
}

export class InvalidModelError extends ValidationError {
  readonly code = 'INVALID_MODEL';
  
  constructor(
    message: string,
    public readonly modelType: string,
    public readonly validationErrors: Array<{ field: string; error: string }>
  ) {
    super(message, { modelType, validationErrors });
  }
}

/**
 * Type guard for application errors
 */
export function isApplicationError(error: unknown): error is ApplicationError {
  return error instanceof ApplicationError;
}

/**
 * Enhanced error handler with structured errors
 */
export function handleApplicationError(
  error: unknown,
  env: { ENVIRONMENT: string }
): Response {
  const isDevelopment = env.ENVIRONMENT === 'development';
  
  // Handle known application errors
  if (isApplicationError(error)) {
    return new Response(
      JSON.stringify({
        error: {
          code: error.code,
          message: error.message,
          ...(isDevelopment && error.context && { context: error.context }),
          ...(isDevelopment && { stack: error.stack }),
        },
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Handle unknown errors
  console.error('Unhandled error:', error);
  
  return new Response(
    JSON.stringify({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isDevelopment && error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred',
        ...(isDevelopment && error instanceof Error && { stack: error.stack }),
      },
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
```

**Usage Example**:
```typescript
// In route handler
if (!user) {
  throw new NotFoundError('User not found', { userId });
}

if (usage > quota.limit) {
  throw new QuotaExceededError(
    'Storage quota exceeded',
    'storage',
    usage,
    quota.limit
  );
}
```

---

## 🎯 Priority 3: Enhanced Observability

### Create Structured Metrics

**Create**: `lib/metrics.ts`

```typescript
export interface MetricData {
  name: string;
  value: number;
  unit: 'milliseconds' | 'bytes' | 'count' | 'percentage';
  tags: Record<string, string>;
  timestamp: number;
}

export interface RequestMetrics {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  
  // Performance
  aiLatency?: number;
  cacheHit?: boolean;
  dbQueries?: number;
  
  // Business
  userId?: string;
  apiKeyId?: string;
  toolsUsed?: string[];
  
  // Errors
  errorCode?: string;
  errorMessage?: string;
}

export class MetricsCollector {
  constructor(private analytics?: AnalyticsEngineDataset) {}
  
  /**
   * Record request metrics
   */
  async recordRequest(metrics: RequestMetrics): Promise<void> {
    if (!this.analytics) return;
    
    try {
      await this.analytics.writeDataPoint({
        blobs: [
          metrics.requestId,
          metrics.method,
          metrics.path,
          metrics.statusCode.toString(),
        ],
        doubles: [
          metrics.duration,
          metrics.aiLatency || 0,
        ],
        indexes: [
          metrics.userId || 'anonymous',
          metrics.apiKeyId || 'none',
        ],
      });
    } catch (error) {
      console.error('Failed to record metrics:', error);
    }
  }
  
  /**
   * Record custom metric
   */
  async recordMetric(metric: MetricData): Promise<void> {
    if (!this.analytics) return;
    
    try {
      await this.analytics.writeDataPoint({
        blobs: [metric.name, metric.unit, ...Object.values(metric.tags)],
        doubles: [metric.value],
        indexes: Object.keys(metric.tags),
      });
    } catch (error) {
      console.error('Failed to record custom metric:', error);
    }
  }
}
```

### Add Request Tracing

**Enhance**: `lib/request-context.ts`

```typescript
export interface TraceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  attributes?: Record<string, string | number | boolean>;
  status?: 'ok' | 'error';
  error?: string;
}

export class RequestTracer {
  private spans: TraceSpan[] = [];
  
  constructor(
    private requestId: string,
    private parentSpanId?: string
  ) {}
  
  /**
   * Start a new span
   */
  startSpan(name: string, attributes?: Record<string, unknown>): number {
    const span: TraceSpan = {
      name,
      startTime: Date.now(),
      attributes: attributes as Record<string, string | number | boolean>,
    };
    
    this.spans.push(span);
    return this.spans.length - 1;
  }
  
  /**
   * End a span
   */
  endSpan(spanIndex: number, status: 'ok' | 'error' = 'ok', error?: string): void {
    const span = this.spans[spanIndex];
    if (!span) return;
    
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    if (error) span.error = error;
  }
  
  /**
   * Get all spans
   */
  getSpans(): TraceSpan[] {
    return this.spans;
  }
  
  /**
   * Get trace summary
   */
  getSummary() {
    const totalDuration = this.spans.reduce((sum, span) => sum + (span.duration || 0), 0);
    const errorCount = this.spans.filter(span => span.status === 'error').length;
    
    return {
      requestId: this.requestId,
      totalDuration,
      spanCount: this.spans.length,
      errorCount,
      spans: this.spans,
    };
  }
}

// Usage in routes
async function handleRequest(request: Request, env: Env) {
  const tracer = new RequestTracer(crypto.randomUUID());
  
  const dbSpan = tracer.startSpan('database.query', { table: 'users' });
  try {
    await env.DB.prepare('SELECT * FROM users').all();
    tracer.endSpan(dbSpan, 'ok');
  } catch (error) {
    tracer.endSpan(dbSpan, 'error', error.message);
  }
  
  // Log trace summary
  console.log(JSON.stringify(tracer.getSummary()));
}
```

---

## 🎯 Priority 4: Dependency Injection

### Current Issue
Services are tightly coupled with direct instantiation

### Best Practice Solution

**Create**: `lib/container.ts`

```typescript
/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private services = new Map<string, unknown>();
  private factories = new Map<string, () => unknown>();
  
  /**
   * Register a service instance
   */
  register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }
  
  /**
   * Register a service factory
   */
  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }
  
  /**
   * Get a service
   */
  get<T>(key: string): T {
    if (this.services.has(key)) {
      return this.services.get(key) as T;
    }
    
    const factory = this.factories.get(key);
    if (factory) {
      const instance = factory();
      this.services.set(key, instance);
      return instance as T;
    }
    
    throw new Error(`Service not found: ${key}`);
  }
  
  /**
   * Check if service exists
   */
  has(key: string): boolean {
    return this.services.has(key) || this.factories.has(key);
  }
}

/**
 * Create service container from environment
 */
export function createServiceContainer(env: ValidatedEnv): ServiceContainer {
  const container = new ServiceContainer();
  
  // Register core services
  container.register('env', env);
  container.register('config', new AppConfig(env));
  
  // Register factories
  container.registerFactory('llmService', () => {
    const cache = env.KV ? new IntelligentCacheImpl(env.KV) : undefined;
    const retry = new LLMRetryHandlerImpl();
    const metrics = env.KV ? new LLMMetricsCollectorImpl(env.KV) : undefined;
    return new LLMServiceImpl(env.AI, cache, retry, metrics);
  });
  
  container.registerFactory('metricsCollector', () => {
    return new MetricsCollector(env.ANALYTICS);
  });
  
  return container;
}
```

**Usage**:
```typescript
// In index.ts
const container = createServiceContainer(validateConfig(env));

// In route handlers
const llmService = container.get<LLMService>('llmService');
const metrics = container.get<MetricsCollector>('metricsCollector');
```

---

## 🎯 Priority 5: API Documentation

### Enhance OpenAPI Specification

**Create**: `docs/API_REFERENCE.md`

```markdown
# API Reference

## Authentication

All API requests require authentication using an API key:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.yourdomain.com/v1/endpoint
\`\`\`

## Rate Limiting

- **Requests**: 100 per minute
- **Storage**: 50MB per user
- **AI Queries**: 1000 per day

Rate limit headers:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Unix timestamp of reset

## Error Responses

All errors follow this structure:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "context": { /* Optional additional data */ }
  }
}
\`\`\`

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid API key |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `QUOTA_EXCEEDED` | 429 | Storage/usage quota exceeded |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

## Endpoints

### Health Check

\`GET /health\`

Returns API health status.

**Response**: 200 OK
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "v1",
  "services": {
    "database": "ok",
    "ai": "ok",
    "storage": "ok"
  }
}
\`\`\`
```

---

## 🎯 Priority 6: Performance Optimization

### Response Compression

**Create**: `lib/compression.ts`

```typescript
export function shouldCompress(contentType: string | null): boolean {
  if (!contentType) return false;
  
  const compressible = [
    'application/json',
    'application/javascript',
    'text/html',
    'text/css',
    'text/plain',
    'text/xml',
  ];
  
  return compressible.some(type => contentType.includes(type));
}

export async function compressResponse(
  response: Response,
  acceptEncoding: string | null
): Promise<Response> {
  const contentType = response.headers.get('content-type');
  
  if (!shouldCompress(contentType) || !acceptEncoding?.includes('gzip')) {
    return response;
  }
  
  const body = await response.text();
  const compressed = await gzipCompress(body);
  
  return new Response(compressed, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers),
      'Content-Encoding': 'gzip',
      'Content-Length': compressed.length.toString(),
    },
  });
}
```

### Edge Caching Strategy

**Best Practice**: Add appropriate cache headers

```typescript
export function getCacheHeaders(type: 'static' | 'dynamic' | 'private'): HeadersInit {
  switch (type) {
    case 'static':
      return {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000',
      };
    
    case 'dynamic':
      return {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, max-age=300',
      };
    
    case 'private':
      return {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'CDN-Cache-Control': 'no-store',
      };
  }
}
```

---

## 📋 Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Implement configuration validation
- [ ] Create structured error classes
- [ ] Add comprehensive logging
- [ ] Set up metrics collection
- [ ] Write tests for new utilities

### Phase 2: Architecture (Week 3-4)
- [ ] Implement dependency injection
- [ ] Refactor service initialization
- [ ] Add request tracing
- [ ] Create service interfaces
- [ ] Update all routes to use DI

### Phase 3: Documentation (Week 5)
- [ ] Enhance OpenAPI specs
- [ ] Write API reference docs
- [ ] Add code examples
- [ ] Create architecture diagrams
- [ ] Document error codes

### Phase 4: Optimization (Week 6)
- [ ] Add response compression
- [ ] Optimize caching strategy
- [ ] Implement edge caching
- [ ] Add performance monitoring
- [ ] Load testing and benchmarking

### Phase 5: Polish (Week 7-8)
- [ ] Code review and cleanup
- [ ] Performance tuning
- [ ] Security audit
- [ ] Integration testing
- [ ] Production deployment

---

## 📚 Additional Best Practices

### 1. **API Versioning Strategy**
- Keep `/v1/` prefix for all endpoints
- Use header-based versioning for minor changes
- Maintain backward compatibility for 2 major versions

### 2. **Graceful Degradation**
- Implement feature flags
- Handle service unavailability gracefully
- Provide fallback responses when AI is down

### 3. **Security Hardening**
- Implement request signing
- Add HMAC validation for webhooks
- Use Content Security Policy headers
- Regular dependency audits

### 4. **Monitoring & Alerting**
- Set up error rate alerts (>1% error rate)
- Monitor response time percentiles (p50, p95, p99)
- Track API key usage patterns
- Alert on quota breaches

### 5. **Development Workflow**
- Pre-commit hooks for linting
- Automated testing in CI/CD
- Staging environment for testing
- Blue-green deployments

---

## 🎓 Resources

- [Cloudflare Workers Best Practices](https://developers.cloudflare.com/workers/platform/best-practices/)
- [API Design Patterns](https://cloud.google.com/apis/design)
- [OpenAPI Specification](https://swagger.io/specification/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

## 🤝 Contributing

When implementing these best practices:
1. Create feature branches for each phase
2. Write tests before implementation
3. Update documentation alongside code
4. Request code reviews
5. Deploy incrementally to catch issues early







