import { describe, expect, it } from 'vitest';
import { WorkingCapitalTool } from '../tools/working-capital';

describe('WorkingCapitalTool', () => {
  const validInput = {
    companyInfo: {
      industry: 'distribution',
      annualRevenue: 1000000,
    },
    currentAssets: {
      cash: 50000,
      accountsReceivable: 80000,
      inventory: 70000,
      otherCurrentAssets: 0,
    },
    currentLiabilities: {
      accountsPayable: 60000,
      shortTermDebt: 20000,
      accruedExpenses: 10000,
      otherCurrentLiabilities: 0,
    },
    operatingMetrics: {
      daysSalesOutstanding: 40,
      daysPayableOutstanding: 30,
      daysInventoryOutstanding: 50,
      inventoryTurnover: 7,
    },
    analysis: {
      includeCashConversionCycle: true,
      includeOptimization: true,
      includeLiquidityAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(WorkingCapitalTool.toolName).toBe('analyze_working_capital');
    expect(WorkingCapitalTool.inputSchema.required).toEqual([
      'companyInfo',
      'currentAssets',
      'currentLiabilities',
    ]);
  });

  it('calculates working capital and liquidity ratios', async () => {
    const result = (await WorkingCapitalTool.execute(validInput)) as {
      summary: {
        workingCapital: number;
        currentRatio: number;
        quickRatio: number;
        cashConversionCycle?: number;
      };
    };

    expect(result.summary.workingCapital).toBeCloseTo(110000, 6);
    expect(result.summary.currentRatio).toBeCloseTo(200000 / 90000, 6);
    expect(result.summary.quickRatio).toBeCloseTo(130000 / 90000, 6);
    expect(result.summary.cashConversionCycle).toBeCloseTo(60, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      WorkingCapitalTool.execute({
        ...validInput,
        currentAssets: {
          ...validInput.currentAssets,
          cash: -1,
        },
      })
    ).rejects.toThrow();
  });
});
