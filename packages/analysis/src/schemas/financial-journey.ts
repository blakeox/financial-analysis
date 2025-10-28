import { z } from 'zod';

export const FinancialJourneyInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(20),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
    education: z.enum(['high-school', 'some-college', 'bachelors', 'masters', 'phd']),
  }),
  currentFinancials: z.object({
    annualIncome: z.number().min(0),
    monthlyExpenses: z.number().min(0),
    totalDebt: z.number().min(0),
    emergencyFund: z.number().min(0),
    retirementSavings: z.number().min(0),
    otherAssets: z.number().min(0),
  }),
  goals: z.object({
    shortTerm: z.array(z.string()),
    mediumTerm: z.array(z.string()),
    longTerm: z.array(z.string()),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    timeHorizon: z.number().min(1).max(50),
  }),
});
