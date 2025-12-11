import { z } from 'zod';

export const LBOInputSchema = z.object({
  targetCompany: z.object({
    ebitda: z.number().min(0),
    revenue: z.number().min(0),
    debt: z.number().min(0),
    equity: z.number().min(0),
  }),
  transaction: z.object({
    purchasePrice: z.number().min(0),
    equityContribution: z.number().min(0),
    debtAmount: z.number().min(0),
    transactionFees: z.number().min(0).default(0),
  }),
  financing: z.object({
    seniorDebt: z.object({
      amount: z.number().min(0),
      interestRate: z.number().min(0).max(0.2),
      term: z.number().min(1).max(10),
    }),
    mezzanineDebt: z.object({
      amount: z.number().min(0).default(0),
      interestRate: z.number().min(0).max(0.2).default(0.12),
      term: z.number().min(1).max(10).default(7),
    }),
  }),
  projections: z.object({
    ebitdaGrowth: z.number().min(-0.2).max(0.5).default(0.05),
    revenueGrowth: z.number().min(-0.2).max(0.5).default(0.05),
    exitMultiple: z.number().min(3).max(20).default(8),
    holdingPeriod: z.number().min(3).max(10).default(5),
  }),
  analysis: z.object({
    includeIRR: z.boolean().default(true),
    includeMOIC: z.boolean().default(true),
    includeDebtPaydown: z.boolean().default(true),
    includeExitScenarios: z.boolean().default(true),
  }),
});

export type LBOInput = z.infer<typeof LBOInputSchema>;
