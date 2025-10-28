export { AmortizationAnalyzer } from './engines/amortization.js';
export { BondPricingAnalyzer } from './engines/bond-pricing.js';
export { CashFlowAnalyzer } from './engines/cash-flow.js';
export { EbitdaForecaster } from './engines/ebitda-forecasting.js';
export { EnhancedLeaseAnalyzer } from './engines/enhanced-lease.js';
export { LeaseAnalyzer } from './engines/lease.js';
export { OptionsPricingAnalyzer } from './engines/options-pricing.js';

// Export amortization functions and types
export { computeAmortizationInsights } from './engines/amortization.js';
export type {
  AmortizationAnalysisResult,
  AmortizationInsights,
  AmortizationResultItem,
} from './engines/amortization.js';

// Export zod from our dependency for API usage
export { z } from 'zod';

// Export schemas and types for API usage
export { AmortizationInputSchema, FinancialInputSchema } from './schemas.js';
export type { AmortizationInput, FinancialInput } from './schemas.js';

// Enhanced lease schemas and types
export { EnhancedLeaseInputSchema } from './schemas/enhanced-lease.js';
export type {
  AdditionalCosts,
  EnhancedLeaseInput,
  EscalationType,
  LeaseType,
} from './schemas/enhanced-lease.js';
export type { EnhancedLeaseAnalysisResult } from './types/enhanced-lease-result.js';

// Lease extraction schemas and types
export {
  ExtractedLeaseDataSchema,
  LeaseExtractionRequestSchema,
  LeaseExtractionResponseSchema,
  SupportedDocumentTypeSchema,
} from './schemas/lease-extraction.js';
export type {
  ExtractedLeaseData,
  LeaseExtractionRequest,
  LeaseExtractionResponse,
  SupportedDocumentType,
} from './schemas/lease-extraction.js';

// Align Scenario schema with EBITDA forecaster's contract
export { ScenarioInputSchema } from './engines/ebitda-forecasting.js';
export type { EbitdaForecastResult, ScenarioInput } from './engines/ebitda-forecasting.js';
export type { LeaseAnalysisResult } from './engines/lease.js';

// Bond pricing schemas and types
export { BondPricingInputSchema } from './schemas/bond-pricing.js';
export type { BondPricingInput, BondType, CouponFrequency } from './schemas/bond-pricing.js';
export type { BondPricingResult } from './types/bond-pricing-result.js';

// Options pricing schemas and types
export { OptionsPricingInputSchema } from './schemas/options-pricing.js';
export type {
  OptionStyle,
  OptionType,
  OptionsPricingInput,
  PricingModel,
} from './schemas/options-pricing.js';
export type { OptionsPricingResult } from './types/options-pricing-result.js';

// Cash flow analysis schemas and types
export { CashFlowAnalysisInputSchema } from './schemas/cash-flow.js';
export type { CashFlowAnalysisInput, CashFlowType } from './schemas/cash-flow.js';
export type { CashFlowAnalysisResult } from './types/cash-flow-result.js';

// Auto loan schemas and types
export * as AutoLoanEngine from './engines/auto-loan.js';
export { AutoLoanInputSchema } from './schemas/auto-loan.js';
export type { AutoLoanInput } from './schemas/auto-loan.js';
export type { AutoLoanResult } from './types/auto-loan-result.js';

// Debt payoff schemas and types
export * as DebtPayoffEngine from './engines/debt-payoff.js';
export { DebtItemSchema, DebtPayoffInputSchema } from './schemas/debt-payoff.js';
export type { DebtItem, DebtPayoffInput } from './schemas/debt-payoff.js';
export type { DebtPayoffResult } from './types/debt-payoff-result.js';

// Savings goal schemas and types
export * as SavingsGoalEngine from './engines/savings-goal.js';
export { SavingsGoalInputSchema } from './schemas/savings-goal.js';
export type { SavingsGoalInput } from './schemas/savings-goal.js';
export type { SavingsGoalResult } from './types/savings-goal-result.js';

// Student loan schemas and types
export * as StudentLoanEngine from './engines/student-loan.js';
export {
  IncomeDrivenPlanSchema,
  RefinancingOptionSchema,
  StudentLoanInputSchema,
  StudentLoanSchema,
} from './schemas/student-loan.js';
export type {
  IncomeDrivenPlan,
  RefinancingOption,
  StudentLoan,
  StudentLoanInput,
} from './schemas/student-loan.js';
export type { StudentLoanResult } from './types/student-loan-result.js';

// Retirement schemas and types
export * as RetirementEngine from './engines/retirement.js';
export { RetirementAccountSchema, RetirementInputSchema } from './schemas/retirement.js';
export type { RetirementAccount, RetirementInput } from './schemas/retirement.js';
export type { RetirementResult } from './types/retirement-result.js';

// Budget optimizer schemas and types
export * as BudgetEngine from './engines/budget.js';
export {
  BudgetInputSchema,
  DebtObligationSchema,
  ExpenseCategorySchema,
  IncomeSourceSchema,
} from './schemas/budget.js';
export type {
  BudgetInput,
  DebtObligation,
  ExpenseCategory,
  IncomeSource,
} from './schemas/budget.js';
export type { BudgetResult } from './types/budget-result.js';
