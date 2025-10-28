import { z } from 'zod';

export const CCAnalysisInputSchema = z.object({
  targetCompany: z.object({
    name: z.string(),
    ticker: z.string().optional(),
    industry: z.string(),
    marketCap: z.number().min(0),
    enterpriseValue: z.number().min(0),
    revenue: z.number().min(0),
    ebitda: z.number().min(0),
    netIncome: z.number(),
  }),
  peerCompanies: z.array(
    z.object({
      name: z.string(),
      ticker: z.string(),
      marketCap: z.number().min(0),
      enterpriseValue: z.number().min(0),
      revenue: z.number().min(0),
      ebitda: z.number().min(0),
      netIncome: z.number(),
      tradingPrice: z.number().min(0),
    })
  ),
  analysisSettings: z.object({
    multiplesToAnalyze: z.array(z.enum(['ev-revenue', 'ev-ebitda', 'pe', 'pb', 'ps'])),
    outlierThreshold: z.number().min(0).max(1),
    includeOutliers: z.boolean(),
  }),
  goals: z.object({
    analysisType: z.enum(['trading-multiples', 'premium-discount', 'outlier-detection']),
    includeValuationRange: z.boolean(),
  }),
});
