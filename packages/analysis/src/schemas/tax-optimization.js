import { z } from 'zod';

export const TaxOptimizationInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(20),
    stateOfResidence: z.string(),
    occupation: z.string(),
  }),
  income: z.object({
    annualSalary: z.number().min(0),
    bonus: z.number().min(0),
    investmentIncome: z.number().min(0),
    rentalIncome: z.number().min(0),
    otherIncome: z.number().min(0),
  }),
  deductions: z.object({
    mortgageInterest: z.number().min(0),
    propertyTaxes: z.number().min(0),
    charitableContributions: z.number().min(0),
    medicalExpenses: z.number().min(0),
    otherDeductions: z.number().min(0),
  }),
  investments: z.object({
    taxableAccounts: z.number().min(0),
    traditionalIRA: z.number().min(0),
    rothIRA: z.number().min(0),
    employer401k: z.number().min(0),
    otherRetirement: z.number().min(0),
  }),
  goals: z.object({
    taxStrategy: z.enum(['minimize-current', 'minimize-lifetime', 'balanced']),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    timeHorizon: z.number().min(1).max(50),
  }),
});
