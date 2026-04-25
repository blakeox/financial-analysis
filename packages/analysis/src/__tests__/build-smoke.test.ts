import { describe, expect, it } from 'vitest';

const loadDistModule = async () => {
  return await import('../../dist/index.js');
};

describe('analysis package build smoke', () => {
  it('exposes primary analyzers via compiled entry', async () => {
    const mod = await loadDistModule();
    expect(mod).toHaveProperty('LeaseAnalyzer');
    expect(typeof mod.LeaseAnalyzer.analyze).toBe('function');
    expect(mod).toHaveProperty('CashFlowAnalyzer');
    expect(mod).toHaveProperty('BusinessExpansionLoanJourney');
    expect(typeof mod.BusinessExpansionLoanJourney.analyze).toBe('function');
    expect(mod).toHaveProperty('DebtCapacityCalculator');
    expect(typeof mod.DebtCapacityCalculator.analyze).toBe('function');
  });

  it('preserves schema exports for downstream consumers', async () => {
    const mod = await loadDistModule();
    expect(mod).toHaveProperty('FinancialInputSchema');
    expect(mod).toHaveProperty('AmortizationInputSchema');
    expect(mod).toHaveProperty('BusinessExpansionLoanInputSchema');
    expect(mod).toHaveProperty('DebtCapacityInputSchema');
    expect(mod).toHaveProperty('RetirementPlanningInputSchema');
  });
});
