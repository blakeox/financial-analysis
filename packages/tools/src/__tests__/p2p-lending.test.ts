import { describe, expect, it } from 'vitest';
import { P2PLendingTool } from '../tools/p2p-lending';

describe('P2PLendingTool', () => {
  const validInput = {
    principal: 10000,
    annualInterestRate: 0.12,
    termYears: 3,
    feeRate: 0.01,
    defaultProbability: 0.05,
    recoveryRate: 0.2,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(P2PLendingTool.toolName).toBe('analyze_p2p_lending');
    });

    it('requires principal, rate, and term', () => {
      expect(P2PLendingTool.inputSchema.required).toEqual([
        'principal',
        'annualInterestRate',
        'termYears',
      ]);
    });
  });

  describe('execute', () => {
    it('estimates expected return and loss', async () => {
      const result = (await P2PLendingTool.execute(validInput)) as {
        expectedEndingValue: number;
        expectedLoss: number;
        expectedAnnualizedReturn: number | null;
      };

      expect(result.expectedLoss).toBeCloseTo(400, 6);
      expect(result.expectedEndingValue).toBeCloseTo(12985.8, 6);
      expect(result.expectedAnnualizedReturn).toBeCloseTo(0.0909953593, 6);
    });

    it('rejects invalid input', async () => {
      await expect(
        P2PLendingTool.execute({
          ...validInput,
          defaultProbability: 2,
        })
      ).rejects.toThrow();
    });
  });
});
