import { describe, it, expect } from 'vitest';
import { BondPricingAnalyzer } from '../bond-pricing';
import type { BondPricingInput } from '../../../schemas/bond-pricing';

describe('BondPricingAnalyzer', () => {
  const basicInput: BondPricingInput = {
    bondType: 'corporate',
    faceValue: 1000,
    couponRate: 0.05, // 5%
    couponFrequency: 'semi-annual',
    issueDate: '2020-01-01',
    maturityDate: '2030-01-01',
    yieldToMaturity: 0.06, // 6%
    dayCountConvention: 'actual-365',
    taxRate: 0,
    stateTaxRate: 0,
    isTaxExempt: false,
  };

  const longDurationInput: BondPricingInput = {
    ...basicInput,
    couponRate: 0.02,
    couponFrequency: 'annual',
    maturityDate: '2055-01-01',
    yieldToMaturity: 0.01,
    dayCountConvention: 'actual-actual',
  };

  const shortDurationInput: BondPricingInput = {
    ...basicInput,
    maturityDate: '2023-01-01',
    yieldToMaturity: 0.05,
  };

  describe('basic bond pricing', () => {
    it('calculates bond price', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.metrics.price).toBeGreaterThan(0);
    });

    it('bond trading at discount when YTM > coupon rate', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      // YTM (6%) > coupon (5%), so price should be below par
      expect(result.metrics.price).toBeLessThan(basicInput.faceValue);
    });

    it('bond trading at premium when YTM < coupon rate', () => {
      const premiumInput: BondPricingInput = {
        ...basicInput,
        yieldToMaturity: 0.04, // 4% < 5% coupon
      };

      const result = BondPricingAnalyzer.analyze(premiumInput);

      expect(result.metrics.price).toBeGreaterThan(basicInput.faceValue);
    });

    it('bond at par when YTM equals coupon rate', () => {
      const parInput: BondPricingInput = {
        ...basicInput,
        yieldToMaturity: 0.05, // Equal to coupon
      };

      const result = BondPricingAnalyzer.analyze(parInput);

      // Should be very close to face value
      expect(result.metrics.price).toBeCloseTo(basicInput.faceValue, -1);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result).toHaveProperty('bondType');
      expect(result).toHaveProperty('faceValue');
      expect(result).toHaveProperty('couponRate');
      expect(result).toHaveProperty('issueDate');
      expect(result).toHaveProperty('maturityDate');
      expect(result).toHaveProperty('settlementDate');
      expect(result).toHaveProperty('yearsToMaturity');
      expect(result).toHaveProperty('remainingPayments');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('couponSchedule');
      expect(result).toHaveProperty('sensitivityAnalysis');
      expect(result).toHaveProperty('riskMetrics');
      expect(result).toHaveProperty('insights');
    });
  });

  describe('coupon schedule', () => {
    it('generates coupon schedule for coupon-paying bond', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.couponSchedule).toBeDefined();
      expect(result.couponSchedule.length).toBeGreaterThan(0);
    });

    it('coupon schedule has correct coupon amount', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      if (result.couponSchedule.length > 0) {
        const couponPayment = result.couponSchedule[0]!;
        // Semi-annual coupon = 1000 * 5% / 2 = 25
        expect(couponPayment.couponAmount).toBeCloseTo(25, 0);
      }
    });

    it('zero-coupon bond has no coupon schedule', () => {
      const zeroCouponInput: BondPricingInput = {
        ...basicInput,
        bondType: 'zero-coupon',
        couponRate: 0,
      };

      const result = BondPricingAnalyzer.analyze(zeroCouponInput);

      expect(result.couponSchedule).toHaveLength(0);
    });
  });

  describe('bond metrics', () => {
    it('calculates macaulay duration', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.metrics.macaulayDuration).toBeGreaterThan(0);
    });

    it('calculates modified duration', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.metrics.modifiedDuration).toBeGreaterThan(0);
      // Modified duration should be less than Macaulay duration
      expect(result.metrics.modifiedDuration).toBeLessThan(result.metrics.macaulayDuration);
    });

    it('calculates convexity', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.metrics.convexity).toBeGreaterThan(0);
    });

    it('calculates current yield', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.metrics.currentYield).toBeGreaterThan(0);
    });

    it('calculates DV01', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.metrics.dv01).toBeGreaterThan(0);
    });
  });

  describe('sensitivity analysis', () => {
    it('generates price-yield curve', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.sensitivityAnalysis.priceYieldCurve).toBeDefined();
      expect(result.sensitivityAnalysis.priceYieldCurve.length).toBeGreaterThan(0);
    });

    it('price decreases as yield increases', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      const curve = result.sensitivityAnalysis.priceYieldCurve;
      const lowYield = curve.find(p => p.yield < 0.05);
      const highYield = curve.find(p => p.yield > 0.07);

      if (lowYield && highYield) {
        expect(lowYield.price).toBeGreaterThan(highYield.price);
      }
    });

    it('generates duration analysis', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.sensitivityAnalysis.durationAnalysis).toBeDefined();
      expect(result.sensitivityAnalysis.durationAnalysis.length).toBeGreaterThan(0);
    });
  });

  describe('risk metrics', () => {
    it('assesses interest rate risk', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.riskMetrics.interestRateRisk).toBeDefined();
      expect(['High', 'Medium', 'Low']).toContain(result.riskMetrics.interestRateRisk);
    });

    it('assesses reinvestment risk', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.riskMetrics.reinvestmentRisk).toBeDefined();
      expect(['High', 'Medium', 'Low']).toContain(result.riskMetrics.reinvestmentRisk);
    });

    it('includes credit risk rating', () => {
      const ratedInput: BondPricingInput = {
        ...basicInput,
        creditRating: 'AA',
      };

      const result = BondPricingAnalyzer.analyze(ratedInput);

      expect(result.riskMetrics.creditRisk).toBe('AA');
    });

    it('classifies long duration bonds as high interest rate risk', () => {
      const result = BondPricingAnalyzer.analyze(longDurationInput);

      expect(result.riskMetrics.interestRateRisk).toBe('High');
    });

    it('classifies short duration bonds as low interest rate risk', () => {
      const result = BondPricingAnalyzer.analyze(shortDurationInput);

      expect(result.riskMetrics.interestRateRisk).toBe('Low');
    });

    it('classifies intermediate duration bonds as medium interest rate risk', () => {
      const mediumDurationInput: BondPricingInput = {
        ...basicInput,
        maturityDate: '2040-01-01',
        yieldToMaturity: 0.05,
      };

      const result = BondPricingAnalyzer.analyze(mediumDurationInput);

      expect(result.riskMetrics.interestRateRisk).toBe('Medium');
    });

    it('flags high coupon bonds with high reinvestment risk', () => {
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        couponRate: 0.08,
      });

      expect(result.riskMetrics.reinvestmentRisk).toBe('High');
    });

    it('flags very low coupon bonds with low reinvestment risk', () => {
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        couponRate: 0.01,
      });

      expect(result.riskMetrics.reinvestmentRisk).toBe('Low');
    });
  });

  describe('bond types', () => {
    it('handles municipal bonds', () => {
      const municipalInput: BondPricingInput = {
        ...basicInput,
        bondType: 'municipal',
        isTaxExempt: true,
      };

      const result = BondPricingAnalyzer.analyze(municipalInput);

      expect(result.bondType).toBe('municipal');
    });

    it('handles treasury bonds', () => {
      const treasuryInput: BondPricingInput = {
        ...basicInput,
        bondType: 'treasury',
      };

      const result = BondPricingAnalyzer.analyze(treasuryInput);

      expect(result.bondType).toBe('treasury');
    });
  });

  describe('coupon frequencies', () => {
    it('handles annual coupons', () => {
      const annualInput: BondPricingInput = {
        ...basicInput,
        couponFrequency: 'annual',
      };

      const result = BondPricingAnalyzer.analyze(annualInput);

      expect(result.couponSchedule.length).toBeLessThan(
        BondPricingAnalyzer.analyze(basicInput).couponSchedule.length
      );
    });

    it('handles quarterly coupons', () => {
      const quarterlyInput: BondPricingInput = {
        ...basicInput,
        couponFrequency: 'quarterly',
      };

      const result = BondPricingAnalyzer.analyze(quarterlyInput);

      expect(result.couponSchedule.length).toBeGreaterThan(
        BondPricingAnalyzer.analyze(basicInput).couponSchedule.length
      );
    });

    it('handles monthly coupons', () => {
      const monthlyInput: BondPricingInput = {
        ...basicInput,
        couponFrequency: 'monthly',
      };

      const result = BondPricingAnalyzer.analyze(monthlyInput);

      expect(result.couponSchedule.length).toBeGreaterThan(
        BondPricingAnalyzer.analyze({ ...basicInput, couponFrequency: 'quarterly' }).couponSchedule.length
      );
    });

    it('handles zero coupon frequency by skipping remaining payments', () => {
      const zeroFrequencyInput: BondPricingInput = {
        ...basicInput,
        couponRate: 0,
        couponFrequency: 'zero',
      };

      const result = BondPricingAnalyzer.analyze(zeroFrequencyInput);

      expect(result.remainingPayments).toBe(0);
      expect(result.couponSchedule).toHaveLength(0);
    });
  });

  describe('day count conventions', () => {
    it('handles 30-360 convention', () => {
      const thirtyThreeSixtyInput: BondPricingInput = {
        ...basicInput,
        dayCountConvention: '30-360',
      };

      const result = BondPricingAnalyzer.analyze(thirtyThreeSixtyInput);

      expect(result.yearsToMaturity).toBeGreaterThan(0);
    });

    it('handles actual-360 convention', () => {
      const actualThreeSixtyInput: BondPricingInput = {
        ...basicInput,
        dayCountConvention: 'actual-360',
      };

      const result = BondPricingAnalyzer.analyze(actualThreeSixtyInput);

      expect(result.yearsToMaturity).toBeGreaterThan(0);
    });

    it('handles actual-actual convention', () => {
      const actualActualInput: BondPricingInput = {
        ...basicInput,
        dayCountConvention: 'actual-actual',
      };

      const result = BondPricingAnalyzer.analyze(actualActualInput);

      expect(result.yearsToMaturity).toBeGreaterThan(0);
    });
  });

  describe('insights and recommendations', () => {
    it('generates insights', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('generates recommendation', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.recommendation).toBeDefined();
      expect(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']).toContain(result.recommendation);
    });

    it('flags high duration and convexity scenarios', () => {
      const result = BondPricingAnalyzer.analyze(longDurationInput);

      expect(result.insights.some((insight) => insight.includes('High duration'))).toBe(true);
      expect(result.insights.some((insight) => insight.includes('High convexity'))).toBe(true);
    });

    it('recommends Strong Buy when yield spread is significantly positive', () => {
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        yieldToMaturity: 0.08,
      });

      expect(result.recommendation).toBe('Strong Buy');
    });

    it('recommends Sell when yield spread is slightly negative', () => {
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        yieldToMaturity: 0.02,
      });

      expect(result.recommendation).toBe('Sell');
    });

    it('recommends Strong Sell when yield spread is deeply negative', () => {
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        yieldToMaturity: 0.005,
      });

      expect(result.recommendation).toBe('Strong Sell');
    });
  });

  describe('assumptions', () => {
    it('includes calculation assumptions', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.assumptions).toBeDefined();
      expect(Array.isArray(result.assumptions)).toBe(true);
      expect(result.assumptions.length).toBeGreaterThan(0);
    });

    it('includes reinvestment and tax assumptions when provided', () => {
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        reinvestmentRate: 0.03,
        taxRate: 0.1,
      });

      expect(result.assumptions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Reinvestment rate: 3.00%'),
          expect.stringContaining('Tax rate: 10.00%'),
        ])
      );
    });
  });

  describe('metadata', () => {
    it('includes calculation date', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.calculationDate).toBeDefined();
    });

    it('reflects input parameters', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result.faceValue).toBe(basicInput.faceValue);
      expect(result.couponRate).toBe(basicInput.couponRate);
    });

    it('returns provided settlement date when supplied', () => {
      const settlementDate = '2024-01-15T00:00:00.000Z';
      const result = BondPricingAnalyzer.analyze({
        ...basicInput,
        settlementDate,
      });

      expect(result.settlementDate).toBe(settlementDate);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('returns all required fields in the result object', () => {
      const result = BondPricingAnalyzer.analyze(basicInput);

      expect(result).toHaveProperty('bondType');
      expect(result).toHaveProperty('faceValue');
      expect(result).toHaveProperty('couponRate');
      expect(result).toHaveProperty('issueDate');
      expect(result).toHaveProperty('maturityDate');
      expect(result).toHaveProperty('settlementDate');
      expect(result).toHaveProperty('yearsToMaturity');
      expect(result).toHaveProperty('remainingPayments');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('couponSchedule');
      expect(result).toHaveProperty('sensitivityAnalysis');
      expect(result).toHaveProperty('riskMetrics');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('recommendation');
      expect(result).toHaveProperty('calculationDate');
      expect(result).toHaveProperty('assumptions');
    });
  });
});
