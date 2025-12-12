import { z } from 'zod';

export const HSAOptimizationInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    filingStatus: z.enum(['single', 'married-joint', 'married-separate', 'head-of-household']),
    currentHSABalance: z.number().min(0).default(0),
  }),
  contributionLimits: z.object({
    individualLimit: z.number().min(0).default(4150),
    familyLimit: z.number().min(0).default(8300),
    catchUpContribution: z.number().min(0).default(1000), // Age 55+
    currentYear: z.number().default(2024),
  }),
  hsaDetails: z.object({
    annualContribution: z.number().min(0),
    employerContribution: z.number().min(0).default(0),
    investmentReturn: z.number().min(0).max(0.2).default(0.07),
    accountFees: z.number().min(0).default(0),
  }),
  medicalExpenses: z.object({
    annualMedicalExpenses: z.number().min(0).default(0),
    expectedRetirementMedicalCosts: z.number().min(0).default(0),
    yearsUntilRetirement: z.number().min(0).default(30),
  }),
  strategy: z.object({
    optimizeFor: z
      .enum(['max-tax-benefit', 'retirement-healthcare', 'current-expenses', 'hybrid'])
      .default('hybrid'),
    useForCurrentExpenses: z.boolean().default(false),
    saveReceipts: z.boolean().default(true), // For future reimbursement
  }),
  taxInfo: z.object({
    federalTaxRate: z.number().min(0).max(0.5).default(0.22),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    ficaTaxRate: z.number().min(0).max(0.2).default(0.0765), // 7.65% for most
  }),
});

export type HSAOptimizationInput = z.infer<typeof HSAOptimizationInputSchema>;


