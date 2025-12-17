import { z } from 'zod';

export const MonteCarloInvestmentInputSchema = z.object({
  initialValue: z.number().positive(),
  expectedReturn: z.number().finite(),
  volatility: z.number().min(0).finite(),
  years: z.number().positive(),
  stepsPerYear: z.number().int().positive().default(252),
  simulations: z.number().int().positive().max(200000).default(10000),
  seed: z.number().int().default(42),
  percentiles: z.array(z.number().min(0).max(1)).default([0.05, 0.5, 0.95]),
});

export type MonteCarloInvestmentInput = z.infer<typeof MonteCarloInvestmentInputSchema>;

