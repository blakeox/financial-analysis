import { describe, expect, it } from 'vitest';
import { RefinancingTool } from '../tools/refinancing';

describe('RefinancingTool', () => {
  const validInput = {
    currentMortgage: {
      principalBalance: 300000,
      interestRate: 0.07,
      remainingTerm: 25,
      monthlyPayment: 2120,
    },
    newMortgage: {
      interestRate: 0.055,
      term: 30,
      refinanceType: 'rate-and-term',
      cashOutAmount: 0,
      cashInAmount: 0,
    },
    costs: {
      closingCosts: 5000,
      points: 0,
      appraisalFee: 0,
      otherFees: 0,
    },
    goals: {
      priority: 'lower-rate',
      includeBreakEvenAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(RefinancingTool.toolName).toBe('analyze_refinancing');
    expect(RefinancingTool.inputSchema.required).toEqual(['currentMortgage', 'newMortgage', 'costs']);
  });

  it('calculates refinance summary values', async () => {
    const result = (await RefinancingTool.execute(validInput)) as {
      summary: {
        newLoanAmount: number;
        monthlySavings: number;
        breakEvenMonths?: number;
        netBenefit: number;
      };
    };

    expect(result.summary.newLoanAmount).toBeCloseTo(305000, 6);
    expect(result.summary.monthlySavings).toBeGreaterThan(0);
    expect(result.summary.breakEvenMonths).toBeGreaterThan(0);
    expect(result.summary.netBenefit).toBeDefined();
  });

  it('rejects invalid input', async () => {
    await expect(
      RefinancingTool.execute({
        ...validInput,
        newMortgage: {
          ...validInput.newMortgage,
          term: 4,
        },
      })
    ).rejects.toThrow();
  });
});
