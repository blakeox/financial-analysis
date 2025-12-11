import { z } from 'zod';

export const PortfolioOptimizationInputSchema = z.object({
  portfolio: z.object({
    currentHoldings: z.array(
      z.object({
        symbol: z.string(),
        shares: z.number().min(0),
        currentPrice: z.number().min(0),
        assetClass: z.enum(['stock', 'bond', 'real-estate', 'commodity', 'cash', 'other']),
      })
    ),
    totalValue: z.number().min(0),
  }),
  constraints: z.object({
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
    minAllocation: z.number().min(0).max(1).default(0),
    maxAllocation: z.number().min(0).max(1).default(1),
    targetReturn: z.number().min(0).max(0.5).optional(),
    maxRisk: z.number().min(0).max(1).optional(),
  }),
  marketData: z.object({
    expectedReturns: z.array(z.number()).optional(),
    volatilities: z.array(z.number()).optional(),
    correlationMatrix: z.array(z.array(z.number())).optional(),
  }),
  analysis: z.object({
    includeEfficientFrontier: z.boolean().default(true),
    includeRebalancing: z.boolean().default(false),
  }),
});

export type PortfolioOptimizationInput = z.infer<typeof PortfolioOptimizationInputSchema>;
