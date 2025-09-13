import { describe, it, expect } from 'vitest';
import { LeaseAnalyzer } from '../engines/lease';

describe('LeaseAnalyzer', () => {
  describe('analyze', () => {
    it('should calculate basic lease payment correctly', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 50000,
        annualRate: 0.05,
        termMonths: 60,
        residualValue: 10000,
      });

      expect(result.monthlyPayment).toBe(916.67);
      expect(result.totalPayments).toBe(55000);
      expect(result.totalInterest).toBe(15000);
      expect(result.schedule).toHaveLength(60);
    });

    it('should handle zero residual value', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 30000,
        annualRate: 0.04,
        termMonths: 36,
        residualValue: 0,
      });

      expect(result.monthlyPayment).toBe(933.33);
      expect(result.schedule).toHaveLength(36);
      expect(result.schedule[35]?.balance).toBe(0);
    });

    it('should validate input parameters', () => {
      expect(() => {
        LeaseAnalyzer.analyze({
          principal: -1000,
          annualRate: 0.05,
          termMonths: 60,
          residualValue: 0,
        });
      }).toThrow();

      expect(() => {
        LeaseAnalyzer.analyze({
          principal: 50000,
          annualRate: 1.5, // Invalid rate > 1
          termMonths: 60,
          residualValue: 0,
        });
      }).toThrow();

      expect(() => {
        LeaseAnalyzer.analyze({
          principal: 50000,
          annualRate: 0.05,
          termMonths: 0,
          residualValue: 0,
        });
      }).toThrow();
    });

    it('should generate correct amortization schedule', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 20000,
        annualRate: 0.06,
        termMonths: 24,
        residualValue: 5000,
      });

      expect(result.schedule).toHaveLength(24);
      expect(result.schedule[0]?.month).toBe(1);
      expect(result.schedule[23]?.month).toBe(24);

      // First payment
      expect(result.schedule[0]?.payment).toBe(750);
      expect(result.schedule[0]?.principal).toBe(650);
      expect(result.schedule[0]?.interest).toBe(100);
      expect(result.schedule[0]?.balance).toBe(19350);

      // Last payment balance
      expect(result.schedule[23]?.balance).toBeCloseTo(3469.23, 2);
    });

    it('should handle high residual value', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 50000,
        annualRate: 0.03,
        termMonths: 48,
        residualValue: 40000,
      });

      expect(result.monthlyPayment).toBe(433.33);
      expect(result.totalPayments).toBeCloseTo(20800, 0);
      expect(result.totalInterest).toBe(10800);
    });
  });
});