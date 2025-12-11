import { z } from 'zod';

export const EmployerMatch401kInputSchema = z.object({
  planDetails: z.object({
    employerMatch: z.number().min(0).max(1), // e.g., 0.5 = 50% match
    matchLimit: z.number().min(0).max(1), // e.g., 0.06 = up to 6% of salary
    vestingSchedule: z.enum(['immediate', 'cliff', 'graded']).default('immediate'),
    vestingYears: z.number().min(0).max(10).default(0),
    currentVestingPercentage: z.number().min(0).max(1).default(1),
  }),
  employeeInfo: z.object({
    annualSalary: z.number().min(0),
    currentContribution: z.number().min(0).max(0.5), // Percentage of salary
    currentBalance: z.number().min(0).default(0),
    yearsOfService: z.number().min(0).max(50).default(0),
  }),
  analysis: z.object({
    includeMaximization: z.boolean().default(true),
    includeVestingAnalysis: z.boolean().default(true),
    includeTaxAnalysis: z.boolean().default(true),
  }),
});

export type EmployerMatch401kInput = z.infer<typeof EmployerMatch401kInputSchema>;
