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
    const result = NetWorthTracker.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.currentNetWorth).toBeDefined();
    expect(result.currentNetWorth.netWorth).toBe(710000); // 1050000 - 340000
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
});
