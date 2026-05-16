import { z } from 'zod';

export const RothVsTraditionalIRAInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    retirementAge: z.number().min(59.5).max(100),
    currentTaxBracket: z.number().min(0).max(0.5),
    expectedRetirementTaxBracket: z.number().min(0).max(0.5),
  }),
  contributionDetails: z.object({
    annualContribution: z.number().min(0).max(7000), // 2024 limit
    catchUpContribution: z.number().min(0).max(1000).default(0), // Age 50+
    yearsToContribute: z.number().min(1).max(50),
  }),
  accountDetails: z.object({
    currentTraditionalBalance: z.number().min(0).default(0),
    currentRothBalance: z.number().min(0).default(0),
    expectedReturn: z.number().min(0).max(0.2).default(0.07),
  }),
  taxInfo: z.object({
    currentMarginalTaxRate: z.number().min(0).max(0.5),
    expectedRetirementMarginalTaxRate: z.number().min(0).max(0.5),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    stateTaxDeduction: z.boolean().default(false), // Some states don't tax retirement withdrawals
  }),
  withdrawalStrategy: z.object({
    annualWithdrawalAmount: z.number().min(0).default(0),
    withdrawalStartAge: z.number().min(59.5).max(100),
    includeRequiredMinimumDistributions: z.boolean().default(true),
    rmdsStartAge: z.number().min(72).max(75).default(73),
  }),
  analysis: z.object({
    includeConversionAnalysis: z.boolean().default(true),
    includeTaxBracketOptimization: z.boolean().default(true),
    projectionYears: z.number().min(10).max(50).default(30),
  }),
});

export type RothVsTraditionalIRAInput = z.infer<typeof RothVsTraditionalIRAInputSchema>;
