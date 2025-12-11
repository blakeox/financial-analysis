import { z } from 'zod';

export const NetWorthInputSchema = z.object({
  assets: z.object({
    cash: z.number().min(0),
    investments: z.number().min(0),
    realEstate: z.number().min(0),
    retirementAccounts: z.number().min(0),
    businessValue: z.number().min(0).default(0),
    otherAssets: z.number().min(0).default(0),
  }),
  liabilities: z.object({
    mortgages: z.number().min(0),
    creditCardDebt: z.number().min(0),
    studentLoans: z.number().min(0),
    autoLoans: z.number().min(0),
    otherDebt: z.number().min(0).default(0),
  }),
  projections: z.object({
    assetGrowthRate: z.number().min(0).max(0.2).default(0.07),
    debtPaydownRate: z.number().min(0).max(0.2).default(0.05),
    yearsToProject: z.number().min(1).max(50).default(10),
  }),
  goals: z.object({
    targetNetWorth: z.number().min(0).optional(),
    targetDate: z.string().optional(),
    includeMilestones: z.boolean().default(true),
  }),
});

export type NetWorthInput = z.infer<typeof NetWorthInputSchema>;
