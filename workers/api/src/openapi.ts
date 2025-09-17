import { z } from 'zod';
import { FinancialInputSchema } from '@financial-analysis/analysis';
import { OpenAPIRegistry, OpenApiGeneratorV3, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

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
    ],
  });
}
