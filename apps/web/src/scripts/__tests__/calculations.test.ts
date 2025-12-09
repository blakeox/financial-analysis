/**
 * Tests for Mortgage Scenario Planning Calculator - Calculations Module
 */

import { describe, it, expect, vi } from 'vitest';
import { calculatePMI } from '../mortgage-scenario-planning/calculations';

// Mock the analysis-api module
vi.mock('../mortgage-scenario-planning/../analysis-api', () => ({
  postAnalysisRequest: vi.fn(),
}));

describe('Mortgage Scenario Planning - Calculations', () => {
  describe('calculatePMI', () => {
    it('should return no PMI for 20% or higher down payment', () => {
      const principal = 320000; // 80% of 400k
      const downPayment = 80000; // 20%
      const homePrice = 400000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(false);
      expect(result.pmiMonthly).toBe(0);
      expect(result.pmiDropMonth).toBe(0);
      expect(result.pmiTotalCost).toBe(0);
    });

    it('should return no PMI for exactly 20% down', () => {
      const homePrice = 500000;
      const downPayment = 100000; // exactly 20%
      const principal = homePrice - downPayment;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(false);
    });

    it('should calculate PMI for 15-19.99% down payment (0.5% rate)', () => {
      const homePrice = 400000;
      const downPayment = 60000; // 15%
      const principal = 340000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(true);
      expect(result.pmiMonthly).toBeCloseTo(principal * 0.005 / 12, 2);
    });

    it('should calculate PMI for 10-14.99% down payment (0.75% rate)', () => {
      const homePrice = 400000;
      const downPayment = 40000; // 10%
      const principal = 360000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(true);
      expect(result.pmiMonthly).toBeCloseTo(principal * 0.0075 / 12, 2);
    });

    it('should calculate PMI for 5-9.99% down payment (1% rate)', () => {
      const homePrice = 400000;
      const downPayment = 20000; // 5%
      const principal = 380000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(true);
      expect(result.pmiMonthly).toBeCloseTo(principal * 0.01 / 12, 2);
    });

    it('should calculate PMI for less than 5% down payment (1.2% rate)', () => {
      const homePrice = 400000;
      const downPayment = 12000; // 3%
      const principal = 388000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(true);
      expect(result.pmiMonthly).toBeCloseTo(principal * 0.012 / 12, 2);
    });

    it('should calculate PMI drop month correctly', () => {
      const homePrice = 400000;
      const downPayment = 40000; // 10%
      const principal = 360000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(true);
      expect(result.pmiDropMonth).toBeGreaterThan(0);
      expect(result.pmiDropMonth).toBeLessThanOrEqual(360); // Max loan term
    });

    it('should calculate total PMI cost based on drop month', () => {
      const homePrice = 400000;
      const downPayment = 40000; // 10%
      const principal = 360000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.pmiTotalCost).toBeCloseTo(
        result.pmiMonthly * result.pmiDropMonth,
        2
      );
    });

    it('should handle edge case of 0 down payment', () => {
      const homePrice = 400000;
      const downPayment = 0;
      const principal = 400000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(true);
      // Should use highest PMI rate (1.2%)
      expect(result.pmiMonthly).toBeCloseTo(principal * 0.012 / 12, 2);
    });

    it('should handle very high down payment (>20%)', () => {
      const homePrice = 400000;
      const downPayment = 200000; // 50%
      const principal = 200000;

      const result = calculatePMI(principal, downPayment, homePrice);

      expect(result.hasPMI).toBe(false);
      expect(result.pmiMonthly).toBe(0);
    });
  });
});
