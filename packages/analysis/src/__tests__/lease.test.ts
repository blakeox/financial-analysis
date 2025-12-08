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

      // Using present value annuity formula with residual value
      expect(result.monthlyPayment).toBe(796.52);
      expect(result.totalPayments).toBeCloseTo(47791.2, 0);
      expect(result.totalInterest).toBeCloseTo(7791.2, 0);
      expect(result.schedule).toHaveLength(60);
    });

    it('should handle zero residual value', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 30000,
        annualRate: 0.04,
        termMonths: 36,
        residualValue: 0,
      });

      expect(result.monthlyPayment).toBe(885.72);
      expect(result.schedule).toHaveLength(36);
      // With proper amortization, final balance should be close to 0 (residual)
      expect(result.schedule[35]?.balance).toBeCloseTo(0, 0);
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

      // Monthly payment is 689.81 with present value formula
      expect(result.schedule[0]?.payment).toBe(689.81);
      // First month interest: 20000 * 0.06/12 = 100
      expect(result.schedule[0]?.interest).toBe(100);
      // Principal: payment - interest = 689.81 - 100 = 589.81
      expect(result.schedule[0]?.principal).toBe(589.81);
      // Balance: 20000 - 589.81 = 19410.19
      expect(result.schedule[0]?.balance).toBeCloseTo(19410.19, 0);

      // Last payment balance should be close to residual value
      expect(result.schedule[23]?.balance).toBeCloseTo(5000, 0);
    });

    it('should handle high residual value', () => {
      const result = LeaseAnalyzer.analyze({
        principal: 50000,
        annualRate: 0.03,
        termMonths: 48,
        residualValue: 40000,
      });

      expect(result.monthlyPayment).toBe(321.34);
      expect(result.totalPayments).toBeCloseTo(15424.32, 0);
      expect(result.totalInterest).toBeCloseTo(5424.32, 0);
    });
  });
});
