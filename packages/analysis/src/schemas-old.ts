import { z } from 'zod';

// Lease/Financial Input Schema
export const FinancialInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  residualValue: z.number().min(0).default(0),
});

// Amortization Input Schema
export const AmortizationInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  extraMonthlyPayment: z.number().min(0).default(0),
  oneTimePayments: z
    .array(
      z.object({
        month: z.number().positive().int(),
        amount: z.number().positive(),
        applyToPrincipal: z.boolean().default(true),
      })
    )
    .default([]),
  pmi: z
    .object({
      enabled: z.boolean().default(false),
      rate: z.number().min(0).default(0),
      dropOffLTV: z.number().min(0).max(1).default(0.8),
    })
    .default({ enabled: false, rate: 0, dropOffLTV: 0.8 }),
  points: z.number().min(0).default(0),
});

// Employee Schema
const EmployeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  department: z.string(),
  billableHoursPerMonth: z.number().min(0),
  hourlyRate: z.number().min(0),
  salary: z.number().min(0),
  benefits: z.number().min(0),
  startDate: z.string(),
  isActive: z.boolean(),
});

// Monthly Financials Schema
const MonthlyFinancialsSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  revenue: z.number().min(0),
  costOfGoodsSold: z.number().min(0),
  operatingExpenses: z.number().min(0),
  depreciation: z.number().min(0),
  amortization: z.number().min(0),
  interestExpense: z.number().min(0),
  taxes: z.number().min(0),
});

// Additional Expense Schema
const AdditionalExpenseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(['fixed', 'variable']),
  amount: z.number().min(0),
  frequency: z.enum(['monthly', 'quarterly', 'annually']),
  isRecurring: z.boolean(),
  growthRate: z.number().default(0),
  startMonth: z.number().int().min(1).default(1),
});

// EBITDA/Scenario Input Schema
export const ScenarioInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  forecastPeriodMonths: z.number().int().positive(),
  currentMonthlyFinancials: z.array(MonthlyFinancialsSchema),
  currentEmployees: z.array(EmployeeSchema),
  newEmployees: z.array(EmployeeSchema).default([]),
  revenueGrowthRate: z.number().min(-1).max(10), // -100% to 1000%
  billableHoursGrowthRate: z.number().min(-1).max(5).default(0),
  additionalExpenses: z.array(AdditionalExpenseSchema).default([]),
  operatingExpenseGrowthRate: z.number().min(-1).max(5).default(0),
  inflationRate: z.number().min(-1).max(1).default(0.003), // -100% to 100%
  economicFactors: z.object({
    marketGrowth: z.number().min(-1).max(1).default(0.02),
    competitionFactor: z.number().min(0).max(2).default(1.0),
    seasonalityFactors: z.array(z.number().min(0).max(5)).length(12), // 12 months
  }),
});

export type FinancialInput = z.infer<typeof FinancialInputSchema>;
export type AmortizationInput = z.infer<typeof AmortizationInputSchema>;
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
