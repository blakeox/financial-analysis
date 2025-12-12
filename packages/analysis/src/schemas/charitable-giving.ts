import { z } from 'zod';

export const CharitableGivingInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    filingStatus: z.enum(['single', 'married-joint', 'married-separate', 'head-of-household']),
    adjustedGrossIncome: z.number().min(0),
  }),
  taxInfo: z.object({
    federalTaxRate: z.number().min(0).max(0.5),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    itemizeDeductions: z.boolean().default(false),
    standardDeduction: z.number().min(0).default(14600), // 2024 single
  }),
  givingDetails: z.object({
    annualGivingAmount: z.number().min(0),
    givingMethod: z.enum(['cash', 'appreciated-securities', 'donor-advised-fund', 'qcd', 'trust']),
    appreciatedAssetDetails: z
      .object({
        assetType: z.enum(['stocks', 'real-estate', 'other']),
        costBasis: z.number().min(0),
        currentValue: z.number().min(0),
        holdingPeriod: z.enum(['short-term', 'long-term']),
      })
      .optional(),
    qcdDetails: z
      .object({
        age: z.number().min(70.5),
        iraBalance: z.number().min(0),
        qcdAmount: z.number().min(0).max(100000),
      })
      .optional(),
  }),
  donorAdvisedFund: z
    .object({
      useDAF: z.boolean().default(false),
      dafFees: z.number().min(0).default(0),
      dafMinimumContribution: z.number().min(0).default(5000),
    })
    .optional(),
  strategy: z.object({
    optimizeFor: z
      .enum(['max-tax-benefit', 'simplicity', 'flexibility', 'estate-planning'])
      .default('max-tax-benefit'),
    bunchingStrategy: z.boolean().default(false), // Bunch multiple years
    includeEstatePlanning: z.boolean().default(false),
  }),
  analysis: z.object({
    compareMethods: z.boolean().default(true),
    includeMultiYearProjection: z.boolean().default(true),
    projectionYears: z.number().min(1).max(20).default(5),
  }),
});

export type CharitableGivingInput = z.infer<typeof CharitableGivingInputSchema>;


