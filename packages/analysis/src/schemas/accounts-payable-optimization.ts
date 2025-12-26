import { z } from 'zod';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseNetTermsDays(value: number | string | undefined): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/(\d+)/);
    if (match) {
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) ? parsed : 30;
    }
  }
  return 30;
}

function daysBetween(earlierISO: string, laterISO: string): number {
  const earlier = new Date(earlierISO);
  const later = new Date(laterISO);
  const diff = (later.getTime() - earlier.getTime()) / MS_PER_DAY;
  return Number.isFinite(diff) ? diff : 0;
}

const InvoiceEarlyPaymentDiscountSchema = z
  .object({
    discountPercentage: z.number().min(0).max(1).default(0),
    discountDays: z.number().min(0).default(0),
  })
  .optional();

const InvoiceSchema = z
  .object({
    invoiceNumber: z.string(),
    vendorName: z.string().optional(),
    invoiceDate: z.string(), // ISO date
    dueDate: z.string(), // ISO date
    invoiceAmount: z.number().min(0),
    amountOutstanding: z.number().min(0).optional(),
    daysUntilDue: z.number().optional(),
    paymentTerms: z.string().optional(), // e.g., "Net 30"
    earlyPaymentDiscount: InvoiceEarlyPaymentDiscountSchema,
  })
  .transform((inv) => {
    const amountOutstanding = inv.amountOutstanding ?? inv.invoiceAmount;
    const daysUntilDue = inv.daysUntilDue ?? daysBetween(inv.invoiceDate, inv.dueDate);
    return {
      ...inv,
      amountOutstanding,
      daysUntilDue,
    };
  });

const PaymentTermsSchema = z
  .object({
    standardTerms: z.union([z.number().min(0), z.string()]).optional(), // e.g., 30 or "Net 30"
    earlyPaymentDiscounts: z
      .array(
        z.object({
          vendor: z.string().optional(),
          discountPercentage: z.number().min(0).max(1).default(0.02), // 2%
          discountDays: z.number().min(0).default(10),
          annualInvoiceVolume: z.number().min(0).default(0),
        })
      )
      .default([]),
  })
  .optional();

const CashFlowSchema = z.union([
  z.object({
    currentCashBalance: z.number().min(0),
    averageMonthlyCashFlow: z.number(),
    costOfCapital: z.number().min(0).max(0.2).default(0.1), // 10%
    opportunityCostRate: z.number().min(0).max(0.2).default(0.07), // 7%
  }),
  z.object({
    currentCash: z.number().min(0),
    monthlyCashFlow: z.number(),
    costOfCapital: z.number().min(0).max(0.2).default(0.1),
  }),
]);

const VendorRelationshipsSchema = z
  .object({
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
  })
  .optional();

export const AccountsPayableOptimizationInputSchema = z
  .object({
    payables: z.object({
      totalPayables: z.number().min(0),
      invoices: z.array(InvoiceSchema),
    }),
    paymentTerms: PaymentTermsSchema,
    cashFlow: CashFlowSchema,
    vendorRelationships: VendorRelationshipsSchema,
    strategy: z.object({
      optimizeFor: z
        .enum(['max-cash-flow', 'max-discounts', 'vendor-relationships', 'balanced'])
        .default('balanced'),
      includeDynamicDiscounting: z.boolean().default(false),
      includeSupplyChainFinance: z.boolean().default(false),
      includeEarlyPaymentAnalysis: z.boolean().optional(),
    }),
    analysis: z
      .object({
        includeDiscountAnalysis: z.boolean().default(true),
        includeCashFlowImpact: z.boolean().default(true),
        includePaymentSchedule: z.boolean().default(true),
        includeVendorOptimization: z.boolean().optional(),
        includeVendorAnalysis: z.boolean().optional(),
        projectionMonths: z.number().min(1).max(12).default(3),
      })
      .default({
        includeDiscountAnalysis: true,
        includeCashFlowImpact: true,
        includePaymentSchedule: true,
        projectionMonths: 3,
      }),
  })
  .transform((input) => {
    const invoices = input.payables.invoices;

    const standardTermsDays = parseNetTermsDays(
      input.paymentTerms?.standardTerms ?? invoices[0]?.paymentTerms
    );

    const derivedEarlyDiscounts = invoices
      .filter((inv) => (inv.earlyPaymentDiscount?.discountPercentage ?? 0) > 0)
      .map((inv) => {
        const annualInvoiceVolume = inv.invoiceAmount * 12;
        return {
          vendor: inv.vendorName,
          discountPercentage: inv.earlyPaymentDiscount?.discountPercentage ?? 0,
          discountDays: inv.earlyPaymentDiscount?.discountDays ?? 0,
          annualInvoiceVolume,
        };
      });

    const paymentTerms = {
      standardTerms: standardTermsDays,
      earlyPaymentDiscounts:
        input.paymentTerms?.earlyPaymentDiscounts.length
          ? input.paymentTerms.earlyPaymentDiscounts
          : derivedEarlyDiscounts,
    };

    const cashFlow =
      'currentCashBalance' in input.cashFlow
        ? input.cashFlow
        : {
            currentCashBalance: input.cashFlow.currentCash,
            averageMonthlyCashFlow: input.cashFlow.monthlyCashFlow,
            costOfCapital: input.cashFlow.costOfCapital,
            opportunityCostRate: 0.07,
          };

    const vendorRelationships = input.vendorRelationships ?? {
      criticalVendors: [],
      vendorPaymentHistory: [],
    };

    const analysis = {
      ...input.analysis,
      includeVendorOptimization:
        input.analysis.includeVendorOptimization ?? input.analysis.includeVendorAnalysis ?? true,
      includeVendorAnalysis:
        input.analysis.includeVendorAnalysis ?? input.analysis.includeVendorOptimization ?? true,
    };

    return {
      ...input,
      paymentTerms,
      cashFlow,
      vendorRelationships,
      analysis,
    };
  });

export type AccountsPayableOptimizationInput = z.infer<
  typeof AccountsPayableOptimizationInputSchema
>;



