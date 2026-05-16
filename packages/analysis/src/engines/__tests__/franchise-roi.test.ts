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
      franchiseType: 'service',
    },
    initialInvestment: {
      franchiseFee: 50000,
      workingCapital: 50000,
      realEstateCost: 200000,
      equipmentCost: 100000,
      otherCosts: 0,
    },
    ongoingCosts: {
      royaltyFee: 0.05,
      marketingFee: 0.02,
      annualOperatingCosts: 200000,
      annualRent: 0,
      annualUtilities: 0,
      annualInsurance: 0,
      annualSalaries: 0,
    },
    revenueProjections: {
      firstYearRevenue: 500000,
      revenueGrowthRate: 0.1,
      grossMargin: 0.3,
      revenueProjectionYears: 10,
    },
    analysis: {
      includeROI: true,
      includeBreakEven: true,
      includePaybackPeriod: true,
      includeScenarioAnalysis: true,
      includeNPV: true,
      includeIRR: true,
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

  it('should normalize total investment from components', () => {
    const result = FranchiseROICalculator.analyze(baseInput) as any;
    expect(result.summary.totalInvestment).toBe(400000);
  });

  it('should include sensitivity analysis when scenario flag is set', () => {
    const result = FranchiseROICalculator.analyze(baseInput) as any;
    expect(result.sensitivity).toBeDefined();
    expect(result.sensitivity.scenarios.length).toBeGreaterThan(0);
  });

  it('should omit NPV/IRR when disabled', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeNPV: false,
        includeIRR: false,
      },
    }) as any;

    expect(result.npv).toBeUndefined();
    expect(result.irr).toBeUndefined();
    expect(result.summary.npv).toBe(0);
    expect(result.summary.irr).toBe(0);
  });

  it('should return 999 for payback and break-even when revenue is too low', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      revenueProjections: {
        ...baseInput.revenueProjections,
        firstYearRevenue: 10000,
        revenueGrowthRate: 0,
      },
      ongoingCosts: {
        ...baseInput.ongoingCosts,
        annualOperatingCosts: 400000,
      },
    }) as any;

    expect(result.paybackPeriod.years).toBe(999);
    expect(result.breakEven.year).toBe(999);
  });

  it('should include positive NPV and strong IRR recommendations', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      initialInvestment: {
        franchiseFee: 60000,
        workingCapital: 30000,
        realEstateCost: 100000,
        equipmentCost: 60000,
        otherCosts: 0,
      },
      revenueProjections: {
        firstYearRevenue: 850000,
        revenueGrowthRate: 0.12,
        grossMargin: 0.3,
        revenueProjectionYears: 6,
      },
      ongoingCosts: {
        royaltyFee: 0.04,
        marketingFee: 0.015,
        annualOperatingCosts: 180000,
        annualRent: 15000,
        annualUtilities: 7000,
        annualInsurance: 3000,
        annualSalaries: 90000,
      },
      exitStrategy: {
        expectedExitYear: 6,
        expectedExitValue: 300000,
        exitMultiple: 0,
      },
    }) as any;

    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Positive NPV indicates good investment'),
        expect.stringContaining('Strong IRR indicates attractive returns'),
      ])
    );
    expect(result.scenarioAnalysis).toBeDefined();
  });

  it('should avoid positive NPV and strong IRR messaging for weak investments', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      revenueProjections: {
        firstYearRevenue: 50000,
        revenueGrowthRate: 0,
        grossMargin: 0.2,
        revenueProjectionYears: 5,
      },
      ongoingCosts: {
        royaltyFee: 0.08,
        marketingFee: 0.04,
        annualOperatingCosts: 250000,
        annualRent: 40000,
        annualUtilities: 15000,
        annualInsurance: 10000,
        annualSalaries: 120000,
      },
      analysis: {
        ...baseInput.analysis,
        includeNPV: true,
        includeIRR: true,
      },
    }) as any;

    const recs = result.recommendations.join(' ');
    expect(recs).toContain('NPV:');
    expect(recs).toContain('IRR:');
    expect(recs).not.toContain('Positive NPV indicates good investment');
  });

  it('should return zero annualized ROI when total return is negative', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      revenueProjections: {
        firstYearRevenue: 60000,
        revenueGrowthRate: 0,
        grossMargin: 0.2,
        revenueProjectionYears: 3,
      },
      ongoingCosts: {
        royaltyFee: 0.08,
        marketingFee: 0.04,
        annualOperatingCosts: 220000,
        annualRent: 30000,
        annualUtilities: 12000,
        annualInsurance: 8000,
        annualSalaries: 90000,
      },
      exitStrategy: undefined,
    }) as any;

    expect(result.roiAnalysis.annualizedROI).toBe(0);
    expect(result.roiAnalysis.totalROI).toBeLessThan(0);
  });

  it('should omit ROI analysis when disabled', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeROI: false,
      },
    }) as any;

    expect(result.roiAnalysis).toBeUndefined();
    expect(result.summary.roi).toBe(0);
  });

  it('should omit break-even and sensitivity analysis when disabled', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeBreakEven: false,
        includeSensitivityAnalysis: false,
        includeScenarioAnalysis: false,
      },
    }) as any;

    expect(result.breakEven).toBeUndefined();
    expect(result.breakEvenAnalysis).toBeUndefined();
    expect(result.sensitivity).toBeUndefined();
  });

  it('should return break-even year 1 when revenue exceeds break-even threshold immediately', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      ongoingCosts: {
        ...baseInput.ongoingCosts,
        annualOperatingCosts: 50000,
        annualRent: 0,
        annualUtilities: 0,
        annualInsurance: 0,
        annualSalaries: 0,
      },
      revenueProjections: {
        ...baseInput.revenueProjections,
        firstYearRevenue: 400000,
        revenueGrowthRate: 0,
        revenueProjectionYears: 3,
      },
    }) as any;

    expect(result.breakEven.year).toBe(1);
    expect(result.breakEvenAnalysis.breakEvenMonth).toBe(12);
  });

  it('should reach break-even in a later year when revenues ramp up', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      ongoingCosts: {
        ...baseInput.ongoingCosts,
        annualOperatingCosts: 200000,
        annualRent: 30000,
        annualUtilities: 10000,
        annualInsurance: 5000,
        annualSalaries: 50000,
      },
      revenueProjections: {
        ...baseInput.revenueProjections,
        firstYearRevenue: 200000,
        revenueGrowthRate: 0.3,
        revenueProjectionYears: 6,
      },
    }) as any;

    expect(result.breakEven.year).toBeGreaterThan(1);
    expect(result.breakEven.year).toBeLessThan(999);
  });

  it('should fallback when IRR derivative is near zero', () => {
    const irr = (FranchiseROICalculator as any).calculateIRR({
      annualCashFlows: [{ netCashFlow: 0 }, { netCashFlow: 0 }, { netCashFlow: 0 }],
    });

    expect(irr).toBeGreaterThanOrEqual(0);
    expect(irr).toBeLessThanOrEqual(100);
  });
});
