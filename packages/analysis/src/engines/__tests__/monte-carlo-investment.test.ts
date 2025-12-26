import { describe, expect, it } from 'vitest';

import type { MonteCarloInvestmentInput } from '../../schemas/monte-carlo-investment.js';
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
    expect(r1.endingValue.percentiles['0.05']).toBeLessThanOrEqual(r1.endingValue.percentiles['0.5']);
    expect(r1.endingValue.percentiles['0.5']).toBeLessThanOrEqual(r1.endingValue.percentiles['0.95']);
  });
});

