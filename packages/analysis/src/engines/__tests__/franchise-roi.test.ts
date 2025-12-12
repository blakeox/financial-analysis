/**
 * Franchise ROI Tests
 */

import { describe, expect, it } from 'vitest';
import type { FranchiseROIInput } from '../../schemas/franchise-roi.js';
import { FranchiseROICalculator } from '../franchise-roi.js';

describe('FranchiseROICalculator', () => {
  const baseInput: FranchiseROIInput = {
    franchiseInfo: {
      franchiseName: 'Test Franchise',
      industry: 'Food Service',
      location: 'CA',
    },
    initialInvestment: {
      franchiseFee: 50000,
      initialInvestment: 300000,
      workingCapital: 50000,
      realEstateCost: 200000,
      equipmentCost: 100000,
    },
    ongoingCosts: {
      royaltyFee: 0.05,
      marketingFee: 0.02,
      annualOperatingCosts: 200000,
    },
    revenueProjections: {
      firstYearRevenue: 500000,
      revenueGrowthRate: 0.1,
      grossMargin: 0.3,
    },
    analysis: {
      includeROI: true,
      includeBreakEven: true,
      includePaybackPeriod: true,
      includeScenarioAnalysis: true,
      projectionYears: 10,
    },
  };

  it('should calculate franchise ROI', () => {
    const result = FranchiseROICalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.roi).toBeDefined();
  });

  it('should calculate break-even analysis', () => {
    const result = FranchiseROICalculator.analyze(baseInput);
    expect(result.breakEvenAnalysis).toBeDefined();
    expect(result.breakEvenAnalysis.breakEvenMonth).toBeGreaterThan(0);
  });

  it('should calculate payback period', () => {
    const result = FranchiseROICalculator.analyze(baseInput);
    expect(result.paybackPeriod).toBeDefined();
    expect(result.paybackPeriod.years).toBeGreaterThan(0);
  });

  it('should provide scenario analysis', () => {
    const result = FranchiseROICalculator.analyze(baseInput);
    expect(result.scenarioAnalysis).toBeDefined();
  });

  it('should calculate cash flow projections', () => {
    const result = FranchiseROICalculator.analyze(baseInput);
    expect(result.cashFlowProjections).toBeDefined();
    expect(Array.isArray(result.cashFlowProjections)).toBe(true);
  });
});

