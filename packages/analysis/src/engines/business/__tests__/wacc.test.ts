import { describe, expect, it } from 'vitest';
import { WACCAnalyzer, WACCInputSchema, type WACCInput } from '../wacc.js';

describe('WACCAnalyzer', () => {
  const baseInput: WACCInput = {
    equityValue: 1000000,
    debtValue: 500000,
    costOfEquity: 0.1,
    costOfDebt: 0.05,
    taxRate: 0.21,
  };

  it('should calculate WACC correctly', () => {
    const result = WACCAnalyzer.analyze(baseInput);

    // Expected calculations:
    // Total value = 1,500,000
    // Equity weight = 1,000,000 / 1,500,000 = 0.6667
    // Debt weight = 500,000 / 1,500,000 = 0.3333
    // After-tax cost of debt = 0.05 * (1 - 0.21) = 0.0395
    // WACC = (0.6667 * 0.10) + (0.3333 * 0.0395) = 0.06667 + 0.013165 = 0.079835

    expect(result.wacc).toBeCloseTo(0.0798, 3);
    expect(result.equityWeight).toBeCloseTo(0.6667, 3);
    expect(result.debtWeight).toBeCloseTo(0.3333, 3);
    expect(result.costOfEquity).toBe(0.1);
    expect(result.costOfDebt).toBe(0.05);
    expect(result.taxRate).toBe(0.21);
    expect(result.afterTaxCostOfDebt).toBeCloseTo(0.0395, 4);
  });

  it('should handle zero debt', () => {
    const input: WACCInput = {
      ...baseInput,
      debtValue: 0,
    };
    const result = WACCAnalyzer.analyze(input);

    expect(result.wacc).toBe(0.1);
    expect(result.equityWeight).toBe(1);
    expect(result.debtWeight).toBe(0);
  });

  it('should handle zero equity', () => {
    const input: WACCInput = {
      ...baseInput,
      equityValue: 0,
    };
    const result = WACCAnalyzer.analyze(input);

    expect(result.wacc).toBeCloseTo(0.0395, 4);
    expect(result.equityWeight).toBe(0);
    expect(result.debtWeight).toBe(1);
  });

  it('should validate input schema', () => {
    expect(() => WACCInputSchema.parse(baseInput)).not.toThrow();

    expect(() => WACCInputSchema.parse({ ...baseInput, equityValue: -1 })).toThrow();
    expect(() => WACCInputSchema.parse({ ...baseInput, costOfEquity: 1.5 })).toThrow();
    expect(() => WACCInputSchema.parse({ ...baseInput, taxRate: -0.1 })).toThrow();
  });

  describe('Comprehensive Analysis', () => {
    it('should return a complete analysis object with all required fields', () => {
      const result = WACCAnalyzer.analyze(baseInput);

      expect(result).toHaveProperty('wacc');
      expect(result).toHaveProperty('equityWeight');
      expect(result).toHaveProperty('debtWeight');
      expect(result).toHaveProperty('costOfEquity');
      expect(result).toHaveProperty('costOfDebt');
      expect(result).toHaveProperty('taxRate');
      expect(result).toHaveProperty('afterTaxCostOfDebt');
    });
  });
});
