import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { AmortizationInputSchema, FinancialInputSchema } from '@financial-analysis/analysis';
import { z } from 'zod';

const registry = new OpenAPIRegistry();

// Extend Zod to support OpenAPI metadata (.openapi)
extendZodWithOpenApi(z);

// Schemas
const HealthSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  environment: z.string(),
  version: z.string(),
});

registry.register('FinancialInput', FinancialInputSchema);
registry.register('Health', HealthSchema);

const VersionSchema = z.object({
  service: z.string(),
  version: z.string(),
  environment: z.string(),
  commit: z.string(),
  timestamp: z.string(),
});
registry.register('Version', VersionSchema);

// ---- Chat schemas ----
const ChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string(),
});
const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().optional(),
});
const ChatResponseSchema = z.object({
  role: z.literal('assistant'),
  content: z.string(),
  model: z.string().optional(),
});
registry.register('ChatRequest', ChatRequestSchema);
registry.register('ChatResponse', ChatResponseSchema);

// ---- Storage schemas ----
const StorageStatusSchema = z.object({
  bucket: z.enum(['configured', 'absent']),
  approxBytes: z.number(),
  softLimit: z.number(),
  hardLimit: z.number(),
  locked: z.boolean(),
});
registry.register('StorageStatus', StorageStatusSchema);

const StorageUsageSchema = z.object({
  usedBytes: z.number(),
  softLimit: z.number(),
  hardLimit: z.number(),
  maxObjectSize: z.number(),
  locked: z.boolean(),
  timestamp: z.string(),
});
registry.register('StorageUsage', StorageUsageSchema);

const StorageUploadResponseSchema = z.object({
  key: z.string(),
  etag: z.string().nullable(),
  size: z.number(),
});
registry.register('StorageUploadResponse', StorageUploadResponseSchema);

const StorageDeleteResponseSchema = z.object({
  key: z.string(),
  deleted: z.boolean(),
});
registry.register('StorageDeleteResponse', StorageDeleteResponseSchema);

const ErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string(),
  }),
});
registry.register('ErrorResponse', ErrorResponseSchema);

// Lease analysis response schema
const LeaseScheduleItem = z.object({
  month: z.number(),
  payment: z.number(),
  principal: z.number(),
  interest: z.number(),
  balance: z.number(),
});

const LeaseAnalysisResultSchema = z.object({
  monthlyPayment: z.number(),
  totalPayments: z.number(),
  totalInterest: z.number(),
  schedule: z.array(LeaseScheduleItem),
});

registry.register('LeaseAnalysisResult', LeaseAnalysisResultSchema);

// Amortization analysis response schema (same shape as lease schedule)
const AmortizationScheduleItem = LeaseScheduleItem;
const AmortizationAnalysisResultSchema = z.object({
  monthlyPayment: z.number(),
  totalPayments: z.number(),
  totalInterest: z.number(),
  schedule: z.array(AmortizationScheduleItem),
});
registry.register('AmortizationAnalysisResult', AmortizationAnalysisResultSchema);

// Paths
registry.registerPath({
  method: 'get',
  path: '/health',
  responses: {
    200: {
      description: 'API health status',
      content: {
        'application/json': {
          schema: HealthSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/ping',
  responses: {
    200: {
      description: 'Lightweight uptime check',
      content: {
        'text/plain': {
          schema: z.string(),
        },
      },
    },
  },
});

// Chat endpoint (Workers AI, optional)
registry.registerPath({
  method: 'post',
  path: '/v1/chat',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ChatRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description:
        'Assistant reply (uses Workers AI when configured, otherwise a deterministic response)',
      content: {
        'application/json': {
          schema: ChatResponseSchema,
        },
      },
    },
    400: { description: 'Bad request' },
    415: { description: 'Unsupported Media Type' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/version',
  responses: {
    200: {
      description: 'Service version and environment metadata',
      content: {
        'application/json': {
          schema: VersionSchema,
        },
      },
    },
  },
});

const AnalysisTypeEnum = z.enum(['lease', 'amortization', 'cashflow']);
registry.registerPath({
  method: 'get',
  path: '/v1/api/analysis',
  request: {
    query: z.object({
      type: AnalysisTypeEnum.optional(),
    }),
  },
  responses: {
    200: {
      description: 'Analysis API base route',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            version: z.string(),
            environment: z.string(),
            requestedType: AnalysisTypeEnum.optional(),
          }),
        },
      },
    },
  },
});

// Lease analysis endpoint
registry.registerPath({
  method: 'post',
  path: '/v1/api/analysis/lease',
  request: {
    body: {
      content: {
        'application/json': {
          schema: FinancialInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Lease analysis result',
      content: {
        'application/json': {
          schema: LeaseAnalysisResultSchema,
        },
      },
    },
    400: {
      description: 'Invalid request body',
    },
    415: {
      description: 'Unsupported Media Type',
    },
  },
});

// Amortization analysis endpoint
registry.registerPath({
  method: 'post',
  path: '/v1/api/analysis/amortization',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AmortizationInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Amortization analysis result',
      content: {
        'application/json': {
          schema: AmortizationAnalysisResultSchema,
        },
      },
    },
    400: {
      description: 'Invalid request body',
    },
    415: {
      description: 'Unsupported Media Type',
    },
  },
});

// ---- Storage endpoints ----
// Status: summarizes quotas and lock state
registry.registerPath({
  method: 'get',
  path: '/v1/storage/status',
  responses: {
    200: {
      description: 'Storage quota status for the configured R2 bucket',
      content: {
        'application/json': {
          schema: StorageStatusSchema,
        },
      },
    },
  },
});

// Usage: normalized usage response with thresholds and lock
registry.registerPath({
  method: 'get',
  path: '/v1/storage/usage',
  responses: {
    200: {
      description: 'Current approximate usage and thresholds',
      content: {
        'application/json': {
          schema: StorageUsageSchema,
        },
      },
    },
  },
});

// Admin-triggered reconcile (requires Authorization: Bearer <ADMIN_API_TOKEN>)
registry.registerPath({
  method: 'post',
  path: '/v1/storage/reconcile',
  responses: {
    200: {
      description: 'Reconciled usage and lock state',
      content: {
        'application/json': {
          schema: z.object({
            usedBytes: z.number(),
            locked: z.boolean(),
            scanned: z.number(),
            timestamp: z.string(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized' },
  },
});

// Upload object: body is binary; requires Content-Length or X-Content-Length header (documented)
registry.registerPath({
  method: 'put',
  path: '/v1/storage/object/{key}',
  request: {
    params: z.object({ key: z.string().openapi({ param: { name: 'key', in: 'path' } }) }),
    body: {
      description:
        'Binary object data. You must provide Content-Length (or X-Content-Length) header to indicate size. Max object size and quota limits enforced.',
      content: {
        'application/octet-stream': {
          schema: z.string().openapi({ format: 'binary' }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Object stored successfully',
      content: {
        'application/json': {
          schema: StorageUploadResponseSchema,
        },
      },
    },
    400: { description: 'Invalid key or Content-Length' },
    403: {
      description: 'Quota locked or soft limit reached',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
    411: { description: 'Content-Length required' },
    413: { description: 'Object too large' },
    415: { description: 'Unsupported Media Type' },
    500: {
      description: 'Storage not configured',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

// Delete object
registry.registerPath({
  method: 'delete',
  path: '/v1/storage/object/{key}',
  request: {
    params: z.object({ key: z.string().openapi({ param: { name: 'key', in: 'path' } }) }),
  },
  responses: {
    200: {
      description: 'Object deleted',
      content: {
        'application/json': {
          schema: StorageDeleteResponseSchema,
        },
      },
    },
    400: { description: 'Invalid key' },
    500: {
      description: 'Storage not configured',
      content: { 'application/json': { schema: ErrorResponseSchema } },
    },
  },
});

export function getOpenApiDocument(baseUrl?: string) {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Financial Analysis API',
      version: '1.0.0',
      description: 'Cloudflare Workers API for financial analysis with MCP integration',
    },
    servers: baseUrl ? [{ url: baseUrl }] : [],
    tags: [
      { name: 'health', description: 'Health and monitoring' },
      { name: 'analysis', description: 'Financial analysis endpoints' },
      { name: 'storage', description: 'R2 storage guardrails and operations' },
    ],
  });
}
