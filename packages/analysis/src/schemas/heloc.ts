import { z } from 'zod';

export const HELOCInputSchema = z.object({
  propertyInfo: z.object({
    currentHomeValue: z.number().min(0),
    currentMortgageBalance: z.number().min(0),
    mortgageInterestRate: z.number().min(0).max(0.2),
    yearsRemaining: z.number().min(0).max(30),
  }),
  helocDetails: z.object({
    creditLimit: z.number().min(0),
    interestRate: z.number().min(0).max(0.2),
    drawPeriod: z.number().min(1).max(10), // years
    repaymentPeriod: z.number().min(1).max(20), // years
    initialDraw: z.number().min(0),
    annualFee: z.number().min(0).default(0),
  }),
  usage: z.object({
    purpose: z.enum(['home-improvement', 'debt-consolidation', 'investment', 'education', 'other']),
    drawAmount: z.number().min(0),
    drawTiming: z.enum(['immediate', 'gradual', 'as-needed']),
  }),
  comparison: z.object({
    compareToRefinancing: z.boolean().default(true),
    compareToPersonalLoan: z.boolean().default(false),
    newMortgageRate: z.number().min(0).max(0.2).optional(),
    personalLoanRate: z.number().min(0).max(0.2).optional(),
  }),
});

export type HELOCInput = z.infer<typeof HELOCInputSchema>;
