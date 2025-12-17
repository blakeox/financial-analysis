// Tool Modules
export { AmortizationTool } from './tools/amortization';
export { LeaseTool } from './tools/lease';
export { EnhancedLeaseTool } from './tools/enhanced-lease';
export { EbitdaForecastingTool, EbitdaScenarioComparisonTool } from './tools/ebitda-forecasting';
export { InteractiveModelTool } from './tools/interactive-model';
export { BondPricingTool } from './tools/bond-pricing';
export { OptionsPricingTool } from './tools/options-pricing';
export { CashFlowAnalysisTool } from './tools/cash-flow';
export { DebtPayoffTool } from './tools/debt-payoff';
export { SavingsGoalTool } from './tools/savings-goal';
export { StudentLoanTool } from './tools/student-loan';
export { RetirementTool } from './tools/retirement';
export { BudgetTool } from './tools/budget';
export { CollegeSavingsTool } from './tools/college-savings';
export { HomeBuyingAffordabilityTool } from './tools/home-buying-affordability';
export { TaxOptimizationTool } from './tools/tax-optimization';
export { InsuranceNeedsTool } from './tools/insurance-needs';
export { InvestmentPortfolioTool } from './tools/investment-portfolio';
export { FinancialJourneyTool } from './tools/financial-journey';
export { MultiModelScenarioTool } from './tools/multi-model-scenario';
export { MAAnalysisTool } from './tools/ma-analysis';
export { DCFAnalysisTool } from './tools/dcf-analysis';
export { CCAAnalysisTool } from './tools/cca-analysis';
export { PopulateLeaseFormTool } from './tools/populate-lease-form';
export { AutoLoanTool } from './tools/auto-loan';
export { RentVsBuyTool } from './tools/rent-vs-buy';
export { WACCTool } from './tools/wacc';
export { CAPMTool } from './tools/capm';
export { RiskAdjustedReturnsTool } from './tools/risk-adjusted-returns';
export { BreakEvenTool } from './tools/break-even';
export { NPVIRRTool } from './tools/npv-irr';
export { MonteCarloInvestmentTool } from './tools/monte-carlo-investment';
export { DividendReinvestmentTool } from './tools/dividend-reinvestment';
export { FXHedgingTool } from './tools/fx-hedging';
export { ESGScoreTool } from './tools/esg-score';
export { P2PLendingTool } from './tools/p2p-lending';
export { CarbonCreditValuationTool } from './tools/carbon-credit';

// MCP Integration
export { createMCPTools, handleMCPRequest } from './mcp/tools';
export type { MCPRequestMethod, MCPTool } from './mcp/tools';

// Tool Metadata Registry
export {
  toolMetadata,
  getToolMetadata,
  getToolsByCategory,
  getAllCategories,
  categoryDescriptions,
  buildToolCategoryPrompt,
} from './mcp/tool-metadata';
export type { ToolCategory, ToolMetadata } from './mcp/tool-metadata';

// Event Bus
export {
  appEventBus,
  createEventBus,
  getOrCreateGlobalBus,
  GLOBAL_BUS_SYMBOL,
  type AppEventMap,
  type TypedEventBus,
  type EventMap,
  type ChatContextEvent,
  type ChatStateEvent,
  type ChatToolsUpdateEvent,
  type ModelContextEvent,
  type ModelSubmitEvent,
  type ModelErrorEvent,
  type SerializedContext,
} from './event-bus';

// Form Controllers
export { createModelFormController } from './forms/model-form-controller';
export type {
  FormControllerState,
  FormValidationError,
} from './forms/model-form-controller';
