import { describe, expect, it } from 'vitest';
import { VaRTool } from '../tools/var';

describe('VaRTool', () => {
  const validInput = {
    portfolio: {
      positions: [
        { symbol: 'AAPL', quantity: 100, currentPrice: 200, assetClass: 'stock' },
        { symbol: 'MSFT', quantity: 200, currentPrice: 150, assetClass: 'stock' },
      ],
      totalValue: 1000000,
    },
    parameters: {
      confidenceLevel: 0.95,
      timeHorizon: 1,
      method: 'historical',
    },
    marketData: {
      historicalReturns: [-0.02, -0.01, 0.005, -0.03, 0.01],
      volatilities: [0.2, 0.18],
      correlations: [
        [1, 0.5],
        [0.5, 1],
      ],
    },
    analysis: {
      includeStressTesting: true,
      includeBacktesting: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(VaRTool.toolName).toBe('analyze_var');
    expect(VaRTool.inputSchema.required).toEqual(['portfolio', 'parameters']);
  });

  it('calculates historical VaR', async () => {
    const result = (await VaRTool.execute(validInput)) as {
      summary: {
        var: number;
        varPercent: number;
        method: string;
      };
    };

    expect(result.summary.var).toBeCloseTo(30000, 6);
    expect(result.summary.varPercent).toBeCloseTo(3, 6);
    expect(result.summary.method).toBe('Historical Simulation');
  });

  it('rejects invalid input', async () => {
    await expect(
      VaRTool.execute({
        ...validInput,
        parameters: {
          ...validInput.parameters,
          confidenceLevel: 0.5,
        },
      })
    ).rejects.toThrow();
  });
});
