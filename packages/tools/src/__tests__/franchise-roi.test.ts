import { describe, expect, it } from 'vitest';
import { FranchiseROITool } from '../tools/franchise-roi';

describe('FranchiseROITool', () => {
  const validInput = {
    franchiseInfo: {
      franchiseName: 'CoffeeCo',
      industry: 'food',
      location: 'Austin',
    },
    initialInvestment: {
      franchiseFee: 30000,
      initialInvestment: 100000,
      workingCapital: 10000,
      realEstateCost: 0,
      equipmentCost: 0,
    },
    ongoingCosts: {
      royaltyFee: 0.05,
      marketingFee: 0.02,
      annualOperatingCosts: 50000,
    },
    revenueProjections: {
      firstYearRevenue: 200000,
      revenueGrowthRate: 0.1,
      grossMargin: 0.4,
    },
    exitStrategy: {
      expectedExitYear: 5,
      expectedExitValue: 50000,
      exitMultiple: 0,
    },
    analysis: {
      includeROI: true,
      includePaybackPeriod: true,
      includeNPV: true,
      includeIRR: true,
      includeBreakEven: true,
      includeScenarioAnalysis: true,
      projectionYears: 5,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(FranchiseROITool.toolName).toBe('analyze_franchise_roi');
    expect(FranchiseROITool.inputSchema.required).toEqual([
      'franchiseInfo',
      'initialInvestment',
      'ongoingCosts',
      'revenueProjections',
    ]);
  });

  it('calculates ROI, payback, and NPV', async () => {
    const result = (await FranchiseROITool.execute(validInput)) as {
      summary: {
        totalInvestment: number;
        totalROI: number;
        paybackPeriod: number;
        npv: number;
        breakEvenYear: number;
      };
    };

    expect(result.summary.totalInvestment).toBeCloseTo(100000, 6);
    expect(result.summary.totalROI).toBeCloseTo(835.55, 2);
    expect(result.summary.paybackPeriod).toBeCloseTo(1, 6);
    expect(result.summary.npv).toBeCloseTo(655915.21, 2);
    expect(result.summary.breakEvenYear).toBeCloseTo(1, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      FranchiseROITool.execute({
        ...validInput,
        ongoingCosts: {
          ...validInput.ongoingCosts,
          royaltyFee: 1.5,
        },
      })
    ).rejects.toThrow();
  });
});
