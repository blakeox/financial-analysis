import { z } from 'zod';

export const P2PLendingInputSchema = z.object({
  principal: z.number().positive(),
  annualInterestRate: z.number().min(0).finite(),
  termYears: z.number().positive(),
  feeRate: z.number().min(0).finite().default(0),
  defaultProbability: z.number().min(0).max(1).default(0),
  recoveryRate: z.number().min(0).max(1).default(0),
});

export type P2PLendingInput = z.infer<typeof P2PLendingInputSchema>;

