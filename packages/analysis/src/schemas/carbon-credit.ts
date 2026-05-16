import { z } from 'zod';

export const CarbonCreditValuationInputSchema = z.object({
  tonnesCO2e: z.number().positive(),
  pricePerTonne: z.number().min(0),
  yearsUntilSale: z.number().min(0).default(0),
  priceGrowthRate: z.number().finite().default(0),
  discountRate: z.number().finite().default(0),
});

export type CarbonCreditValuationInput = z.infer<typeof CarbonCreditValuationInputSchema>;
