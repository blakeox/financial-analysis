/**
 * Refinancing Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { RefinancingInput } from '../../../schemas/refinancing.js';
import { RefinancingCalculator } from '../refinancing.js';

describe('RefinancingCalculator', () => {
  const baseInput: RefinancingInput = {
    currentMortgage: {
      principalBalance: 300000,
      interestRate: 0.05,
      remainingTerm: 25,
      monthlyPayment: 1753,
    },
    newMortgage: {
      interestRate: 0.04,
      term: 30,
      refinanceType: 'rate-and-term',
      cashOutAmount: 0,
      cashInAmount: 0,
    },
    costs: {
      closingCosts: 5000,
      points: 0,
      appraisalFee: 0,
      otherFees: 0,
    },
    goals: {
      priority: 'lower-rate',
      includeBreakEvenAnalysis: true,
    },
  };

  it('should calculate new loan amount', () => {
    const result = RefinancingCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary.newLoanAmount).toBeGreaterThan(0);
  });

  it('should calculate new monthly payment', () => {
    const result = RefinancingCalculator.analyze(baseInput);
    expect(result.newPayment).toBeDefined();
    expect(result.newPayment.monthlyPayment).toBeGreaterThan(0);
  });

  it('should calculate break-even point', () => {
    const result = RefinancingCalculator.analyze(baseInput);
    expect(result.breakEvenAnalysis).toBeDefined();
    expect(result.breakEvenAnalysis?.breakEvenMonths).toBeGreaterThan(0);
  });

  it('should compare interest costs', () => {
    const result = RefinancingCalculator.analyze(baseInput);
    expect(result.interestComparison).toBeDefined();
    expect(result.interestComparison.totalSavings).toBeDefined();
  });

  it('should calculate net benefit', () => {
    const result = RefinancingCalculator.analyze(baseInput);
    expect(result.netBenefit).toBeDefined();
    expect(result.netBenefit.netSavings).toBeDefined();
  });
});
