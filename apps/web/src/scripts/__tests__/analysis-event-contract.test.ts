import { describe, expect, it } from 'vitest';
import {
  hasAnalysisEngine,
  mapToolNameToModelType,
  normalizeAnalysisResultEventDetail,
} from '../analysis/analysis-event-contract';

describe('analysis-event-contract', () => {
  it('maps analyze_* tool names to calculator model types', () => {
    expect(mapToolNameToModelType('analyze_amortization')).toBe('amortization');
    expect(mapToolNameToModelType('analyze_debt_payoff')).toBe('debt-payoff');
    expect(mapToolNameToModelType('analyze_dcf_valuation')).toBe('dcf-valuation');
  });

  it('applies explicit overrides for irregular tool names', () => {
    expect(mapToolNameToModelType('analyze_ma')).toBe('ma-analysis');
    expect(mapToolNameToModelType('analyze_risk')).toBe('risk-management');
  });

  it('passes through calculator ids used as tool names', () => {
    expect(mapToolNameToModelType('business-valuation')).toBe('business-valuation');
    expect(mapToolNameToModelType('unit-economics')).toBe('unit-economics');
  });

  it('normalizes legacy event detail with toolName only', () => {
    expect(
      normalizeAnalysisResultEventDetail({
        toolName: 'analyze_debt_payoff',
        result: { ok: true },
      })
    ).toEqual({
      modelType: 'debt-payoff',
      toolName: 'analyze_debt_payoff',
      result: { ok: true },
    });
  });

  it('prefers modelType when present on the event detail', () => {
    expect(
      normalizeAnalysisResultEventDetail({
        modelType: 'amortization',
        toolName: 'analyze_amortization',
        result: { monthlyPayment: 1200 },
      })
    ).toEqual({
      modelType: 'amortization',
      toolName: 'analyze_amortization',
      result: { monthlyPayment: 1200 },
    });
  });

  it('identifies calculators with analysis engines', () => {
    expect(hasAnalysisEngine('amortization')).toBe(true);
    expect(hasAnalysisEngine('debt-payoff')).toBe(true);
    expect(hasAnalysisEngine('auto-loan')).toBe(true);
    expect(hasAnalysisEngine('budget')).toBe(true);
    expect(hasAnalysisEngine('retirement')).toBe(true);
    expect(hasAnalysisEngine('savings-goal')).toBe(true);
    expect(hasAnalysisEngine('unit-economics')).toBe(true);
    expect(hasAnalysisEngine('revenue-forecast')).toBe(true);
    expect(hasAnalysisEngine('dcf-valuation')).toBe(true);
    expect(hasAnalysisEngine('saas-metrics')).toBe(true);
    expect(hasAnalysisEngine('rent-vs-buy')).toBe(true);
    expect(hasAnalysisEngine('equipment-lease')).toBe(true);
    expect(hasAnalysisEngine('mortgage-scenario-planning')).toBe(true);
    expect(hasAnalysisEngine('ebitda-forecast')).toBe(true);
    expect(hasAnalysisEngine('business-loan-qualifier')).toBe(true);
    expect(hasAnalysisEngine('roth-vs-traditional-ira')).toBe(true);
    expect(hasAnalysisEngine('emergency-fund')).toBe(true);
    expect(hasAnalysisEngine('fire-calculator')).toBe(true);
    expect(hasAnalysisEngine('insurance-needs')).toBe(true);
    expect(hasAnalysisEngine('disability-insurance')).toBe(true);
    expect(hasAnalysisEngine('tax-loss-harvesting')).toBe(true);
    expect(hasAnalysisEngine('depreciation')).toBe(true);
    expect(hasAnalysisEngine('capital-structure')).toBe(true);
    expect(hasAnalysisEngine('life-insurance-reassessment')).toBe(true);
    expect(hasAnalysisEngine('international-tax-planning')).toBe(true);
    expect(hasAnalysisEngine('supply-chain-finance')).toBe(true);
    expect(hasAnalysisEngine('bond-pricing')).toBe(true);
    expect(hasAnalysisEngine('1031-exchange')).toBe(true);
    expect(hasAnalysisEngine('portfolio-optimization')).toBe(true);
    expect(hasAnalysisEngine('credit-risk')).toBe(true);
    expect(hasAnalysisEngine('options-pricing')).toBe(true);
    expect(hasAnalysisEngine('cryptocurrency-tax')).toBe(true);
    expect(hasAnalysisEngine('business-expansion-loan')).toBe(true);
    expect(hasAnalysisEngine('business-financial-health')).toBe(true);
    expect(hasAnalysisEngine('var')).toBe(true);
    expect(hasAnalysisEngine('revenue-recognition')).toBe(true);
    expect(hasAnalysisEngine('equipment-lease-vs-buy')).toBe(true);
    expect(hasAnalysisEngine('cca-valuation')).toBe(true);
    expect(hasAnalysisEngine('cash-flow')).toBe(true);
    expect(hasAnalysisEngine('employee-stock-options')).toBe(true);
    expect(hasAnalysisEngine('accounts-payable-optimization')).toBe(true);
    expect(hasAnalysisEngine('accounts-receivable-aging')).toBe(true);
    expect(hasAnalysisEngine('inventory-optimization')).toBe(true);
    expect(hasAnalysisEngine('business-succession-planning')).toBe(true);
    expect(hasAnalysisEngine('financial-journey')).toBe(true);
    expect(hasAnalysisEngine('multi-model-scenario')).toBe(true);
    expect(hasAnalysisEngine('unknown-calculator')).toBe(false);
  });
});
