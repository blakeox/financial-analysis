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

// MCP Integration
export { createMCPTools, handleMCPRequest } from './mcp/tools';
export type { MCPRequestMethod } from './mcp/tools';

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
