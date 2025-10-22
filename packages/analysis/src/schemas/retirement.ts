import { z } from "zod";

/**
 * Schema for retirement account contribution.
 */
export const RetirementAccountSchema = z.object({
  accountType: z.enum(["401k", "roth_401k", "traditional_ira", "roth_ira", "sep_ira"]),
  currentBalance: z
    .number()
    .min(0, { message: "Current balance cannot be negative" })
    .max(100_000_000, { message: "Current balance cannot exceed $100M" }),
  annualContribution: z
    .number()
    .min(0, { message: "Annual contribution cannot be negative" })
    .max(1_000_000, { message: "Annual contribution cannot exceed $1M" }),
  employerMatch: z
    .number()
    .min(0, { message: "Employer match cannot be negative" })
    .max(1, { message: "Employer match cannot exceed 100%" })
    .default(0),
  employerMatchLimit: z
    .number()
    .min(0, { message: "Employer match limit cannot be negative" })
    .max(1, { message: "Employer match limit cannot exceed 100%" })
    .default(0.06),
});

/**
 * Schema for retirement savings calculator input.
 */
export const RetirementInputSchema = z.object({
  currentAge: z
    .number()
    .int()
    .min(18, { message: "Current age must be at least 18" })
    .max(100, { message: "Current age cannot exceed 100" }),
  retirementAge: z
    .number()
    .int()
    .min(50, { message: "Retirement age must be at least 50" })
    .max(100, { message: "Retirement age cannot exceed 100" }),
  currentIncome: z
    .number()
    .positive({ message: "Current income must be positive" })
    .max(100_000_000, { message: "Current income cannot exceed $100M" }),
  accounts: z
    .array(RetirementAccountSchema)
    .min(1, { message: "At least one account is required" })
    .max(10, { message: "Cannot analyze more than 10 accounts" }),
  expectedAnnualReturn: z
    .number()
    .min(0, { message: "Expected return cannot be negative" })
    .max(1, { message: "Expected return cannot exceed 100%" })
    .default(0.07),
  inflationRate: z
    .number()
    .min(0, { message: "Inflation rate cannot be negative" })
    .max(1, { message: "Inflation rate cannot exceed 100%" })
    .default(0.03),
  incomeIncreaseRate: z
    .number()
    .min(0, { message: "Income increase rate cannot be negative" })
    .max(1, { message: "Income increase rate cannot exceed 100%" })
    .default(0.03),
  desiredRetirementIncome: z
    .number()
    .positive({ message: "Desired retirement income must be positive" })
    .max(100_000_000, { message: "Desired retirement income cannot exceed $100M" })
    .optional(),
  withdrawalStrategy: z.enum(["4_percent_rule", "fixed_amount", "required_minimum"]).default("4_percent_rule"),
});

export type RetirementAccount = z.infer<typeof RetirementAccountSchema>;
export type RetirementInput = z.infer<typeof RetirementInputSchema>;
