import { describe, it, expect } from 'vitest';
import { FuturesPricingAnalyzer, ForwardPricingAnalyzer, FuturesContractInputSchema, ForwardContractInputSchema } from '../futures';

describe('FuturesPricingAnalyzer', () => {
  describe('input validation', () => {
    it('should validate correct futures input', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25, // 3 months
        riskFreeRate: 0.05,
        dividendYield: 0.02,
      };

      expect(() => FuturesContractInputSchema.parse(input)).not.toThrow();
    });

    it('should reject negative prices', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: -150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      expect(() => FuturesContractInputSchema.parse(input)).toThrow();
    });

    it('should reject invalid risk-free rate', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25,
        riskFreeRate: 1.5, // Invalid: > 1
      };

      expect(() => FuturesContractInputSchema.parse(input)).toThrow();
    });
  });

  describe('theoretical pricing', () => {
    it('should calculate theoretical futures price for equity', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
        dividendYield: 0.02,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.theoreticalPrice).toBeGreaterThan(0);
      expect(typeof result.theoreticalPrice).toBe('number');
    });

    it('should calculate theoretical price for commodity with storage costs', () => {
      const input = {
        underlyingAsset: 'WTI Crude',
        contractSize: 1000,
        currentPrice: 70.0,
        futuresPrice: 72.0,
        timeToExpiration: 0.5,
        riskFreeRate: 0.03,
        storageCost: 0.05, // 5% annual storage cost
        convenienceYield: 0.02, // 2% convenience yield
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.theoreticalPrice).toBeGreaterThan(0);
      // With storage costs and convenience yield, price should be adjusted
      expect(result.theoreticalPrice).not.toBe(input.currentPrice);
    });

    it('should handle zero time to expiration', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 150.0,
        timeToExpiration: 0.001, // Very short time
        riskFreeRate: 0.05,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      // At expiration, futures price should equal spot price
      expect(result.theoreticalPrice).toBeCloseTo(input.currentPrice, 1);
    });
  });

  describe('Greeks calculation', () => {
    it('should calculate correct Greeks for futures', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      // Futures always have delta = 1
      expect(result.delta).toBe(1);

      // Futures have gamma = 0
      expect(result.gamma).toBe(0);

      // Theta and rho should be calculated
      expect(typeof result.theta).toBe('number');
      expect(typeof result.rho).toBe('number');
    });
  });

  describe('basis analysis', () => {
    it('should calculate basis correctly', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.basis).toBe(2.0); // 152 - 150
      expect(result.basisRisk).toBeGreaterThan(0);
    });

    it('should identify contango and backwardation', () => {
      const contangoInput = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 155.0, // Futures > Spot
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const backwardationInput = {
        underlyingAsset: 'WTI',
        contractSize: 1000,
        currentPrice: 70.0,
        futuresPrice: 65.0, // Futures < Spot
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const contangoResult = FuturesPricingAnalyzer.analyze(contangoInput);
      const backwardationResult = FuturesPricingAnalyzer.analyze(backwardationInput);

      expect(contangoResult.basis).toBeGreaterThan(0); // Contango
      expect(backwardationResult.basis).toBeLessThan(0); // Backwardation
    });
  });

  describe('valuation analysis', () => {
    it('should identify overvalued futures', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 160.0, // Significantly over theoretical
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.isOvervalued).toBe(true);
      expect(result.isUndervalued).toBe(false);
      expect(result.recommendation).toContain('overvalued');
    });

    it('should identify undervalued futures', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 140.0, // Significantly under theoretical
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.isOvervalued).toBe(false);
      expect(result.isUndervalued).toBe(true);
      expect(result.recommendation).toContain('undervalued');
    });

    it('should identify fairly valued futures', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 150.5, // Close to theoretical
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.isOvervalued).toBe(false);
      expect(result.isUndervalued).toBe(false);
      expect(result.recommendation).toContain('fairly valued');
    });
  });

  describe('insights generation', () => {
    it('should generate insights for equity futures', () => {
      const input = {
        underlyingAsset: 'AAPL',
        contractSize: 100,
        currentPrice: 150.0,
        futuresPrice: 152.0,
        timeToExpiration: 0.25,
        riskFreeRate: 0.05,
        dividendYield: 0.02,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some(insight => insight.includes('Dividend'))).toBe(true);
    });

    it('should generate insights for commodity futures', () => {
      const input = {
        underlyingAsset: 'WTI Crude',
        contractSize: 1000,
        currentPrice: 70.0,
        futuresPrice: 72.0,
        timeToExpiration: 0.5,
        riskFreeRate: 0.03,
        storageCost: 0.05,
        convenienceYield: 0.02,
      };

      const result = FuturesPricingAnalyzer.analyze(input);

      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.some(insight => insight.includes('Storage'))).toBe(true);
      expect(result.insights.some(insight => insight.includes('Convenience'))).toBe(true);
    });
  });
});

describe('ForwardPricingAnalyzer', () => {
  describe('input validation', () => {
    it('should validate correct forward input', () => {
      const input = {
        underlyingAsset: 'EURUSD',
        contractSize: 100000,
        currentPrice: 1.05,
        forwardPrice: 1.052,
        timeToExpiration: 0.25,
        riskFreeRate: 0.04,
      };

      expect(() => ForwardContractInputSchema.parse(input)).not.toThrow();
    });
  });

  describe('forward contract analysis', () => {
    it('should analyze forward contract pricing', () => {
      const input = {
        underlyingAsset: 'EURUSD',
        contractSize: 100000,
        currentPrice: 1.05,
        forwardPrice: 1.052,
        timeToExpiration: 0.25,
        riskFreeRate: 0.04,
      };

      const result = ForwardPricingAnalyzer.analyze(input);

      expect(result).toHaveProperty('theoreticalPrice');
      expect(result).toHaveProperty('marketPrice');
      expect(result).toHaveProperty('recommendation');
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.insights.some(insight => insight.includes('counterparty risk'))).toBe(true);
    });

    it('should handle currency forwards', () => {
      const input = {
        underlyingAsset: 'EURUSD',
        contractSize: 1000000,
        currentPrice: 1.05,
        forwardPrice: 1.048,
        timeToExpiration: 0.5,
        riskFreeRate: 0.04,
      };

      const result = ForwardPricingAnalyzer.analyze(input);

      expect(result.theoreticalPrice).toBeGreaterThan(0);
      expect(result.basis).toBe(input.forwardPrice - input.currentPrice);
    });
  });
});