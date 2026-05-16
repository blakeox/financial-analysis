import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import { AutoLoanAnalysisInputSchema, z } from '@financial-analysis/analysis';

// Extend Zod to support OpenAPI metadata (.openapi) on the same Zod instance
// that created the schemas from @financial-analysis/analysis
extendZodWithOpenApi(z);
const registry = new OpenAPIRegistry();

// Schemas
const HealthSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  environment: z.string(),
  version: z.string(),
});

// Define OpenAPI-only versions using the locally-extended Zod instance to avoid cross-package extension issues
const FinancialInputOpenAPISchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  residualValue: z.number().min(0).default(0),
});

registry.register('FinancialInput', FinancialInputOpenAPISchema);

// ---- EBITDA Forecasting (OpenAPI-only schemas) ----
const MonthlyFinancialsOpenAPISchema = z
  .object({
    month: z.number().int().min(1).max(12).openapi({ example: 12 }),
    year: z.number().int().min(2020).openapi({ example: 2024 }),
    revenue: z.number().min(0).openapi({ example: 200000 }),
    costOfGoodsSold: z.number().min(0).default(0).openapi({ example: 0 }),
    operatingExpenses: z.number().min(0).openapi({ example: 50000 }),
    depreciation: z.number().min(0).default(0).openapi({ example: 1500 }),
    amortization: z.number().min(0).default(0).openapi({ example: 750 }),
    interestExpense: z.number().min(0).default(0).openapi({ example: 300 }),
    taxes: z.number().min(0).default(0).openapi({ example: 12000 }),
  })
  .openapi({ description: 'Monthly baseline financials' });

const EmployeeOpenAPISchema = z
  .object({
    id: z.string().openapi({ example: 'emp-1' }),
    name: z.string().openapi({ example: 'Senior Consultant' }),
    role: z.string().openapi({ example: 'Senior Consultant' }),
    department: z.string().openapi({ example: 'Consulting' }),
    billableHoursPerMonth: z.number().min(0).default(160).openapi({ example: 150 }),
    hourlyRate: z.number().min(0).openapi({ example: 175 }),
    salary: z.number().min(0).openapi({ example: 100000 }),
    benefits: z.number().min(0).default(0).openapi({ example: 15000 }),
    startDate: z.string().openapi({ example: '2024-01-01T00:00:00Z', format: 'date-time' }),
    isActive: z.boolean().default(true).openapi({ example: true }),
  })
  .openapi({ description: 'Employee details' });

const ExpenseTypeOpenAPISchema = z
  .object({
    id: z.string().openapi({ example: 'exp-1' }),
    name: z.string().openapi({ example: 'New Office Space' }),
    category: z.enum(['fixed', 'variable', 'semi-variable']).openapi({ example: 'fixed' }),
    amount: z.number().min(0).openapi({ example: 20000 }),
    frequency: z.enum(['monthly', 'quarterly', 'annually']).openapi({ example: 'monthly' }),
    isRecurring: z.boolean().default(true).openapi({ example: true }),
    description: z.string().optional().openapi({ example: 'Additional office rent' }),
    growthRate: z.number().min(-1).max(1).default(0).openapi({ example: 0 }),
    startMonth: z.number().int().min(1).max(60).default(1).openapi({ example: 6 }),
  })
  .openapi({ description: 'Additional expense' });

const ScenarioInputOpenAPISchema = z
  .object({
    name: z.string().openapi({ example: 'Seasonal Consulting Business' }),
    description: z.string().optional().openapi({ example: 'EBITDA forecast with seasonality' }),
    forecastPeriodMonths: z.number().int().min(1).max(60).default(12).openapi({ example: 12 }),
    currentMonthlyFinancials: z.array(MonthlyFinancialsOpenAPISchema).openapi({
      example: [
        {
          month: 12,
          year: 2024,
          revenue: 200000,
          costOfGoodsSold: 0,
          operatingExpenses: 50000,
          depreciation: 1500,
          amortization: 750,
          interestExpense: 300,
          taxes: 12000,
        },
      ],
    }),
    currentEmployees: z.array(EmployeeOpenAPISchema).openapi({ example: [] }),
    newEmployees: z
      .array(EmployeeOpenAPISchema.extend({ startMonth: z.number().int().min(1).max(60) }))
      .default([])
      .openapi({ example: [] }),
    revenueGrowthRate: z.number().min(-1).max(10).default(0).openapi({ example: 0.03 }),
    billableHoursGrowthRate: z.number().min(-1).max(10).default(0).openapi({ example: 0.01 }),
    additionalExpenses: z.array(ExpenseTypeOpenAPISchema).default([]).openapi({ example: [] }),
    operatingExpenseGrowthRate: z.number().min(-1).max(1).default(0).openapi({ example: 0.015 }),
    inflationRate: z.number().min(0).max(1).default(0.03).openapi({ example: 0.03 }),
    economicFactors: z
      .object({
        marketGrowth: z.number().min(-1).max(1).default(0).openapi({ example: 0.0 }),
        competitionFactor: z.number().min(0).max(2).default(1).openapi({ example: 1.0 }),
        seasonalityFactors: z
          .array(z.number().min(0).max(5))
          .length(12)
          .optional()
          .openapi({
            example: [0.8, 0.85, 1.1, 1.15, 1.05, 0.95, 0.75, 0.8, 1.2, 1.25, 1.1, 0.9],
          }),
      })
      .optional(),
  })
  .openapi({ description: 'EBITDA forecast scenario input' });

const MonthlyForecastOpenAPISchema = z
  .object({
    month: z.number().openapi({ example: 1 }),
    year: z.number().openapi({ example: 2025 }),
    revenue: z.number().openapi({ example: 210000 }),
    costOfGoodsSold: z.number().openapi({ example: 0 }),
    grossProfit: z.number().openapi({ example: 210000 }),
    operatingExpenses: z.number().openapi({ example: 60000 }),
    ebitda: z.number().openapi({ example: 150000 }),
    depreciation: z.number().openapi({ example: 1500 }),
    amortization: z.number().openapi({ example: 750 }),
    ebit: z.number().openapi({ example: 147750 }),
    interestExpense: z.number().openapi({ example: 300 }),
    ebt: z.number().openapi({ example: 147450 }),
    taxes: z.number().openapi({ example: 36862.5 }),
    netIncome: z.number().openapi({ example: 110587.5 }),
    billableHours: z.number().openapi({ example: 300 }),
    employeeCosts: z.number().openapi({ example: 20000 }),
    employeeCount: z.number().openapi({ example: 2 }),
    marginPercent: z.number().openapi({ example: 50 }),
    ebitdaMargin: z.number().openapi({ example: 71.4 }),
  })
  .openapi({ description: 'Per-month forecast output' });

const EbitdaForecastResponseOpenAPISchema = z
  .object({
    scenario: z.object({
      name: z.string(),
      description: z.string().optional(),
      forecastPeriodMonths: z.number(),
      economicFactors: z
        .object({
          seasonalityFactors: z.array(z.number()).length(12).optional(),
        })
        .optional(),
    }),
    forecast: z.array(MonthlyForecastOpenAPISchema),
    summary: z.object({
      totalRevenue: z.number(),
      totalEbitda: z.number(),
      averageEbitdaMargin: z.number(),
      totalEmployeeCosts: z.number(),
      totalOperatingExpenses: z.number(),
      finalEmployeeCount: z.number(),
      revenueGrowth: z.number(),
      ebitdaGrowth: z.number(),
    }),
  })
  .openapi({ description: 'EBITDA forecast result' });

registry.register('EbitdaScenarioInput', ScenarioInputOpenAPISchema);
registry.register('EbitdaForecastResponse', EbitdaForecastResponseOpenAPISchema);
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

// Auto loan analysis response schema
const AutoLoanAnalysisPaymentScheduleItemOpenAPISchema = z.object({
  paymentNumber: z.number(),
  paymentDate: z.string(),
  principalPayment: z.number(),
  interestPayment: z.number(),
  remainingBalance: z.number(),
  cumulativeInterest: z.number(),
});

const AutoLoanAnalysisResultOpenAPISchema = z.object({
  loanAnalysis: z.object({
    monthlyPayment: z.number(),
    totalInterest: z.number(),
    totalCost: z.number(),
    effectiveRate: z.number(),
    payoffDate: z.string(),
    paymentSchedule: z.array(AutoLoanAnalysisPaymentScheduleItemOpenAPISchema),
  }),
  leaseAnalysis: z
    .object({
      monthlyPayment: z.number(),
      totalPayments: z.number(),
      totalCost: z.number(),
      effectiveRate: z.number(),
      endDate: z.string(),
      buyoutCost: z.number(),
      totalCostIfPurchased: z.number(),
    })
    .optional(),
  comparison: z
    .object({
      loanVsLease: z.object({
        monthlyPaymentDifference: z.number(),
        totalCostDifference: z.number(),
        breakEvenPoint: z.number(),
        recommendation: z.enum(['loan', 'lease', 'depends']),
        reasoning: z.array(z.string()),
      }),
    })
    .optional(),
  refinancingAnalysis: z
    .object({
      scenarios: z.array(
        z.object({
          newRate: z.number(),
          newMonthlyPayment: z.number(),
          monthlySavings: z.number(),
          totalSavings: z.number(),
          breakEvenMonths: z.number(),
          recommendation: z.enum(['refinance', 'keep-current']),
        })
      ),
      bestScenario: z.object({
        rate: z.number(),
        monthlySavings: z.number(),
        totalSavings: z.number(),
      }),
    })
    .optional(),
  tcoAnalysis: z
    .object({
      ownershipYears: z.number(),
      totalCostOfOwnership: z.number(),
      costPerMile: z.number(),
      costPerMonth: z.number(),
      breakdown: z.object({
        loanPayments: z.number(),
        interest: z.number(),
        maintenance: z.number(),
        fuel: z.number(),
        insurance: z.number(),
        registration: z.number(),
        depreciation: z.number(),
        fees: z.number(),
      }),
      residualValue: z.number(),
    })
    .optional(),
  insights: z.array(z.string()),
  recommendations: z.array(
    z.object({
      category: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      description: z.string(),
      impact: z.string(),
      action: z.string(),
    })
  ),
  metadata: z.object({
    calculatedAt: z.string(),
    version: z.string(),
    methodology: z.string(),
    assumptions: z.record(z.string(), z.unknown()),
  }),
});
registry.register('AutoLoanAnalysisResult', AutoLoanAnalysisResultOpenAPISchema);

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

const AnalysisTypeEnum = z.enum([
  'lease',
  'amortization',
  'cashflow',
  'ebitda-forecast',
  'auto-loan-analysis',
]);
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
          schema: FinancialInputOpenAPISchema,
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
          // Use OpenAPI-only schema built with locally-extended Zod instance
          schema: z.object({
            principal: z.number(),
            annualRate: z.number(),
            termMonths: z.number(),
          }),
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

// Auto loan analysis endpoint
registry.registerPath({
  method: 'post',
  path: '/v1/api/analysis/auto-loan-analysis',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AutoLoanAnalysisInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Auto loan analysis result',
      content: {
        'application/json': {
          schema: AutoLoanAnalysisResultOpenAPISchema,
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

// EBITDA forecast analysis endpoint
registry.registerPath({
  method: 'post',
  path: '/v1/api/analysis/ebitda-forecast',
  request: {
    body: {
      content: {
        'application/json': {
          schema: ScenarioInputOpenAPISchema,
          example: {
            name: 'Baseline SaaS Plan',
            description: '12‑month forecast with moderate growth and seasonality',
            forecastPeriodMonths: 12,
            currentMonthlyFinancials: [
              {
                month: 1,
                year: 2025,
                revenue: 120000,
                costOfGoodsSold: 0,
                operatingExpenses: 45000,
                depreciation: 2000,
                amortization: 0,
                interestExpense: 0,
                taxes: 0,
              },
              {
                month: 2,
                year: 2025,
                revenue: 125000,
                costOfGoodsSold: 0,
                operatingExpenses: 46000,
                depreciation: 2000,
                amortization: 0,
                interestExpense: 0,
                taxes: 0,
              },
            ],
            currentEmployees: [
              {
                id: 'emp-1',
                name: 'Lead Engineer',
                role: 'Engineer',
                department: 'Engineering',
                billableHoursPerMonth: 0,
                hourlyRate: 0,
                salary: 160000,
                benefits: 25000,
                startDate: '2025-01-01T00:00:00Z',
                isActive: true,
              },
            ],
            newEmployees: [],
            revenueGrowthRate: 0.04,
            billableHoursGrowthRate: 0,
            additionalExpenses: [
              {
                id: 'exp-1',
                name: 'Headquarters Lease',
                category: 'fixed',
                amount: 18000,
                frequency: 'monthly',
                isRecurring: true,
                description: 'Office lease',
                growthRate: 0,
                startMonth: 1,
              },
              {
                id: 'exp-2',
                name: 'Cloud Infrastructure',
                category: 'semi-variable',
                amount: 9000,
                frequency: 'monthly',
                isRecurring: true,
                description: 'Core hosting costs',
                growthRate: 0.01,
                startMonth: 1,
              },
            ],
            operatingExpenseGrowthRate: 0.01,
            inflationRate: 0.03,
            economicFactors: {
              marketGrowth: 0.0,
              competitionFactor: 1.0,
              seasonalityFactors: [1, 1, 1.05, 1.07, 1.1, 1.05, 0.95, 0.9, 1.05, 1.1, 1.08, 1.02],
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: 'EBITDA forecast result',
      content: {
        'application/json': {
          schema: EbitdaForecastResponseOpenAPISchema,
          example: {
            scenario: {
              name: 'Baseline SaaS Plan',
              forecastPeriodMonths: 12,
              economicFactors: {
                seasonalityFactors: [1, 1, 1.05, 1.07, 1.1, 1.05, 0.95, 0.9, 1.05, 1.1, 1.08, 1.02],
              },
            },
            forecast: [
              {
                month: 1,
                year: 2025,
                revenue: 120000,
                costOfGoodsSold: 0,
                grossProfit: 120000,
                operatingExpenses: 45000,
                ebitda: 75000,
                depreciation: 2000,
                amortization: 0,
                ebit: 73000,
                interestExpense: 0,
                ebt: 73000,
                taxes: 0,
                netIncome: 73000,
                billableHours: 0,
                employeeCosts: 15333.33,
                employeeCount: 1,
                marginPercent: 62.5,
                ebitdaMargin: 62.5,
              },
            ],
            summary: {
              totalRevenue: 120000,
              totalEbitda: 75000,
              averageEbitdaMargin: 62.5,
              totalEmployeeCosts: 15333.33,
              totalOperatingExpenses: 45000,
              finalEmployeeCount: 1,
              revenueGrowth: 0,
              ebitdaGrowth: 0,
            },
          },
        },
      },
    },
    400: { description: 'Invalid request body' },
    415: { description: 'Unsupported Media Type' },
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

registry.registerPath({
  method: 'post',
  path: '/v1/admin/knowledge/reindex',
  request: {
    body: {
      description: 'Queue a knowledge reindex job for AI Search and fallback cache warming.',
      content: {
        'application/json': {
          schema: z.object({
            paths: z.array(z.string()).max(50).optional(),
            warmCache: z.boolean().optional(),
            delaySeconds: z.number().int().min(0).max(900).optional(),
          }),
        },
      },
    },
  },
  responses: {
    202: {
      description: 'Knowledge reindex job accepted for background processing',
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('enqueued'),
            backlogCount: z.number(),
            queuedAt: z.string(),
            source: z.literal('manual'),
            warmCache: z.boolean(),
            pathCount: z.number(),
          }),
        },
      },
    },
    400: { description: 'Invalid request body' },
    401: { description: 'Unauthorized' },
    415: { description: 'Unsupported Media Type' },
    503: { description: 'Knowledge reindex queue not configured' },
  },
});

registry.registerPath({
  method: 'get',
  path: '/v1/admin/knowledge/status',
  responses: {
    200: {
      description: 'Current status of the Cloudflare-backed knowledge pipeline',
      content: {
        'application/json': {
          schema: z.object({
            queue: z.object({
              configured: z.boolean(),
              backlogCount: z.number().nullable(),
              backlogBytes: z.number().nullable(),
              oldestMessageTimestamp: z.string().nullable(),
              error: z.string().optional(),
            }),
            aiSearch: z.object({
              configured: z.boolean(),
              instanceName: z.string().nullable(),
              available: z.boolean(),
              info: z.unknown().nullable(),
              stats: z.unknown().nullable(),
              recentJobs: z.array(z.unknown()),
              error: z.string().optional(),
            }),
            browserRendering: z.object({
              configured: z.boolean(),
              enabled: z.boolean(),
              pathPrefixes: z.array(z.string()),
            }),
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
