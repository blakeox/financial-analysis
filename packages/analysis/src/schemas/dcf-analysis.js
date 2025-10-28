import { z } from 'zod';

export const DCFAnalysisInputSchema = z.object({
  companyInfo: z.object({
    name: z.string(),
    ticker: z.string().optional(),
    industry: z.string(),
    businessModel: z.string(),
  }),
  financialData: z.object({
    revenue: z.array(z.number()),
    ebitda: z.array(z.number()),
    capex: z.array(z.number()),
    workingCapital: z.array(z.number()),
    debt: z.number().min(0),
    cash: z.number().min(0),
    sharesOutstanding: z.number().min(0),
  }),
  assumptions: z.object({
    revenueGrowthRate: z.number().min(-1).max(1),
    ebitdaMargin: z.number().min(0).max(1),
    terminalGrowthRate: z.number().min(0).max(0.1),
    wacc: z.number().min(0).max(0.5),
    projectionYears: z.number().min(3).max(10),
  }),
  goals: z.object({
    analysisType: z.enum(['base-case', 'sensitivity', 'scenario', 'monte-carlo']),
    includeSensitivity: z.boolean(),
    includeScenario: z.boolean(),
  }),
});
