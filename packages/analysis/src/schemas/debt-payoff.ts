import { z } from 'zod';

/**
 * Schema for a single debt in the payoff analysis
 */
export const DebtItemSchema = z.object({
  name: z.string().min(1).max(100),
  balance: z.number().positive(),
  interestRate: z.number().min(0).max(1), // Annual rate as decimal (e.g., 0.18 for 18%)
  minimumPayment: z.number().positive(),
});

export type DebtItem = z.infer<typeof DebtItemSchema>;

/**
 * Schema for debt payoff optimizer input
 */
export const DebtPayoffInputSchema = z.object({
  debts: z.array(DebtItemSchema).min(1).max(20),
  extraMonthlyPayment: z.number().min(0).default(0),
  strategy: z.enum(['avalanche', 'snowball']).default('avalanche'),
  
  // Optional balance transfer scenario
  balanceTransferOffer: z
    .object({
      creditLimit: z.number().positive(),
      transferFeeRate: z.number().min(0).max(0.1), // 0-10%
      introRate: z.number().min(0).max(1), // Intro APR as decimal
      introMonths: z.number().int().min(0).max(36),
      regularRate: z.number().min(0).max(1), // Regular APR after intro
    })
    .optional(),
});

export type DebtPayoffInput = z.infer<typeof DebtPayoffInputSchema>;
