import { describe, expect, it } from 'vitest';

import type { DividendReinvestmentInput } from '../../schemas/dividend-reinvestment.js';
import { DividendReinvestmentCalculator } from '../dividend-reinvestment.js';

describe('DividendReinvestmentCalculator', () => {
  it('models a simple 1-year DRIP scenario', () => {
    const input: DividendReinvestmentInput = {
      initialInvestment: 1000,
      sharePrice: 100,
      years: 1,
      annualDividendYield: 0.04,
      dividendFrequency: 'annual',
      sharePriceGrowthRate: 0,
      dividendGrowthRate: 0,
      annualContribution: 0,
    };

    const result = DividendReinvestmentCalculator.analyze(input);
    expect(result.endingShares).toBeCloseTo(10.4, 10);
    expect(result.endingValue).toBeCloseTo(1040, 10);
    expect(result.totalDividends).toBeCloseTo(40, 10);
    expect(result.cagr).toBeCloseTo(0.04, 10);
  });
});

