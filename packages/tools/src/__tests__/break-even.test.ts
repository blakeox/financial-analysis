import { describe, expect, it } from 'vitest';
import { BreakEvenTool } from '../tools/break-even';

describe('BreakEvenTool', () => {
  const validInput = {
    fixedCosts: 10000,
    variableCostPerUnit: 25,
    pricePerUnit: 50,
    targetProfit: 5000,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(BreakEvenTool.toolName).toBe('analyze_break_even');
    });

    it('requires fixed costs, variable cost, and price', () => {
      expect(BreakEvenTool.inputSchema.required).toEqual([
        'fixedCosts',
        'variableCostPerUnit',
        'pricePerUnit',
      ]);
    });
  });

  describe('execute', () => {
    it('calculates break-even units and revenue', async () => {
      const result = (await BreakEvenTool.execute(validInput)) as {
        breakEvenPossible: boolean;
        breakEvenUnits: number | null;
        breakEvenRevenue: number | null;
      };

      expect(result.breakEvenPossible).toBe(true);
      expect(result.breakEvenUnits).toBeCloseTo(600, 6);
      expect(result.breakEvenRevenue).toBeCloseTo(30000, 6);
    });

    it('rejects invalid input', async () => {
      await expect(
        BreakEvenTool.execute({
          fixedCosts: -1,
          variableCostPerUnit: 10,
          pricePerUnit: 20,
        })
      ).rejects.toThrow();
    });
  });
});
