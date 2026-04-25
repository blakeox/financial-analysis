import { describe, expect, it } from 'vitest';
import { StartupFinancialModelTool } from '../tools/startup-financial-model';

describe('StartupFinancialModelTool', () => {
  const validInput = {
    companyInfo: {
      name: 'SaaSy',
      industry: 'software',
      stage: 'seed',
      businessModel: 'saas',
    },
    currentSituation: {
      currentCash: 600000,
      monthlyBurnRate: 80000,
      currentRevenue: 240000,
      currentMRR: 20000,
      currentCustomers: 200,
    },
    revenueProjections: {
      revenueModel: 'subscription',
      monthlyRevenue: [
        {
          month: 1,
          revenue: 20000,
          newCustomers: 20,
          churnRate: 0.05,
          averageRevenuePerUser: 100,
        },
      ],
      growthAssumptions: {
        customerGrowthRate: 0.1,
        revenuePerCustomer: 100,
        churnRate: 0.05,
      },
    },
    expenses: {
      fixedCosts: {
        salaries: 720000,
        rent: 60000,
        utilities: 12000,
        insurance: 12000,
        otherFixed: 24000,
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
    milestones: [
      {
        milestone: 'Series A',
        targetDate: '2026-12-31',
        requiredFunding: 500000,
        keyMetrics: {
          revenue: 500000,
          customers: 500,
        },
      },
    ],
    analysis: {
      includeBurnRate: true,
      includeRunway: true,
      includeUnitEconomics: true,
      includeFundingNeeds: true,
      includeMilestoneTracking: true,
      projectionMonths: 24,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(StartupFinancialModelTool.toolName).toBe('analyze_startup_financial_model');
    expect(StartupFinancialModelTool.inputSchema.required).toEqual(['companyInfo', 'financials']);
  });

  it('calculates burn, runway, and funding needs', async () => {
    const result = (await StartupFinancialModelTool.execute(validInput)) as {
      summary: {
        currentCash: number;
        monthlyBurnRate: number;
        runwayMonths: number;
        fundingNeeded: number;
        ltvCacRatio: number;
      };
    };

    expect(result.summary.currentCash).toBeCloseTo(600000, 6);
    expect(result.summary.monthlyBurnRate).toBeCloseTo(49000, 6);
    expect(result.summary.runwayMonths).toBeCloseTo(12, 6);
    expect(result.summary.fundingNeeded).toBeCloseTo(500000, 6);
    expect(result.summary.ltvCacRatio).toBeCloseTo(48, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      StartupFinancialModelTool.execute({
        ...validInput,
        currentSituation: {
          ...validInput.currentSituation,
          currentCash: -1,
        },
      })
    ).rejects.toThrow();
  });
});
