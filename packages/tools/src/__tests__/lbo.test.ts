import { describe, expect, it } from 'vitest';
import { LBOTool } from '../tools/lbo';

describe('LBOTool', () => {
  const validInput = {
    targetCompany: {
      ebitda: 100000,
      revenue: 500000,
      debt: 50000,
      equity: 150000,
    },
    transaction: {
      purchasePrice: 800000,
      equityContribution: 300000,
      debtAmount: 500000,
      transactionFees: 20000,
    },
    financing: {
      seniorDebt: {
        amount: 400000,
        interestRate: 0.08,
        term: 5,
      },
      mezzanineDebt: {
        amount: 100000,
        interestRate: 0.12,
        term: 7,
      },
    },
    projections: {
      ebitdaGrowth: 0.05,
      revenueGrowth: 0.05,
      exitMultiple: 8,
      holdingPeriod: 5,
    },
    analysis: {
      includeIRR: true,
      includeMOIC: true,
      includeDebtPaydown: true,
      includeExitScenarios: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(LBOTool.toolName).toBe('analyze_lbo');
    expect(LBOTool.inputSchema.required).toEqual(['targetCompany', 'transaction', 'financing']);
  });

  it('analyzes LBO leverage and returns', async () => {
    const result = (await LBOTool.execute(validInput)) as {
      summary: {
        leverage: number;
        irr?: number;
        moic?: number;
        exitValue: number;
      };
    };

    expect(result.summary.leverage).toBeCloseTo(500000 / 300000, 6);
    expect(result.summary.irr).toBeGreaterThan(0);
    expect(result.summary.moic).toBeGreaterThan(0);
    expect(result.summary.exitValue).toBeGreaterThan(validInput.transaction.purchasePrice);
  });

  it('rejects invalid input', async () => {
    await expect(
      LBOTool.execute({
        ...validInput,
        projections: {
          ...validInput.projections,
          holdingPeriod: 2,
        },
      })
    ).rejects.toThrow();
  });
});
