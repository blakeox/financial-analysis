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

  const cloneInput = (): FinancialRatioAnalyzerInput =>
    JSON.parse(JSON.stringify(baseInput)) as FinancialRatioAnalyzerInput;

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

  it('should flag liquidity concerns when current ratio below 1', () => {
    const input = cloneInput();
    input.financialStatements.balanceSheet.currentAssets = 100000;
    input.financialStatements.balanceSheet.currentLiabilities = 200000;

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.liquidityRatios?.interpretation).toContain('below 1');
  });

  it('should return zero market ratios when shares outstanding are missing', () => {
    const input = cloneInput();
    input.marketData = { sharePrice: 25 };

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.marketRatios).toEqual({
      peRatio: 0,
      priceToBook: 0,
      priceToSales: 0,
      evToEbitda: 0,
    });
  });

  it('should warn on high leverage and weak benchmarking', () => {
    const input = cloneInput();
    input.financialStatements.balanceSheet.totalEquity = 100000;
    input.financialStatements.balanceSheet.shortTermDebt = 200000;
    input.financialStatements.balanceSheet.longTermDebt = 800000;
    input.financialStatements.balanceSheet.currentAssets = 200000;
    input.financialStatements.balanceSheet.currentLiabilities = 300000;
    input.marketData = {
      sharePrice: 25,
      sharesOutstanding: 10000,
      industryAverages: {
        currentRatio: 3,
        roe: 12,
        debtToEquity: 1,
      },
    };

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.recommendations).toContain('High debt-to-equity ratio - consider reducing debt');
    expect(result.recommendations).toContain(
      'Liquidity ratios below industry average - improve working capital management'
    );
  });

  it('should handle zero revenue and zero interest expense', () => {
    const input = cloneInput();
    input.financialStatements.incomeStatement.revenue = 0;
    input.financialStatements.incomeStatement.interestExpense = 0;

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.profitabilityRatios?.netMargin).toBe(0);
    expect(result.leverageRatios?.timesInterestEarned).toBe(0);
  });

  it('should fallback to zero ratios when denominators are zero', () => {
    const input = cloneInput();
    input.financialStatements.balanceSheet.currentLiabilities = 0;
    input.financialStatements.balanceSheet.totalAssets = 0;
    input.financialStatements.balanceSheet.totalEquity = 0;
    input.financialStatements.balanceSheet.longTermDebt = 0;
    input.financialStatements.balanceSheet.inventory = 0;
    input.financialStatements.balanceSheet.accountsReceivable = 0;
    input.financialStatements.balanceSheet.accountsPayable = 0;
    input.financialStatements.incomeStatement.revenue = 0;
    input.financialStatements.incomeStatement.ebitda = 0;
    input.financialStatements.incomeStatement.netIncome = 0;
    input.financialStatements.incomeStatement.interestExpense = 0;

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.liquidityRatios?.currentRatio).toBe(0);
    expect(result.liquidityRatios?.quickRatio).toBe(0);
    expect(result.liquidityRatios?.cashRatio).toBe(0);
    expect(result.profitabilityRatios?.roe).toBe(0);
    expect(result.profitabilityRatios?.roa).toBe(0);
    expect(result.profitabilityRatios?.roic).toBe(0);
    expect(result.efficiencyRatios?.assetTurnover).toBe(0);
    expect(result.efficiencyRatios?.inventoryTurnover).toBe(0);
    expect(result.efficiencyRatios?.receivablesTurnover).toBe(0);
    expect(result.efficiencyRatios?.payablesTurnover).toBe(0);
  });

  it('should return zero market ratios when earnings and sales are non-positive', () => {
    const input = cloneInput();
    input.financialStatements.incomeStatement.netIncome = 0;
    input.financialStatements.incomeStatement.revenue = 0;
    input.financialStatements.incomeStatement.ebitda = 0;
    input.financialStatements.balanceSheet.totalEquity = 0;
    input.marketData = {
      sharePrice: 42,
      sharesOutstanding: 1000,
    };

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.marketRatios).toEqual({
      peRatio: 0,
      priceToBook: 0,
      priceToSales: 0,
      evToEbitda: 0,
    });
  });

  it('computes benchmarking when ratios are disabled', () => {
    const input = cloneInput();
    input.analysis.includeLiquidityRatios = false;
    input.analysis.includeProfitabilityRatios = false;
    input.analysis.includeLeverageRatios = false;
    input.marketData = {
      sharePrice: 25,
      sharesOutstanding: 10000,
      industryAverages: {
        currentRatio: 2,
        roe: 10,
        debtToEquity: 1,
      },
    };

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.benchmarking?.liquidityComparison.ratio).toBe(0);
    expect(result.benchmarking?.profitabilityComparison.ratio).toBe(0);
    expect(result.benchmarking?.leverageComparison.ratio).toBe(0);
    expect(result.recommendations).toContain(
      'Liquidity ratios below industry average - improve working capital management'
    );
  });

  it('handles benchmarking with missing industry averages', () => {
    const input = cloneInput();
    input.marketData = {
      sharePrice: 25,
      sharesOutstanding: 10000,
      industryAverages: {},
    };

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.benchmarking?.liquidityComparison.industry).toBe(0);
    expect(result.benchmarking?.profitabilityComparison.industry).toBe(0);
    expect(result.benchmarking?.leverageComparison.industry).toBe(0);
  });

  it('should omit optional analyses when flags are disabled', () => {
    const input = cloneInput();
    input.analysis = {
      includeLiquidityRatios: false,
      includeProfitabilityRatios: false,
      includeEfficiencyRatios: false,
      includeLeverageRatios: false,
      includeMarketRatios: false,
      includeBenchmarking: false,
    };

    const result = FinancialRatioAnalyzer.analyze(input);
    expect(result.liquidityRatios).toBeUndefined();
    expect(result.profitabilityRatios).toBeUndefined();
    expect(result.efficiencyRatios).toBeUndefined();
    expect(result.leverageRatios).toBeUndefined();
    expect(result.marketRatios).toBeUndefined();
    expect(result.benchmarking).toBeUndefined();
    expect(result.recommendations).toEqual([]);
  });
});

