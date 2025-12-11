import { z } from 'zod';

export const BusinessFinancialHealthInputSchema = z.object({
  businessInfo: z.object({
    yearsInBusiness: z.number().min(0).max(100),
    industry: z.string().optional(),
    employeeCount: z.number().min(0).max(10000).optional(),
  }),
  financials: z.object({
    annualRevenue: z.number().min(0),
    annualEBITDA: z.number(),
    currentDebt: z.number().min(0),
    monthlyDebtPayments: z.number().min(0),
    cashOnHand: z.number().min(0),
    accountsReceivable: z.number().min(0).default(0),
    accountsPayable: z.number().min(0).default(0),
    creditScore: z.number().min(300).max(850).optional(),
  }),
});

export type BusinessFinancialHealthInput = z.infer<typeof BusinessFinancialHealthInputSchema>;
