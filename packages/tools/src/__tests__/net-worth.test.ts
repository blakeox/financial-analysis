import { describe, expect, it } from 'vitest';
import { NetWorthTool } from '../tools/net-worth';

describe('NetWorthTool', () => {
  const validInput = {
    assets: {
      cash: 10000,
      investments: 50000,
      realEstate: 300000,
      retirementAccounts: 40000,
      businessValue: 0,
      otherAssets: 0,
    },
    liabilities: {
      mortgages: 200000,
      creditCardDebt: 5000,
      studentLoans: 10000,
      autoLoans: 15000,
      otherDebt: 0,
    },
    projections: {
      assetGrowthRate: 0.07,
      debtPaydownRate: 0.05,
      yearsToProject: 10,
    },
    goals: {
      targetNetWorth: 500000,
      targetDate: '2035-01-01',
      includeMilestones: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(NetWorthTool.toolName).toBe('analyze_net_worth');
    expect(NetWorthTool.inputSchema.required).toEqual(['assets', 'liabilities']);
  });

  it('calculates current net worth and totals', async () => {
    const result = (await NetWorthTool.execute(validInput)) as {
      summary: {
        currentNetWorth: number;
        totalAssets: number;
        totalLiabilities: number;
        projectedNetWorth: number;
      };
    };

    expect(result.summary.totalAssets).toBeCloseTo(400000, 6);
    expect(result.summary.totalLiabilities).toBeCloseTo(230000, 6);
    expect(result.summary.currentNetWorth).toBeCloseTo(170000, 6);
    expect(result.summary.projectedNetWorth).toBeGreaterThan(result.summary.currentNetWorth);
  });

  it('rejects invalid input', async () => {
    await expect(
      NetWorthTool.execute({
        ...validInput,
        liabilities: {
          ...validInput.liabilities,
          mortgages: -1,
        },
      })
    ).rejects.toThrow();
  });
});
