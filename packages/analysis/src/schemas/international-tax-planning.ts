import { z } from 'zod';

export const InternationalTaxPlanningInputSchema = z.object({
  personalInfo: z.object({
    citizenship: z.string().default('US'),
    residenceCountry: z.string().default('US'),
    filingStatus: z
      .enum(['single', 'married-joint', 'married-separate', 'head-of-household'])
      .default('single'),
    taxYear: z.number().min(2020).max(2100).default(2024),
  }),
  foreignIncome: z.object({
    foreignEarnedIncome: z.number().min(0).default(0),
    foreignUnearnedIncome: z.number().min(0).default(0),
    foreignTaxPaid: z.number().min(0).default(0),
    foreignTaxRate: z.number().min(0).max(1).default(0),
    countries: z
      .array(
        z.object({
          country: z.string(),
          income: z.number().min(0),
          taxPaid: z.number().min(0),
        })
      )
      .default([]),
  }),
  feie: z.object({
    eligibleForFEIE: z.boolean().default(false),
    physicalPresenceTest: z.boolean().default(false),
    bonaFideResidenceTest: z.boolean().default(false),
    daysAbroad: z.number().min(0).default(0),
    feieLimit: z.number().min(0).default(126500), // 2024 limit
    housingExclusion: z.number().min(0).default(0),
  }),
  foreignTaxCredit: z.object({
    eligibleForFTC: z.boolean().default(false),
    foreignTaxPaid: z.number().min(0).default(0),
    foreignIncome: z.number().min(0).default(0),
    useFTC: z.boolean().default(true), // vs FEIE
  }),
  foreignAssets: z.object({
    foreignBankAccounts: z
      .array(
        z.object({
          country: z.string(),
          accountType: z.string(),
          maxBalance: z.number().min(0),
          currentBalance: z.number().min(0),
        })
      )
      .default([]),
    foreignFinancialAssets: z
      .array(
        z.object({
          assetType: z.string(),
          country: z.string(),
          value: z.number().min(0),
        })
      )
      .default([]),
    fbarRequired: z.boolean().default(false),
    fatcaRequired: z.boolean().default(false),
  }),
  taxTreaties: z
    .array(
      z.object({
        country: z.string(),
        treatyBenefits: z.string().optional(),
        reducedWithholding: z.number().min(0).max(1).optional(),
      })
    )
    .default([]),
  analysis: z.object({
    includeFEIEvsFTC: z.boolean().default(true),
    includeTaxSavings: z.boolean().default(true),
    includeComplianceCheck: z.boolean().default(true),
    includeOptimization: z.boolean().default(true),
  }),
});

export type InternationalTaxPlanningInput = z.infer<typeof InternationalTaxPlanningInputSchema>;


