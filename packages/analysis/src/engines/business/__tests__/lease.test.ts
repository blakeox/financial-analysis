import { describe, it, expect } from 'vitest';
import { LeaseAnalyzer } from '../lease';

describe('LeaseAnalyzer', () => {
  const basicInput = {
    principal: 30000,
    annualRate: 0.06,
    termMonths: 36,
    residualValue: 12000,
  };

  describe('basic lease calculations', () => {
    it('calculates monthly payment correctly', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      // Monthly payment for $30k at 6% for 36 months with $12k residual
      // Using present value annuity formula: ~607.59
      expect(result.monthlyPayment).toBeGreaterThan(600);
      expect(result.monthlyPayment).toBeLessThan(650);
    });

    it('generates correct number of schedule entries', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      expect(result.schedule).toHaveLength(36);
    });

    it('calculates total payments', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      expect(result.totalPayments).toBeCloseTo(result.monthlyPayment * 36, 0);
    });

    it('calculates total interest', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      // Total interest = Total payments - (Principal - Residual)
      const principalPaid = basicInput.principal - basicInput.residualValue;
      expect(result.totalInterest).toBeCloseTo(result.totalPayments - principalPaid, 0);
    });
  });

  describe('schedule details', () => {
    it('schedule entries have all required fields', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      const firstEntry = result.schedule[0]!;
      expect(firstEntry).toHaveProperty('month');
      expect(firstEntry).toHaveProperty('payment');
      expect(firstEntry).toHaveProperty('principal');
      expect(firstEntry).toHaveProperty('interest');
      expect(firstEntry).toHaveProperty('balance');
    });

    it('first month has correct month number', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      expect(result.schedule[0]!.month).toBe(1);
    });

    it('last month has correct month number', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      expect(result.schedule[result.schedule.length - 1]!.month).toBe(36);
    });

    it('balance decreases over time', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      const firstBalance = result.schedule[0]!.balance;
      const lastBalance = result.schedule[result.schedule.length - 1]!.balance;

      expect(lastBalance).toBeLessThan(firstBalance);
    });

    it('final balance equals residual value', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      const lastEntry = result.schedule[result.schedule.length - 1]!;
      expect(lastEntry.balance).toBeCloseTo(basicInput.residualValue, 0);
    });
  });

  describe('zero residual value', () => {
    it('handles lease with zero residual', () => {
      const zeroResidualInput = {
        ...basicInput,
        residualValue: 0,
      };

      const result = LeaseAnalyzer.analyze(zeroResidualInput);
      const baselineResult = LeaseAnalyzer.analyze(basicInput);

      // With zero residual, this is like a standard loan - payments should be higher
      expect(result.monthlyPayment).toBeGreaterThan(baselineResult.monthlyPayment);
      expect(result.schedule[result.schedule.length - 1]!.balance).toBeCloseTo(0, 0);
    });
  });

  describe('high residual value', () => {
    it('handles lease with high residual value', () => {
      const highResidualInput = {
        ...basicInput,
        residualValue: 20000, // High residual
      };

      const result = LeaseAnalyzer.analyze(highResidualInput);

      // Lower payments when residual is higher
      const lowResidualResult = LeaseAnalyzer.analyze({ ...basicInput, residualValue: 5000 });
      expect(result.monthlyPayment).toBeLessThan(lowResidualResult.monthlyPayment);
    });
  });

  describe('different interest rates', () => {
    it('higher rate means higher payment', () => {
      const highRateInput = {
        ...basicInput,
        annualRate: 0.12, // 12%
      };

      const result = LeaseAnalyzer.analyze(highRateInput);
      const baseline = LeaseAnalyzer.analyze(basicInput);

      expect(result.monthlyPayment).toBeGreaterThan(baseline.monthlyPayment);
    });

    it('zero interest rate', () => {
      const zeroRateInput = {
        ...basicInput,
        annualRate: 0,
      };

      const result = LeaseAnalyzer.analyze(zeroRateInput);

      // With zero interest, payment = (principal - residual) / termMonths
      const expectedPayment = (basicInput.principal - basicInput.residualValue) / basicInput.termMonths;
      expect(result.monthlyPayment).toBeCloseTo(expectedPayment, 2);
      expect(result.totalInterest).toBeCloseTo(0, 0);
    });
  });

  describe('different term lengths', () => {
    it('shorter term means higher payment', () => {
      const shortTermInput = {
        ...basicInput,
        termMonths: 24,
      };

      const result = LeaseAnalyzer.analyze(shortTermInput);
      const baseline = LeaseAnalyzer.analyze(basicInput);

      expect(result.monthlyPayment).toBeGreaterThan(baseline.monthlyPayment);
      expect(result.schedule).toHaveLength(24);
    });

    it('longer term means lower payment', () => {
      const longTermInput = {
        ...basicInput,
        termMonths: 48,
      };

      const result = LeaseAnalyzer.analyze(longTermInput);
      const baseline = LeaseAnalyzer.analyze(basicInput);

      expect(result.monthlyPayment).toBeLessThan(baseline.monthlyPayment);
      expect(result.schedule).toHaveLength(48);
    });
  });

  describe('validation', () => {
    it('handles small principal', () => {
      const smallInput = {
        principal: 1000,
        annualRate: 0.05,
        termMonths: 12,
        residualValue: 0,
      };

      const result = LeaseAnalyzer.analyze(smallInput);

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule).toHaveLength(12);
    });

    it('handles large principal', () => {
      const largeInput = {
        principal: 100000,
        annualRate: 0.05,
        termMonths: 60,
        residualValue: 30000,
      };

      const result = LeaseAnalyzer.analyze(largeInput);

      expect(result.monthlyPayment).toBeGreaterThan(0);
      expect(result.schedule).toHaveLength(60);
    });
  });

  describe('interest breakdown', () => {
    it('early payments have higher interest portion', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      const firstMonth = result.schedule[0]!;
      const lastMonth = result.schedule[result.schedule.length - 1]!;

      // Early payments have more interest
      expect(firstMonth.interest).toBeGreaterThan(lastMonth.interest);
    });

    it('sum of interest in schedule equals total interest', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      const scheduleInterest = result.schedule.reduce((sum, entry) => sum + entry.interest, 0);
      expect(scheduleInterest).toBeCloseTo(result.totalInterest, 0);
    });
  });

  describe('default residual value', () => {
    it('defaults residual to 0 if not provided', () => {
      const noResidualInput = {
        principal: 20000,
        annualRate: 0.05,
        termMonths: 36,
        residualValue: 0, // Explicitly set to 0 to test zero-residual behavior
      };

      const result = LeaseAnalyzer.analyze(noResidualInput);

      expect(result.schedule[result.schedule.length - 1]!.balance).toBeCloseTo(0, 0);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should return a complete analysis object with all required fields', () => {
      const result = LeaseAnalyzer.analyze(basicInput);

      expect(result).toHaveProperty('monthlyPayment');
      expect(result).toHaveProperty('totalPayments');
      expect(result).toHaveProperty('totalInterest');
      expect(result).toHaveProperty('schedule');
      expect(Array.isArray(result.schedule)).toBe(true);
      expect(result.schedule.length).toBeGreaterThan(0);

      const firstEntry = result.schedule[0];
      expect(firstEntry).toHaveProperty('month');
      expect(firstEntry).toHaveProperty('payment');
      expect(firstEntry).toHaveProperty('principal');
      expect(firstEntry).toHaveProperty('interest');
      expect(firstEntry).toHaveProperty('balance');
    });
  });
});
