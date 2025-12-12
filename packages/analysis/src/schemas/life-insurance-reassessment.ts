import { z } from 'zod';

export const LifeInsuranceReassessmentInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']),
    smoker: z.boolean().default(false),
    gender: z.enum(['male', 'female']),
  }),
  currentPolicies: z.array(
    z.object({
      policyType: z.enum(['term', 'whole-life', 'universal-life', 'variable-life']),
      faceAmount: z.number().min(0),
      annualPremium: z.number().min(0),
      yearsRemaining: z.number().min(0).optional(), // For term
      cashValue: z.number().min(0).default(0),
      policyAge: z.number().min(0), // years
      beneficiary: z.string().optional(),
    })
  ),
  financialSituation: z.object({
    annualIncome: z.number().min(0),
    totalAssets: z.number().min(0),
    totalDebt: z.number().min(0),
    monthlyExpenses: z.number().min(0),
    dependents: z.number().min(0).default(0),
    yearsUntilRetirement: z.number().min(0).default(20),
  }),
  needsAnalysis: z.object({
    incomeReplacement: z.object({
      yearsOfIncome: z.number().min(0).default(10),
      replacementPercentage: z.number().min(0).max(1).default(0.7),
    }),
    debtPayoff: z.object({
      mortgageBalance: z.number().min(0).default(0),
      otherDebt: z.number().min(0).default(0),
    }),
    educationFunding: z.object({
      childrenCount: z.number().min(0).default(0),
      educationCostPerChild: z.number().min(0).default(0),
    }),
    finalExpenses: z.number().min(0).default(10000),
    estateTaxes: z.number().min(0).default(0),
  }),
  analysis: z.object({
    includeCoverageGapAnalysis: z.boolean().default(true),
    includePolicyOptimization: z.boolean().default(true),
    includeConversionAnalysis: z.boolean().default(true),
    includeTermVsPermanent: z.boolean().default(true),
  }),
});

export type LifeInsuranceReassessmentInput = z.infer<typeof LifeInsuranceReassessmentInputSchema>;



