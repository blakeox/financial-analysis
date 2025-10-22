import { z } from "zod";

/**
 * Schema for income source.
 */
export const IncomeSourceSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Income source name is required" })
    .max(100, { message: "Income source name cannot exceed 100 characters" }),
  monthlyAmount: z
    .number()
    .positive({ message: "Income amount must be positive" })
    .max(10_000_000, { message: "Income amount cannot exceed $10M" }),
  type: z.enum(["salary", "business", "investment", "rental", "other"]).default("salary"),
  recurring: z.boolean().default(true),
});

/**
 * Schema for expense category.
 */
export const ExpenseCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Expense category name is required" })
    .max(100, { message: "Expense category name cannot exceed 100 characters" }),
  monthlyAmount: z
    .number()
    .positive({ message: "Expense amount must be positive" })
    .max(10_000_000, { message: "Expense amount cannot exceed $10M" }),
  type: z
    .enum([
      "housing",
      "transportation",
      "food",
      "utilities",
      "insurance",
      "healthcare",
      "debt_payment",
      "entertainment",
      "personal",
      "savings",
      "other",
    ])
    .default("other"),
  isFixed: z.boolean().default(false),
  isEssential: z.boolean().default(true),
});

/**
 * Schema for debt obligation.
 */
export const DebtObligationSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Debt name is required" })
    .max(100, { message: "Debt name cannot exceed 100 characters" }),
  totalBalance: z
    .number()
    .positive({ message: "Debt balance must be positive" })
    .max(10_000_000, { message: "Debt balance cannot exceed $10M" }),
  monthlyPayment: z
    .number()
    .positive({ message: "Monthly payment must be positive" })
    .max(1_000_000, { message: "Monthly payment cannot exceed $1M" }),
  interestRate: z
    .number()
    .min(0, { message: "Interest rate cannot be negative" })
    .max(1, { message: "Interest rate cannot exceed 100%" }),
  type: z.enum(["mortgage", "auto", "student", "credit_card", "personal", "other"]).default("other"),
});

/**
 * Schema for budget optimizer input.
 */
export const BudgetInputSchema = z.object({
  income: z
    .array(IncomeSourceSchema)
    .min(1, { message: "At least one income source is required" })
    .max(20, { message: "Cannot analyze more than 20 income sources" }),
  expenses: z
    .array(ExpenseCategorySchema)
    .min(1, { message: "At least one expense category is required" })
    .max(50, { message: "Cannot analyze more than 50 expense categories" }),
  debts: z
    .array(DebtObligationSchema)
    .max(20, { message: "Cannot analyze more than 20 debts" })
    .default([]),
  savingsGoalMonthly: z
    .number()
    .min(0, { message: "Savings goal cannot be negative" })
    .max(10_000_000, { message: "Savings goal cannot exceed $10M" })
    .default(0),
  optimizationGoal: z
    .enum(["maximize_savings", "reduce_debt", "balance", "reduce_discretionary"])
    .default("balance"),
});

export type IncomeSource = z.infer<typeof IncomeSourceSchema>;
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;
export type DebtObligation = z.infer<typeof DebtObligationSchema>;
export type BudgetInput = z.infer<typeof BudgetInputSchema>;
