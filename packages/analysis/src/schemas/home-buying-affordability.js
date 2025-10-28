import { z } from 'zod';

export const HomeBuyingAffordabilityInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']),
    dependents: z.number().min(0).max(20),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
    yearsEmployed: z.number().min(0).max(50),
    creditScore: z.number().min(300).max(850),
  }),
  finances: z.object({
    annualIncome: z.number().min(0),
    monthlyDebtPayments: z.number().min(0),
    downPaymentAvailable: z.number().min(0),
    emergencyFund: z.number().min(0),
    otherAssets: z.number().min(0),
  }),
  homePreferences: z.object({
    targetPrice: z.number().min(0),
    location: z.string(),
    homeType: z.enum(['single-family', 'condo', 'townhouse', 'multi-family']),
    mustHaves: z.array(z.string()),
    niceToHaves: z.array(z.string()),
  }),
  goals: z.object({
    timeline: z.number().min(1).max(10),
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    priority: z.enum(['affordability', 'location', 'size', 'investment']),
  }),
});
