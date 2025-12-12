import { z } from 'zod';

export const EmployeeStockOptionsInputSchema = z.object({
  personalInfo: z.object({
    age: z.number().min(18).max(100),
    currentSalary: z.number().min(0),
    expectedRetirementAge: z.number().min(50).max(100).default(65),
  }),
  options: z.array(
    z.object({
      grantId: z.string().optional(),
      grantDate: z.string(), // ISO date
      grantPrice: z.number().min(0), // Strike price
      numberOfOptions: z.number().min(0),
      vestingSchedule: z.object({
        vestingType: z.enum(['cliff', 'graded', 'immediate']).default('graded'),
        cliffPeriod: z.number().min(0).default(0), // years
        vestingPeriod: z.number().min(0).default(4), // years
        vestingPercentage: z
          .array(
            z.object({
              year: z.number(),
              percentage: z.number().min(0).max(1),
            })
          )
          .optional(),
      }),
      expirationDate: z.string(), // ISO date
      optionType: z.enum(['iso', 'nso', 'eso']).default('iso'), // Incentive Stock Option, Non-Qualified Stock Option, Employee Stock Option
      currentStockPrice: z.number().min(0),
      expectedVolatility: z.number().min(0).max(1).default(0.3),
      riskFreeRate: z.number().min(0).max(0.1).default(0.04),
      dividendYield: z.number().min(0).max(0.1).default(0),
    })
  ),
  taxInfo: z.object({
    federalTaxRate: z.object({
      ordinary: z.number().min(0).max(0.5).default(0.37),
      capitalGains: z.number().min(0).max(0.3).default(0.2),
      amt: z.boolean().default(false), // Alternative Minimum Tax
    }),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    includeAMT: z.boolean().default(true),
  }),
  exerciseStrategy: z.object({
    strategy: z
      .enum([
        'exercise-early',
        'exercise-at-vest',
        'exercise-before-expiration',
        'hold-to-expiration',
      ])
      .default('exercise-at-vest'),
    exerciseAmount: z.number().min(0).default(0), // Amount to exercise now
    exerciseDate: z.string().optional(), // ISO date
    includeTaxOptimization: z.boolean().default(true),
  }),
  analysis: z.object({
    includeValuation: z.boolean().default(true), // Black-Scholes
    includeTaxAnalysis: z.boolean().default(true),
    includeExerciseScenarios: z.boolean().default(true),
    includeDilutionAnalysis: z.boolean().default(false),
    projectionYears: z.number().min(1).max(20).default(10),
  }),
});

export type EmployeeStockOptionsInput = z.infer<typeof EmployeeStockOptionsInputSchema>;


