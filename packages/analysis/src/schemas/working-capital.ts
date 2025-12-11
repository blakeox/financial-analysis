import { z } from 'zod';

export const WorkingCapitalInputSchema = z.object({
  companyInfo: z.object({
    industry: z.string().optional(),
    annualRevenue: z.number().min(0),
  }),
  currentAssets: z.object({
    cash: z.number().min(0),
    accountsReceivable: z.number().min(0),
    inventory: z.number().min(0),
    otherCurrentAssets: z.number().min(0).default(0),
  }),
  currentLiabilities: z.object({
    accountsPayable: z.number().min(0),
    shortTermDebt: z.number().min(0),
    accruedExpenses: z.number().min(0).default(0),
    otherCurrentLiabilities: z.number().min(0).default(0),
  }),
  operatingMetrics: z.object({
    daysSalesOutstanding: z.number().min(0).max(365).optional(),
    daysPayableOutstanding: z.number().min(0).max(365).optional(),
    daysInventoryOutstanding: z.number().min(0).max(365).optional(),
    inventoryTurnover: z.number().min(0).optional(),
  }),
  analysis: z.object({
    includeCashConversionCycle: z.boolean().default(true),
    includeOptimization: z.boolean().default(true),
    includeLiquidityAnalysis: z.boolean().default(true),
  }),
});

export type WorkingCapitalInput = z.infer<typeof WorkingCapitalInputSchema>;
