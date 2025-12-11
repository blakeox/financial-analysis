import { z } from 'zod';

export const CapitalStructureInputSchema = z.object({
  companyInfo: z.object({
    marketCap: z.number().min(0),
    currentDebt: z.number().min(0),
    cashAndEquivalents: z.number().min(0),
    sharesOutstanding: z.number().min(0),
    stockPrice: z.number().min(0),
  }),
  financials: z.object({
    annualEBITDA: z.number(),
    annualEBIT: z.number(),
    netIncome: z.number(),
    taxRate: z.number().min(0).max(0.5),
    annualInterestExpense: z.number().min(0),
  }),
  marketData: z.object({
    riskFreeRate: z.number().min(0).max(0.1),
    marketRiskPremium: z.number().min(0).max(0.2).default(0.06),
    beta: z.number().min(0).max(5),
    creditRating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']).optional(),
  }),
  analysis: z.object({
    includeWACCOptimization: z.boolean().default(true),
    includeDebtCapacity: z.boolean().default(true),
    includeCreditRatingImpact: z.boolean().default(true),
    includeDividendPolicy: z.boolean().default(false),
  }),
});

export type CapitalStructureInput = z.infer<typeof CapitalStructureInputSchema>;
