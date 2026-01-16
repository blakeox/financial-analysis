import { describe, expect, it } from 'vitest';

import type { RiskAdjustedReturnsInput } from '../../../schemas/risk-adjusted-returns.js';
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

  describe('Comprehensive Analysis', () => {
    it('should return a complete analysis object with all required fields', () => {
      const input: RiskAdjustedReturnsInput = {
        returns: [0.01, 0.02, -0.01, 0.015, 0.005],
        riskFreeRate: 0,
        targetReturn: 0,
        periodsPerYear: 252,
      };
      const result = RiskAdjustedReturnsCalculator.analyze(input);

      expect(result).toHaveProperty('averageReturn');
      expect(result).toHaveProperty('annualizedReturn');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('annualizedVolatility');
      expect(result).toHaveProperty('downsideDeviation');
      expect(result).toHaveProperty('annualizedDownsideDeviation');
      expect(result).toHaveProperty('sharpeRatio');
      expect(result).toHaveProperty('sortinoRatio');
    });
  });
});

