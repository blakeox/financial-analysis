import { z } from 'zod';

export const FiveTwoNineOptimizerInputSchema = z.object({
  personalInfo: z.object({
    stateOfResidence: z.string(),
    filingStatus: z.enum(['single', 'married-joint', 'married-separate', 'head-of-household']),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
  }),
  children: z.array(
    z.object({
      name: z.string().optional(),
      age: z.number().min(0).max(25),
      yearsUntilCollege: z.number().min(0).max(25),
      expectedCollegeCost: z.number().min(0).default(0), // Total 4-year cost
      collegeType: z
        .enum(['public-in-state', 'public-out-state', 'private', 'unknown'])
        .default('public-in-state'),
    })
  ),
  current529Accounts: z
    .array(
      z.object({
        state: z.string(),
        accountType: z.enum(['direct', 'advisor-sold']),
        currentBalance: z.number().min(0),
        annualContribution: z.number().min(0).default(0),
        fees: z.number().min(0).max(0.02).default(0.001), // Expense ratio
        investmentReturn: z.number().min(0).max(0.2).default(0.07),
      })
    )
    .default([]),
  contributionPlan: z.object({
    annualContribution: z.number().min(0),
    contributionIncrease: z.number().min(0).max(0.1).default(0.03), // Annual increase
    lumpSumContributions: z
      .array(
        z.object({
          year: z.number(),
          amount: z.number().min(0),
        })
      )
      .default([]),
  }),
  state529Options: z
    .array(
      z.object({
        state: z.string(),
        stateTaxDeduction: z.boolean().default(false),
        maxDeduction: z.number().min(0).default(0),
        fees: z.number().min(0).max(0.02),
        investmentOptions: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
        minimumContribution: z.number().min(0).default(0),
      })
    )
    .optional(),
  financialAid: z.object({
    expectFinancialAid: z.boolean().default(true),
    expectedAidPercentage: z.number().min(0).max(1).default(0.3),
    includeAidImpact: z.boolean().default(true),
  }),
  strategy: z.object({
    optimizeFor: z
      .enum(['max-tax-benefit', 'lowest-fees', 'best-investments', 'aid-optimization'])
      .default('max-tax-benefit'),
    includeMultiStateComparison: z.boolean().default(true),
    includeCoverdellESA: z.boolean().default(false),
  }),
  analysis: z.object({
    includeProjection: z.boolean().default(true),
    includeShortfallAnalysis: z.boolean().default(true),
    includeRolloverAnalysis: z.boolean().default(true),
  }),
});

export type FiveTwoNineOptimizerInput = z.infer<typeof FiveTwoNineOptimizerInputSchema>;


