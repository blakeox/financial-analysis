import { describe, expect, it } from 'vitest';
import { WACCTool } from '../tools/wacc';

describe('WACCTool', () => {
  const validInput = {
    equityValue: 700,
    debtValue: 300,
    costOfEquity: 0.1,
    costOfDebt: 0.05,
    taxRate: 0.21,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(WACCTool.toolName).toBe('calculate_wacc');
    });

    it('defines the required input schema', () => {
      expect(WACCTool.inputSchema.type).toBe('object');
      expect(WACCTool.inputSchema.required).toEqual([
        'equityValue',
        'debtValue',
        'costOfEquity',
        'costOfDebt',
        'taxRate',
      ]);
    });
  });

  describe('execute', () => {
    it('calculates weighted capital costs', async () => {
      const result = await WACCTool.execute(validInput);

      expect(result.wacc).toBeCloseTo(0.08185, 6);
      expect(result.equityWeight).toBeCloseTo(0.7, 6);
      expect(result.debtWeight).toBeCloseTo(0.3, 6);
      expect(result.afterTaxCostOfDebt).toBeCloseTo(0.0395, 6);
    });

    it('rejects invalid input', async () => {
      expect(() =>
        WACCTool.execute({
          ...validInput,
          taxRate: 1.5,
        })
      ).toThrow();
    });
  });
});
