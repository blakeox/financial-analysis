import { z } from 'zod';

export const DSCRInputSchema = z.object({
  ebitda: z.number(),
  annualDebtService: z.number().min(0),
  existingDebtService: z.number().min(0).default(0),
  newLoanPayment: z.number().min(0).optional(),
});

export type DSCRInput = z.infer<typeof DSCRInputSchema>;
