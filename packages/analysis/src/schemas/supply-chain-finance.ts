import { z } from 'zod';

export const SupplyChainFinanceInputSchema = z.object({
  companyInfo: z.object({
    companyName: z.string().optional(),
    industry: z.string().optional(),
    annualRevenue: z.number().min(0),
    paymentTerms: z.number().min(0).default(30), // Net 30 days
  }),
  supplyChain: z.object({
    suppliers: z.array(
      z.object({
        supplierName: z.string().optional(),
        annualPurchaseVolume: z.number().min(0),
        paymentTerms: z.number().min(0).default(30),
        averageInvoiceAmount: z.number().min(0),
        invoicesPerMonth: z.number().min(0).default(1),
        supplierRelationship: z
          .enum(['critical', 'important', 'standard', 'commodity'])
          .default('standard'),
      })
    ),
    customers: z.array(
      z.object({
        customerName: z.string().optional(),
        annualSalesVolume: z.number().min(0),
        paymentTerms: z.number().min(0).default(30),
        averageInvoiceAmount: z.number().min(0),
        invoicesPerMonth: z.number().min(0).default(1),
        customerRelationship: z
          .enum(['strategic', 'important', 'standard', 'small'])
          .default('standard'),
      })
    ),
  }),
  workingCapital: z.object({
    accountsReceivable: z.number().min(0),
    accountsPayable: z.number().min(0),
    inventory: z.number().min(0),
    daysSalesOutstanding: z.number().min(0).default(0),
    daysPayableOutstanding: z.number().min(0).default(0),
    daysInventoryOutstanding: z.number().min(0).default(0),
    cashConversionCycle: z.number().default(0),
  }),
  financingOptions: z.object({
    dynamicDiscounting: z.object({
      enabled: z.boolean().default(false),
      discountRate: z.number().min(0).max(1).default(0.02), // 2%
      earlyPaymentDays: z.number().min(0).default(10),
      annualVolume: z.number().min(0).default(0),
    }),
    reverseFactoring: z.object({
      enabled: z.boolean().default(false),
      financingRate: z.number().min(0).max(0.2).default(0.08),
      programFee: z.number().min(0).max(0.05).default(0.01),
      annualVolume: z.number().min(0).default(0),
    }),
    supplyChainFinance: z.object({
      enabled: z.boolean().default(false),
      financingRate: z.number().min(0).max(0.2).default(0.06),
      programFee: z.number().min(0).max(0.05).default(0.005),
      annualVolume: z.number().min(0).default(0),
    }),
  }),
  costOfCapital: z.object({
    costOfDebt: z.number().min(0).max(0.2).default(0.08),
    costOfEquity: z.number().min(0).max(0.3).default(0.12),
    wacc: z.number().min(0).max(0.2).default(0.1),
    opportunityCostRate: z.number().min(0).max(0.2).default(0.07),
  }),
  analysis: z.object({
    includeWorkingCapitalOptimization: z.boolean().default(true),
    includeFinancingComparison: z.boolean().default(true),
    includeCashFlowImpact: z.boolean().default(true),
    includeSupplierBenefits: z.boolean().default(true),
    includeRiskAnalysis: z.boolean().default(true),
    projectionMonths: z.number().min(1).max(24).default(12),
  }),
});

export type SupplyChainFinanceInput = z.infer<typeof SupplyChainFinanceInputSchema>;


