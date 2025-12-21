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

// New Personal Finance Engines
export { FiveTwoNineOptimizer } from './engines/529-optimizer.js';
export { CarLeaseVsBuyCalculator } from './engines/car-lease-vs-buy.js';
export { CharitableGivingOptimizer } from './engines/charitable-giving.js';
export { CreditScoreImpactAnalyzer } from './engines/credit-score-impact.js';
export { DisabilityInsuranceAnalyzer } from './engines/disability-insurance.js';
export { HSAOptimizer } from './engines/hsa-optimization.js';
export { LifeInsuranceReassessmentCalculator } from './engines/life-insurance-reassessment.js';
export { LongTermCareCalculator } from './engines/long-term-care.js';
export { RothVsTraditionalIRACalculator } from './engines/roth-vs-traditional-ira.js';
export { TaxLossHarvestingOptimizer } from './engines/tax-loss-harvesting.js';

// New Business Finance Engines
export { AccountsPayableOptimizer } from './engines/accounts-payable-optimization.js';
export { AccountsReceivableAgingAnalyzer } from './engines/accounts-receivable-aging.js';
export { DepreciationCalculator } from './engines/depreciation.js';
export { EmployeeStockOptionsValuator } from './engines/employee-stock-options.js';
export { EquipmentLeaseVsBuyCalculator } from './engines/equipment-lease-vs-buy.js';
export { FinancialRatioAnalyzer } from './engines/financial-ratio-analyzer.js';
export { FranchiseROICalculator } from './engines/franchise-roi.js';
export { InventoryOptimizer } from './engines/inventory-optimization.js';
export { RevenueRecognitionCalculator } from './engines/revenue-recognition.js';
export { StartupFinancialModel } from './engines/startup-financial-model.js';

// Specialized/Advanced Engines
export { OneZeroThreeOneExchangeAnalyzer } from './engines/1031-exchange.js';
export { BusinessSuccessionPlanningCalculator } from './engines/business-succession-planning.js';
export { CryptocurrencyTaxCalculator } from './engines/cryptocurrency-tax.js';
export { InternationalTaxPlanningOptimizer } from './engines/international-tax-planning.js';
export { SupplyChainFinanceOptimizer } from './engines/supply-chain-finance.js';
export { WACCAnalyzer } from './engines/wacc.js';

// Advanced Derivatives and Risk Management
export { FuturesPricingAnalyzer, ForwardPricingAnalyzer } from './engines/futures.js';
export { InterestRateSwapAnalyzer, CurrencySwapAnalyzer } from './engines/swaps.js';
export { RealOptionsAnalyzer } from './engines/real-options.js';

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
  WACCInputSchema,
} from './schemas.js';
export type { AmortizationInput, FinancialInput, WACCInput } from './schemas.js';

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
export type { WACCResult } from './engines/wacc.js';

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
export { TaxOptimizationInputSchema } from './engines/tax-optimization.js';
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

// Social Security schemas and types
export { SocialSecurityOptimizer } from './engines/social-security.js';
export { SocialSecurityInputSchema } from './schemas/social-security.js';
export type { SocialSecurityInput } from './schemas/social-security.js';

// HELOC schemas and types
export { HELOCAnalyzer } from './engines/heloc.js';
export { HELOCInputSchema } from './schemas/heloc.js';
export type { HELOCInput } from './schemas/heloc.js';

// Refinancing schemas and types
export { RefinancingCalculator } from './engines/refinancing.js';
export { RefinancingInputSchema } from './schemas/refinancing.js';
export type { RefinancingInput } from './schemas/refinancing.js';

// Capital Structure schemas and types
export { CapitalStructureOptimizer } from './engines/capital-structure.js';
export { CapitalStructureInputSchema } from './schemas/capital-structure.js';
export type { CapitalStructureInput } from './schemas/capital-structure.js';

// Project Finance schemas and types
export { ProjectFinanceAnalyzer } from './engines/project-finance.js';
export { ProjectFinanceInputSchema } from './schemas/project-finance.js';
export type { ProjectFinanceInput } from './schemas/project-finance.js';

// Real Estate Investment schemas and types
export { RealEstateInvestmentAnalyzer } from './engines/real-estate-investment.js';
export { RealEstateInvestmentInputSchema } from './schemas/real-estate-investment.js';
export type { RealEstateInvestmentInput } from './schemas/real-estate-investment.js';

// FIRE Calculator schemas and types
export { FIRECalculator } from './engines/fire-calculator.js';
export { FIRECalculatorInputSchema } from './schemas/fire-calculator.js';
export type { FIRECalculatorInput } from './schemas/fire-calculator.js';

// LBO Model schemas and types
export { LBOModel } from './engines/lbo.js';
export { LBOInputSchema } from './schemas/lbo.js';
export type { LBOInput } from './schemas/lbo.js';

// Credit Risk schemas and types
export { CreditRiskAnalyzer } from './engines/credit-risk.js';
export { CreditRiskInputSchema } from './schemas/credit-risk.js';
export type { CreditRiskInput } from './schemas/credit-risk.js';

// Working Capital schemas and types
export { WorkingCapitalOptimizer } from './engines/working-capital.js';
export { WorkingCapitalInputSchema } from './schemas/working-capital.js';
export type { WorkingCapitalInput } from './schemas/working-capital.js';

// VaR Calculator schemas and types
export { VaRCalculator } from './engines/var.js';
export { VaRInputSchema } from './schemas/var.js';
export type { VaRInput } from './schemas/var.js';

// Investment Metrics schemas and types
export { CAPMCalculator } from './engines/capm.js';
export { CAPMInputSchema } from './schemas/capm.js';
export type { CAPMInput } from './schemas/capm.js';

export { RiskAdjustedReturnsCalculator } from './engines/risk-adjusted-returns.js';
export { RiskAdjustedReturnsInputSchema } from './schemas/risk-adjusted-returns.js';
export type { RiskAdjustedReturnsInput } from './schemas/risk-adjusted-returns.js';

export { DividendReinvestmentCalculator } from './engines/dividend-reinvestment.js';
export { DividendReinvestmentInputSchema } from './schemas/dividend-reinvestment.js';
export type { DividendReinvestmentInput } from './schemas/dividend-reinvestment.js';

export { FXHedgingAnalyzer } from './engines/fx-hedging.js';
export { FXHedgingInputSchema } from './schemas/fx-hedging.js';
export type { FXHedgingInput } from './schemas/fx-hedging.js';

export { MonteCarloInvestmentSimulator } from './engines/monte-carlo-investment.js';
export { MonteCarloInvestmentInputSchema } from './schemas/monte-carlo-investment.js';
export type { MonteCarloInvestmentInput } from './schemas/monte-carlo-investment.js';

export { ESGScoringCalculator } from './engines/esg-score.js';
export { ESGScoreInputSchema } from './schemas/esg-score.js';
export type { ESGScoreInput } from './schemas/esg-score.js';

export { P2PLendingAnalyzer } from './engines/p2p-lending.js';
export { P2PLendingInputSchema } from './schemas/p2p-lending.js';
export type { P2PLendingInput } from './schemas/p2p-lending.js';

export { CarbonCreditValuationCalculator } from './engines/carbon-credit.js';
export { CarbonCreditValuationInputSchema } from './schemas/carbon-credit.js';
export type { CarbonCreditValuationInput } from './schemas/carbon-credit.js';

// Business Metrics schemas and types
export { BreakEvenAnalyzer } from './engines/break-even.js';
export { BreakEvenInputSchema } from './schemas/break-even.js';
export type { BreakEvenInput } from './schemas/break-even.js';

export { NPVIRRCalculator } from './engines/npv-irr.js';
export { NPVIRRInputSchema } from './schemas/npv-irr.js';
export type { NPVIRRInput } from './schemas/npv-irr.js';

// Portfolio Optimization schemas and types
export { PortfolioOptimizer } from './engines/portfolio-optimization.js';
export { PortfolioOptimizationInputSchema } from './schemas/portfolio-optimization.js';
export type { PortfolioOptimizationInput } from './schemas/portfolio-optimization.js';

// Estate Planning schemas and types
export { EstatePlanningCalculator } from './engines/estate-planning.js';
export { EstatePlanningInputSchema } from './schemas/estate-planning.js';
export type { EstatePlanningInput } from './schemas/estate-planning.js';

// Emergency Fund schemas and types
export { EmergencyFundCalculator } from './engines/emergency-fund.js';
export { EmergencyFundInputSchema } from './schemas/emergency-fund.js';
export type { EmergencyFundInput } from './schemas/emergency-fund.js';

// Net Worth schemas and types
export { NetWorthTracker } from './engines/net-worth.js';
export { NetWorthInputSchema } from './schemas/net-worth.js';
export type { NetWorthInput } from './schemas/net-worth.js';

// 401(k) Employer Match schemas and types
export { EmployerMatch401kOptimizer } from './engines/401k-match.js';
export { EmployerMatch401kInputSchema } from './schemas/401k-match.js';
export type { EmployerMatch401kInput } from './schemas/401k-match.js';

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

// New Personal Finance Models - Schemas
export { HSAOptimizationInputSchema } from './schemas/hsa-optimization.js';
export type { HSAOptimizationInput } from './schemas/hsa-optimization.js';

export { RothVsTraditionalIRAInputSchema } from './schemas/roth-vs-traditional-ira.js';
export type { RothVsTraditionalIRAInput } from './schemas/roth-vs-traditional-ira.js';

export { TaxLossHarvestingInputSchema } from './schemas/tax-loss-harvesting.js';
export type { TaxLossHarvestingInput } from './schemas/tax-loss-harvesting.js';

export { CharitableGivingInputSchema } from './schemas/charitable-giving.js';
export type { CharitableGivingInput } from './schemas/charitable-giving.js';

export { CarLeaseVsBuyInputSchema } from './schemas/car-lease-vs-buy.js';
export type { CarLeaseVsBuyInput } from './schemas/car-lease-vs-buy.js';

export { LongTermCareInputSchema } from './schemas/long-term-care.js';
export type { LongTermCareInput } from './schemas/long-term-care.js';

export { DisabilityInsuranceInputSchema } from './schemas/disability-insurance.js';
export type { DisabilityInsuranceInput } from './schemas/disability-insurance.js';

export { LifeInsuranceReassessmentInputSchema } from './schemas/life-insurance-reassessment.js';
export type { LifeInsuranceReassessmentInput } from './schemas/life-insurance-reassessment.js';

export { FiveTwoNineOptimizerInputSchema } from './schemas/529-optimizer.js';
export type { FiveTwoNineOptimizerInput } from './schemas/529-optimizer.js';

export { CreditScoreImpactInputSchema } from './schemas/credit-score-impact.js';
export type { CreditScoreImpactInput } from './schemas/credit-score-impact.js';

// New Business Finance Models - Schemas
export { InventoryOptimizationInputSchema } from './schemas/inventory-optimization.js';
export type { InventoryOptimizationInput } from './schemas/inventory-optimization.js';

export { AccountsReceivableAgingInputSchema } from './schemas/accounts-receivable-aging.js';
export type { AccountsReceivableAgingInput } from './schemas/accounts-receivable-aging.js';

export { FinancialRatioAnalyzerInputSchema } from './schemas/financial-ratio-analyzer.js';
export type { FinancialRatioAnalyzerInput } from './schemas/financial-ratio-analyzer.js';

export { DepreciationInputSchema } from './schemas/depreciation.js';
export type { DepreciationInput } from './schemas/depreciation.js';

export { EquipmentLeaseVsBuyInputSchema } from './schemas/equipment-lease-vs-buy.js';
export type { EquipmentLeaseVsBuyInput } from './schemas/equipment-lease-vs-buy.js';

export { RevenueRecognitionInputSchema } from './schemas/revenue-recognition.js';
export type { RevenueRecognitionInput } from './schemas/revenue-recognition.js';

export { EmployeeStockOptionsInputSchema } from './schemas/employee-stock-options.js';
export type { EmployeeStockOptionsInput } from './schemas/employee-stock-options.js';

export { FranchiseROIInputSchema } from './schemas/franchise-roi.js';
export type { FranchiseROIInput } from './schemas/franchise-roi.js';

export { StartupFinancialModelInputSchema } from './schemas/startup-financial-model.js';
export type { StartupFinancialModelInput } from './schemas/startup-financial-model.js';

export { AccountsPayableOptimizationInputSchema } from './schemas/accounts-payable-optimization.js';
export type { AccountsPayableOptimizationInput } from './schemas/accounts-payable-optimization.js';

// Specialized/Advanced Models - Schemas
export { CryptocurrencyTaxInputSchema } from './schemas/cryptocurrency-tax.js';
export type { CryptocurrencyTaxInput } from './schemas/cryptocurrency-tax.js';

export { InternationalTaxPlanningInputSchema } from './schemas/international-tax-planning.js';
export type { InternationalTaxPlanningInput } from './schemas/international-tax-planning.js';

export { OneZeroThreeOneExchangeInputSchema } from './schemas/1031-exchange.js';
export type { OneZeroThreeOneExchangeInput } from './schemas/1031-exchange.js';

export { BusinessSuccessionPlanningInputSchema } from './schemas/business-succession-planning.js';
export type { BusinessSuccessionPlanningInput } from './schemas/business-succession-planning.js';

export { SupplyChainFinanceInputSchema } from './schemas/supply-chain-finance.js';
export type { SupplyChainFinanceInput } from './schemas/supply-chain-finance.js';
