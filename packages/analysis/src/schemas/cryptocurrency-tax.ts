import { z } from 'zod';

export const CryptocurrencyTaxInputSchema = z.object({
  personalInfo: z.object({
    country: z.string().default('US'),
    taxYear: z.number().min(2020).max(2100).default(2024),
    filingStatus: z
      .enum(['single', 'married-joint', 'married-separate', 'head-of-household'])
      .default('single'),
  }),
  transactions: z.array(
    z.object({
      transactionId: z.string().optional(),
      date: z.string(), // ISO date
      transactionType: z.enum([
        'buy',
        'sell',
        'trade',
        'gift',
        'mining',
        'staking',
        'defi-yield',
        'airdrop',
        'fork',
        'transfer',
      ]),
      asset: z.string(), // e.g., 'BTC', 'ETH'
      quantity: z.number().min(0),
      pricePerUnit: z.number().min(0),
      totalValue: z.number().min(0),
      fees: z.number().min(0).default(0),
      costBasis: z.number().min(0).optional(),
      proceeds: z.number().min(0).optional(),
      counterpartyAsset: z.string().optional(), // For trades
      counterpartyQuantity: z.number().min(0).optional(),
      counterpartyValue: z.number().min(0).optional(),
    })
  ),
  costBasisMethod: z
    .enum(['fifo', 'lifo', 'highest-cost', 'lowest-cost', 'specific-identification'])
    .default('fifo'),
  taxInfo: z.object({
    federalTaxRate: z.object({
      shortTerm: z.number().min(0).max(0.5), // Ordinary income
      longTerm: z.number().min(0).max(0.3), // Capital gains
    }),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    incomeBracket: z.number().min(0).max(0.5),
  }),
  incomeTransactions: z.object({
    miningIncome: z.number().min(0).default(0),
    stakingRewards: z.number().min(0).default(0),
    defiYield: z.number().min(0).default(0),
    airdrops: z.number().min(0).default(0),
    forks: z.number().min(0).default(0),
  }),
  analysis: z.object({
    includeRealizedGains: z.boolean().default(true),
    includeUnrealizedGains: z.boolean().default(true),
    includeTaxLossHarvesting: z.boolean().default(true),
    includeWashSaleAnalysis: z.boolean().default(true),
    includeMethodComparison: z.boolean().default(false),
  }),
});

export type CryptocurrencyTaxInput = z.infer<typeof CryptocurrencyTaxInputSchema>;



