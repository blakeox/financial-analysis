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

  it('should classify burn rate trend as increasing when revenue is low', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      currentSituation: {
        ...baseInput.currentSituation,
        currentRevenue: 0,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.burnRateAnalysis.burnRateTrend).toBe('increasing');
  });

  it('should classify burn rate trend as decreasing when revenue is high', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      currentSituation: {
        ...baseInput.currentSituation,
        currentRevenue: 30000,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.burnRateAnalysis.burnRateTrend).toBe('decreasing');
  });

  it('should return runway months as 999 when burn rate is non-positive', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      currentSituation: {
        ...baseInput.currentSituation,
        currentRevenue: 500000,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.runwayAnalysis.runwayMonths).toBe(999);
  });

  it('should return zero runway when burn rate analysis is disabled', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeBurnRate: false,
        includeRunway: true,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.runwayAnalysis.runwayMonths).toBe(0);
  });

  it('should compute unit economics when CAC is derived from marketing spend', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      expenses: {
        ...baseInput.expenses,
        variableCosts: {
          ...baseInput.expenses.variableCosts,
          customerAcquisitionCost: undefined,
          marketing: 0.2,
        },
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.unitEconomics.cac).toBeGreaterThan(0);
  });

  it('should mark milestone as behind when progress is low and deadline near', () => {
    const nearDate = new Date();
    nearDate.setDate(nearDate.getDate() + 30);
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      milestones: [
        {
          milestone: 'Reach $100k MRR',
          targetDate: nearDate.toISOString(),
          requiredFunding: 100000,
          keyMetrics: { revenue: 100000 },
        },
      ],
      currentSituation: {
        ...baseInput.currentSituation,
        currentRevenue: 10000,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.milestoneTracking.milestones[0].status).toBe('behind');
  });

  it('should mark milestone as at-risk when progress is moderate and deadline is approaching', () => {
    const riskDate = new Date();
    riskDate.setDate(riskDate.getDate() + 120);
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      milestones: [
        {
          milestone: 'Reach 100 customers',
          targetDate: riskDate.toISOString(),
          requiredFunding: 50000,
          keyMetrics: { customers: 100 },
        },
      ],
      currentSituation: {
        ...baseInput.currentSituation,
        currentCustomers: 60,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.milestoneTracking.milestones[0].status).toBe('at-risk');
  });

  it('should use churn rate from revenue projections when provided', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      revenueProjections: {
        ...baseInput.revenueProjections,
        monthlyRevenue: [{ month: 1, revenue: 10000, churnRate: 0.1 }],
      },
      currentSituation: {
        ...baseInput.currentSituation,
        currentMRR: 12000,
        currentCustomers: 100,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.unitEconomics.ltv).toBeCloseTo(14400, 1);
  });

  it('should include urgent funding recommendation for short runway and low LTV:CAC', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      currentSituation: {
        ...baseInput.currentSituation,
        currentCash: 10000,
        currentRevenue: 0,
        currentMRR: 1000,
        currentCustomers: 10,
      },
      expenses: {
        ...baseInput.expenses,
        variableCosts: {
          ...baseInput.expenses.variableCosts,
          customerAcquisitionCost: 10000,
        },
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    const recs = result.recommendations.join(' ');
    expect(recs).toContain('URGENT');
    expect(recs).toContain('LTV:CAC ratio below 3:1');
  });

  it('should omit optional analyses when disabled', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      analysis: {
        includeBurnRate: false,
        includeRunway: false,
        includeUnitEconomics: false,
        includeFundingNeeds: false,
        includeMilestoneTracking: false,
        projectionMonths: 24,
      },
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.burnRateAnalysis).toBeUndefined();
    expect(result.runwayAnalysis).toBeUndefined();
    expect(result.unitEconomics).toBeUndefined();
    expect(result.fundingNeeds).toBeUndefined();
    expect(result.milestoneTracking).toBeUndefined();
  });

  it('should compute funding needs from milestones when runway is disabled', () => {
    const input = StartupFinancialModelInputSchema.parse({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeRunway: false,
        includeFundingNeeds: true,
      },
      milestones: [
        {
          milestone: 'Launch V1',
          targetDate: new Date(Date.now() + 200 * 24 * 60 * 60 * 1000).toISOString(),
          requiredFunding: 200000,
          keyMetrics: { revenue: 50000 },
        },
      ],
    });

    const result = StartupFinancialModel.analyze(input) as any;
    expect(result.runwayAnalysis).toBeUndefined();
    expect(result.fundingNeeds.totalFundingNeeded).toBe(200000);
  });
});
