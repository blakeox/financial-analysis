import { describe, expect, it } from 'vitest';
import { CharitableGivingTool } from '../tools/charitable-giving';

describe('CharitableGivingTool', () => {
  const validInput = {
    personalInfo: {
      age: 45,
      filingStatus: 'married-joint',
      adjustedGrossIncome: 180000,
    },
    taxInfo: {
      federalTaxRate: 0.24,
      stateTaxRate: 0.05,
      itemizeDeductions: true,
      standardDeduction: 29200,
    },
    givingDetails: {
      annualGivingAmount: 10000,
      givingMethod: 'cash',
    },
    strategy: {
      optimizeFor: 'max-tax-benefit',
      bunchingStrategy: false,
      includeEstatePlanning: false,
    },
    analysis: {
      compareMethods: true,
      includeMultiYearProjection: true,
      projectionYears: 5,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(CharitableGivingTool.toolName).toBe('analyze_charitable_giving');
    expect(CharitableGivingTool.inputSchema.required).toEqual([
      'personalInfo',
      'taxInfo',
      'givingDetails',
    ]);
  });

  it('calculates charitable giving tax impact', async () => {
    const result = (await CharitableGivingTool.execute(validInput)) as {
      totalTaxSavings: number;
      projectedImpact: {
        immediateTaxBenefit: number;
      };
      methodComparison?: unknown[];
    };

    expect(result.totalTaxSavings).toBeCloseTo(2400, 6);
    expect(result.projectedImpact.immediateTaxBenefit).toBeCloseTo(2400, 6);
    expect(result.methodComparison?.length).toBeGreaterThan(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      CharitableGivingTool.execute({
        ...validInput,
        taxInfo: {
          ...validInput.taxInfo,
          federalTaxRate: 0.6,
        },
      })
    ).rejects.toThrow();
  });
});
