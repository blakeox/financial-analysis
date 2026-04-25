import { describe, expect, it } from 'vitest';
import { PortfolioOptimizationTool } from '../tools/portfolio-optimization';

describe('PortfolioOptimizationTool', () => {
  const validInput = {
    portfolio: {
      currentHoldings: [
        {
          symbol: 'AAA',
          shares: 50,
          currentPrice: 100,
          assetClass: 'stock',
        },
        {
          symbol: 'BBB',
          shares: 100,
          currentPrice: 50,
          assetClass: 'bond',
        },
      ],
      totalValue: 10000,
    },
    constraints: {
      riskTolerance: 'moderate',
      minAllocation: 0.2,
      maxAllocation: 0.8,
      targetReturn: 0.08,
      maxRisk: 0.2,
    },
    marketData: {
      expectedReturns: [0.1, 0.06],
      volatilities: [0.2, 0.1],
      correlationMatrix: [
        [1, 0.2],
        [0.2, 1],
      ],
    },
    analysis: {
      includeEfficientFrontier: true,
      includeRebalancing: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(PortfolioOptimizationTool.toolName).toBe('analyze_portfolio_optimization');
    expect(PortfolioOptimizationTool.inputSchema.required).toEqual(['portfolio', 'constraints']);
  });

  it('calculates optimized return and risk', async () => {
    const result = (await PortfolioOptimizationTool.execute(validInput)) as {
      summary: {
        currentReturn: number;
        optimalReturn: number;
        currentRisk: number;
        optimalRisk: number;
        improvement: number;
      };
    };

    expect(result.summary.currentReturn).toBeCloseTo(0.08, 6);
    expect(result.summary.optimalReturn).toBeCloseTo(0.0804, 6);
    expect(result.summary.currentRisk).toBeCloseTo(0.1118, 4);
    expect(result.summary.optimalRisk).toBeCloseTo(0.1132, 4);
    expect(result.summary.improvement).toBeCloseTo(0.0004, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      PortfolioOptimizationTool.execute({
        ...validInput,
        constraints: {
          ...validInput.constraints,
          maxAllocation: 1.5,
        },
      })
    ).rejects.toThrow();
  });
});
