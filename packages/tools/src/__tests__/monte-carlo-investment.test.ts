import { describe, expect, it } from 'vitest';
import { MonteCarloInvestmentTool } from '../tools/monte-carlo-investment';

describe('MonteCarloInvestmentTool', () => {
  const validInput = {
    initialValue: 10000,
    expectedReturn: 0.08,
    volatility: 0.15,
    years: 3,
    simulations: 250,
    stepsPerYear: 12,
    seed: 42,
    percentiles: [0.1, 0.5, 0.9],
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(MonteCarloInvestmentTool.toolName).toBe('simulate_investment_monte_carlo');
    });

    it('requires the core simulation inputs', () => {
      expect(MonteCarloInvestmentTool.inputSchema.required).toEqual([
        'initialValue',
        'expectedReturn',
        'volatility',
        'years',
      ]);
    });
  });

  describe('execute', () => {
    it('returns deterministic simulated outcomes for a fixed seed', async () => {
      const first = (await MonteCarloInvestmentTool.execute(validInput)) as {
        endingValue: { mean: number; percentiles: Record<string, number> };
        simulations: number;
      };
      const second = (await MonteCarloInvestmentTool.execute(validInput)) as {
        endingValue: { mean: number; percentiles: Record<string, number> };
      };

      expect(first.simulations).toBe(250);
      expect(first.endingValue.mean).toBeCloseTo(second.endingValue.mean, 10);
      expect(first.endingValue.percentiles['0.5']).toBeCloseTo(
        second.endingValue.percentiles['0.5'],
        10
      );
    });

    it('rejects invalid input', async () => {
      await expect(
        MonteCarloInvestmentTool.execute({
          ...validInput,
          volatility: -1,
        })
      ).rejects.toThrow();
    });
  });
});
