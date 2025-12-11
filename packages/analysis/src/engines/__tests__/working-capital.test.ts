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
});
