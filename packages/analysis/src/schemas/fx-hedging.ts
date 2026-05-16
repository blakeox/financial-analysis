import { z } from 'zod';

export const FXHedgingInputSchema = z.object({
  spotRate: z.number().positive(),
  domesticRate: z.number().finite(),
  foreignRate: z.number().finite(),
  tenorYears: z.number().positive(),
  expectedSpotRateAtMaturity: z.number().positive().optional(),
  foreignAssetReturn: z.number().finite().optional(),
});

export type FXHedgingInput = z.infer<typeof FXHedgingInputSchema>;
