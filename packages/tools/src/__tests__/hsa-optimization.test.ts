import { describe, expect, it } from 'vitest';
import { HSAOptimizationTool } from '../tools/hsa-optimization';

describe('HSAOptimizationTool', () => {
  const validInput = {
    personalInfo: {
      age: 56,
      filingStatus: 'married-joint',
      currentHSABalance: 5000,
    },
    contributionLimits: {
      individualLimit: 4150,
      familyLimit: 8300,
      catchUpContribution: 1000,
    },
    hsaDetails: {
      annualContribution: 7000,
      employerContribution: 1000,
      investmentReturn: 0.07,
    },
    medicalExpenses: {
      annualMedicalExpenses: 2000,
      expectedRetirementMedicalCosts: 150000,
      yearsUntilRetirement: 10,
    },
    strategy: {
      optimizeFor: 'hybrid',
      useForCurrentExpenses: false,
      saveReceipts: true,
    },
    taxInfo: {
      federalTaxRate: 0.22,
      stateTaxRate: 0.05,
      ficaTaxRate: 0.0765,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(HSAOptimizationTool.toolName).toBe('analyze_hsa_optimization');
    expect(HSAOptimizationTool.inputSchema.required).toEqual(['personalInfo', 'hsaDetails']);
  });

  it('calculates HSA contribution limits and tax savings', async () => {
    const result = (await HSAOptimizationTool.execute(validInput)) as {
      summary: {
        maxContribution: number;
        totalTaxSavings: number;
        projectedBalanceAtRetirement: number;
      };
    };

    expect(result.summary.maxContribution).toBeCloseTo(9300, 6);
    expect(result.summary.totalTaxSavings).toBeCloseTo(2425.5, 6);
    expect(result.summary.projectedBalanceAtRetirement).toBeGreaterThan(validInput.personalInfo.currentHSABalance);
  });

  it('rejects invalid input', async () => {
    await expect(
      HSAOptimizationTool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          age: 10,
        },
      })
    ).rejects.toThrow();
  });
});
