/**
 * Startup Financial Model Tests
 */

import { describe, expect, it } from 'vitest';
import type { StartupFinancialModelInput } from '../../../schemas/startup-financial-model.js';
import { StartupFinancialModel } from '../startup-financial-model.js';

describe('StartupFinancialModel', () => {
  const baseInput: StartupFinancialModelInput = {
    companyInfo: {
      name: 'Test Startup',
      industry: 'SaaS',
      businessModel: 'saas',
      stage: 'seed',
    },
    currentSituation: {
      currentCash: 500000,
      monthlyBurnRate: 50000,
      currentRevenue: 10000,
      currentMRR: 10000,
      currentCustomers: 100,
    },
    revenueProjections: {
      revenueModel: 'subscription',
      monthlyRevenue: [],
      growthAssumptions: {
        customerGrowthRate: 0.1,
        revenuePerCustomer: 100,
        churnRate: 0.05,
      },
    },
    expenses: {
      fixedCosts: {
        salaries: 30000,
        rent: 5000,
        utilities: 1000,
        insurance: 1000,
        otherFixed: 3000,
      },
      variableCosts: {
        costOfGoodsSold: 0.2,
        marketing: 0.3,
        sales: 0.1,
        customerAcquisitionCost: 500,
      },
    },
    funding: {
      fundingRounds: [],
      plannedFunding: [],
    },
    milestones: [],
    analysis: {
      includeRunway: true,
      includeBurnRate: true,
      includeUnitEconomics: true,
      includeFundingNeeds: true,
      includeMilestoneTracking: true,
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
    expect(result.runwayAnalysis.runwayMonths).toBeDefined();
  });

  it('should analyze burn rate', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.burnRateAnalysis).toBeDefined();
  });

  it('should calculate unit economics', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.unitEconomics).toBeDefined();
    expect(result.unitEconomics.ltvCacRatio).toBeGreaterThan(0);
  });

  it('should provide funding needs', () => {
    const result = StartupFinancialModel.analyze(baseInput);
    expect(result.fundingNeeds).toBeDefined();
  });
});
