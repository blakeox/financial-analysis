import { z } from "zod";

/**
 * Schema for a savings goal planner input.
 */
export const SavingsGoalInputSchema = z.object({
  goalAmount: z
    .number()
    .positive({ message: "Goal amount must be positive" })
    .max(100_000_000, { message: "Goal amount cannot exceed $100M" }),
  currentSavings: z
    .number()
    .min(0, { message: "Current savings cannot be negative" })
    .max(100_000_000, { message: "Current savings cannot exceed $100M" }),
  monthlyContribution: z
    .number()
    .min(0, { message: "Monthly contribution cannot be negative" })
    .max(10_000_000, { message: "Monthly contribution cannot exceed $10M" })
    .optional()
    .default(0),
  annualReturnRate: z
    .number()
    .min(0, { message: "Annual return rate cannot be negative" })
    .max(1, { message: "Annual return rate cannot exceed 100%" })
    .default(0.05),
  inflationRate: z
    .number()
    .min(0, { message: "Inflation rate cannot be negative" })
    .max(1, { message: "Inflation rate cannot exceed 100%" })
    .default(0.03),
  timeHorizonMonths: z
    .number()
    .int()
    .positive({ message: "Time horizon must be positive" })
    .max(600, { message: "Time horizon cannot exceed 600 months (50 years)" })
    .optional(),
  goalType: z
    .enum(["general", "emergency_fund", "home_down_payment", "education", "retirement"])
    .default("general"),
});

export type SavingsGoalInput = z.infer<typeof SavingsGoalInputSchema>;
