import { describe, it, expect } from 'vitest';
import { RealOptionsAnalyzer, RealOptionsInputSchema } from '../real-options';

describe('RealOptionsAnalyzer', () => {
  describe('input validation', () => {
    it('should validate correct input', () => {
      const input = {
        initialInvestment: 1000000,
        expectedCashFlows: [300000, 400000, 500000, 600000],
        volatility: 0.25,
        riskFreeRate: 0.05,
        timeToMaturity: 4,
        optionType: 'expand' as const,
        exercisePrice: 500000,
      };

      expect(() => RealOptionsInputSchema.parse(input)).not.toThrow();
    });

    it('should reject negative initial investment', () => {
      const input = {
        initialInvestment: -1000000,
        expectedCashFlows: [300000, 400000, 500000, 600000],
        volatility: 0.25,
        riskFreeRate: 0.05,
        timeToMaturity: 4,
        optionType: 'expand' as const,
      };

      expect(() => RealOptionsInputSchema.parse(input)).toThrow();
    });

    it('should reject invalid volatility', () => {
      const input = {
        initialInvestment: 1000000,
        expectedCashFlows: [300000, 400000, 500000, 600000],
        volatility: 1.5, // Invalid: > 1
        riskFreeRate: 0.05,
        timeToMaturity: 4,
        optionType: 'expand' as const,
      };

      expect(() => RealOptionsInputSchema.parse(input)).toThrow();
    });
  });

  describe('NPV calculation', () => {
    it('should calculate NPV correctly', () => {
      const initialInvestment = 1000000;
      const cashFlows = [300000, 400000, 500000];
      const discountRate = 0.1;

      const npv = RealOptionsAnalyzer['calculateNPV'](initialInvestment, cashFlows, discountRate);
      expect(npv).toBeCloseTo(300000 + 400000/1.1 + 500000/1.21 - 1000000, 0.01);
    });

    it('should handle zero discount rate', () => {
      const initialInvestment = 1000000;
      const cashFlows = [200000, 300000, 400000];
      const discountRate = 0;

      const npv = RealOptionsAnalyzer['calculateNPV'](initialInvestment, cashFlows, discountRate);
      expect(npv).toBe(-100000 + 200000 + 300000 + 400000);
    });
  });

  describe('payback period calculation', () => {
    it('should calculate payback period correctly', () => {
      const initialInvestment = 500000;
      const cashFlows = [200000, 200000, 200000, 200000];

      const payback = RealOptionsAnalyzer['calculatePaybackPeriod'](initialInvestment, cashFlows);
      expect(payback).toBe(2.5); // 2 full years + 0.5 of year 3
    });

    it('should handle exact payback', () => {
      const initialInvestment = 300000;
      const cashFlows = [150000, 150000];

      const payback = RealOptionsAnalyzer['calculatePaybackPeriod'](initialInvestment, cashFlows);
      expect(payback).toBe(2);
    });
  });

  describe('Black-Scholes calculations', () => {
    it('should calculate call option value', () => {
      const S = 100; // Stock price
      const K = 95;  // Strike price
      const T = 1;   // Time to maturity
      const r = 0.05; // Risk-free rate
      const sigma = 0.2; // Volatility

      const callValue = RealOptionsAnalyzer['blackScholesCall'](S, K, T, r, sigma);
      expect(callValue).toBeGreaterThan(0);
      expect(callValue).toBeLessThan(S); // Call should be less than stock price
    });

    it('should calculate put option value', () => {
      const S = 90;  // Stock price
      const K = 95;  // Strike price
      const T = 1;   // Time to maturity
      const r = 0.05; // Risk-free rate
      const sigma = 0.2; // Volatility

      const putValue = RealOptionsAnalyzer['blackScholesPut'](S, K, T, r, sigma);
      expect(putValue).toBeGreaterThan(0);
      expect(putValue).toBeLessThan(K); // Put should be less than strike for out-of-money
    });
  });

  describe('real options analysis', () => {
    it('should analyze expansion option', () => {
      const input = {
        initialInvestment: 1000000,
        expectedCashFlows: [300000, 400000, 500000, 600000],
        volatility: 0.25,
        riskFreeRate: 0.05,
        timeToMaturity: 4,
        optionType: 'expand' as const,
        exercisePrice: 500000,
        expansionCost: 500000,
      };

      const result = RealOptionsAnalyzer.analyze(input);

      expect(result).toHaveProperty('npv');
      expect(result).toHaveProperty('optionValue');
      expect(result).toHaveProperty('totalValue');
      expect(result).toHaveProperty('recommendation');
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.risks).toBeInstanceOf(Array);
    });

    it('should analyze abandonment option', () => {
      const input = {
        initialInvestment: 1000000,
        expectedCashFlows: [200000, 200000, 200000],
        volatility: 0.3,
        riskFreeRate: 0.04,
        timeToMaturity: 3,
        optionType: 'abandon' as const,
        exercisePrice: 300000,
        salvageValue: 300000,
      };

      const result = RealOptionsAnalyzer.analyze(input);

      expect(result.npv).toBeLessThan(0); // Negative NPV project
      expect(result.optionValue).toBeGreaterThan(0); // But abandonment option has value
      expect(result.totalValue).toBe(result.npv + result.optionValue);
    });

    it('should analyze delay option', () => {
      const input = {
        initialInvestment: 800000,
        expectedCashFlows: [250000, 350000, 450000, 550000],
        volatility: 0.2,
        riskFreeRate: 0.03,
        timeToMaturity: 5,
        optionType: 'delay' as const,
      };

      const result = RealOptionsAnalyzer.analyze(input);

      expect(result).toHaveProperty('optionValue');
      expect(result.optionType === 'delay' ? result.optionValue >= 0 : true).toBe(true);
    });
  });

  describe('Greeks calculation', () => {
    it('should calculate option Greeks', () => {
      const input = {
        initialInvestment: 1000000,
        expectedCashFlows: [300000, 400000, 500000],
        volatility: 0.25,
        riskFreeRate: 0.05,
        timeToMaturity: 3,
        optionType: 'expand' as const,
        exercisePrice: 400000,
      };

      const result = RealOptionsAnalyzer.analyze(input);

      expect(typeof result.delta).toBe('number');
      expect(typeof result.gamma).toBe('number');
      expect(typeof result.theta).toBe('number');
      expect(typeof result.rho).toBe('number');

      // Delta should be between 0 and 1 for calls
      expect(result.delta).toBeGreaterThanOrEqual(0);
      expect(result.delta).toBeLessThanOrEqual(1);
    });
  });

  describe('recommendations and insights', () => {
    it('should provide positive recommendation for valuable project', () => {
      const input = {
        initialInvestment: 500000,
        expectedCashFlows: [200000, 300000, 400000, 500000],
        volatility: 0.3,
        riskFreeRate: 0.05,
        timeToMaturity: 4,
        optionType: 'expand' as const,
        exercisePrice: 300000,
      };

      const result = RealOptionsAnalyzer.analyze(input);

      expect(result.recommendation).toContain('recommendation to proceed');
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.risks.length).toBeGreaterThan(0);
    });

    it('should provide cautious recommendation for marginal project', () => {
      const input = {
        initialInvestment: 1200000,
        expectedCashFlows: [300000, 300000, 300000],
        volatility: 0.15,
        riskFreeRate: 0.05,
        timeToMaturity: 3,
        optionType: 'abandon' as const,
        exercisePrice: 200000,
      };

      const result = RealOptionsAnalyzer.analyze(input);

      expect(result.recommendation).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });
  });
});