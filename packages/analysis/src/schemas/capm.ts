import { z } from 'zod';

export const CAPMInputSchema = z.object({
  riskFreeRate: z.number().finite(),
  beta: z.number().finite(),
  marketRiskPremium: z.number().finite(),
});

export type CAPMInput = z.infer<typeof CAPMInputSchema>;
