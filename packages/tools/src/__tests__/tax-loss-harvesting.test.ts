import { describe, expect, it } from 'vitest';
import { TaxLossHarvestingTool } from '../tools/tax-loss-harvesting';

describe('TaxLossHarvestingTool', () => {
  const validInput = {
    portfolio: {
      holdings: [
        {
          symbol: 'LOSS',
          shares: 10,
          costBasis: 1000,
          currentPrice: 80,
          purchaseDate: '2023-01-15',
          holdingPeriod: 'long-term',
        },
        {
          symbol: 'GAIN',
          shares: 5,
          costBasis: 200,
          currentPrice: 50,
          purchaseDate: '2024-01-15',
          holdingPeriod: 'short-term',
        },
      ],
      totalValue: 1050,
    },
    taxInfo: {
      federalTaxRate: {
        shortTerm: 0.24,
        longTerm: 0.15,
      },
      stateTaxRate: 0.05,
      incomeBracket: 0.24,
    },
    realizedGains: {
      shortTermGains: 0,
      longTermGains: 1000,
      ordinaryIncome: 120000,
    },
    harvestingStrategy: {
      maxHarvestAmount: 3000,
      includeWashSaleRules: true,
      washSaleWindow: 30,
      replacementSecuritySimilarity: 'similar',
    },
    analysis: {
      includeTaxSavingsProjection: true,
      includeCarryForwardAnalysis: true,
      projectionYears: 5,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(TaxLossHarvestingTool.toolName).toBe('analyze_tax_loss_harvesting');
    expect(TaxLossHarvestingTool.inputSchema.required).toEqual(['portfolio', 'taxInfo']);
  });

  it('calculates harvestable losses and tax savings', async () => {
    const result = (await TaxLossHarvestingTool.execute(validInput)) as {
      totalTaxLoss: number;
      projectedTaxSavings: number;
      harvestableLosses: Array<{ symbol: string; lossAmount: number }>;
    };

    expect(result.totalTaxLoss).toBeCloseTo(200, 6);
    expect(result.projectedTaxSavings).toBeCloseTo(30, 6);
    expect(result.harvestableLosses).toEqual([
      expect.objectContaining({
        symbol: 'LOSS',
        lossAmount: 200,
      }),
    ]);
  });

  it('rejects invalid input', async () => {
    await expect(
      TaxLossHarvestingTool.execute({
        ...validInput,
        taxInfo: {
          ...validInput.taxInfo,
          federalTaxRate: {
            ...validInput.taxInfo.federalTaxRate,
            longTerm: 0.5,
          },
        },
      })
    ).rejects.toThrow();
  });
});
