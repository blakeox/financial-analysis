import { describe, expect, it } from 'vitest';

import type { MonteCarloInvestmentInput } from '../../../schemas/monte-carlo-investment.js';
import { MonteCarloInvestmentSimulator } from '../monte-carlo-investment.js';

describe('MonteCarloInvestmentSimulator', () => {
  it('is deterministic with a seed', () => {
    const input: MonteCarloInvestmentInput = {
      initialValue: 10000,
      expectedReturn: 0.07,
      volatility: 0.15,
      years: 5,
      stepsPerYear: 12,
      simulations: 2000,
      seed: 123,
      percentiles: [0.05, 0.5, 0.95],
    };

    const r1 = MonteCarloInvestmentSimulator.analyze(input);
    const r2 = MonteCarloInvestmentSimulator.analyze(input);
    expect(r1).toEqual(r2);
    expect(r1.endingValue.percentiles['0.05']).toBeLessThanOrEqual(
      r1.endingValue.percentiles['0.5']
    );
    expect(r1.endingValue.percentiles['0.5']).toBeLessThanOrEqual(
      r1.endingValue.percentiles['0.95']
    );
  });

  describe('Comprehensive Analysis', () => {
    it('should return a complete analysis object with all required fields', () => {
      const input: MonteCarloInvestmentInput = {
        initialValue: 10000,
        expectedReturn: 0.07,
        volatility: 0.15,
        years: 5,
        stepsPerYear: 12,
        simulations: 100,
        seed: 123,
        percentiles: [0.05, 0.5, 0.95],
      };
      const result = MonteCarloInvestmentSimulator.analyze(input);

      expect(result).toHaveProperty('initialValue');
      expect(result).toHaveProperty('expectedReturn');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('years');
      expect(result).toHaveProperty('simulations');
      expect(result).toHaveProperty('stepsPerYear');
      expect(result).toHaveProperty('endingValue');

      expect(result.endingValue).toHaveProperty('mean');
      expect(result.endingValue).toHaveProperty('median');
      expect(result.endingValue).toHaveProperty('min');
      expect(result.endingValue).toHaveProperty('max');
      expect(result.endingValue).toHaveProperty('percentiles');
    });
  });

  it('handles percentile bounds and exact indices', () => {
    const input: MonteCarloInvestmentInput = {
      initialValue: 5000,
      expectedReturn: 0.04,
      volatility: 0.1,
      years: 1,
      stepsPerYear: 1,
      simulations: 2,
      seed: 7,
      percentiles: [0, 0.25, 1, -0.5, 1.5],
    };

    const result = MonteCarloInvestmentSimulator.analyze(input);
    expect(result.endingValue.percentiles['0']).toBeDefined();
    expect(result.endingValue.percentiles['1']).toBeDefined();
    expect(result.endingValue.percentiles['0.25']).toBeDefined();
    expect(result.endingValue.percentiles['-0.5']).toBeDefined();
    expect(result.endingValue.percentiles['1.5']).toBeDefined();
  });

  it('returns NaN percentiles when simulations are zero', () => {
    const input = {
      initialValue: 1000,
      expectedReturn: 0.05,
      volatility: 0.2,
      years: 1,
      stepsPerYear: 12,
      simulations: 0,
      seed: 99,
      percentiles: [0.5],
    } as unknown as MonteCarloInvestmentInput;

    const result = MonteCarloInvestmentSimulator.analyze(input);
    expect(Number.isNaN(result.endingValue.mean)).toBe(true);
    expect(Number.isNaN(result.endingValue.median)).toBe(true);
    expect(Number.isNaN(result.endingValue.percentiles['0.5'])).toBe(true);
    expect(result.endingValue.min).toBe(0);
    expect(result.endingValue.max).toBe(0);
  });
});
