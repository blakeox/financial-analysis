import { describe, expect, it } from 'vitest';
import { DepreciationTool } from '../tools/depreciation';

describe('DepreciationTool', () => {
  const validInput = {
    assetInfo: {
      purchaseDate: '2024-01-01',
      purchaseCost: 10000,
      salvageValue: 0,
      usefulLife: 5,
      assetClass: 'equipment',
      businessUsePercentage: 1,
    },
    depreciationMethod: 'straight-line',
    taxInfo: {
      taxYear: 2024,
      federalTaxRate: 0.21,
      stateTaxRate: 0.05,
      section179Limit: 1080000,
      section179Threshold: 2900000,
      bonusDepreciationPercentage: 0.6,
    },
    analysis: {
      includeSchedule: true,
      includeTaxSavings: true,
      includeMethodComparison: false,
      projectionYears: 5,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(DepreciationTool.toolName).toBe('analyze_depreciation');
    expect(DepreciationTool.inputSchema.required).toEqual([
      'assetInfo',
      'depreciationMethod',
      'taxInfo',
      'analysis',
    ]);
  });

  it('calculates depreciation schedule and tax savings', async () => {
    const result = (await DepreciationTool.execute(validInput)) as {
      summary: {
        assetCost: number;
        totalDepreciation: number;
        totalTaxSavings: number;
        bookValue: number;
      };
    };

    expect(result.summary.assetCost).toBeCloseTo(10000, 6);
    expect(result.summary.totalDepreciation).toBeCloseTo(10000, 6);
    expect(result.summary.totalTaxSavings).toBeCloseTo(2600, 6);
    expect(result.summary.bookValue).toBeCloseTo(0, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      DepreciationTool.execute({
        ...validInput,
        analysis: {
          ...validInput.analysis,
          projectionYears: 0,
        },
      })
    ).rejects.toThrow();
  });
});
