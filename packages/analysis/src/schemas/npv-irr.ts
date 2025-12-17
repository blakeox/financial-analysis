import { z } from 'zod';

export const NPVIRRInputSchema = z.object({
  cashFlows: z.array(z.number().finite()).min(2, 'At least two cash flow periods are required'),
  discountRate: z.number().finite(),
  sensitivityDiscountRates: z.array(z.number().finite()).min(2).optional(),
});

export type NPVIRRInput = z.infer<typeof NPVIRRInputSchema>;

