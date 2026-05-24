/**
 * Shared contract for calculator analysis result events.
 */

/** Model types with a real FinancialAnalysisEngine implementation in the impact summary rail. */
export const ANALYSIS_ENGINE_MODEL_TYPES = [
  'amortization',
  'lease',
  'investment-portfolio',
  'debt-payoff',
  'auto-loan',
  'budget',
  'retirement',
  'savings-goal',
  'unit-economics',
  'business-valuation',
  'revenue-forecast',
  'student-loans',
  'dcf-valuation',
  'risk-management',
  'ma-analysis',
  'saas-metrics',
  'rent-vs-buy',
  'credit-card-payoff',
  'break-even',
  'cash-flow-forecast',
  'invest-vs-payoff-debt',
  'equipment-lease',
  'mortgage-scenario-planning',
  'ebitda-forecast',
  'business-loan-qualifier',
  'pricing-strategy',
  'side-hustle-income',
  'roth-vs-traditional-ira',
  'emergency-fund',
  'net-worth',
  'fire-calculator',
  'business-loan-scenarios',
  'refinancing',
  'heloc',
  'car-lease-vs-buy',
  'startup-financial-model',
  'social-security',
  '401k-match',
  'hsa-optimization',
  '529-optimizer',
  'home-buying-affordability',
  'dscr',
  'debt-capacity',
  'real-estate-investment',
  'college-savings',
  'retirement-planning',
  'credit-score-impact',
  'estate-planning',
  'long-term-care',
  'project-finance',
  'lbo',
  'charitable-giving',
  'tax-optimization',
  'working-capital',
  'franchise-roi',
  'financial-ratio-analyzer',
  'insurance-needs',
  'disability-insurance',
  'tax-loss-harvesting',
  'depreciation',
  'capital-structure',
  'life-insurance-reassessment',
  'international-tax-planning',
  'supply-chain-finance',
  'bond-pricing',
  '1031-exchange',
  'portfolio-optimization',
  'credit-risk',
  'options-pricing',
  'cryptocurrency-tax',
  'business-expansion-loan',
  'business-financial-health',
  'var',
  'revenue-recognition',
  'equipment-lease-vs-buy',
  'cca-valuation',
  'cash-flow',
  'employee-stock-options',
  'accounts-payable-optimization',
  'accounts-receivable-aging',
  'inventory-optimization',
  'business-succession-planning',
  'financial-journey',
  'multi-model-scenario',
] as const;

/** toolName values that store results but intentionally have no impact-summary engine yet. */
export const ANALYSIS_STORE_WITHOUT_ENGINE = [] as const;

export type AnalysisEngineModelType = (typeof ANALYSIS_ENGINE_MODEL_TYPES)[number];

/** toolName values that do not map cleanly via analyze_* → kebab-case. */
export const TOOL_NAME_TO_MODEL_TYPE_OVERRIDES: Record<string, string> = {
  analyze_ma: 'ma-analysis',
  analyze_risk: 'risk-management',
  multi_model_scenario_analysis: 'multi-model-scenario',
};

export interface AnalysisResultEventDetail {
  modelType: string;
  result: unknown;
  toolName: string;
}

export function mapToolNameToModelType(toolName: string): string {
  if (TOOL_NAME_TO_MODEL_TYPE_OVERRIDES[toolName]) {
    return TOOL_NAME_TO_MODEL_TYPE_OVERRIDES[toolName];
  }

  if (toolName.startsWith('analyze_')) {
    return toolName.slice('analyze_'.length).replace(/_/g, '-');
  }

  return toolName;
}

export function hasAnalysisEngine(modelType: string): modelType is AnalysisEngineModelType {
  return (ANALYSIS_ENGINE_MODEL_TYPES as readonly string[]).includes(modelType);
}

export function normalizeAnalysisResultEventDetail(
  detail: unknown
): AnalysisResultEventDetail | null {
  if (!detail || typeof detail !== 'object') return null;

  const record = detail as Record<string, unknown>;
  const result = record.result;
  if (result === undefined) return null;

  const toolName =
    typeof record.toolName === 'string'
      ? record.toolName
      : typeof record.tool === 'string'
        ? record.tool
        : undefined;

  const modelType =
    typeof record.modelType === 'string'
      ? record.modelType
      : toolName
        ? mapToolNameToModelType(toolName)
        : undefined;

  if (!modelType) return null;

  return {
    modelType,
    result,
    toolName: toolName ?? modelType,
  };
}

export function dispatchAnalysisResultUpdated(detail: AnalysisResultEventDetail): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('analysis-result-updated', { detail }));
  document.dispatchEvent(new CustomEvent('analysis-result-updated', { detail }));
}
