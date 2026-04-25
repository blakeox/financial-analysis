import { describe, expect, it } from 'vitest';
import { CreditRiskTool } from '../tools/credit-risk';

describe('CreditRiskTool', () => {
  const validInput = {
    borrowerInfo: {
      companyName: 'Northwind Services',
      industry: 'services',
      yearsInBusiness: 5,
    },
    financials: {
      annualRevenue: 1000000,
      ebitda: 150000,
      netIncome: 50000,
      totalDebt: 300000,
      totalAssets: 800000,
      cashAndEquivalents: 100000,
      currentLiabilities: 120000,
    },
    debtInfo: {
      exposureAtDefault: 500000,
      currentRating: 'BBB',
      recoveryRate: 0.4,
    },
    analysis: {
      includePD: true,
      includeLGD: true,
      includeEL: true,
      includeStressTesting: false,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(CreditRiskTool.toolName).toBe('analyze_credit_risk');
    expect(CreditRiskTool.inputSchema.required).toEqual(['financials', 'debtInfo']);
  });

  it('calculates PD, LGD, and expected loss', async () => {
    const result = (await CreditRiskTool.execute(validInput)) as {
      summary: {
        pd?: number;
        lgd?: number;
        expectedLoss?: number;
        riskLevel: string;
      };
    };

    expect(result.summary.pd).toBeCloseTo(0.02, 6);
    expect(result.summary.lgd).toBeCloseTo(0.6, 6);
    expect(result.summary.expectedLoss).toBeCloseTo(6000, 6);
    expect(['low', 'moderate', 'high']).toContain(result.summary.riskLevel);
  });

  it('rejects invalid input', async () => {
    await expect(
      CreditRiskTool.execute({
        ...validInput,
        debtInfo: {
          ...validInput.debtInfo,
          recoveryRate: 2,
        },
      })
    ).rejects.toThrow();
  });
});
