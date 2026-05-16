import { z } from 'zod';

// Cash flow type enumeration
export const CashFlowTypeSchema = z.enum([
  'operating', // Operating activities
  'investing', // Investing activities
  'financing', // Financing activities
]);

// Cash flow category (more specific)
export const CashFlowCategorySchema = z.enum([
  // Operating
  'revenue',
  'cost-of-goods-sold',
  'operating-expenses',
  'taxes',
  'working-capital-change',

  // Investing
  'capital-expenditure',
  'asset-sale',
  'acquisition',
  'investment-purchase',
  'investment-sale',

  // Financing
  'debt-issuance',
  'debt-repayment',
  'equity-issuance',
  'dividend-payment',
  'share-buyback',
  'interest-payment',
]);

// Cash flow frequency
export const CashFlowFrequencySchema = z.enum(['monthly', 'quarterly', 'annual', 'one-time']);

// Analysis method
export const AnalysisMethodSchema = z.enum([
  'direct', // Direct method - actual cash receipts and payments
  'indirect', // Indirect method - starts with net income
]);

// Individual cash flow item
export const CashFlowItemSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  amount: z.number(), // Positive for inflows, negative for outflows
  type: CashFlowTypeSchema,
  category: CashFlowCategorySchema,
  date: z.string().optional(), // ISO date (for one-time items)
  frequency: CashFlowFrequencySchema.default('monthly'),
  startMonth: z.number().int().min(1).max(12).default(1), // For recurring items
  endMonth: z.number().int().min(1).max(120).optional(), // Optional end month
  growthRate: z.number().default(0), // Annual growth rate (0-1)
  isRecurring: z.boolean().default(true),
  notes: z.string().optional(),
});

// Working capital components
export const WorkingCapitalSchema = z.object({
  accountsReceivable: z.number().min(0).default(0),
  inventory: z.number().min(0).default(0),
  accountsPayable: z.number().min(0).default(0),
  daysReceivable: z.number().int().positive().default(45),
  daysInventory: z.number().int().positive().default(60),
  daysPayable: z.number().int().positive().default(30),
});

// Depreciation and amortization
export const DepreciationSchema = z.object({
  method: z
    .enum(['straight-line', 'declining-balance', 'units-of-production'])
    .default('straight-line'),
  assetCost: z.number().positive(),
  salvageValue: z.number().min(0).default(0),
  usefulLife: z.number().int().positive(), // In years
  placedInServiceDate: z.string().optional(), // ISO date
});

// Debt service
export const DebtServiceSchema = z.object({
  principal: z.number().positive(),
  interestRate: z.number().min(0).max(1),
  termMonths: z.number().int().positive(),
  startDate: z.string(), // ISO date
  paymentFrequency: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
});

// Scenario definition
export const ScenarioSchema = z.object({
  name: z.string(),
  revenueMultiplier: z.number().positive().default(1),
  expenseMultiplier: z.number().positive().default(1),
  description: z.string().optional(),
});

// Cash flow analysis input schema
export const CashFlowAnalysisInputSchema = z
  .object({
    // Basic information
    companyName: z.string().optional(),
    analysisStartDate: z.string(), // ISO date
    analysisPeriodMonths: z.number().int().positive().default(12),

    // Cash flow items
    cashFlowItems: z.array(CashFlowItemSchema).min(1),

    // Opening cash balance
    openingCashBalance: z.number().default(0),

    // Minimum cash balance requirement
    minimumCashBalance: z.number().min(0).default(0),

    // Working capital
    workingCapital: WorkingCapitalSchema.optional(),

    // Depreciation schedules
    depreciationSchedules: z.array(DepreciationSchema).default([]),

    // Debt service
    debtObligations: z.array(DebtServiceSchema).default([]),

    // Analysis method
    method: AnalysisMethodSchema.default('direct'),

    // Starting net income (for indirect method)
    netIncome: z.number().optional(),

    // Tax rate
    taxRate: z.number().min(0).max(1).default(0),

    // Discount rate for NPV
    discountRate: z.number().min(0).max(1).default(0.1),

    // Scenarios for sensitivity analysis
    scenarios: z.array(ScenarioSchema).default([]),

    // Analysis options
    includeSeasonality: z.boolean().default(false),
    seasonalityFactors: z.array(z.number()).length(12).optional(), // Monthly multipliers

    // Forecast parameters
    forecastGrowthRate: z.number().default(0), // Overall growth rate
    inflationRate: z.number().default(0),
  })
  .refine(
    (data) => {
      // Indirect method requires net income
      if (data.method === 'indirect') {
        return data.netIncome !== undefined;
      }
      return true;
    },
    {
      message: 'Indirect method requires netIncome',
      path: ['netIncome'],
    }
  )
  .refine(
    (data) => {
      // If seasonality is enabled, factors must be provided
      if (data.includeSeasonality) {
        return data.seasonalityFactors !== undefined;
      }
      return true;
    },
    {
      message: 'Seasonality requires seasonalityFactors (12 monthly multipliers)',
      path: ['seasonalityFactors'],
    }
  );

export type CashFlowAnalysisInput = z.infer<typeof CashFlowAnalysisInputSchema>;
export type CashFlowItem = z.infer<typeof CashFlowItemSchema>;
export type CashFlowType = z.infer<typeof CashFlowTypeSchema>;
export type CashFlowCategory = z.infer<typeof CashFlowCategorySchema>;
