import { describe, expect, it } from 'vitest';
import { FXHedgingTool } from '../tools/fx-hedging';

describe('FXHedgingTool', () => {
  const validInput = {
    spotRate: 1.1,
    domesticRate: 0.05,
    foreignRate: 0.02,
    tenorYears: 1,
    expectedSpotRateAtMaturity: 1.15,
    foreignAssetReturn: 0.08,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(FXHedgingTool.toolName).toBe('analyze_fx_hedge');
    });

    it('requires the core FX hedge inputs', () => {
      expect(FXHedgingTool.inputSchema.required).toEqual([
        'spotRate',
        'domesticRate',
        'foreignRate',
        'tenorYears',
      ]);
    });
  });

  describe('execute', () => {
    it('calculates forward rate and hedged versus unhedged returns', async () => {
      const result = (await FXHedgingTool.execute(validInput)) as {
        forwardRate: number;
        hedgePoints: number;
        hedgedReturn?: number;
        unhedgedReturn?: number;
      };

      expect(result.forwardRate).toBeCloseTo(1.1323529412, 6);
      expect(result.hedgePoints).toBeCloseTo(0.0323529412, 6);
      expect(result.hedgedReturn).toBeDefined();
      expect(result.unhedgedReturn).toBeDefined();
      expect((result.hedgedReturn ?? 0) < (result.unhedgedReturn ?? 0)).toBe(true);
    });

    it('rejects invalid input', async () => {
      await expect(
        FXHedgingTool.execute({
          ...validInput,
          spotRate: 0,
        })
      ).rejects.toThrow();
    });
  });
});
