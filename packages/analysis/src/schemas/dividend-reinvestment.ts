import { z } from 'zod';

export const DividendReinvestmentInputSchema = z.object({
  initialInvestment: z.number().min(0),
  sharePrice: z.number().positive(),
  years: z.number().positive(),
  annualDividendYield: z.number().min(0).finite(),
  dividendFrequency: z.enum(['monthly', 'quarterly', 'annual']).default('quarterly'),
  sharePriceGrowthRate: z.number().finite().default(0),
  dividendGrowthRate: z.number().finite().default(0),
  annualContribution: z.number().min(0).default(0),
});

export type DividendReinvestmentInput = z.infer<typeof DividendReinvestmentInputSchema>;
