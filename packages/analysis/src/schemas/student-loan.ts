import { z } from "zod";

/**
 * Schema for a single student loan.
 */
export const StudentLoanSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Loan name is required" })
    .max(100, { message: "Loan name cannot exceed 100 characters" }),
  balance: z
    .number()
    .positive({ message: "Loan balance must be positive" })
    .max(1_000_000, { message: "Loan balance cannot exceed $1M" }),
  interestRate: z
    .number()
    .min(0, { message: "Interest rate cannot be negative" })
    .max(1, { message: "Interest rate cannot exceed 100%" }),
  minimumPayment: z
    .number()
    .positive({ message: "Minimum payment must be positive" })
    .max(100_000, { message: "Minimum payment cannot exceed $100k" }),
  loanType: z.enum(["federal_subsidized", "federal_unsubsidized", "private"]).default("federal_unsubsidized"),
  remainingMonths: z
    .number()
    .int()
    .positive({ message: "Remaining months must be positive" })
    .max(360, { message: "Remaining months cannot exceed 360 (30 years)" })
    .optional(),
});

/**
 * Schema for income-driven repayment plan.
 */
export const IncomeDrivenPlanSchema = z.object({
  planType: z.enum(["IBR", "PAYE", "REPAYE", "ICR"]),
  annualIncome: z
    .number()
    .positive({ message: "Annual income must be positive" })
    .max(10_000_000, { message: "Annual income cannot exceed $10M" }),
  familySize: z
    .number()
    .int()
    .positive({ message: "Family size must be positive" })
    .max(20, { message: "Family size cannot exceed 20" })
    .default(1),
  expectedAnnualIncreaseRate: z
    .number()
    .min(0, { message: "Income increase rate cannot be negative" })
    .max(1, { message: "Income increase rate cannot exceed 100%" })
    .default(0.03),
});

/**
 * Schema for refinancing options.
 */
export const RefinancingOptionSchema = z.object({
  newInterestRate: z
    .number()
    .min(0, { message: "New interest rate cannot be negative" })
    .max(1, { message: "New interest rate cannot exceed 100%" }),
  newTermMonths: z
    .number()
    .int()
    .positive({ message: "New term must be positive" })
    .max(360, { message: "New term cannot exceed 360 months" }),
  closingCosts: z
    .number()
    .min(0, { message: "Closing costs cannot be negative" })
    .max(100_000, { message: "Closing costs cannot exceed $100k" })
    .default(0),
});

/**
 * Schema for student loan analysis input.
 */
export const StudentLoanInputSchema = z.object({
  loans: z
    .array(StudentLoanSchema)
    .min(1, { message: "At least one loan is required" })
    .max(20, { message: "Cannot analyze more than 20 loans" }),
  extraMonthlyPayment: z
    .number()
    .min(0, { message: "Extra payment cannot be negative" })
    .max(1_000_000, { message: "Extra payment cannot exceed $1M" })
    .default(0),
  paymentStrategy: z.enum(["avalanche", "snowball", "standard"]).default("avalanche"),
  incomeDrivenPlan: IncomeDrivenPlanSchema.optional(),
  refinancingOption: RefinancingOptionSchema.optional(),
  forgivenessEligible: z.boolean().optional().default(false),
  forgivenessMonths: z
    .number()
    .int()
    .positive()
    .max(360)
    .optional(),
});

export type StudentLoan = z.infer<typeof StudentLoanSchema>;
export type IncomeDrivenPlan = z.infer<typeof IncomeDrivenPlanSchema>;
export type RefinancingOption = z.infer<typeof RefinancingOptionSchema>;
export type StudentLoanInput = z.infer<typeof StudentLoanInputSchema>;
