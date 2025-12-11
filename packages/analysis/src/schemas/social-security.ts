import { z } from 'zod';

export const SocialSecurityInputSchema = z.object({
  personalInfo: z.object({
    birthDate: z.string(), // ISO date
    currentAge: z.number().min(62).max(70),
    fullRetirementAge: z.number().min(66).max(67),
    lifeExpectancy: z.number().min(70).max(100).default(85),
  }),
  earnings: z.object({
    currentAnnualEarnings: z.number().min(0),
    averageLifetimeEarnings: z.number().min(0).optional(),
    earningsHistory: z
      .array(
        z.object({
          year: z.number(),
          earnings: z.number().min(0),
        })
      )
      .optional(),
  }),
  maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
  spouseInfo: z
    .object({
      birthDate: z.string(),
      currentAge: z.number().min(62).max(70),
      fullRetirementAge: z.number().min(66).max(67),
      currentAnnualEarnings: z.number().min(0),
      averageLifetimeEarnings: z.number().min(0).optional(),
    })
    .optional(),
  claimingStrategy: z.object({
    primaryClaimingAge: z.number().min(62).max(70),
    spouseClaimingAge: z.number().min(62).max(70).optional(),
    strategy: z
      .enum(['early', 'full-retirement', 'delayed', 'file-and-suspend', 'restricted-application'])
      .optional(),
  }),
  goals: z.object({
    optimizeFor: z
      .enum(['maximum-lifetime', 'maximum-monthly', 'survivor-benefits', 'spousal-benefits'])
      .default('maximum-lifetime'),
    includeBreakEvenAnalysis: z.boolean().default(true),
  }),
});

export type SocialSecurityInput = z.infer<typeof SocialSecurityInputSchema>;
