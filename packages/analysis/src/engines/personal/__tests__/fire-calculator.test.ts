/**
 * FIRE Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { FIRECalculatorInput } from '../../../schemas/fire-calculator.js';
import { FIRECalculator } from '../fire-calculator.js';

describe('FIRECalculator', () => {
  const baseInput: FIRECalculatorInput = {
    currentSituation: {
      age: 30,
      currentSavings: 50000,
      annualIncome: 100000,
      annualExpenses: 60000,
      monthlySavings: 2000,
    },
    fireGoals: {
      targetAge: 50,
      annualExpensesInRetirement: 60000,
      safeWithdrawalRate: 0.04,
      fireType: 'traditional',
    },
    assumptions: {
      expectedReturn: 0.07,
      inflationRate: 0.03,
      incomeGrowth: 0.03,
      expenseReduction: 0,
    },
    analysis: {
      includeProjections: true,
      includeScenarios: true,
      includeExpenseOptimization: true,
    },
  };

  it('should calculate FIRE number', () => {
    const result = FIRECalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.fireNumber).toBeGreaterThan(0);
    expect(result.fireNumber).toBe(1500000); // 60000 / 0.04
  });

  it('should calculate years to FIRE', () => {
    const result = FIRECalculator.analyze(baseInput);
    expect(result.yearsToFIRE).toBeDefined();
    expect(result.yearsToFIRE.years).toBeGreaterThan(0);
  });

  it('should calculate Coast FIRE', () => {
    const result = FIRECalculator.analyze(baseInput);
    expect(result.coastFIRE).toBeDefined();
    expect(result.coastFIRE.coastFIRENumber).toBeGreaterThan(0);
  });

  it('should calculate Barista FIRE', () => {
    const result = FIRECalculator.analyze(baseInput);
    expect(result.baristaFIRE).toBeDefined();
    expect(result.baristaFIRE.baristaFIRENumber).toBeGreaterThan(0);
  });

  it('should provide projections', () => {
    const result = FIRECalculator.analyze(baseInput);
    expect(result.projections).toBeDefined();
    expect(result.projections?.projections.length).toBeGreaterThan(0);
  });

  it('should analyze scenarios', () => {
    const result = FIRECalculator.analyze(baseInput);
    expect(result.scenarios).toBeDefined();
    expect(result.scenarios?.optimistic).toBeDefined();
    expect(result.scenarios?.base).toBeDefined();
    expect(result.scenarios?.pessimistic).toBeDefined();
  });

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = FIRECalculator.analyze(baseInput);
    
    // Check summary
    expect(result.summary).toBeDefined();
    expect(result.summary.fireNumber).toBeDefined();
    expect(result.summary.yearsToFIRE).toBeDefined();
    expect(result.summary.projectedRetirementAge).toBeDefined();
    expect(result.summary.onTrack).toBeDefined();
    
    // Check recommendations
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.recommendations[0]).toBe('string');
  });
});
