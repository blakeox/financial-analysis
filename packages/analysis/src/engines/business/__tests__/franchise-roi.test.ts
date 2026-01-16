/**
 * Franchise ROI Tests
 */

import { describe, expect, it } from 'vitest';
import type { FranchiseROIInput } from '../../../schemas/franchise-roi.js';
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

  it('should normalize total investment from component costs', () => {
    const result = FranchiseROICalculator.analyze(baseInput) as any;
    expect(result.summary.totalInvestment).toBe(400000);
  });

  it('should honor scenario analysis flag for sensitivity', () => {
    const result = FranchiseROICalculator.analyze(baseInput) as any;
    expect(result.sensitivity).toBeDefined();
    expect(result.sensitivity.scenarios.length).toBeGreaterThan(0);
  });

  it('should compute break-even month alongside year', () => {
    const result = FranchiseROICalculator.analyze(baseInput) as any;
    expect(result.breakEvenAnalysis).toBeDefined();
    expect(result.breakEvenAnalysis.breakEvenMonth).toBe(
      result.breakEvenAnalysis.year * 12
    );
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

  it('should honor totalInvestment when provided', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      initialInvestment: {
        franchiseFee: 40000,
        totalInvestment: 275000,
        workingCapital: 20000,
        realEstate: 100000,
        equipment: 80000,
      },
      revenueProjections: {
        ...baseInput.revenueProjections,
        revenueProjectionYears: 5,
      },
      ongoingCosts: {
        royaltyFee: 0.05,
        marketingFee: 0.02,
        annualOperatingExpenses: 150000,
        annualRent: 12000,
        annualUtilities: 6000,
        annualInsurance: 3000,
        annualSalaries: 80000,
      },
    }) as any;

    expect(result.summary.totalInvestment).toBe(275000);
    expect(result.cashFlowProjections.length).toBe(5);
  });

  it('should respect disabled analysis flags', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      revenueProjections: {
        ...baseInput.revenueProjections,
        revenueProjectionYears: 3,
      },
      ongoingCosts: {
        royaltyFee: 0.06,
        marketingFee: 0.03,
        annualOperatingExpenses: 180000,
        annualRent: 18000,
        annualUtilities: 8000,
        annualInsurance: 4000,
        annualSalaries: 90000,
      },
      analysis: {
        includeROI: true,
        includePaybackPeriod: false,
        includeNPV: false,
        includeIRR: false,
        includeBreakEven: false,
        includeScenarioAnalysis: false,
        projectionYears: 3,
      },
    }) as any;

    expect(result.paybackPeriod).toBeUndefined();
    expect(result.npv).toBeUndefined();
    expect(result.irr).toBeUndefined();
    expect(result.breakEven).toBeUndefined();
    expect(result.breakEvenAnalysis).toBeUndefined();
    expect(result.sensitivity).toBeUndefined();
    expect(result.summary.npv).toBe(0);
    expect(result.summary.irr).toBe(0);
    expect(result.summary.breakEvenYear).toBe(0);
  });

  it('should return no payback and break-even when cash flows stay negative', () => {
    const result = FranchiseROICalculator.analyze({
      ...baseInput,
      initialInvestment: {
        franchiseFee: 80000,
        workingCapital: 50000,
        realEstateCost: 150000,
        equipmentCost: 120000,
        totalInvestment: 400000,
      },
      revenueProjections: {
        firstYearRevenue: 120000,
        revenueGrowthRate: 0.01,
        revenueProjectionYears: 4,
      },
      ongoingCosts: {
        royaltyFee: 0.08,
        marketingFee: 0.04,
        annualOperatingExpenses: 250000,
        annualRent: 24000,
        annualUtilities: 10000,
        annualInsurance: 5000,
        annualSalaries: 120000,
      },
      analysis: {
        includeROI: true,
        includePaybackPeriod: true,
        includeNPV: true,
        includeIRR: true,
        includeBreakEven: true,
        includeSensitivityAnalysis: false,
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
        realEstate: 100000,
        equipment: 60000,
        totalInvestment: 250000,
      },
      revenueProjections: {
        firstYearRevenue: 850000,
        revenueGrowthRate: 0.12,
        revenueProjectionYears: 6,
      },
      ongoingCosts: {
        royaltyFee: 0.04,
        marketingFee: 0.015,
        annualOperatingExpenses: 180000,
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
      analysis: {
        includeROI: true,
        includePaybackPeriod: true,
        includeNPV: true,
        includeIRR: true,
        includeBreakEven: true,
        includeSensitivityAnalysis: true,
      },
    }) as any;

    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Positive NPV indicates good investment'),
        expect.stringContaining('Strong IRR indicates attractive returns'),
      ])
    );
    expect(result.sensitivity).toBeDefined();
  });
});

