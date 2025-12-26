/**
 * Startup Financial Model Tests
 */

import { describe, expect, it } from 'vitest';
import { StartupFinancialModelInputSchema } from '../../schemas/startup-financial-model.js';
import { StartupFinancialModel } from '../startup-financial-model.js';

describe('StartupFinancialModel', () => {
  const baseInput = {
    companyInfo: {
      name: 'Test Startup',
      industry: 'SaaS',
      stage: 'seed',
      businessModel: 'saas',
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
      includeBurnRate: true,
      includeRunway: true,
      includeUnitEconomics: true,
      includeFundingNeeds: true,
      includeMilestoneTracking: true,
      projectionMonths: 24,
    },
  };

  it('should calculate startup financial model', () => {
    const input = StartupFinancialModelInputSchema.parse(baseInput);
    const result = StartupFinancialModel.analyze(input) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate runway when requested', () => {
    const input = StartupFinancialModelInputSchema.parse(baseInput);
    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.runwayAnalysis).toBeDefined();
    expect(result.runwayAnalysis.runwayMonths).toBeGreaterThan(0);
  });

  it('should analyze burn rate', () => {
    const input = StartupFinancialModelInputSchema.parse(baseInput);
    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.burnRateAnalysis).toBeDefined();
  });

  it('should calculate unit economics', () => {
    const input = StartupFinancialModelInputSchema.parse(baseInput);
    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.unitEconomics).toBeDefined();
    expect(result.unitEconomics.ltvCacRatio).toBeGreaterThan(0);
  });

  it('should provide funding scenarios', () => {
    const input = StartupFinancialModelInputSchema.parse(baseInput);
    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.fundingNeeds).toBeDefined();
    expect(result.fundingNeeds.totalFundingNeeded).toBeGreaterThanOrEqual(0);
  });
});

