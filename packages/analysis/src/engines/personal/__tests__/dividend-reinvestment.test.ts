import { describe, expect, it } from 'vitest';

import type { DividendReinvestmentInput } from '../../../schemas/dividend-reinvestment.js';
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

  describe('Comprehensive Analysis', () => {
    it('should return a complete analysis object with all required fields', () => {
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

      expect(result).toHaveProperty('endingValue');
      expect(result).toHaveProperty('endingShares');
      expect(result).toHaveProperty('totalContributions');
      expect(result).toHaveProperty('totalDividends');
      expect(result).toHaveProperty('cagr');
      expect(result).toHaveProperty('assumptions');

      expect(result.assumptions).toHaveProperty('initialInvestment');
      expect(result.assumptions).toHaveProperty('sharePrice');
      expect(result.assumptions).toHaveProperty('years');
      expect(result.assumptions).toHaveProperty('annualDividendYield');
      expect(result.assumptions).toHaveProperty('dividendFrequency');
      expect(result.assumptions).toHaveProperty('sharePriceGrowthRate');
      expect(result.assumptions).toHaveProperty('dividendGrowthRate');
      expect(result.assumptions).toHaveProperty('annualContribution');
    });
  });
});

