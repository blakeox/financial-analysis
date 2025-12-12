import { z } from 'zod';

export const LongTermCareInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(40).max(100),
    gender: z.enum(['male', 'female']),
    healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']),
    familyHistory: z.object({
      hasLTCNeeds: z.boolean().default(false),
      averageLTCDuration: z.number().min(0).default(0), // years
    }),
  }),
  careNeeds: z.object({
    expectedCareStartAge: z.number().min(65).max(100).default(80),
    expectedCareDuration: z.number().min(0).max(10).default(3), // years
    careType: z.enum(['home-care', 'assisted-living', 'nursing-home', 'mixed']).default('mixed'),
    annualCareCost: z.number().min(0).default(100000),
    careCostInflation: z.number().min(0).max(0.1).default(0.05),
  }),
  insuranceOptions: z.object({
    hasLTCInsurance: z.boolean().default(false),
    policyDetails: z
      .object({
        dailyBenefit: z.number().min(0),
        benefitPeriod: z.number().min(0), // years
        eliminationPeriod: z.number().min(0).default(90), // days
        inflationProtection: z.boolean().default(true),
        annualPremium: z.number().min(0),
        premiumIncreases: z
          .array(
            z.object({
              year: z.number(),
              newPremium: z.number().min(0),
            })
          )
          .optional(),
      })
      .optional(),
  }),
  financialResources: z.object({
    currentAssets: z.number().min(0),
    annualIncome: z.number().min(0),
    expectedRetirementAssets: z.number().min(0),
    otherInsurance: z.object({
      hasMedicaid: z.boolean().default(false),
      hasMedicare: z.boolean().default(true),
      hasHybridPolicy: z.boolean().default(false),
    }),
  }),
  strategy: z.object({
    fundingMethod: z
      .enum(['self-fund', 'ltc-insurance', 'hybrid', 'medicaid-planning'])
      .default('hybrid'),
    includeMedicaidPlanning: z.boolean().default(false),
    includeHybridPolicy: z.boolean().default(false),
  }),
  analysis: z.object({
    includeProbabilityAnalysis: z.boolean().default(true),
    includeScenarioAnalysis: z.boolean().default(true),
    projectionYears: z.number().min(10).max(50).default(30),
  }),
});

export type LongTermCareInput = z.infer<typeof LongTermCareInputSchema>;


