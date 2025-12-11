import { z } from 'zod';

export const ProjectFinanceInputSchema = z.object({
  projectInfo: z.object({
    name: z.string(),
    type: z.enum([
      'infrastructure',
      'real-estate',
      'energy',
      'manufacturing',
      'technology',
      'other',
    ]),
    duration: z.number().min(1).max(50), // years
  }),
  cashFlows: z.object({
    initialInvestment: z.number().min(0),
    annualCashFlows: z.array(
      z.object({
        year: z.number(),
        revenue: z.number().min(0),
        operatingExpenses: z.number().min(0),
        capitalExpenditures: z.number().min(0).default(0),
        workingCapital: z.number().default(0),
      })
    ),
  }),
  financing: z.object({
    equityPercentage: z.number().min(0).max(100).default(30),
    debtPercentage: z.number().min(0).max(100).default(70),
    costOfEquity: z.number().min(0).max(0.5),
    costOfDebt: z.number().min(0).max(0.5),
    taxRate: z.number().min(0).max(0.5),
  }),
  analysis: z.object({
    includeNPV: z.boolean().default(true),
    includeIRR: z.boolean().default(true),
    includePayback: z.boolean().default(true),
    includeSensitivity: z.boolean().default(true),
    discountRate: z.number().min(0).max(0.5).optional(),
  }),
});

export type ProjectFinanceInput = z.infer<typeof ProjectFinanceInputSchema>;
