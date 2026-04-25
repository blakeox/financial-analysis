import { describe, expect, it } from 'vitest';
import { RiskAdjustedReturnsTool } from '../tools/risk-adjusted-returns';

describe('RiskAdjustedReturnsTool', () => {
  const validInput = {
    returns: [0.02, 0.01, -0.01, 0.03, 0.015],
    riskFreeRate: 0.001,
    targetReturn: 0,
    periodsPerYear: 12,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(RiskAdjustedReturnsTool.toolName).toBe('analyze_risk_adjusted_returns');
    });

    it('requires a returns array', () => {
      expect(RiskAdjustedReturnsTool.inputSchema.required).toEqual(['returns']);
    });
  });

  describe('execute', () => {
    it('calculates sharpe and sortino metrics', async () => {
      const result = (await RiskAdjustedReturnsTool.execute(validInput)) as {
        averageReturn: number;
        sharpeRatio: number | null;
        sortinoRatio: number | null;
      };

      expect(result.averageReturn).toBeCloseTo(0.013, 6);
      expect(result.sharpeRatio).not.toBeNull();
      expect(result.sortinoRatio).not.toBeNull();
      expect((result.sharpeRatio ?? 0) > 0).toBe(true);
      expect((result.sortinoRatio ?? 0) > 0).toBe(true);
    });

    it('rejects invalid input', async () => {
      await expect(RiskAdjustedReturnsTool.execute({ returns: ['bad'] })).rejects.toThrow();
    });
  });
});
