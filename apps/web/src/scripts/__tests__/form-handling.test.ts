/**
 * Tests for Mortgage Scenario Planning Calculator - Form Handling Module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getScenarioCount,
  setScenarioCount,
  parseFormInput,
  validateInput,
} from '../mortgage-scenario-planning/form-handling';
import { MIN_SCENARIOS, MAX_SCENARIOS } from '../mortgage-scenario-planning/constants';

// Mock calculator-utilities
vi.mock('../../utils/calculator-utilities', () => ({
  coerceNumber: (value: unknown, defaultVal: number = 0) => {
    const num = Number(value);
    return isNaN(num) ? defaultVal : num;
  },
  showError: vi.fn(),
}));

describe('Mortgage Scenario Planning - Form Handling', () => {
  describe('getScenarioCount / setScenarioCount', () => {
    beforeEach(() => {
      // Reset to default
      setScenarioCount(MIN_SCENARIOS);
    });

    it('should return MIN_SCENARIOS initially', () => {
      expect(getScenarioCount()).toBe(MIN_SCENARIOS);
    });

    it('should update scenario count within valid range', () => {
      setScenarioCount(4);
      expect(getScenarioCount()).toBe(4);
    });

    it('should clamp to MIN_SCENARIOS when set below minimum', () => {
      setScenarioCount(0);
      expect(getScenarioCount()).toBe(MIN_SCENARIOS);
    });

    it('should clamp to MAX_SCENARIOS when set above maximum', () => {
      setScenarioCount(100);
      expect(getScenarioCount()).toBe(MAX_SCENARIOS);
    });
  });

  describe('parseFormInput', () => {
    const createMockForm = (data: Record<string, string>): HTMLFormElement => {
      const form = document.createElement('form');

      Object.entries(data).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.name = name;
        input.value = value;
        form.appendChild(input);
      });

      return form;
    };

    it('should parse basic form inputs correctly', () => {
      const form = createMockForm({
        homePrice: '400000',
        loanTermYears: '30',
        scenario0Down: '80000',
        scenario0Rate: '6.5',
        scenario0Extra: '0',
        scenario0Closing: '5000',
        scenario1Down: '40000',
        scenario1Rate: '6.75',
        scenario1Extra: '200',
        scenario1Closing: '4000',
      });

      const result = parseFormInput(form);

      expect(result.homePrice).toBe(400000);
      expect(result.loanTermYears).toBe(30);
      expect(result.scenarios).toHaveLength(2);
      expect(result.scenarios[0].downPayment).toBe(80000);
      expect(result.scenarios[0].rate).toBe(6.5);
      expect(result.scenarios[1].downPayment).toBe(40000);
      expect(result.scenarios[1].rate).toBe(6.75);
    });

    it('should handle optional refinance rate', () => {
      const form = createMockForm({
        homePrice: '400000',
        loanTermYears: '30',
        refinanceRate: '5.5',
        scenario0Down: '80000',
        scenario0Rate: '6.5',
        scenario0Extra: '0',
        scenario0Closing: '0',
        scenario1Down: '40000',
        scenario1Rate: '6.75',
        scenario1Extra: '0',
        scenario1Closing: '0',
      });

      const result = parseFormInput(form);

      expect(result.refinanceRate).toBe(5.5);
    });

    it('should default refinanceRate to 0 when not provided', () => {
      const form = createMockForm({
        homePrice: '400000',
        loanTermYears: '30',
        scenario0Down: '80000',
        scenario0Rate: '6.5',
        scenario0Extra: '0',
        scenario0Closing: '0',
        scenario1Down: '40000',
        scenario1Rate: '6.75',
        scenario1Extra: '0',
        scenario1Closing: '0',
      });

      const result = parseFormInput(form);

      expect(result.refinanceRate).toBe(0);
    });
  });

  describe('validateInput', () => {
    it('should return null for valid input', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: 6.5, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).toBeNull();
    });

    it('should return error for home price <= 0', () => {
      const input = {
        homePrice: 0,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: 6.5, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
      expect(result).toContain('home price');
    });

    it('should return error for negative home price', () => {
      const input = {
        homePrice: -100000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: 6.5, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
    });

    it('should return error for less than 2 scenarios', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [{ downPayment: 80000, rate: 6.5, extraPayment: 0, closingCosts: 0 }],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
      expect(result).toContain('at least 2 scenarios');
    });

    it('should return error for down payment exceeding home price', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 500000, rate: 6.5, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
      expect(result).toContain('Down payment');
    });

    it('should return error for negative interest rate', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: -1, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
      expect(result).toContain('interest rate');
    });

    it('should return error for empty scenarios', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
      expect(result).toContain('scenario');
    });

    it('should accept 15-year loan term', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 15,
        scenarios: [
          { downPayment: 80000, rate: 6.5, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).toBeNull();
    });

    it('should accept high interest rate up to 30%', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: 15, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 20, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).toBeNull();
    });

    it('should return error for interest rate above 30%', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: 35, extraPayment: 0, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 0, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).not.toBeNull();
      expect(result).toContain('too high');
    });

    it('should accept extra payments', () => {
      const input = {
        homePrice: 400000,
        loanTermYears: 30,
        scenarios: [
          { downPayment: 80000, rate: 6.5, extraPayment: 500, closingCosts: 0 },
          { downPayment: 40000, rate: 6.75, extraPayment: 200, closingCosts: 0 },
        ],
      };

      const result = validateInput(input);

      expect(result).toBeNull();
    });
  });
});
