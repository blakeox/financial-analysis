import { z } from 'zod';

export const TaxLossHarvestingInputSchema = z.object({
  portfolio: z.object({
    holdings: z.array(
      z.object({
        symbol: z.string(),
        shares: z.number().min(0),
        costBasis: z.number().min(0),
        currentPrice: z.number().min(0),
        purchaseDate: z.string(), // ISO date
        holdingPeriod: z.enum(['short-term', 'long-term']),
      })
    ),
    totalValue: z.number().min(0),
  }),
  taxInfo: z.object({
    federalTaxRate: z.object({
      shortTerm: z.number().min(0).max(0.5), // Ordinary income rate
      longTerm: z.number().min(0).max(0.3), // Capital gains rate
    }),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    incomeBracket: z.number().min(0).max(0.5),
  }),
  realizedGains: z.object({
    shortTermGains: z.number().min(0).default(0),
    longTermGains: z.number().min(0).default(0),
    ordinaryIncome: z.number().min(0).default(0),
  }),
  harvestingStrategy: z.object({
    maxHarvestAmount: z.number().min(0).default(3000), // Annual limit
    includeWashSaleRules: z.boolean().default(true),
    washSaleWindow: z.number().min(0).default(30), // days
    replacementSecuritySimilarity: z.enum(['exact', 'similar', 'different']).default('similar'),
  }),
  analysis: z.object({
    includeTaxSavingsProjection: z.boolean().default(true),
    includeCarryForwardAnalysis: z.boolean().default(true),
    projectionYears: z.number().min(1).max(10).default(5),
  }),
});

export type TaxLossHarvestingInput = z.infer<typeof TaxLossHarvestingInputSchema>;
