import { getToolMetadata, type ToolCategory } from '@financial-analysis/tools';
import type { CalculatorContextKey } from './calculator-contexts';
import type { ToolSummary } from './types';

const DISABLED_CONTEXTS = new Set<CalculatorContextKey>(['general', 'models']);

const TOOL_NAMES_BY_CONTEXT: Partial<Record<CalculatorContextKey, string[]>> = {
  amortization: ['analyze_amortization'],
  'auto-loan': ['analyze_auto_loan'],
  'student-loans': ['analyze_student_loans'],
  'debt-payoff': ['analyze_debt_payoff'],
  budget: ['optimize_budget'],
  retirement: ['analyze_retirement_savings'],
  'savings-goal': ['analyze_savings_goal'],
  lease: ['analyze_lease', 'analyze_enhanced_lease', 'populate_lease_form'],
  ebitda: ['ebitda_forecasting', 'ebitda_scenario_comparison'],
  'rent-vs-buy': ['analyze_rent_vs_buy'],
  'startup-planning': [
    'analyze_financial_journey',
    'multi_model_scenario_analysis',
    'analyze_cash_flow',
    'ebitda_forecasting',
  ],
};

const TOOL_CATEGORIES_BY_CONTEXT: Partial<Record<CalculatorContextKey, ToolCategory[]>> = {
  'dcf-valuation': ['valuation'],
  'ma-analysis': ['valuation'],
  'risk-management': ['investment'],
  'equipment-lease': ['lease'],
  'invest-vs-payoff-debt': ['scenario', 'loan', 'investment'],
  'mortgage-scenario-planning': ['scenario', 'loan'],
  'credit-card-payoff': ['loan'],
  'break-even': ['business'],
  'cash-flow-forecast': ['business'],
  'business-loan-qualifier': ['business', 'loan'],
  'pricing-strategy': ['business'],
  'saas-metrics': ['business'],
  'unit-economics': ['business'],
  'business-valuation': ['business', 'valuation'],
  'revenue-forecast': ['business'],
  'business-growth': ['business', 'scenario'],
  'side-hustle-income': ['business'],
};

const hasAnyCategory = (
  contextCategories: readonly ToolCategory[],
  toolCategories: readonly ToolCategory[]
): boolean => contextCategories.some((category) => toolCategories.includes(category));

export function filterToolsForContext(
  contextKey: CalculatorContextKey,
  tools: readonly ToolSummary[]
): ToolSummary[] {
  if (DISABLED_CONTEXTS.has(contextKey)) {
    return [];
  }

  const explicitToolNames = TOOL_NAMES_BY_CONTEXT[contextKey];
  if (explicitToolNames?.length) {
    const allowed = new Set(explicitToolNames);
    return tools.filter((tool) => allowed.has(tool.name));
  }

  const contextCategories = TOOL_CATEGORIES_BY_CONTEXT[contextKey];
  if (!contextCategories?.length) {
    return [];
  }

  return tools.filter((tool) => {
    const metadata = getToolMetadata(tool.name);
    return hasAnyCategory(contextCategories, [metadata.category]);
  });
}
