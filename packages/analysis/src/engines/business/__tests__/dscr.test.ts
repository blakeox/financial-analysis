import { describe, expect, it } from 'vitest';
import type { DSCRInput } from '../../../schemas/dscr.js';
import { DSCRCalculator } from '../dscr.js';

describe('DSCRCalculator', () => {
  const baseInput: DSCRInput = {
    ebitda: 500000,
    annualDebtService: 300000,
    existingDebtService: 300000,
    newLoanPayment: 5000, // Monthly
  };

  it('should return all required fields in the analysis result', () => {
    const result = DSCRCalculator.analyze(baseInput) as any;

    expect(result).toHaveProperty('ratio');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('interpretation');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('breakdown');
    expect(result).toHaveProperty('targetRatio');
    expect(result).toHaveProperty('margin');
  });

  it('should calculate total debt service including new loan', () => {
    const result = DSCRCalculator.analyze(baseInput) as any;

    expect(result.breakdown.newLoanDebtService).toBe(60000);
    expect(result.breakdown.totalDebtService).toBe(360000);
    expect(result.ratio).toBeCloseTo(500000 / 360000, 6);
  });

  it('returns excellent status for ratio >= 1.5', () => {
    const input: DSCRInput = {
      ...baseInput,
      ebitda: 600000,
      annualDebtService: 300000,
      newLoanPayment: 0,
    };

    const result = DSCRCalculator.analyze(input) as any;

    expect(result.status).toBe('excellent');
    expect(result.interpretation).toContain('Strong');
    expect(result.recommendations[0]).toContain('Excellent DSCR');
  });

  it('returns good status for ratio >= 1.25 and < 1.5', () => {
    const input: DSCRInput = {
      ...baseInput,
      ebitda: 375000,
      annualDebtService: 300000,
      newLoanPayment: 0,
    };

    const result = DSCRCalculator.analyze(input) as any;

    expect(result.status).toBe('good');
    expect(result.interpretation).toContain('Adequate');
    expect(result.recommendations[0]).toContain('Good DSCR');
  });

  it('returns marginal status for ratio >= 1.0 and < 1.25', () => {
    const input: DSCRInput = {
      ...baseInput,
      ebitda: 310000,
      annualDebtService: 300000,
      newLoanPayment: 0,
    };

    const result = DSCRCalculator.analyze(input) as any;

    expect(result.status).toBe('marginal');
    expect(result.interpretation).toContain('Minimal');
    expect(result.recommendations.length).toBeGreaterThan(1);
    expect(result.recommendations.join(' ')).toContain('Target');
  });

  it('returns poor status for ratio < 1.0', () => {
    const input: DSCRInput = {
      ...baseInput,
      ebitda: 200000,
      annualDebtService: 300000,
      newLoanPayment: 0,
    };

    const result = DSCRCalculator.analyze(input) as any;

    expect(result.status).toBe('poor');
    expect(result.interpretation).toContain('Insufficient');
    expect(result.recommendations.length).toBeGreaterThan(1);
    expect(result.recommendations.join(' ')).toContain('Critical');
  });

  it('returns large ratio when total debt service is zero', () => {
    const input: DSCRInput = {
      ebitda: 100000,
      annualDebtService: 0,
      existingDebtService: 0,
    };

    const result = DSCRCalculator.analyze(input) as any;

    expect(result.ratio).toBe(999);
    expect(result.breakdown.totalDebtService).toBe(0);
  });
});
