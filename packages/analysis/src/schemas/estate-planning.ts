import { z } from 'zod';

export const EstatePlanningInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    stateOfResidence: z.string(),
  }),
  assets: z.object({
    totalAssets: z.number().min(0),
    realEstate: z.number().min(0),
    investments: z.number().min(0),
    retirementAccounts: z.number().min(0),
    businessInterests: z.number().min(0).default(0),
    otherAssets: z.number().min(0).default(0),
  }),
  estatePlan: z.object({
    hasWill: z.boolean().default(false),
    hasTrust: z.boolean().default(false),
    beneficiaries: z.number().min(0).max(20).default(1),
    charitableGiving: z.number().min(0).default(0),
  }),
  taxInfo: z.object({
    federalEstateTaxExemption: z.number().min(0).default(12920000), // 2024 exemption
    stateEstateTaxExemption: z.number().min(0).default(0),
    expectedGrowthRate: z.number().min(0).max(0.2).default(0.05),
    yearsToProject: z.number().min(1).max(50).default(20),
  }),
  analysis: z.object({
    includeEstateTaxProjection: z.boolean().default(true),
    includeInheritanceProjection: z.boolean().default(true),
    includeTrustAnalysis: z.boolean().default(false),
  }),
});

export type EstatePlanningInput = z.infer<typeof EstatePlanningInputSchema>;
