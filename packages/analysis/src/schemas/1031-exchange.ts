import { z } from 'zod';

export const OneZeroThreeOneExchangeInputSchema = z.object({
  relinquishedProperty: z.object({
    description: z.string().optional(),
    purchaseDate: z.string(), // ISO date
    purchasePrice: z.number().min(0),
    currentValue: z.number().min(0),
    adjustedBasis: z.number().min(0),
    accumulatedDepreciation: z.number().min(0).default(0),
    mortgageBalance: z.number().min(0).default(0),
    sellingPrice: z.number().min(0),
    sellingExpenses: z.number().min(0).default(0),
    netProceeds: z.number().min(0),
  }),
  replacementProperty: z.object({
    description: z.string().optional(),
    purchasePrice: z.number().min(0),
    purchaseExpenses: z.number().min(0).default(0),
    expectedValue: z.number().min(0),
    mortgageAmount: z.number().min(0).default(0),
    downPayment: z.number().min(0),
  }),
  exchangeTimeline: z.object({
    saleDate: z.string(), // ISO date
    identificationDeadline: z.string(), // ISO date (45 days)
    closingDeadline: z.string(), // ISO date (180 days)
    qualifiedIntermediary: z.boolean().default(true),
    qifees: z.number().min(0).default(0),
  }),
  taxInfo: z.object({
    federalTaxRate: z.object({
      ordinary: z.number().min(0).max(0.5).default(0.37),
      capitalGains: z.number().min(0).max(0.3).default(0.2),
      depreciationRecapture: z.number().min(0).max(0.5).default(0.25),
    }),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    netInvestmentIncomeTax: z.boolean().default(false),
    niiTaxRate: z.number().min(0).max(0.05).default(0.038),
  }),
  boot: z.object({
    cashReceived: z.number().min(0).default(0),
    debtRelief: z.number().min(0).default(0),
    nonLikeKindProperty: z.number().min(0).default(0),
    totalBoot: z.number().min(0).default(0),
  }),
  analysis: z.object({
    includeTaxDeferral: z.boolean().default(true),
    includeDepreciationRecapture: z.boolean().default(true),
    includeBootAnalysis: z.boolean().default(true),
    includeComparison: z.boolean().default(true), // vs selling without exchange
    includeMultiPropertyExchange: z.boolean().default(false),
  }),
});

export type OneZeroThreeOneExchangeInput = z.infer<typeof OneZeroThreeOneExchangeInputSchema>;


