import { describe, expect, it } from 'vitest';
import { RentVsBuyTool } from '../tools/rent-vs-buy';

describe('RentVsBuyTool', () => {
  const validInput = {
    homePrice: 450000,
    downPayment: 90000,
    monthlyRent: 2400,
    interestRate: 6.5,
    yearsToAnalyze: 7,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(RentVsBuyTool.toolName).toBe('analyze_rent_vs_buy');
    });

    it('requires the key comparison fields', () => {
      expect(RentVsBuyTool.inputSchema.required).toEqual([
        'homePrice',
        'downPayment',
        'monthlyRent',
      ]);
    });
  });

  describe('execute', () => {
    it('returns a successful rent-vs-buy comparison payload', async () => {
      const result = (await RentVsBuyTool.execute(validInput)) as {
        success: boolean;
        data?: {
          buy: unknown;
          rent: unknown;
          comparison: { recommendation: string; breakEvenYear: number | null };
          inputSummary: { yearsAnalyzed: number };
        };
        timestamp?: string;
      };

      expect(result.success).toBe(true);
      expect(result.data?.buy).toBeDefined();
      expect(result.data?.rent).toBeDefined();
      expect(result.data?.comparison.recommendation).toBeTruthy();
      expect(result.data?.inputSummary.yearsAnalyzed).toBe(7);
      expect(result.timestamp).toBeTruthy();
    });

    it('returns a failure payload for invalid input', async () => {
      const result = (await RentVsBuyTool.execute({
        homePrice: -1,
        downPayment: 0,
        monthlyRent: 1000,
      })) as {
        success: boolean;
        error?: string;
      };

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });
});
