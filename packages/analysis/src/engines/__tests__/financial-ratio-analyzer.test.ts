/**
 * Financial Ratio Analyzer Tests
 */

import { describe, expect, it } from 'vitest';
import type { FinancialRatioAnalyzerInput } from '../../schemas/financial-ratio-analyzer.js';
import { FinancialRatioAnalyzer } from '../financial-ratio-analyzer.js';

describe('FinancialRatioAnalyzer', () => {
  const baseInput: FinancialRatioAnalyzerInput = {
    financialStatements: {
      balanceSheet: {
        currentAssets: 500000,
        totalAssets: 2000000,
        currentLiabilities: 200000,
        totalLiabilities: 800000,
        totalEquity: 1200000,
        cash: 100000,
        accountsReceivable: 150000,
        inventory: 250000,
        accountsPayable: 100000,
        shortTermDebt: 100000,
        longTermDebt: 600000,
      },
      incomeStatement: {
        revenue: 2000000,
        costOfGoodsSold: 1200000,
        grossProfit: 800000,
        operatingExpenses: 400000,
        ebitda: 500000,
        ebit: 400000,
        netIncome: 240000,
        interestExpense: 50000,
        taxExpense: 110000,
      },
      cashFlowStatement: {
        operatingCashFlow: 300000,
        capitalExpenditures: 100000,
        freeCashFlow: 200000,
      },
    },
    marketData: {
      sharePrice: 50,
      sharesOutstanding: 10000,
    },
    analysis: {
      includeLiquidityRatios: true,
      includeProfitabilityRatios: true,
      includeEfficiencyRatios: true,
      includeLeverageRatios: true,
      includeMarketRatios: true,
      includeBenchmarking: true,
    },
  };

  it('should calculate financial ratio analysis', () => {
    const result = FinancialRatioAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate liquidity ratios when requested', () => {
    const result = FinancialRatioAnalyzer.analyze(baseInput);
    expect(result.liquidityRatios).toBeDefined();
    expect(result.liquidityRatios.currentRatio).toBeGreaterThan(0);
  });

  it('should calculate profitability ratios', () => {
    const result = FinancialRatioAnalyzer.analyze(baseInput);
    expect(result.profitabilityRatios).toBeDefined();
    expect(result.profitabilityRatios.netProfitMargin).toBeDefined();
  });

  it('should calculate efficiency ratios', () => {
    const result = FinancialRatioAnalyzer.analyze(baseInput);
    expect(result.efficiencyRatios).toBeDefined();
  });

  it('should calculate leverage ratios', () => {
    const result = FinancialRatioAnalyzer.analyze(baseInput);
    expect(result.leverageRatios).toBeDefined();
    expect(result.leverageRatios.debtToEquity).toBeGreaterThanOrEqual(0);
  });
});

