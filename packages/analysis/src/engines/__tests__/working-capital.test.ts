/**
 * Working Capital Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { WorkingCapitalInput } from '../../schemas/working-capital.js';
import { WorkingCapitalOptimizer } from '../working-capital.js';

describe('WorkingCapitalOptimizer', () => {
  const baseInput: WorkingCapitalInput = {
    companyInfo: {
      industry: 'Manufacturing',
      annualRevenue: 10000000,
    },
    currentAssets: {
      cash: 1000000,
      accountsReceivable: 2000000,
      inventory: 1500000,
      otherCurrentAssets: 500000,
    },
    currentLiabilities: {
      accountsPayable: 1500000,
      shortTermDebt: 500000,
      accruedExpenses: 300000,
      otherCurrentLiabilities: 200000,
    },
    operatingMetrics: {
      daysSalesOutstanding: 45,
      daysPayableOutstanding: 30,
      daysInventoryOutstanding: 60,
    },
    analysis: {
      includeCashConversionCycle: true,
      includeOptimization: true,
      includeLiquidityAnalysis: true,
    },
  };

  it('should calculate working capital', () => {
    const result = WorkingCapitalOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.workingCapital).toBeDefined();
    expect(result.workingCapital.netWorkingCapital).toBeDefined();
  });

  it('should calculate ratios', () => {
    const result = WorkingCapitalOptimizer.analyze(baseInput);
    expect(result.ratios).toBeDefined();
    expect(result.ratios.currentRatio).toBeGreaterThan(0);
    expect(result.ratios.quickRatio).toBeGreaterThan(0);
  });

  it('should calculate cash conversion cycle when requested', () => {
    const result = WorkingCapitalOptimizer.analyze(baseInput);
    expect(result.cashConversionCycle).toBeDefined();
    expect(result.cashConversionCycle?.cycle).toBeDefined();
  });

  it('should analyze liquidity when requested', () => {
    const result = WorkingCapitalOptimizer.analyze(baseInput);
    expect(result.liquidityAnalysis).toBeDefined();
    expect(result.liquidityAnalysis?.liquidityStatus).toBeDefined();
  });

  it('should provide optimization recommendations', () => {
    const result = WorkingCapitalOptimizer.analyze(baseInput);
    expect(result.optimization).toBeDefined();
    expect(result.optimization?.optimizations.length).toBeGreaterThan(0);
  });

  it('should compute cash conversion cycle from balances when metrics are missing', () => {
    const result = WorkingCapitalOptimizer.analyze({
      ...baseInput,
      operatingMetrics: {
        inventoryTurnover: 6,
      },
    });

    expect(result.cashConversionCycle).toBeDefined();
    expect(result.cashConversionCycle.daysSalesOutstanding).toBeGreaterThan(0);
    expect(result.cashConversionCycle.daysInventoryOutstanding).toBeGreaterThan(0);
    expect(result.cashConversionCycle.daysPayableOutstanding).toBeGreaterThan(0);
  });

  it('should mark liquidity as critical with negative working capital', () => {
    const result = WorkingCapitalOptimizer.analyze({
      ...baseInput,
      currentAssets: {
        cash: 10000,
        accountsReceivable: 20000,
        inventory: 10000,
        otherCurrentAssets: 0,
      },
      currentLiabilities: {
        accountsPayable: 200000,
        shortTermDebt: 50000,
        accruedExpenses: 20000,
        otherCurrentLiabilities: 10000,
      },
    });

    expect(result.liquidityAnalysis.liquidityStatus).toBe('Critical');
    expect(result.liquidityAnalysis.riskFactors.join(' ')).toContain('Negative working capital');
    expect(result.recommendations.join(' ')).toContain('Negative working capital');
  });

  it('should skip AP optimization when DPO is already high', () => {
    const result = WorkingCapitalOptimizer.analyze({
      ...baseInput,
      operatingMetrics: {
        daysSalesOutstanding: 45,
        daysPayableOutstanding: 90,
        daysInventoryOutstanding: 60,
      },
    });

    const areas = result.optimization.optimizations.map((opt: any) => opt.area);
    expect(areas).toContain('Accounts Receivable');
    expect(areas).toContain('Inventory');
    expect(areas).not.toContain('Accounts Payable');
  });

  it('should omit optional analyses when disabled', () => {
    const result = WorkingCapitalOptimizer.analyze({
      ...baseInput,
      analysis: {
        includeCashConversionCycle: false,
        includeOptimization: false,
        includeLiquidityAnalysis: false,
      },
    });

    expect(result.cashConversionCycle).toBeUndefined();
    expect(result.optimization).toBeUndefined();
    expect(result.liquidityAnalysis).toBeUndefined();
  });
});
