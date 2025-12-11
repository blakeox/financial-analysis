import { z } from 'zod';

export const EmergencyFundInputSchema = z.object({
  currentSituation: z.object({
    monthlyExpenses: z.number().min(0),
    monthlyIncome: z.number().min(0),
    currentEmergencyFund: z.number().min(0).default(0),
    dependents: z.number().min(0).max(10).default(0),
    employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'retired']),
  }),
  goals: z.object({
    targetMonths: z.number().min(1).max(24).default(6),
    priority: z.enum(['build-quickly', 'build-gradually', 'maintain']).default('build-gradually'),
  }),
  assumptions: z.object({
    monthlySavings: z.number().min(0),
    expectedReturn: z.number().min(0).max(0.1).default(0.02),
  }),
  analysis: z.object({
    includeTimeline: z.boolean().default(true),
    includeScenarios: z.boolean().default(true),
  }),
});

export type EmergencyFundInput = z.infer<typeof EmergencyFundInputSchema>;
