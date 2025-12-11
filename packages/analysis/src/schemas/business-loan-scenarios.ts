import { z } from 'zod';

export const BusinessLoanScenariosInputSchema = z.object({
  loanAmount: z.number().min(0),
  scenarios: z.array(
    z.object({
      name: z.string(),
      term: z.number().min(1).max(30),
      rate: z.number().min(0).max(0.2),
      description: z.string().optional(),
    })
  ),
  currentDebtPayments: z.number().min(0).default(0),
});

export type BusinessLoanScenariosInput = z.infer<typeof BusinessLoanScenariosInputSchema>;
