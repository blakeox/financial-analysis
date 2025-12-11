import { z } from 'zod';

export const RetirementPlanningInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    retirementAge: z.number().min(50).max(80),
    lifeExpectancy: z.number().min(70).max(120),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(20),
  }),
  currentAccounts: z.array(
    z.object({
      type: z.enum(['401k', 'ira', 'roth-ira', 'pension', 'savings']),
      balance: z.number().min(0),
      annualContribution: z.number().min(0),
      employerMatch: z.number().min(0).optional(),
      expectedReturn: z.number().min(0).max(0.2),
    })
  ),
  income: z.object({
    currentAnnual: z.number().min(0),
    expectedGrowthRate: z.number().min(0).max(0.1),
    socialSecurity: z.number().min(0).optional(),
  }),
  expenses: z.object({
    currentAnnual: z.number().min(0),
    retirementAnnual: z.number().min(0),
    inflationRate: z.number().min(0).max(0.1),
  }),
  goals: z.object({
    targetRetirementIncome: z.number().min(0),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    taxStrategy: z.enum(['traditional-first', 'roth-first', 'balanced']),
  }),
});

export type RetirementPlanningInput = z.infer<typeof RetirementPlanningInputSchema>;
