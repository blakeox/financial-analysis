import { z } from 'zod';

export const BusinessSuccessionPlanningInputSchema = z.object({
  businessInfo: z.object({
    businessName: z.string().optional(),
    businessType: z
      .enum(['sole-proprietorship', 'partnership', 'llc', 's-corp', 'c-corp'])
      .default('llc'),
    industry: z.string().optional(),
    annualRevenue: z.number().min(0),
    annualEBITDA: z.number().min(0),
    totalAssets: z.number().min(0),
    totalDebt: z.number().min(0),
  }),
  ownership: z.object({
    currentOwners: z.array(
      z.object({
        name: z.string().optional(),
        ownershipPercentage: z.number().min(0).max(1),
        age: z.number().min(18).max(100),
        expectedExitAge: z.number().min(50).max(100).default(65),
      })
    ),
    totalOwnership: z.number().min(0).max(1).default(1),
  }),
  valuation: z.object({
    valuationMethod: z
      .enum(['asset-based', 'market-multiple', 'income-approach', 'dcf', 'hybrid'])
      .default('hybrid'),
    estimatedValue: z.number().min(0),
    valuationMultiple: z.number().min(0).optional(), // e.g., 5x EBITDA
    industryMultiple: z.number().min(0).optional(),
  }),
  successionOptions: z.object({
    transferMethod: z
      .enum(['sale', 'gift', 'trust', 'esop', 'management-buyout', 'family-transfer'])
      .default('family-transfer'),
    buyerType: z
      .enum(['family-member', 'key-employee', 'third-party', 'esop', 'management'])
      .optional(),
    salePrice: z.number().min(0).optional(),
    paymentTerms: z
      .object({
        upfrontPayment: z.number().min(0).default(0),
        installmentPayments: z
          .array(
            z.object({
              year: z.number(),
              amount: z.number().min(0),
            })
          )
          .default([]),
        interestRate: z.number().min(0).max(0.2).default(0.05),
      })
      .optional(),
  }),
  taxPlanning: z.object({
    federalEstateTaxExemption: z.number().min(0).default(13400000), // 2024
    stateEstateTaxExemption: z.number().min(0).default(0),
    estateTaxRate: z.number().min(0).max(0.5).default(0.4),
    giftTaxExemption: z.number().min(0).default(18000), // Annual exclusion 2024
    includeGRAT: z.boolean().default(false), // Grantor Retained Annuity Trust
    includeFLP: z.boolean().default(false), // Family Limited Partnership
  }),
  buySellAgreement: z.object({
    hasAgreement: z.boolean().default(false),
    agreementType: z.enum(['cross-purchase', 'entity-redemption', 'hybrid']).optional(),
    fundingMethod: z.enum(['cash', 'life-insurance', 'installment', 'combination']).optional(),
    valuationMethod: z.string().optional(),
  }),
  analysis: z.object({
    includeTaxAnalysis: z.boolean().default(true),
    includeEstateTaxImpact: z.boolean().default(true),
    includeTransferStrategies: z.boolean().default(true),
    includeTimingAnalysis: z.boolean().default(true),
    includeFundingAnalysis: z.boolean().default(true),
  }),
});

export type BusinessSuccessionPlanningInput = z.infer<typeof BusinessSuccessionPlanningInputSchema>;
