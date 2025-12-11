import { z } from 'zod';

export const FIRECalculatorInputSchema = z.object({
  currentSituation: z.object({
    age: z.number().min(18).max(100),
    currentSavings: z.number().min(0),
    annualIncome: z.number().min(0),
    annualExpenses: z.number().min(0),
    monthlySavings: z.number().min(0),
  }),
  fireGoals: z.object({
    targetAge: z.number().min(18).max(100),
    annualExpensesInRetirement: z.number().min(0),
    safeWithdrawalRate: z.number().min(0.02).max(0.06).default(0.04),
    fireType: z.enum(['traditional', 'coast', 'barista', 'lean']).default('traditional'),
  }),
  assumptions: z.object({
    expectedReturn: z.number().min(0).max(0.2).default(0.07),
    inflationRate: z.number().min(0).max(0.1).default(0.03),
    incomeGrowth: z.number().min(0).max(0.2).default(0.03),
    expenseReduction: z.number().min(0).max(0.5).default(0),
  }),
  analysis: z.object({
    includeProjections: z.boolean().default(true),
    includeScenarios: z.boolean().default(true),
    includeExpenseOptimization: z.boolean().default(true),
  }),
});

export type FIRECalculatorInput = z.infer<typeof FIRECalculatorInputSchema>;
