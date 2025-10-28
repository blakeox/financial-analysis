import { z } from 'zod';

export const InvestmentPortfolioInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(20),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
  }),
  currentPortfolio: z.object({
    totalValue: z.number().min(0),
    holdings: z.array(
      z.object({
        symbol: z.string(),
        name: z.string(),
        shares: z.number().min(0),
        currentPrice: z.number().min(0),
        sector: z.string(),
        assetClass: z.enum(['stock', 'bond', 'etf', 'mutual-fund', 'cash', 'alternative']),
      })
    ),
    cashReserve: z.number().min(0),
  }),
  goals: z.object({
    targetAllocation: z.object({
      stocks: z.number().min(0).max(1),
      bonds: z.number().min(0).max(1),
      cash: z.number().min(0).max(1),
      alternatives: z.number().min(0).max(1),
    }),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    timeHorizon: z.number().min(1).max(50),
    rebalancingFrequency: z.enum(['monthly', 'quarterly', 'annually', 'never']),
  }),
});
