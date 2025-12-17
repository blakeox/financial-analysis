import { z } from 'zod';

export const RiskAdjustedReturnsInputSchema = z.object({
  returns: z.array(z.number().finite()).min(2, 'At least two return observations are required'),
  riskFreeRate: z.number().finite().default(0),
  targetReturn: z.number().finite().default(0),
  periodsPerYear: z.number().int().positive().default(252),
});

export type RiskAdjustedReturnsInput = z.infer<typeof RiskAdjustedReturnsInputSchema>;

