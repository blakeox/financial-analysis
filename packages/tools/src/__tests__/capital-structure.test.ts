import { describe, expect, it } from 'vitest';
import { CapitalStructureTool } from '../tools/capital-structure';

describe('CapitalStructureTool', () => {
  const validInput = {
    companyInfo: {
      marketCap: 1000000,
      currentDebt: 400000,
      cashAndEquivalents: 100000,
      sharesOutstanding: 100000,
      stockPrice: 10,
    },
    financials: {
      annualEBITDA: 200000,
      annualEBIT: 150000,
      netIncome: 90000,
      taxRate: 0.25,
      annualInterestExpense: 20000,
    },
    marketData: {
      riskFreeRate: 0.04,
      marketRiskPremium: 0.06,
      beta: 1.1,
      creditRating: 'BBB',
    },
    analysis: {
      includeWACCOptimization: true,
      includeDebtCapacity: true,
      includeCreditRatingImpact: true,
      includeDividendPolicy: false,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(CapitalStructureTool.toolName).toBe('analyze_capital_structure');
    expect(CapitalStructureTool.inputSchema.required).toEqual([
      'companyInfo',
      'financials',
      'marketData',
    ]);
  });

  it('analyzes capital structure and WACC', async () => {
    const result = (await CapitalStructureTool.execute(validInput)) as {
      summary: {
        currentWACC: number;
        currentDebtToEquity: number;
        debtCapacity?: number;
      };
    };

    expect(result.summary.currentWACC).toBeCloseTo(0.0864285714, 6);
    expect(result.summary.currentDebtToEquity).toBeCloseTo(0.4, 6);
    expect(result.summary.debtCapacity).toBeGreaterThan(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      CapitalStructureTool.execute({
        ...validInput,
        marketData: {
          ...validInput.marketData,
          beta: 6,
        },
      })
    ).rejects.toThrow();
  });
});
