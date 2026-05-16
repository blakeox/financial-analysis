import { describe, expect, it } from 'vitest';
import { CAPMTool } from '../tools/capm';

describe('CAPMTool', () => {
  const validInput = {
    riskFreeRate: 0.04,
    beta: 1.2,
    marketRiskPremium: 0.05,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(CAPMTool.toolName).toBe('calculate_capm');
    });

    it('requires risk free rate, beta, and market premium', () => {
      expect(CAPMTool.inputSchema.required).toEqual(['riskFreeRate', 'beta', 'marketRiskPremium']);
    });
  });

  describe('execute', () => {
    it('calculates expected return', async () => {
      const result = (await CAPMTool.execute(validInput)) as {
        expectedReturn: number;
        beta: number;
      };

      expect(result.expectedReturn).toBeCloseTo(0.1, 6);
      expect(result.beta).toBe(1.2);
    });

    it('rejects invalid input', async () => {
      await expect(
        CAPMTool.execute({
          ...validInput,
          marketRiskPremium: 'bad',
        })
      ).rejects.toThrow();
    });
  });
});
