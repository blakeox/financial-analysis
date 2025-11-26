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
export { 
  CacheDocumentTool, 
  SearchDocumentsTool, 
  GetDocumentTool, 
  ClearExpiredDocumentsTool 
} from './tools/autorag-documents';

// MCP Integration
export { createMCPTools, handleMCPRequest } from './mcp/tools';
export type { MCPRequestMethod, MCPTool } from './mcp/tools';

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
