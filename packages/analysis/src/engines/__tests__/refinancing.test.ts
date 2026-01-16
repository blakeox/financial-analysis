/**
 * Refinancing Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { RefinancingInput } from '../../schemas/refinancing.js';
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

  it('should recommend excellent break-even for shorter-term goals', () => {
    const result = RefinancingCalculator.analyze({
      ...baseInput,
      newMortgage: {
        ...baseInput.newMortgage,
        interestRate: 0.03,
      },
      costs: {
        ...baseInput.costs,
        closingCosts: 1000,
      },
      goals: {
        priority: 'shorter-term',
        includeBreakEvenAnalysis: true,
      },
    });

    expect(result.breakEvenAnalysis?.breakEvenMonths).toBeLessThan(24);
    expect(result.recommendations.some((item) => item.includes('Excellent break-even point'))).toBe(true);
    expect(
      result.recommendations.some((item) =>
        item.includes('Refinancing to shorter term will save significant interest')
      )
    ).toBe(true);
  });

  it('should recommend mid-range break-even timing', () => {
    const result = RefinancingCalculator.analyze({
      ...baseInput,
      newMortgage: {
        ...baseInput.newMortgage,
        interestRate: 0.045,
      },
      costs: {
        ...baseInput.costs,
        closingCosts: 8000,
      },
    });

    expect(result.breakEvenAnalysis?.breakEvenMonths).toBeGreaterThanOrEqual(24);
    expect(result.breakEvenAnalysis?.breakEvenMonths).toBeLessThan(60);
    expect(
      result.recommendations.some((item) =>
        item.includes('consider if you plan to stay in home longer')
      )
    ).toBe(true);
  });

  it('should warn on long break-even with negative savings', () => {
    const result = RefinancingCalculator.analyze({
      ...baseInput,
      newMortgage: {
        ...baseInput.newMortgage,
        interestRate: 0.06,
      },
      costs: {
        ...baseInput.costs,
        closingCosts: 10000,
      },
    });

    expect(result.breakEvenAnalysis?.breakEvenMonths).toBeGreaterThanOrEqual(60);
    expect(result.breakEvenAnalysis?.monthlySavings).toBeLessThanOrEqual(0);
    expect(
      result.recommendations.some((item) =>
        item.includes('may not be worth refinancing unless staying long-term')
      )
    ).toBe(true);
    expect(result.recommendations.some((item) => item.includes('Total net savings:'))).toBe(false);
    expect(result.recommendations.some((item) => item.includes('Total interest savings:'))).toBe(false);
  });
});
