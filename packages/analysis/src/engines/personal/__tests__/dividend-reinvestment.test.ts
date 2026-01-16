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

  it('handles monthly contributions and growth', () => {
    const input: DividendReinvestmentInput = {
      initialInvestment: 5000,
      sharePrice: 50,
      years: 2,
      annualDividendYield: 0.03,
      dividendFrequency: 'monthly',
      sharePriceGrowthRate: 0.04,
      dividendGrowthRate: 0.02,
      annualContribution: 1200,
    };

    const result = DividendReinvestmentCalculator.analyze(input);
    expect(result.totalContributions).toBeCloseTo(7400, 6);
    expect(result.endingShares).toBeGreaterThan(100);
    expect(result.totalDividends).toBeGreaterThan(0);
    expect(result.cagr).not.toBeNull();
  });

  it('returns zero values when share price is zero', () => {
    const input: DividendReinvestmentInput = {
      initialInvestment: 0,
      sharePrice: 0,
      years: 1,
      annualDividendYield: 0.05,
      dividendFrequency: 'quarterly',
      sharePriceGrowthRate: 0,
      dividendGrowthRate: 0,
      annualContribution: 0,
    };

    const result = DividendReinvestmentCalculator.analyze(input);
    expect(result.endingShares).toBe(0);
    expect(result.endingValue).toBe(0);
    expect(result.totalDividends).toBe(0);
    expect(result.cagr).toBeNull();
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

