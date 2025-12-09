/**
 * Tests for Mortgage Scenario Planning Calculator - Utils Module
 */

import { describe, it, expect } from 'vitest';
import {
  formatTimeDisplay,
  calculateDownPaymentPercent,
  generateScenarioName,
  findRefinanceSavings,
} from '../mortgage-scenario-planning/utils';
import type { Scenario } from '../mortgage-scenario-planning/types';

describe('Mortgage Scenario Planning - Utils', () => {
  describe('formatTimeDisplay', () => {
    it('should format exact years correctly', () => {
      const result = formatTimeDisplay(60);
      expect(result.years).toBe(5);
      expect(result.months).toBe(0);
      expect(result.display).toBe('5y 0m');
    });

    it('should format years and months correctly', () => {
      const result = formatTimeDisplay(75);
      expect(result.years).toBe(6);
      expect(result.months).toBe(3);
      expect(result.display).toBe('6y 3m');
    });

    it('should handle less than a year', () => {
      const result = formatTimeDisplay(8);
      expect(result.years).toBe(0);
      expect(result.months).toBe(8);
      expect(result.display).toBe('0y 8m');
    });

    it('should handle 0 months', () => {
      const result = formatTimeDisplay(0);
      expect(result.years).toBe(0);
      expect(result.months).toBe(0);
      expect(result.display).toBe('0y 0m');
    });

    it('should handle full 30-year term', () => {
      const result = formatTimeDisplay(360);
      expect(result.years).toBe(30);
      expect(result.months).toBe(0);
      expect(result.display).toBe('30y 0m');
    });

    it('should handle 15-year term', () => {
      const result = formatTimeDisplay(180);
      expect(result.years).toBe(15);
      expect(result.months).toBe(0);
      expect(result.display).toBe('15y 0m');
    });
  });

  describe('calculateDownPaymentPercent', () => {
    const createScenario = (principal: number, downPayment: number): Scenario => ({
      name: 'Test',
      downPayment,
      rate: 6.5,
      extraPayment: 0,
      closingCosts: 0,
      principal,
      monthlyPayment: 2000,
      totalInterest: 100000,
      totalCost: 500000,
      payoffMonths: 360,
      hasPMI: false,
      pmiMonthly: 0,
      pmiTotalCost: 0,
      pmiDropMonth: 0,
      monthlyPaymentWithPMI: 2000,
      index: 0,
    });

    it('should calculate 20% down payment correctly', () => {
      const scenario = createScenario(320000, 80000); // 400k home
      const result = calculateDownPaymentPercent(scenario);
      expect(result).toBe('20.0');
    });

    it('should calculate 10% down payment correctly', () => {
      const scenario = createScenario(360000, 40000); // 400k home
      const result = calculateDownPaymentPercent(scenario);
      expect(result).toBe('10.0');
    });

    it('should calculate 5% down payment correctly', () => {
      const scenario = createScenario(380000, 20000); // 400k home
      const result = calculateDownPaymentPercent(scenario);
      expect(result).toBe('5.0');
    });

    it('should calculate 3.5% down payment (FHA minimum)', () => {
      const scenario = createScenario(386000, 14000); // 400k home
      const result = calculateDownPaymentPercent(scenario);
      expect(result).toBe('3.5');
    });
  });

  describe('generateScenarioName', () => {
    it('should generate name with 20% down and standard rate', () => {
      const name = generateScenarioName(80000, 400000, 6.5, 0, 'A');
      expect(name).toContain('Option A');
      expect(name).toContain('20% Down');
      expect(name).toContain('6.50%');
    });

    it('should include PMI indicator for 10-19% down', () => {
      const name = generateScenarioName(60000, 400000, 6.5, 0);
      expect(name).toContain('15% Down');
      expect(name).toContain('(PMI)');
    });

    it('should include High PMI indicator for 5-9% down', () => {
      const name = generateScenarioName(20000, 400000, 6.5, 0);
      expect(name).toContain('5% Down');
      expect(name).toContain('(High PMI)');
    });

    it('should include FHA indicator for <5% down', () => {
      const name = generateScenarioName(12000, 400000, 6.5, 0);
      expect(name).toContain('3% Down');
      expect(name).toContain('(FHA)');
    });

    it('should include Low rate indicator for rate < 5%', () => {
      const name = generateScenarioName(80000, 400000, 4.5, 0);
      expect(name).toContain('4.50%');
      expect(name).toContain('(Low)');
    });

    it('should include High rate indicator for rate >= 7%', () => {
      const name = generateScenarioName(80000, 400000, 7.5, 0);
      expect(name).toContain('7.50%');
      expect(name).toContain('(High)');
    });

    it('should include extra payment info for $500+ extra', () => {
      const name = generateScenarioName(80000, 400000, 6.5, 500);
      expect(name).toContain('+ $500 extra');
    });

    it('should include general extra payment info for small amounts', () => {
      const name = generateScenarioName(80000, 400000, 6.5, 200);
      expect(name).toContain('+ extra payments');
    });

    it('should work without label', () => {
      const name = generateScenarioName(80000, 400000, 6.5, 0);
      expect(name).not.toContain('Option');
      expect(name).toContain('20% Down');
    });
  });

  describe('findRefinanceSavings', () => {
    const createScenario = (totalCost: number): Scenario => ({
      name: 'Test',
      downPayment: 80000,
      rate: 6.5,
      extraPayment: 0,
      closingCosts: 0,
      principal: 320000,
      monthlyPayment: 2000,
      totalInterest: 100000,
      totalCost,
      payoffMonths: 360,
      hasPMI: false,
      pmiMonthly: 0,
      pmiTotalCost: 0,
      pmiDropMonth: 0,
      monthlyPaymentWithPMI: 2000,
      index: 0,
    });

    it('should indicate significant savings for >$10k difference', () => {
      const base = createScenario(500000);
      const refinanced = createScenario(480000);
      
      const result = findRefinanceSavings(base, refinanced);
      
      expect(result).toContain('significant');
    });

    it('should indicate modest savings for $0-$10k difference', () => {
      const base = createScenario(500000);
      const refinanced = createScenario(495000);
      
      const result = findRefinanceSavings(base, refinanced);
      
      expect(result).toContain('modest');
    });

    it('should indicate not beneficial when refinance costs more', () => {
      const base = createScenario(500000);
      const refinanced = createScenario(510000);
      
      const result = findRefinanceSavings(base, refinanced);
      
      expect(result).toContain('not be beneficial');
    });
  });
});
