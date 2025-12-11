import { z } from 'zod';

export const CreditRiskInputSchema = z.object({
  borrowerInfo: z.object({
    companyName: z.string().optional(),
    industry: z.string().optional(),
    yearsInBusiness: z.number().min(0).max(100).optional(),
  }),
  financials: z.object({
    annualRevenue: z.number().min(0),
    ebitda: z.number(),
    netIncome: z.number(),
    totalDebt: z.number().min(0),
    totalAssets: z.number().min(0),
    cashAndEquivalents: z.number().min(0),
    currentLiabilities: z.number().min(0),
  }),
  debtInfo: z.object({
    exposureAtDefault: z.number().min(0), // EAD
    currentRating: z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'D']).optional(),
    recoveryRate: z.number().min(0).max(1).default(0.4),
  }),
  analysis: z.object({
    includePD: z.boolean().default(true),
    includeLGD: z.boolean().default(true),
    includeEL: z.boolean().default(true),
    includeStressTesting: z.boolean().default(false),
  }),
});

export type CreditRiskInput = z.infer<typeof CreditRiskInputSchema>;
