import { z } from 'zod';

export const AccountsReceivableAgingInputSchema = z.object({
  receivables: z.object({
    totalReceivables: z.number().min(0),
    invoices: z.array(
      z.object({
        invoiceNumber: z.string(),
        customerName: z.string().optional(),
        invoiceDate: z.string(), // ISO date
        dueDate: z.string(), // ISO date
        invoiceAmount: z.number().min(0),
        amountOutstanding: z.number().min(0),
        daysOutstanding: z.number().min(0),
        agingBucket: z.enum(['current', '1-30', '31-60', '61-90', 'over-90']),
      })
    ),
  }),
  creditPolicy: z.object({
    paymentTerms: z.number().min(0).default(30), // Net 30 days
    creditLimit: z.number().min(0).default(0),
    discountTerms: z
      .object({
        earlyPaymentDiscount: z.number().min(0).max(1).default(0.02), // 2%
        discountDays: z.number().min(0).default(10),
      })
      .optional(),
  }),
  historicalData: z.object({
    averageCollectionPeriod: z.number().min(0).default(0), // days
    badDebtPercentage: z.number().min(0).max(1).default(0.02), // 2%
    annualSales: z.number().min(0),
    annualCreditSales: z.number().min(0),
  }),
  analysis: z.object({
    includeDSO: z.boolean().default(true), // Days Sales Outstanding
    includeAgingAnalysis: z.boolean().default(true),
    includeBadDebtForecast: z.boolean().default(true),
    includeCollectionRecommendations: z.boolean().default(true),
    includeCreditPolicyOptimization: z.boolean().default(true),
  }),
});

export type AccountsReceivableAgingInput = z.infer<typeof AccountsReceivableAgingInputSchema>;


