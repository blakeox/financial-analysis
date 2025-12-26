import { describe, it, expect } from 'vitest';
import { InterestRateSwapAnalyzer, CurrencySwapAnalyzer, InterestRateSwapInputSchema, CurrencySwapInputSchema } from '../swaps';

describe('InterestRateSwapAnalyzer', () => {
  const baseInput = {
    notionalPrincipal: 1000000,
    swapRate: 0.045,
    floatingRateBenchmark: 'SOFR',
    currentFloatingRate: 0.042,
    timeToMaturity: 5,
    paymentFrequency: 2,
    spotRates: [0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048, 0.049],
    payFixed: true,
  };

  describe('Input Validation', () => {
    it('should validate correct input', () => {
      expect(() => InterestRateSwapInputSchema.parse(baseInput)).not.toThrow();
    });

    it('should reject negative notional principal', () => {
      const invalid = { ...baseInput, notionalPrincipal: -1000 };
      expect(() => InterestRateSwapInputSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid swap rate', () => {
      const invalid = { ...baseInput, swapRate: 1.5 };
      expect(() => InterestRateSwapInputSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid payment frequency', () => {
      const invalid = { ...baseInput, paymentFrequency: 3 };
      expect(() => InterestRateSwapInputSchema.parse(invalid)).toThrow();
    });
  });

  describe('Swap Analysis', () => {
    it('should calculate NPV for a standard swap', () => {
      const result = InterestRateSwapAnalyzer.analyze(baseInput);

      expect(result.npv).toBeDefined();
      expect(typeof result.npv).toBe('number');
      expect(result.fixedLegValue).toBeDefined();
      expect(result.floatingLegValue).toBeDefined();
    });

    it('should generate cash flows correctly', () => {
      const result = InterestRateSwapAnalyzer.analyze(baseInput);

      expect(result.fixedCashFlows.length).toBe(10); // 5 years * 2 payments
      expect(result.floatingCashFlows.length).toBe(10);
      expect(result.netCashFlows.length).toBe(10);

      // Fixed payments should be constant
      const expectedFixedPayment = 1000000 * 0.045 / 2; // $22,500
      expect(result.fixedCashFlows[0]).toBeCloseTo(expectedFixedPayment, 2);
      expect(result.fixedCashFlows.every(flow => flow === result.fixedCashFlows[0])).toBe(true);
    });

    it('should calculate risk metrics', () => {
      const result = InterestRateSwapAnalyzer.analyze(baseInput);

      expect(result.dv01).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.convexity).toBeGreaterThan(0);
      expect(result.delta).toBeDefined();
      expect(result.gamma).toBeDefined();
      expect(result.vega).toBeDefined();
    });

    it('should identify fair value swaps', () => {
      const fairValueInput = {
        ...baseInput,
        swapRate: 0.042, // Match floating rate
      };

      const result = InterestRateSwapAnalyzer.analyze(fairValueInput);
      expect(result.isFairValue).toBe(true);
    });

    it('should generate recommendations', () => {
      const result = InterestRateSwapAnalyzer.analyze(baseInput);

      expect(result.recommendation).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    });

    it('should provide insights', () => {
      const result = InterestRateSwapAnalyzer.analyze(baseInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some(insight => insight.includes('duration'))).toBe(true);
    });

    it('should identify risks', () => {
      const result = InterestRateSwapAnalyzer.analyze(baseInput);

      expect(result.risks).toBeDefined();
      expect(Array.isArray(result.risks)).toBe(true);
      expect(result.risks.length).toBeGreaterThan(0);
      expect(result.risks.some(risk => risk.includes('Interest rate risk'))).toBe(true);
    });
  });

  describe('Different Payment Frequencies', () => {
    it('should handle annual payments', () => {
      const annualInput = { ...baseInput, paymentFrequency: 1 };
      const result = InterestRateSwapAnalyzer.analyze(annualInput);

      expect(result.fixedCashFlows.length).toBe(5); // 5 payments for 5 years
    });

    it('should handle quarterly payments', () => {
      const quarterlyInput = { ...baseInput, paymentFrequency: 4 };
      const result = InterestRateSwapAnalyzer.analyze(quarterlyInput);

      expect(result.fixedCashFlows.length).toBe(20); // 5 years * 4 payments
    });
  });

  describe('Pay/Receive Fixed Analysis', () => {
    it('should handle receiving fixed rate', () => {
      const receiveFixedInput = { ...baseInput, payFixed: false };
      const result = InterestRateSwapAnalyzer.analyze(receiveFixedInput);

      expect(result.recommendation).toContain('fixed receiver');
    });
  });

  describe('Edge Cases', () => {
    it('should handle short maturity', () => {
      const shortInput = { ...baseInput, timeToMaturity: 0.5 };
      const result = InterestRateSwapAnalyzer.analyze(shortInput);

      expect(result.fixedCashFlows.length).toBe(1); // 1 payment
    });

    it('should handle long maturity', () => {
      const longInput = {
        ...baseInput,
        timeToMaturity: 30,
        spotRates: Array(60).fill(0).map((_, i) => 0.04 + i * 0.0001), // 60 spot rates for 30 years quarterly
        paymentFrequency: 4,
      };
      const result = InterestRateSwapAnalyzer.analyze(longInput);

      expect(result.fixedCashFlows.length).toBe(120); // 30 years * 4 payments
    });
  });
});

describe('CurrencySwapAnalyzer', () => {
  const baseCurrencyInput = {
    notionalPrincipal: 1000000,
    swapRate: 0.045,
    currentFloatingRate: 0.042,
    timeToMaturity: 5,
    paymentFrequency: 2,
    spotRates: [0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048, 0.049],
    payFixed: true,
    domesticCurrency: 'USD',
    foreignCurrency: 'EUR',
    exchangeRate: 0.85,
    domesticRates: [0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048, 0.049],
    foreignRates: [0.035, 0.036, 0.037, 0.038, 0.039, 0.040, 0.041, 0.042, 0.043, 0.044],
  };

  describe('Input Validation', () => {
    it('should validate correct currency swap input', () => {
      expect(() => CurrencySwapInputSchema.parse(baseCurrencyInput)).not.toThrow();
    });

    it('should reject missing currencies', () => {
      const invalid = { ...baseCurrencyInput, domesticCurrency: '' };
      expect(() => CurrencySwapInputSchema.parse(invalid)).toThrow();
    });
  });

  describe('Currency Swap Analysis', () => {
    it('should calculate FX risk', () => {
      const result = CurrencySwapAnalyzer.analyze(baseCurrencyInput);

      expect(result.fxRisk).toBeDefined();
      expect(result.fxRisk).toBeGreaterThan(0);
    });

    it('should identify currency mismatch', () => {
      const result = CurrencySwapAnalyzer.analyze(baseCurrencyInput);

      expect(result.currencyMismatch).toBe(true);
    });

    it('should include FX insights', () => {
      const result = CurrencySwapAnalyzer.analyze(baseCurrencyInput);

      expect(result.insights.some(insight => insight.includes('Exchange rate'))).toBe(true);
      expect(result.insights.some(insight => insight.includes('FX risk'))).toBe(true);
    });

    it('should include FX risks', () => {
      const result = CurrencySwapAnalyzer.analyze(baseCurrencyInput);

      expect(result.risks.some(risk => risk.includes('Foreign exchange risk'))).toBe(true);
    });
  });

  describe('Same Currency Swap', () => {
    it('should handle same currency pairs', () => {
      const sameCurrencyInput = {
        ...baseCurrencyInput,
        foreignCurrency: 'USD',
      };

      const result = CurrencySwapAnalyzer.analyze(sameCurrencyInput);
      expect(result.currencyMismatch).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle real-world swap scenario', () => {
    // Example: 5-year USD SOFR swap
    const realWorldInput = {
      notionalPrincipal: 10000000, // $10M
      swapRate: 0.0532, // 5.32%
      floatingRateBenchmark: 'SOFR',
      currentFloatingRate: 0.0525, // 5.25%
      timeToMaturity: 5,
      paymentFrequency: 2, // Semi-annual
      spotRates: [
        0.0520, 0.0525, 0.0530, 0.0535, 0.0540,
        0.0545, 0.0550, 0.0555, 0.0560, 0.0565
      ],
      payFixed: true,
    };

    const result = InterestRateSwapAnalyzer.analyze(realWorldInput);

    // Verify all required fields are present
    expect(result.npv).toBeDefined();
    expect(result.dv01).toBeDefined();
    expect(result.duration).toBeGreaterThan(0);
    expect(result.recommendation).toBeDefined();
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);

    // Verify cash flows
    expect(result.fixedCashFlows.length).toBe(10);
    expect(result.floatingCashFlows.length).toBe(10);
    expect(result.netCashFlows.length).toBe(10);
  });

  it('should handle currency swap with different rate environments', () => {
    const currencySwapInput = {
      notionalPrincipal: 5000000,
      swapRate: 0.04,
      currentFloatingRate: 0.035,
      timeToMaturity: 3,
      paymentFrequency: 4,
      spotRates: [0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048, 0.049, 0.050, 0.051],
      payFixed: true,
      domesticCurrency: 'USD',
      foreignCurrency: 'GBP',
      exchangeRate: 0.78,
      domesticRates: [0.04, 0.041, 0.042, 0.043, 0.044, 0.045, 0.046, 0.047, 0.048, 0.049, 0.050, 0.051],
      foreignRates: [0.045, 0.046, 0.047, 0.048, 0.049, 0.050, 0.051, 0.052, 0.053, 0.054, 0.055, 0.056],
    };

    const result = CurrencySwapAnalyzer.analyze(currencySwapInput);

    expect(result.fxRisk).toBeGreaterThan(0);
    expect(result.currencyMismatch).toBe(true);
    expect(result.insights.some(insight => insight.includes('GBP/USD'))).toBe(true);
  });
});