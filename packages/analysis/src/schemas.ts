import { z } from 'zod';

// Financial Input Schema
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
  startDate: z.string().optional(),
  extraMonthlyPayment: z.number().min(0).optional().default(0),
  oneTimePayments: z
    .array(
      z.object({
        month: z.number().positive().int(),
        amount: z.number().positive(),
      })
    )
    .optional()
    .default([]),
  paymentFrequency: z.enum(['monthly', 'biweekly', 'weekly']).optional().default('monthly'),
  interestOnlyMonths: z.number().min(0).int().optional().default(0),
  balloonPayment: z.number().min(0).optional().default(0),
  origination_fee: z.number().min(0).optional().default(0),
  points: z.number().min(0).optional().default(0),
  pmi: z
    .object({
      enabled: z.boolean().default(false),
      rate: z.number().min(0).max(1).optional().default(0),
      dropOffLTV: z.number().min(0).max(1).optional().default(0.8),
      homeValue: z.number().positive().optional(),
    })
    .optional()
    .default({ enabled: false, rate: 0, dropOffLTV: 0.8 }),
  // PITI fields (Tax & Insurance)
  propertyTaxAnnual: z.number().min(0).optional().default(0),
  homeInsuranceAnnual: z.number().min(0).optional().default(0),
  hoaMonthly: z.number().min(0).optional().default(0),
  // APR calculation inputs
  downPayment: z.number().min(0).optional().default(0),
  closingCosts: z.number().min(0).optional().default(0),
});

// Scenario Input Schema (minimal placeholder)
export const ScenarioInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  forecastPeriodMonths: z.number().positive().int(),
  currentMonthlyFinancials: z.array(z.object({
    month: z.number().positive().int(),
    revenue: z.number().min(0),
    costs: z.number().min(0),
  })),
  employees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    department: z.string(),
    billableHoursPerMonth: z.number().min(0),
    hourlyRate: z.number().min(0),
    salary: z.number().min(0),
    benefits: z.number().min(0),
    startDate: z.string(),
  })),
  revenueStreams: z.array(z.object({
    name: z.string(),
    monthlyRevenue: z.number().min(0),
    growthRate: z.number().min(-1),
    seasonalityMultipliers: z.array(z.number().positive()).default([1,1,1,1,1,1,1,1,1,1,1,1]),
  })),
  costItems: z.array(z.object({
    name: z.string(),
    monthlyCost: z.number().min(0),
    isVariableCost: z.boolean(),
    costPercentageOfRevenue: z.number().min(0).optional(),
  })),
  assumptions: z.object({
    taxRate: z.number().min(0).max(1).default(0.25),
    discountRate: z.number().min(0).max(1).default(0.1),
    inflationRate: z.number().min(0).max(1).default(0.03),
  }).default({ taxRate: 0.25, discountRate: 0.1, inflationRate: 0.03 }),
});

// WACC Input Schema
export const WACCInputSchema = z.object({
  equityValue: z.number().positive('Equity value must be positive'),
  debtValue: z.number().positive('Debt value must be positive'),
  costOfEquity: z.number().min(0).max(1, 'Cost of equity must be between 0 and 1'),
  costOfDebt: z.number().min(0).max(1, 'Cost of debt must be between 0 and 1'),
  taxRate: z.number().min(0).max(1, 'Tax rate must be between 0 and 1'),
});

// Type exports
export type FinancialInput = z.infer<typeof FinancialInputSchema>;
export type AmortizationInput = z.infer<typeof AmortizationInputSchema>;
export type ScenarioInput = z.infer<typeof ScenarioInputSchema>;
export type WACCInput = z.infer<typeof WACCInputSchema>;

// Validation helper functions
export function validateFinancialInput(input: unknown): input is FinancialInput {
  return FinancialInputSchema.safeParse(input).success;
}
