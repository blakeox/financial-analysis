import { z } from 'zod';

export const BusinessExpansionLoanInputSchema = z.object({
  businessInfo: z.object({
    businessName: z.string(),
    industry: z.string(),
    yearsInBusiness: z.number().min(0).max(100),
    businessType: z.enum(['sole-proprietorship', 'partnership', 'llc', 'corporation', 's-corp']),
    employeeCount: z.number().min(0).max(10000),
  }),
  currentFinancials: z.object({
    annualRevenue: z.number().min(0),
    annualEBITDA: z.number(),
    currentDebt: z.number().min(0),
    monthlyDebtPayments: z.number().min(0),
    cashOnHand: z.number().min(0),
    accountsReceivable: z.number().min(0),
    accountsPayable: z.number().min(0),
    creditScore: z.number().min(300).max(850).optional(),
  }),
  expansionPlan: z.object({
    loanAmount: z.number().min(0),
    loanPurpose: z.enum([
      'equipment',
      'real-estate',
      'working-capital',
      'inventory',
      'expansion',
      'acquisition',
      'refinancing',
      'other',
    ]),
    expectedRevenueIncrease: z.number().min(0),
    expectedEBITDAIncrease: z.number(),
    timeline: z.number().min(1).max(10), // years
    description: z.string().optional(),
  }),
  loanPreferences: z.object({
    preferredTerm: z.number().min(1).max(30), // years
    preferredRate: z.number().min(0).max(0.2).optional(), // annual rate
    loanType: z.enum([
      'term-loan',
      'line-of-credit',
      'sba',
      'equipment-financing',
      'commercial-mortgage',
    ]),
    collateralAvailable: z.boolean().default(false),
    collateralValue: z.number().min(0).default(0),
  }),
  goals: z.object({
    riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
    priority: z.enum(['lowest-cost', 'fastest-approval', 'flexible-terms', 'maximum-amount']),
    includeScenarioAnalysis: z.boolean().default(true),
  }),
});

export type BusinessExpansionLoanInput = z.infer<typeof BusinessExpansionLoanInputSchema>;
