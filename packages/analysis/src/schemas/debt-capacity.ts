import { z } from 'zod';

export const DebtCapacityInputSchema = z.object({
  financials: z.object({
    annualEBITDA: z.number(),
    monthlyDebtPayments: z.number().min(0),
    expectedEBITDAIncrease: z.number().default(0),
  }),
  loanPreferences: z.object({
    preferredTerm: z.number().min(1).max(30),
    preferredRate: z.number().min(0).max(0.2).optional(),
    loanType: z.enum([
      'term-loan',
      'line-of-credit',
      'sba',
      'equipment-financing',
      'commercial-mortgage',
    ]),
  }),
  requestedAmount: z.number().min(0).optional(),
});

export type DebtCapacityInput = z.infer<typeof DebtCapacityInputSchema>;
