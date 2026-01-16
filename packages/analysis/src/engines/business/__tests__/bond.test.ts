import { describe, it, expect } from 'vitest';
import { BondAnalyzer, BondSchema } from '../bond.js';

describe('Bond Schema', () => {
  it('should validate valid bond input', () => {
    const validBond = {
      faceValue: 1000,
      couponRate: 0.05,
      maturity: 10,
      frequency: 2,
      bondType: 'corporate',
    };
    expect(() => BondSchema.parse(validBond)).not.toThrow();
  });

  it('should reject invalid bond input', () => {
    const invalidBond = {
      faceValue: -1000,
      couponRate: 0.05,
      maturity: 10,
      frequency: 2,
      bondType: 'corporate',
    };
    expect(() => BondSchema.parse(invalidBond)).toThrow();
  });

  it('should reject unsupported coupon frequency', () => {
    const invalidFrequencyBond = {
      faceValue: 1000,
      couponRate: 0.05,
      maturity: 10,
      frequency: 3,
      bondType: 'corporate',
    };

    expect(() => BondSchema.parse(invalidFrequencyBond)).toThrow(/Frequency must be 1, 2, 4, or 12/);
  });
});

describe('BondAnalyzer', () => {
  const yieldCurve = {
    points: [
      { maturity: 1, yield: 0.04 },
      { maturity: 5, yield: 0.05 },
      { maturity: 10, yield: 0.06 },
    ],
    curveType: 'treasury' as const,
    asOfDate: '2026-01-01',
    interpolationMethod: 'linear' as const,
  };

  it('prices a par bond near 100 when coupon equals yield', () => {
    const result = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0.06,
        maturity: 10,
        frequency: 2,
        bondType: 'treasury',
      },
      marketData: { yieldCurve },
    });

    expect(result.price).toBeCloseTo(100, 2);
    expect(result.accruedInterest).toBe(0);
    expect(result.dirtyPrice).toBeCloseTo(result.price, 4);
    expect(result.yieldToMaturity).toBeCloseTo(0.06, 6);
    expect(result.yieldToWorst).toBeCloseTo(result.yieldToMaturity, 6);
    expect(result.cashFlows.length).toBeGreaterThan(0);
  });

  it('derives YTM from current price when provided', () => {
    const result = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0.05,
        maturity: 10,
        frequency: 2,
        bondType: 'treasury',
        currentPrice: 100,
      },
      marketData: { yieldCurve },
    });

    expect(result.yieldToMaturity).toBeCloseTo(0.05, 6);
    expect(result.price).toBe(100);
  });

  it('includes option analysis for callable bonds', () => {
    const result = BondAnalyzer.analyze({
      bond: {
        faceValue: 100,
        couponRate: 0.05,
        maturity: 10,
        frequency: 2,
        bondType: 'callable',
        callableDate: 2,
        callPrice: 100,
      },
      marketData: {
        yieldCurve,
        volatility: 0.2,
      },
      analysis: {
        includeOptionAnalysis: true,
        includeRiskMetrics: true,
        includeSensitivityAnalysis: true,
        scenarioShifts: [-100, 0, 100],
        keyRateMaturities: [1, 2, 5, 10],
      },
    });

    expect(result.optionValue).toEqual(expect.any(Number));
    expect(result.straightBondPrice).toEqual(expect.any(Number));
    expect(result.optionCost).toEqual(expect.any(Number));
  });

  it('prices zero-coupon bonds and sets duration to maturity', () => {
    const result = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0,
        maturity: 5,
        frequency: 1,
        bondType: 'zero-coupon',
      },
      marketData: { yieldCurve },
    });

    const expectedPrice = 100 / Math.pow(1 + 0.05, 5);
    expect(result.price).toBeCloseTo(expectedPrice, 2);
    expect(result.macaulayDuration).toBeCloseTo(5, 4);
  });

  it('handles puttable bonds with option analysis enabled', () => {
    const result = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0.055,
        maturity: 7,
        frequency: 2,
        bondType: 'puttable',
        puttableDate: 3,
        putPrice: 1020,
      },
      marketData: {
        yieldCurve,
        volatility: 0.18,
      },
      analysis: {
        includeOptionAnalysis: true,
        includeRiskMetrics: true,
        includeSensitivityAnalysis: true,
        scenarioShifts: [-100, 0, 100],
        keyRateMaturities: [1, 3, 5, 7],
      },
    });

    expect(result.yieldToPut).toBeDefined();
    expect(result.optionValue).toEqual(expect.any(Number));
    expect(result.optionCost).toEqual(expect.any(Number));
  });

  it('omits option metrics when option analysis is disabled', () => {
    const result = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0.06,
        maturity: 8,
        frequency: 2,
        bondType: 'callable',
        callableDate: 3,
        callPrice: 1010,
      },
      marketData: { yieldCurve },
      analysis: {
        includeOptionAnalysis: false,
        includeRiskMetrics: true,
        includeSensitivityAnalysis: true,
        scenarioShifts: [-50, 0, 50],
        keyRateMaturities: [1, 2, 5, 8],
      },
    });

    expect(result.optionValue).toBeUndefined();
    expect(result.optionCost).toBeUndefined();
    expect(result.straightBondPrice).toBeUndefined();
  });

  it('uses yield curve endpoints for extrapolation and credit ratings for spread', () => {
    const shortResult = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0.04,
        maturity: 0.5,
        frequency: 2,
        bondType: 'corporate',
      },
      marketData: { yieldCurve },
    });

    const longResult = BondAnalyzer.analyze({
      bond: {
        faceValue: 1000,
        couponRate: 0.04,
        maturity: 20,
        frequency: 2,
        bondType: 'corporate',
        creditRating: 'BB',
      },
      marketData: { yieldCurve },
    });

    expect(shortResult.yieldToMaturity).toBeCloseTo(0.04, 6);
    expect(longResult.yieldToMaturity).toBeGreaterThan(0.06);
  });

  it('analyzes bond portfolios with scenario impacts and exposures', () => {
    const bondA = {
      faceValue: 1000,
      couponRate: 0.045,
      maturity: 5,
      frequency: 2,
      bondType: 'corporate' as const,
      creditRating: 'AA' as const,
      sector: 'financial' as const,
    };

    const bondB = {
      faceValue: 1000,
      couponRate: 0.06,
      maturity: 12,
      frequency: 2,
      bondType: 'corporate' as const,
      creditRating: 'BBB' as const,
      sector: 'industrial' as const,
    };

    const portfolioResult = BondAnalyzer.analyzePortfolio([
      {
        bond: bondA,
        weight: 0.7,
        input: {
          bond: bondA,
          marketData: { yieldCurve },
        },
      },
      {
        bond: bondB,
        weight: 0.3,
        input: {
          bond: bondB,
          marketData: { yieldCurve },
        },
      },
    ]);

    expect(portfolioResult.totalValue).toBeGreaterThan(0);
    expect(portfolioResult.scenarios.length).toBeGreaterThan(0);
    expect(portfolioResult.creditRisk.creditExposure.AA).toBeCloseTo(0.7, 4);
    expect(portfolioResult.creditRisk.sectorExposure.financial).toBeCloseTo(0.7, 4);
    expect(portfolioResult.averageCreditRating).toBe('AA');
  });
});
