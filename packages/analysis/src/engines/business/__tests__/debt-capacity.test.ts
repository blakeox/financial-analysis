import { describe, expect, it } from 'vitest';
import type { DebtCapacityInput } from '../../../schemas/debt-capacity.js';
import { DebtCapacityCalculator } from '../debt-capacity.js';

describe('DebtCapacityCalculator', () => {
  const baseInput: DebtCapacityInput = {
    financials: {
      annualEBITDA: 500_000,
      monthlyDebtPayments: 10_000,
      expectedEBITDAIncrease: 50_000,
    },
    loanPreferences: {
      preferredTerm: 5,
      loanType: 'term-loan',
    },
    requestedAmount: 300_000,
  };

  it('calculates max loan and recommended amount', () => {
    const result = DebtCapacityCalculator.analyze(baseInput) as any;

    expect(result.maxLoanAmount).toBeGreaterThan(0);
    expect(result.recommendedLoanAmount).toBeGreaterThan(0);
    expect(result.recommendedLoanAmount).toBeLessThan(result.maxLoanAmount);
  });

  it('uses preferred rate when provided', () => {
    const input: DebtCapacityInput = {
      ...baseInput,
      loanPreferences: {
        ...baseInput.loanPreferences,
        preferredRate: 0.06,
        loanType: 'term-loan',
      },
    };

    const result = DebtCapacityCalculator.analyze(input) as any;

    expect(result.maxLoanAmount).toBeGreaterThan(0);
  });

  it('falls back to market rate when preferred rate is missing', () => {
    const input: DebtCapacityInput = {
      ...baseInput,
      loanPreferences: {
        preferredTerm: 5,
        loanType: 'sba',
      },
    };

    const result = DebtCapacityCalculator.analyze(input) as any;

    expect(result.maxLoanAmount).toBeGreaterThan(0);
  });

  it('includes requested amount comparison when provided', () => {
    const result = DebtCapacityCalculator.analyze(baseInput) as any;

    expect(result.debtCapacityRatio).toBeGreaterThan(0);
    expect(result.factors).toBeInstanceOf(Array);
    expect(result.factors.length).toBeGreaterThan(0);
  });

  it('returns undefined debtCapacityRatio when no requested amount', () => {
    const input: DebtCapacityInput = {
      ...baseInput,
      requestedAmount: undefined,
    };

    const result = DebtCapacityCalculator.analyze(input) as any;

    expect(result.debtCapacityRatio).toBeUndefined();
    expect(result.factors).toEqual([]);
  });

  it('handles insufficient capacity for requested loan', () => {
    const input: DebtCapacityInput = {
      ...baseInput,
      requestedAmount: 5_000_000,
    };

    const result = DebtCapacityCalculator.analyze(input) as any;

    expect(result.maxLoanAmount).toBeLessThan(input.requestedAmount!);
    expect(result.factors.join(' ')).toContain('Maximum loan capacity');
  });

  it('includes assumptions in output', () => {
    const result = DebtCapacityCalculator.analyze(baseInput) as any;

    expect(result.assumptions).toBeDefined();
    expect(result.assumptions.targetDSCR).toBe(1.5);
    expect(result.assumptions.ebitda).toBeGreaterThan(0);
    expect(result.assumptions.currentDebtService).toBeGreaterThan(0);
    expect(result.assumptions.availableForNewDebt).toBeDefined();
  });
});
