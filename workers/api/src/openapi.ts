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
