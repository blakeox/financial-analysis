import { describe, expect, it } from 'vitest';
import { DividendReinvestmentTool } from '../tools/dividend-reinvestment';

describe('DividendReinvestmentTool', () => {
  const validInput = {
    initialInvestment: 10000,
    sharePrice: 50,
    years: 5,
    annualDividendYield: 0.03,
    dividendFrequency: 'quarterly' as const,
    sharePriceGrowthRate: 0.04,
    dividendGrowthRate: 0.02,
    annualContribution: 1200,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(DividendReinvestmentTool.toolName).toBe('calculate_dividend_reinvestment');
    });

    it('requires the core dividend inputs', () => {
      expect(DividendReinvestmentTool.inputSchema.required).toEqual([
        'initialInvestment',
        'sharePrice',
        'years',
        'annualDividendYield',
      ]);
    });
  });

  describe('execute', () => {
    it('models ending value, shares, and contribution totals', async () => {
      const result = (await DividendReinvestmentTool.execute(validInput)) as {
        endingValue: number;
        endingShares: number;
        totalContributions: number;
        totalDividends: number;
        cagr: number | null;
      };

      expect(result.endingValue).toBeGreaterThan(validInput.initialInvestment);
      expect(result.endingShares).toBeGreaterThan(200);
      expect(result.totalContributions).toBe(16000);
      expect(result.totalDividends).toBeGreaterThan(0);
      expect(result.cagr).not.toBeNull();
    });

    it('rejects invalid input', async () => {
      await expect(
        DividendReinvestmentTool.execute({
          ...validInput,
          annualDividendYield: -0.1,
        })
      ).rejects.toThrow();
    });
  });
});
