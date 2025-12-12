/**
 * Startup Financial Model Tests
 */

import { describe, expect, it } from 'vitest';
import type { StartupFinancialModelInput } from '../../schemas/startup-financial-model.js';
import { StartupFinancialModel } from '../startup-financial-model.js';

describe('StartupFinancialModel', () => {
  const baseInput: StartupFinancialModelInput = {
    companyInfo: {
      companyName: 'Test Startup',
      industry: 'SaaS',
      businessModel: 'saas',
      stage: 'seed',
    },
    financials: {
      currentCash: 500000,
      monthlyBurnRate: 50000,
      monthlyRevenue: 10000,
      annualRecurringRevenue: 120000,
    },
    revenueProjections: {
      monthlyGrowthRate: 0.1,
      churnRate: 0.05,
      averageRevenuePerUser: 100,
    },
    unitEconomics: {
      customerAcquisitionCost: 500,
      lifetimeValue: 2000,
      grossMargin: 0.7,
    },
    analysis: {
      includeRunway: true,
      includeBurnRate: true,
      includeUnitEconomics: true,
      includeFundingScenarios: true,
      projectionMonths: 24,
    },
  };

  it('should calculate startup financial model', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate runway when requested', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.runwayAnalysis).toBeDefined();
    expect(result.runwayAnalysis.monthsOfRunway).toBeGreaterThan(0);
  });

  it('should analyze burn rate', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.burnRateAnalysis).toBeDefined();
  });

  it('should calculate unit economics', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.unitEconomics).toBeDefined();
    expect(result.unitEconomics.ltvToCacRatio).toBeGreaterThan(0);
  });

  it('should provide funding scenarios', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.fundingScenarios).toBeDefined();
    expect(Array.isArray(result.fundingScenarios)).toBe(true);
  });
});

