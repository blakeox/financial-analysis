import { z } from 'zod';

export const VaRInputSchema = z.object({
  portfolio: z.object({
    positions: z.array(
      z.object({
        symbol: z.string(),
        quantity: z.number().min(0),
        currentPrice: z.number().min(0),
        assetClass: z.enum(['stock', 'bond', 'commodity', 'currency', 'other']),
      })
    ),
    totalValue: z.number().min(0),
  }),
  parameters: z.object({
    confidenceLevel: z.number().min(0.9).max(0.99).default(0.95),
    timeHorizon: z.number().min(1).max(252).default(1), // days
    method: z.enum(['historical', 'parametric', 'monte-carlo']).default('historical'),
  }),
  marketData: z.object({
    historicalReturns: z.array(z.number()).optional(),
    volatilities: z.array(z.number()).optional(),
    correlations: z.array(z.array(z.number())).optional(),
  }),
  analysis: z.object({
    includeStressTesting: z.boolean().default(false),
    includeBacktesting: z.boolean().default(false),
  }),
});

export type VaRInput = z.infer<typeof VaRInputSchema>;
