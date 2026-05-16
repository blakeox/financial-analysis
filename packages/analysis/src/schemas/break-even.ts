import { z } from 'zod';

export const BreakEvenInputSchema = z.object({
  fixedCosts: z.number().min(0),
  variableCostPerUnit: z.number().min(0),
  pricePerUnit: z.number().positive(),
  targetProfit: z.number().min(0).default(0),
});

export type BreakEvenInput = z.infer<typeof BreakEvenInputSchema>;
