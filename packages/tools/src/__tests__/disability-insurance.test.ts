import { describe, expect, it } from 'vitest';
import { DisabilityInsuranceTool } from '../tools/disability-insurance';

describe('DisabilityInsuranceTool', () => {
  const validInput = {
    personalInfo: {
      age: 35,
      occupation: 'Software engineer',
      occupationClass: 'professional',
      annualIncome: 120000,
      monthlyExpenses: 4500,
    },
    currentCoverage: {
      hasGroupCoverage: true,
      groupCoverageAmount: 4000,
      groupCoveragePercentage: 0.6,
      hasIndividualPolicy: false,
    },
    needsAnalysis: {
      targetReplacementIncome: 0.6,
      includeSocialSecurity: true,
      expectedSSDIBenefit: 1500,
      includeOtherIncome: false,
      otherIncomeSources: 0,
    },
    policyOptions: {
      benefitAmount: 72000,
      benefitPeriod: 'to-age-65',
      eliminationPeriod: 90,
      definitionOfDisability: 'own-occupation',
      riders: {
        costOfLivingAdjustment: true,
        residualDisability: true,
        futureIncreaseOption: false,
        catastrophicDisability: false,
      },
      estimatedAnnualPremium: 2100,
    },
    analysis: {
      includeCoverageGapAnalysis: true,
      includeCostBenefitAnalysis: true,
      includeProbabilityAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(DisabilityInsuranceTool.toolName).toBe('analyze_disability_insurance');
    expect(DisabilityInsuranceTool.inputSchema.required).toEqual([
      'personalInfo',
      'needsAnalysis',
    ]);
  });

  it('calculates recommended coverage and premium', async () => {
    const result = (await DisabilityInsuranceTool.execute(validInput)) as {
      recommendedCoverage: number;
      monthlyPremium: number;
      totalCost: number;
      benefitAmount: number;
    };

    expect(result.recommendedCoverage).toBeCloseTo(72000, 6);
    expect(result.monthlyPremium).toBeCloseTo(172.8, 6);
    expect(result.totalCost).toBeCloseTo(2073.6, 6);
    expect(result.benefitAmount).toBeCloseTo(72000, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      DisabilityInsuranceTool.execute({
        ...validInput,
        personalInfo: {
          ...validInput.personalInfo,
          age: 70,
        },
      })
    ).rejects.toThrow();
  });
});
