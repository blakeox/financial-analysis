/**
 * Net Worth Tracker Tests
 */

import { describe, expect, it } from 'vitest';
import type { NetWorthInput } from '../../schemas/net-worth.js';
import { NetWorthTracker } from '../net-worth.js';

describe('NetWorthTracker', () => {
  const baseInput: NetWorthInput = {
    assets: {
      cash: 50000,
      investments: 200000,
      realEstate: 500000,
      retirementAccounts: 300000,
      businessValue: 0,
      otherAssets: 0,
    },
    liabilities: {
      mortgages: 300000,
      creditCardDebt: 5000,
      studentLoans: 20000,
      autoLoans: 15000,
      otherDebt: 0,
    },
    projections: {
      assetGrowthRate: 0.07,
      debtPaydownRate: 0.05,
      yearsToProject: 10,
    },
    goals: {
      targetNetWorth: 2000000,
      includeMilestones: true,
    },
  };

  it('should calculate current net worth', () => {
    const result = NetWorthTracker.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.currentNetWorth).toBeDefined();
    expect(result.currentNetWorth.netWorth).toBe(715000); // 1050000 - 340000
  });

  it('should project future net worth', () => {
    const result = NetWorthTracker.analyze(baseInput);
    expect(result.projections).toBeDefined();
    expect(result.projections.finalNetWorth).toBeGreaterThan(result.currentNetWorth.netWorth);
  });

  it('should calculate milestones when requested', () => {
    const result = NetWorthTracker.analyze(baseInput);
    expect(result.milestones).toBeDefined();
    expect(result.milestones?.milestones.length).toBeGreaterThan(0);
  });

  it('should analyze asset allocation', () => {
    const result = NetWorthTracker.analyze(baseInput);
    expect(result.assetAllocation).toBeDefined();
    expect(result.assetAllocation.allocation.length).toBeGreaterThan(0);
  });

  it('should analyze debt', () => {
    const result = NetWorthTracker.analyze(baseInput);
    expect(result.debtAnalysis).toBeDefined();
    expect(result.debtAnalysis.totalDebt).toBe(340000);
  });

  it('adds years-to-target when milestones are enabled and reachable', () => {
    const result = NetWorthTracker.analyze({
      assets: {
        cash: 10000,
        investments: 0,
        realEstate: 0,
        retirementAccounts: 0,
        businessValue: 0,
        otherAssets: 0,
      },
      liabilities: {
        mortgages: 14000,
        creditCardDebt: 0,
        studentLoans: 0,
        autoLoans: 0,
        otherDebt: 0,
      },
      projections: {
        assetGrowthRate: 0.1,
        debtPaydownRate: 0,
        yearsToProject: 5,
      },
      goals: {
        targetNetWorth: 4000,
        includeMilestones: true,
      },
    } as NetWorthInput);

    expect(result.summary.yearsToTarget).toBe(1);
    expect(
      result.milestones?.milestones.some(
        (m: { milestone: string }) => m.milestone === 'Target Net Worth'
      )
    ).toBe(true);
    expect(
      result.recommendations.some((rec: string) => rec.includes('Years to reach target'))
    ).toBe(true);
  });

  it('handles negative net worth and debt recommendations', () => {
    const result = NetWorthTracker.analyze({
      assets: {
        cash: 0,
        investments: 0,
        realEstate: 0,
        retirementAccounts: 0,
        businessValue: 0,
        otherAssets: 0,
      },
      liabilities: {
        mortgages: 20000,
        creditCardDebt: 5000,
        studentLoans: 0,
        autoLoans: 0,
        otherDebt: 0,
      },
      projections: {
        assetGrowthRate: 0.02,
        debtPaydownRate: 0.01,
        yearsToProject: 1,
      },
      goals: {
        targetNetWorth: 100000,
        includeMilestones: false,
      },
    } as NetWorthInput);

    expect(result.debtAnalysis.debtToNetWorth).toBe(999);
    expect(
      result.debtAnalysis.recommendations.some((rec: string) => rec.includes('High-interest debt'))
    ).toBe(true);
    expect(
      result.debtAnalysis.recommendations.some((rec: string) => rec.includes('debt-to-assets'))
    ).toBe(true);
  });

  it('clamps diversification score to 100', () => {
    const result = NetWorthTracker.analyze({
      assets: {
        cash: 100,
        investments: 100,
        realEstate: 100,
        retirementAccounts: 100,
        businessValue: 100,
        otherAssets: 100,
      },
      liabilities: {
        mortgages: 0,
        creditCardDebt: 0,
        studentLoans: 0,
        autoLoans: 0,
        otherDebt: 0,
      },
      projections: {
        assetGrowthRate: 0.01,
        debtPaydownRate: 0,
        yearsToProject: 1,
      },
      goals: {
        targetNetWorth: 1000,
        includeMilestones: false,
      },
    } as NetWorthInput);

    expect(result.assetAllocation.diversificationScore).toBe(100);
    expect(
      result.recommendations.some((rec: string) => rec.includes('Years to reach target'))
    ).toBe(false);
  });

  it('should skip target milestone when target net worth is already met', () => {
    const result = NetWorthTracker.analyze({
      assets: {
        cash: 600000,
        investments: 600000,
        realEstate: 400000,
        retirementAccounts: 200000,
        businessValue: 0,
        otherAssets: 0,
      },
      liabilities: {
        mortgages: 0,
        creditCardDebt: 0,
        studentLoans: 0,
        autoLoans: 0,
        otherDebt: 0,
      },
      projections: {
        assetGrowthRate: 0.02,
        debtPaydownRate: 0,
        yearsToProject: 5,
      },
      goals: {
        targetNetWorth: 500000,
        includeMilestones: true,
      },
    } as NetWorthInput);

    expect(result.summary.yearsToTarget).toBeUndefined();
    expect(
      result.milestones?.milestones.some(
        (m: { milestone: string }) => m.milestone === 'Target Net Worth'
      )
    ).toBe(false);
  });

  it('should omit standard milestones when current net worth exceeds all thresholds', () => {
    const result = NetWorthTracker.analyze({
      assets: {
        cash: 1000000,
        investments: 2000000,
        realEstate: 3000000,
        retirementAccounts: 1000000,
        businessValue: 0,
        otherAssets: 0,
      },
      liabilities: {
        mortgages: 0,
        creditCardDebt: 0,
        studentLoans: 0,
        autoLoans: 0,
        otherDebt: 0,
      },
      projections: {
        assetGrowthRate: 0.01,
        debtPaydownRate: 0,
        yearsToProject: 3,
      },
      goals: {
        targetNetWorth: undefined,
        includeMilestones: true,
      },
    } as NetWorthInput);

    expect(result.milestones?.milestones.length).toBe(0);
  });
});
