import { describe, expect, it } from 'vitest';
import { HELOCTool } from '../tools/heloc';

describe('HELOCTool', () => {
  const validInput = {
    propertyInfo: {
      currentHomeValue: 500000,
      currentMortgageBalance: 250000,
      mortgageInterestRate: 0.065,
      yearsRemaining: 25,
    },
    helocDetails: {
      creditLimit: 100000,
      interestRate: 0.08,
      drawPeriod: 10,
      repaymentPeriod: 15,
      initialDraw: 50000,
      annualFee: 75,
    },
    usage: {
      purpose: 'home-improvement',
      drawAmount: 50000,
      drawTiming: 'immediate',
    },
    comparison: {
      compareToRefinancing: true,
      compareToPersonalLoan: true,
      newMortgageRate: 0.06,
      personalLoanRate: 0.11,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(HELOCTool.toolName).toBe('analyze_heloc');
    expect(HELOCTool.inputSchema.required).toEqual(['propertyInfo', 'helocDetails', 'usage']);
  });

  it('analyzes HELOC usage and alternatives', async () => {
    const result = (await HELOCTool.execute(validInput)) as {
      summary: {
        availableEquity: number;
        equityPercentage: number;
        helocCreditLimit: number;
      };
      taxAnalysis: {
        deductibleInterest: number;
      };
      refinancingComparison?: unknown;
      personalLoanComparison?: unknown;
    };

    expect(result.summary.availableEquity).toBeCloseTo(250000, 6);
    expect(result.summary.equityPercentage).toBeCloseTo(50, 6);
    expect(result.summary.helocCreditLimit).toBe(100000);
    expect(result.taxAnalysis.deductibleInterest).toBeGreaterThan(0);
    expect(result.refinancingComparison).toBeDefined();
    expect(result.personalLoanComparison).toBeDefined();
  });

  it('rejects invalid input', async () => {
    await expect(
      HELOCTool.execute({
        ...validInput,
        usage: {
          ...validInput.usage,
          drawAmount: -1,
        },
      })
    ).rejects.toThrow();
  });
});
