export { LeaseAnalyzer } from "./engines/lease.js";
export { EnhancedLeaseAnalyzer } from "./engines/enhanced-lease.js";
export { AmortizationAnalyzer } from "./engines/amortization.js"; 
export { EbitdaForecaster } from "./engines/ebitda-forecasting.js";
export { BondPricingAnalyzer } from "./engines/bond-pricing.js";
export { OptionsPricingAnalyzer } from "./engines/options-pricing.js";
export { CashFlowAnalyzer } from "./engines/cash-flow.js";

// Export amortization functions and types
export { computeAmortizationInsights } from "./engines/amortization.js";
export type { 
  AmortizationInsights, 
  AmortizationAnalysisResult,
  AmortizationResultItem 
} from "./engines/amortization.js";

// Export zod from our dependency for API usage
export { z } from "zod";

// Export schemas and types for API usage
export { FinancialInputSchema, AmortizationInputSchema } from "./schemas.js";
export type { FinancialInput, AmortizationInput } from "./schemas.js";

// Enhanced lease schemas and types
export { EnhancedLeaseInputSchema } from "./schemas/enhanced-lease.js";
export type { EnhancedLeaseInput, LeaseType, EscalationType, AdditionalCosts } from "./schemas/enhanced-lease.js";
export type { EnhancedLeaseAnalysisResult } from "./types/enhanced-lease-result.js";

// Lease extraction schemas and types
export { 
  LeaseExtractionRequestSchema, 
  LeaseExtractionResponseSchema, 
  ExtractedLeaseDataSchema,
  SupportedDocumentTypeSchema 
} from "./schemas/lease-extraction.js";
export type { 
  LeaseExtractionRequest, 
  LeaseExtractionResponse, 
  ExtractedLeaseData,
  SupportedDocumentType 
} from "./schemas/lease-extraction.js";

// Align Scenario schema with EBITDA forecaster's contract
export { ScenarioInputSchema } from "./engines/ebitda-forecasting.js";
export type { ScenarioInput } from "./engines/ebitda-forecasting.js";
export type { LeaseAnalysisResult } from "./engines/lease.js";
export type { EbitdaForecastResult } from "./engines/ebitda-forecasting.js";

// Bond pricing schemas and types
export { BondPricingInputSchema } from "./schemas/bond-pricing.js";
export type { BondPricingInput, BondType, CouponFrequency } from "./schemas/bond-pricing.js";
export type { BondPricingResult } from "./types/bond-pricing-result.js";

// Options pricing schemas and types
export { OptionsPricingInputSchema } from "./schemas/options-pricing.js";
export type { OptionsPricingInput, OptionType, OptionStyle, PricingModel } from "./schemas/options-pricing.js";
export type { OptionsPricingResult } from "./types/options-pricing-result.js";

// Cash flow analysis schemas and types
export { CashFlowAnalysisInputSchema } from "./schemas/cash-flow.js";
export type { CashFlowAnalysisInput, CashFlowType } from "./schemas/cash-flow.js";
export type { CashFlowAnalysisResult } from "./types/cash-flow-result.js";

// Auto loan schemas and types
export { AutoLoanInputSchema } from "./schemas/auto-loan.js";
export type { AutoLoanInput } from "./schemas/auto-loan.js";
export type { AutoLoanResult } from "./types/auto-loan-result.js";
export * as AutoLoanEngine from "./engines/auto-loan.js";

// Debt payoff schemas and types
export { DebtPayoffInputSchema, DebtItemSchema } from "./schemas/debt-payoff.js";
export type { DebtPayoffInput, DebtItem } from "./schemas/debt-payoff.js";
export type { DebtPayoffResult } from "./types/debt-payoff-result.js";
export * as DebtPayoffEngine from "./engines/debt-payoff.js";

// Savings goal schemas and types
export { SavingsGoalInputSchema } from "./schemas/savings-goal.js";
export type { SavingsGoalInput } from "./schemas/savings-goal.js";
export type { SavingsGoalResult } from "./types/savings-goal-result.js";
export * as SavingsGoalEngine from "./engines/savings-goal.js";

// Student loan schemas and types
export { StudentLoanInputSchema, StudentLoanSchema, IncomeDrivenPlanSchema, RefinancingOptionSchema } from "./schemas/student-loan.js";
export type { StudentLoanInput, StudentLoan, IncomeDrivenPlan, RefinancingOption } from "./schemas/student-loan.js";
export type { StudentLoanResult } from "./types/student-loan-result.js";
export * as StudentLoanEngine from "./engines/student-loan.js";

// Retirement schemas and types
export { RetirementInputSchema, RetirementAccountSchema } from "./schemas/retirement.js";
export type { RetirementInput, RetirementAccount } from "./schemas/retirement.js";
export type { RetirementResult } from "./types/retirement-result.js";
export * as RetirementEngine from "./engines/retirement.js";

// Budget optimizer schemas and types
export { BudgetInputSchema, IncomeSourceSchema, ExpenseCategorySchema, DebtObligationSchema } from "./schemas/budget.js";
export type { BudgetInput, IncomeSource, ExpenseCategory, DebtObligation } from "./schemas/budget.js";
export type { BudgetResult } from "./types/budget-result.js";
export * as BudgetEngine from "./engines/budget.js";

