import { z } from 'zod';

export const RefinancingInputSchema = z.object({
  currentMortgage: z.object({
    principalBalance: z.number().min(0),
    interestRate: z.number().min(0).max(0.2),
    remainingTerm: z.number().min(0).max(30), // years
    monthlyPayment: z.number().min(0),
  }),
  newMortgage: z.object({
    interestRate: z.number().min(0).max(0.2),
    term: z.number().min(5).max(30), // years
    refinanceType: z.enum(['rate-and-term', 'cash-out', 'cash-in']),
    cashOutAmount: z.number().min(0).default(0),
    cashInAmount: z.number().min(0).default(0),
  }),
  costs: z.object({
    closingCosts: z.number().min(0),
    points: z.number().min(0).max(5).default(0),
    appraisalFee: z.number().min(0).default(0),
    otherFees: z.number().min(0).default(0),
  }),
  goals: z.object({
    priority: z
      .enum(['lower-payment', 'lower-rate', 'cash-out', 'shorter-term', 'reduce-interest'])
      .default('lower-rate'),
    includeBreakEvenAnalysis: z.boolean().default(true),
  }),
});

export type RefinancingInput = z.infer<typeof RefinancingInputSchema>;
