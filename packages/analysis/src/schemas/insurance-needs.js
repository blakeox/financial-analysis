import { z } from 'zod';

export const InsuranceNeedsInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(20),
    annualIncome: z.number().min(0),
    netWorth: z.number().min(0),
    healthStatus: z.enum(['excellent', 'good', 'fair', 'poor']),
    occupation: z.string(),
    hobbies: z.array(z.string()),
  }),
  currentCoverage: z.object({
    lifeInsurance: z.number().min(0),
    disabilityInsurance: z.number().min(0),
    longTermCareInsurance: z.number().min(0),
  }),
  goals: z.object({
    incomeReplacementYears: z.number().min(1).max(50),
    educationFunding: z.number().min(0),
    debtPayoff: z.number().min(0),
    finalExpenses: z.number().min(0),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
  }),
});
