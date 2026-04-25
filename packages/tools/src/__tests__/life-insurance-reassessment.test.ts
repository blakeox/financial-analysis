import { describe, expect, it } from 'vitest';
import { LifeInsuranceReassessmentTool } from '../tools/life-insurance-reassessment';

describe('LifeInsuranceReassessmentTool', () => {
  const validInput = {
    personalInfo: {
      age: 40,
      healthStatus: 'good',
      smoker: false,
      gender: 'male',
    },
    currentPolicies: [
      {
        policyType: 'term',
        faceAmount: 500000,
        annualPremium: 500,
        yearsRemaining: 20,
        cashValue: 0,
        policyAge: 5,
      },
    ],
    financialSituation: {
      annualIncome: 100000,
      totalAssets: 200000,
      totalDebt: 250000,
      monthlyExpenses: 5000,
      dependents: 2,
      yearsUntilRetirement: 25,
    },
    needsAnalysis: {
      incomeReplacement: {
        yearsOfIncome: 10,
        replacementPercentage: 0.7,
      },
      debtPayoff: {
        mortgageBalance: 200000,
        otherDebt: 50000,
      },
      educationFunding: {
        childrenCount: 2,
        educationCostPerChild: 50000,
      },
      finalExpenses: 10000,
      estateTaxes: 0,
    },
    analysis: {
      includeCoverageGapAnalysis: true,
      includePolicyOptimization: true,
      includeConversionAnalysis: true,
      includeTermVsPermanent: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(LifeInsuranceReassessmentTool.toolName).toBe('analyze_life_insurance_reassessment');
    expect(LifeInsuranceReassessmentTool.inputSchema.required).toEqual([
      'personalInfo',
      'financialSituation',
      'needsAnalysis',
    ]);
  });

  it('calculates coverage need and gap', async () => {
    const result = (await LifeInsuranceReassessmentTool.execute(validInput)) as {
      summary: {
        totalNeeded: number;
        currentCoverage: number;
        coverageGap: number;
        recommendation: string;
      };
    };

    expect(result.summary.totalNeeded).toBeCloseTo(1060000, 6);
    expect(result.summary.currentCoverage).toBeCloseTo(500000, 6);
    expect(result.summary.coverageGap).toBeCloseTo(560000, 6);
    expect(result.summary.recommendation).toBe('increase');
  });

  it('rejects invalid input', async () => {
    await expect(
      LifeInsuranceReassessmentTool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          age: 10,
        },
      })
    ).rejects.toThrow();
  });
});
