import { describe, expect, it } from 'vitest';
import { RothVsTraditionalIRATool } from '../tools/roth-vs-traditional-ira';

describe('RothVsTraditionalIRATool', () => {
  const validInput = {
    personalInfo: {
      age: 40,
      retirementAge: 60,
      currentTaxBracket: 0.24,
      expectedRetirementTaxBracket: 0.12,
    },
    contributionDetails: {
      annualContribution: 6000,
      catchUpContribution: 0,
      yearsToContribute: 20,
    },
    accountDetails: {
      currentTraditionalBalance: 0,
      currentRothBalance: 0,
      expectedReturn: 0.05,
    },
    taxInfo: {
      currentMarginalTaxRate: 0.24,
      expectedRetirementMarginalTaxRate: 0.12,
      stateTaxRate: 0,
      stateTaxDeduction: false,
    },
    withdrawalStrategy: {
      annualWithdrawalAmount: 20000,
      withdrawalStartAge: 60,
      includeRequiredMinimumDistributions: true,
      rmdsStartAge: 73,
    },
    analysis: {
      includeConversionAnalysis: true,
      includeTaxBracketOptimization: true,
      projectionYears: 20,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(RothVsTraditionalIRATool.toolName).toBe('analyze_roth_vs_traditional_ira');
    expect(RothVsTraditionalIRATool.inputSchema.required).toEqual([
      'personalInfo',
      'contributionDetails',
      'taxInfo',
    ]);
  });

  it('compares roth and traditional outcomes', async () => {
    const result = (await RothVsTraditionalIRATool.execute(validInput)) as {
      summary: {
        rothFinalValue: number;
        traditionalFinalValue: number;
        betterOption: string;
        taxSavingsDifference: number;
      };
    };

    expect(result.summary.rothFinalValue).toBeCloseTo(198395.7, 1);
    expect(result.summary.traditionalFinalValue).toBeCloseTo(198395.7, 1);
    expect(result.summary.betterOption).toBe('roth');
    expect(result.summary.taxSavingsDifference).toBeCloseTo(23807.49, 1);
  });

  it('rejects invalid input', async () => {
    await expect(
      RothVsTraditionalIRATool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          retirementAge: 50,
        },
      })
    ).rejects.toThrow();
  });
});
