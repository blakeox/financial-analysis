import { describe, expect, it } from 'vitest';

import type { RiskAdjustedReturnsInput } from '../../schemas/risk-adjusted-returns.js';
import { RiskAdjustedReturnsCalculator } from '../risk-adjusted-returns.js';

describe('RiskAdjustedReturnsCalculator', () => {
  it('calculates Sharpe and Sortino ratios', () => {
    const input: RiskAdjustedReturnsInput = {
      returns: [0.01, 0.02, -0.01, 0.015, 0.005],
      riskFreeRate: 0,
      targetReturn: 0,
      periodsPerYear: 252,
    };
    const result = RiskAdjustedReturnsCalculator.analyze(input);
    expect(result.sharpeRatio).not.toBeNull();
    expect(result.sortinoRatio).not.toBeNull();
    expect(result.annualizedVolatility).toBeGreaterThan(0);
  });

  it('returns null Sortino when no downside deviation', () => {
    const input: RiskAdjustedReturnsInput = {
      returns: [0.01, 0.02, 0.015, 0.005],
      riskFreeRate: 0,
      targetReturn: 0,
      periodsPerYear: 252,
    };
    const result = RiskAdjustedReturnsCalculator.analyze(input);
    expect(result.sortinoRatio).toBeNull();
  });

  it('returns null Sharpe when volatility is zero', () => {
    const input: RiskAdjustedReturnsInput = {
      returns: [0.01],
      riskFreeRate: 0,
      targetReturn: 0.02,
      periodsPerYear: 252,
    };
    const result = RiskAdjustedReturnsCalculator.analyze(input);
    expect(result.sharpeRatio).toBeNull();
    expect(result.sortinoRatio).not.toBeNull();
    expect(result.annualizedVolatility).toBe(0);
  });
});
