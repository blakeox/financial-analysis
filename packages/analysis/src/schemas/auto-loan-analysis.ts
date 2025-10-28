import { z } from 'zod';

export const AutoLoanAnalysisInputSchema = z.object({
  vehicleInfo: z.object({
    make: z.string(),
    model: z.string(),
    year: z.number().min(1900).max(2030),
    price: z.number().min(0),
    downPayment: z.number().min(0),
    tradeInValue: z.number().min(0),
  }),
  loanTerms: z.object({
    loanAmount: z.number().min(0),
    interestRate: z.number().min(0).max(0.5),
    termMonths: z.number().min(12).max(84),
    loanType: z.enum(['new', 'used', 'refinance']),
  }),
  personalInfo: z.object({
    creditScore: z.number().min(300).max(850),
    annualIncome: z.number().min(0),
    monthlyDebtPayments: z.number().min(0),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
  }),
  goals: z.object({
    analysisType: z.enum(['loan', 'lease', 'comparison']),
    priority: z.enum(['lowest-payment', 'lowest-total-cost', 'flexibility']),
  }),
});
