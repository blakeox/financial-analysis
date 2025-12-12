import { z } from 'zod';

export const AccountsPayableOptimizationInputSchema = z.object({
  payables: z.object({
    totalPayables: z.number().min(0),
    invoices: z.array(
      z.object({
        invoiceNumber: z.string(),
        vendorName: z.string().optional(),
        invoiceDate: z.string(), // ISO date
        dueDate: z.string(), // ISO date
        invoiceAmount: z.number().min(0),
        amountOutstanding: z.number().min(0),
        daysUntilDue: z.number(),
        paymentTerms: z.string().optional(), // e.g., "Net 30"
      })
    ),
  }),
  paymentTerms: z.object({
    standardTerms: z.number().min(0).default(30), // Net 30 days
    earlyPaymentDiscounts: z
      .array(
        z.object({
          vendor: z.string().optional(),
          discountPercentage: z.number().min(0).max(1).default(0.02), // 2%
          discountDays: z.number().min(0).default(10),
          annualInvoiceVolume: z.number().min(0),
        })
      )
      .default([]),
  }),
  cashFlow: z.object({
    currentCashBalance: z.number().min(0),
    averageMonthlyCashFlow: z.number(),
    costOfCapital: z.number().min(0).max(0.2).default(0.1), // 10%
    opportunityCostRate: z.number().min(0).max(0.2).default(0.07), // 7%
  }),
  vendorRelationships: z.object({
    criticalVendors: z.array(z.string()).default([]),
    vendorPaymentHistory: z
      .array(
        z.object({
          vendor: z.string(),
          averagePaymentDays: z.number().min(0),
          relationshipScore: z.number().min(0).max(10).default(5),
        })
      )
      .default([]),
  }),
  strategy: z.object({
    optimizeFor: z
      .enum(['max-cash-flow', 'max-discounts', 'vendor-relationships', 'balanced'])
      .default('balanced'),
    includeDynamicDiscounting: z.boolean().default(false),
    includeSupplyChainFinance: z.boolean().default(false),
  }),
  analysis: z.object({
    includeDiscountAnalysis: z.boolean().default(true),
    includeCashFlowImpact: z.boolean().default(true),
    includePaymentSchedule: z.boolean().default(true),
    includeVendorOptimization: z.boolean().default(true),
    projectionMonths: z.number().min(1).max(12).default(3),
  }),
});

export type AccountsPayableOptimizationInput = z.infer<
  typeof AccountsPayableOptimizationInputSchema
>;


