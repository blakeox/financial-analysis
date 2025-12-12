import { z } from 'zod';

export const DisabilityInsuranceInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(65),
    occupation: z.string(),
    occupationClass: z
      .enum(['professional', 'white-collar', 'blue-collar', 'high-risk'])
      .default('professional'),
    annualIncome: z.number().min(0),
    monthlyExpenses: z.number().min(0),
  }),
  currentCoverage: z.object({
    hasGroupCoverage: z.boolean().default(false),
    groupCoverageAmount: z.number().min(0).default(0),
    groupCoveragePercentage: z.number().min(0).max(1).default(0.6), // 60% of income
    hasIndividualPolicy: z.boolean().default(false),
    individualPolicyDetails: z
      .object({
        monthlyBenefit: z.number().min(0),
        benefitPeriod: z.number().min(0), // years or "to age 65"
        eliminationPeriod: z.number().min(0).default(90), // days
        definitionOfDisability: z
          .enum(['own-occupation', 'any-occupation', 'modified'])
          .default('own-occupation'),
        costOfLivingAdjustment: z.boolean().default(false),
        residualDisability: z.boolean().default(true),
        annualPremium: z.number().min(0),
      })
      .optional(),
  }),
  needsAnalysis: z.object({
    targetReplacementIncome: z.number().min(0).max(1).default(0.6), // 60% of income
    includeSocialSecurity: z.boolean().default(true),
    expectedSSDIBenefit: z.number().min(0).default(0),
    includeOtherIncome: z.boolean().default(false),
    otherIncomeSources: z.number().min(0).default(0),
  }),
  policyOptions: z.object({
    benefitAmount: z.number().min(0),
    benefitPeriod: z
      .enum(['2-years', '5-years', '10-years', 'to-age-65', 'lifetime'])
      .default('to-age-65'),
    eliminationPeriod: z.number().min(30).max(365).default(90), // days
    definitionOfDisability: z
      .enum(['own-occupation', 'any-occupation', 'modified'])
      .default('own-occupation'),
    riders: z.object({
      costOfLivingAdjustment: z.boolean().default(false),
      residualDisability: z.boolean().default(true),
      futureIncreaseOption: z.boolean().default(false),
      catastrophicDisability: z.boolean().default(false),
    }),
    estimatedAnnualPremium: z.number().min(0),
  }),
  analysis: z.object({
    includeCoverageGapAnalysis: z.boolean().default(true),
    includeCostBenefitAnalysis: z.boolean().default(true),
    includeProbabilityAnalysis: z.boolean().default(true),
  }),
});

export type DisabilityInsuranceInput = z.infer<typeof DisabilityInsuranceInputSchema>;


