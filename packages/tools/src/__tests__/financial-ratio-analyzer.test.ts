import { describe, expect, it } from 'vitest';
import { FinancialRatioAnalyzerTool } from '../tools/financial-ratio-analyzer';

describe('FinancialRatioAnalyzerTool', () => {
  const validInput = {
    companyInfo: {
      name: 'Acme',
      industry: 'software',
      size: 'medium',
    },
    financialStatements: {
      balanceSheet: {
        currentAssets: 500000,
        totalAssets: 1200000,
        currentLiabilities: 250000,
        totalLiabilities: 500000,
        totalEquity: 700000,
        cash: 100000,
        accountsReceivable: 150000,
        inventory: 50000,
        accountsPayable: 80000,
        shortTermDebt: 100000,
        longTermDebt: 200000,
      },
      incomeStatement: {
        revenue: 1000000,
        costOfGoodsSold: 400000,
        grossProfit: 600000,
        operatingExpenses: 300000,
        ebitda: 350000,
        ebit: 300000,
        netIncome: 200000,
        interestExpense: 20000,
        taxExpense: 50000,
      },
      cashFlowStatement: {
        operatingCashFlow: 250000,
        capitalExpenditures: 50000,
        freeCashFlow: 200000,
        investingCashFlow: -50000,
        financingCashFlow: 100000,
      },
    },
    marketData: {
      sharePrice: 20,
      sharesOutstanding: 100000,
      industryAverages: {
        currentRatio: 1.8,
        roe: 20,
        debtToEquity: 0.5,
      },
    },
    analysis: {
      includeLiquidityRatios: true,
      includeProfitabilityRatios: true,
      includeEfficiencyRatios: true,
      includeLeverageRatios: true,
      includeMarketRatios: true,
      includeTrendAnalysis: false,
      includeBenchmarking: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(FinancialRatioAnalyzerTool.toolName).toBe('analyze_financial_ratios');
    expect(FinancialRatioAnalyzerTool.inputSchema.required).toEqual(['financialStatements']);
  });

  it('calculates key liquidity, profitability, and leverage ratios', async () => {
    const result = (await FinancialRatioAnalyzerTool.execute(validInput)) as {
      summary: {
        currentRatio: number;
        quickRatio: number;
        roe: number;
        roa: number;
        debtToEquity: number;
      };
    };

    expect(result.summary.currentRatio).toBeCloseTo(2, 6);
    expect(result.summary.quickRatio).toBeCloseTo(1.8, 6);
    expect(result.summary.roe).toBeCloseTo(28.57, 2);
    expect(result.summary.roa).toBeCloseTo(16.67, 2);
    expect(result.summary.debtToEquity).toBeCloseTo(0.4286, 4);
  });

  it('rejects invalid input', async () => {
    await expect(
      FinancialRatioAnalyzerTool.execute({
        ...validInput,
        financialStatements: {
          ...validInput.financialStatements,
          balanceSheet: {
            ...validInput.financialStatements.balanceSheet,
            currentAssets: -1,
          },
        },
      })
    ).rejects.toThrow();
  });
});
