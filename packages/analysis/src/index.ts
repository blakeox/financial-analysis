export { AmortizationAnalyzer } from './engines/amortization.js';
export { BondPricingAnalyzer } from './engines/bond-pricing.js';
export { BusinessValuationEngine } from './engines/business-valuation.js';
export { CashFlowAnalyzer } from './engines/cash-flow.js';
export { CCAValuationEngine } from './engines/cca-analysis.js';
export { DCFValuationEngine } from './engines/dcf-analysis.js';
export { EbitdaForecaster } from './engines/ebitda-forecasting.js';
export { EnhancedLeaseAnalyzer } from './engines/enhanced-lease.js';
export { FinancialJourneyAnalysisEngine } from './engines/financial-journey.js';
export { InsuranceNeedsCalculator } from './engines/insurance-needs.js';
export { LeaseAnalyzer } from './engines/lease.js';
export { MAAnalysisEngine } from './engines/ma-analysis.js';
export { OptionsPricingAnalyzer } from './engines/options-pricing.js';
export { RevenueForecastEngine } from './engines/revenue-forecast.js';
export { UnitEconomicsEngine } from './engines/unit-economics.js';

// Export amortization functions and types
export {
  buildAmortizationComprehensiveAnalysis,
  computeAmortizationInsights,
} from './engines/amortization.js';
export type {
  AmortizationAnalysisResult,
  AmortizationComprehensiveAnalysis,
  AmortizationComprehensiveSummary,
  AmortizationInsights,
  AmortizationNarrativeInsight,
  AmortizationNarrativeRecommendation,
  AmortizationOptimizationOpportunity,
  AmortizationResultItem,
  AmortizationRiskFactor,
} from './engines/amortization.js';

// Export zod from our dependency for API usage
export { z } from 'zod';

// Export schemas and types for API usage
export {
  AmortizationInputSchema,
  FinancialInputSchema,
  validateFinancialInput,
} from './schemas.js';
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

// M&A analysis schemas and types
export { MAAnalysisInputSchema } from './engines/ma-analysis.js';
export type { MAAnalysisInput, MAAnalysisResult } from './engines/ma-analysis.js';

// DCF valuation schemas and types
export { DCFValuationInputSchema } from './engines/dcf-analysis.js';
export type { DCFValuationInput, DCFValuationResult } from './engines/dcf-analysis.js';

// CCA valuation schemas and types
export { CCAValuationInputSchema } from './engines/cca-analysis.js';
export type { CCAValuationInput, CCAValuationResult } from './engines/cca-analysis.js';

// Financial journey schemas and types
export { FinancialJourneyInputSchema } from './engines/financial-journey.js';
export type { FinancialJourneyInput, FinancialJourneyResult } from './engines/financial-journey.js';

// Insurance needs schemas and types
export { InsuranceNeedsInputSchema } from './engines/insurance-needs.js';
export type { InsuranceNeedsInput, InsuranceNeedsResult } from './engines/insurance-needs.js';

// College savings schemas and types
export { CollegeSavingsPlanner } from './engines/college-savings.js';
export { CollegeSavingsInputSchema } from './schemas/college-savings.js';
export type { CollegeSavingsInput } from './schemas/college-savings.js';

// Home buying schemas and types
export { HomeBuyingAffordabilityCalculator } from './engines/home-buying-affordability.js';
export { HomeBuyingAffordabilityInputSchema } from './schemas/home-buying-affordability.js';
export type { HomeBuyingAffordabilityInput } from './schemas/home-buying-affordability.js';

// Investment portfolio schemas and types
export { InvestmentPortfolioAnalyzer } from './engines/investment-portfolio.js';
export { InvestmentPortfolioInputSchema } from './schemas/investment-portfolio.js';
export type { InvestmentPortfolioInput } from './schemas/investment-portfolio.js';

// Retirement planning schemas and types
export { RetirementPlanningEngine } from './engines/retirement-planning.js';
export { RetirementPlanningInputSchema } from './schemas/retirement-planning.js';
export type { RetirementPlanningInput } from './schemas/retirement-planning.js';

// Tax optimization schemas and types
export { TaxOptimizationPlanner } from './engines/tax-optimization.js';
export { TaxOptimizationInputSchema } from './schemas/tax-optimization.js';
export type { TaxOptimizationInput } from './schemas/tax-optimization.js';

// Business expansion loan schemas and types
export { BusinessExpansionLoanJourney } from './engines/business-expansion-loan.js';
export { BusinessExpansionLoanInputSchema } from './schemas/business-expansion-loan.js';
export type { BusinessExpansionLoanInput } from './schemas/business-expansion-loan.js';

// Business financial health schemas and types
export { BusinessFinancialHealthAnalyzer } from './engines/business-financial-health.js';
export { BusinessFinancialHealthInputSchema } from './schemas/business-financial-health.js';
export type { BusinessFinancialHealthInput } from './schemas/business-financial-health.js';

// Debt capacity schemas and types
export { DebtCapacityCalculator } from './engines/debt-capacity.js';
export { DebtCapacityInputSchema } from './schemas/debt-capacity.js';
export type { DebtCapacityInput } from './schemas/debt-capacity.js';

// DSCR schemas and types
export { DSCRCalculator } from './engines/dscr.js';
export { DSCRInputSchema } from './schemas/dscr.js';
export type { DSCRInput } from './schemas/dscr.js';

// Business loan scenarios schemas and types
export { BusinessLoanScenariosAnalyzer } from './engines/business-loan-scenarios.js';
export { BusinessLoanScenariosInputSchema } from './schemas/business-loan-scenarios.js';
export type { BusinessLoanScenariosInput } from './schemas/business-loan-scenarios.js';

// Unit economics schemas and types
export type {
  CohortAnalysis,
  UnitEconomicsInput,
  UnitEconomicsResult,
} from './engines/unit-economics.js';

// Business valuation schemas and types
export type {
  BusinessValuationInput,
  BusinessValuationResult,
  ValuationMethod,
} from './engines/business-valuation.js';

// Revenue forecast schemas and types
export type {
  MonthlyForecast,
  RevenueForecastInput,
  RevenueForecastResult,
  RevenueStream,
} from './engines/revenue-forecast.js';

// Rent vs Buy schemas and types
export { RentVsBuyCalculator } from './engines/rent-vs-buy.js';
export { FilingStatusSchema, RentVsBuyInputSchema } from './schemas/rent-vs-buy.js';
export type { FilingStatus, RentVsBuyInput } from './schemas/rent-vs-buy.js';
export type {
  ScenarioBreakdown as RentVsBuyBreakdown,
  ComparisonSummary as RentVsBuyComparison,
  RentVsBuyResult,
  ScenarioResult as RentVsBuyScenarioResult,
  YearByYearData as RentVsBuyYearData,
} from './types/rent-vs-buy-result.js';
