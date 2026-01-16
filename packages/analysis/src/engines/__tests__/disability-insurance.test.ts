/**
 * Disability Insurance Tests
 */

import { describe, expect, it } from 'vitest';
import { DisabilityInsuranceInputSchema, type DisabilityInsuranceInput } from '../../schemas/disability-insurance.js';
import { DisabilityInsuranceAnalyzer } from '../disability-insurance.js';

describe('DisabilityInsuranceAnalyzer', () => {
  const baseInput: DisabilityInsuranceInput = {
    personalInfo: {
      age: 35,
      occupation: 'Software Engineer',
      occupationClass: 'professional',
      annualIncome: 120000,
      monthlyExpenses: 6000,
    },
    currentCoverage: {
      hasGroupCoverage: true,
      groupCoverageAmount: 3000,
      hasIndividualPolicy: false,
    },
    needsAnalysis: {
      targetReplacementIncome: 0.6,
      includeSocialSecurity: true,
      expectedSSDIBenefit: 2000,
    },
    policyOptions: {
      benefitAmount: 5000,
      benefitPeriod: 'to-age-65',
      eliminationPeriod: 90,
      definitionOfDisability: 'own-occupation',
      estimatedAnnualPremium: 3000,
      riders: {
        costOfLivingAdjustment: false,
        residualDisability: true,
        futurePurchaseOption: false,
        catastrophicDisability: false,
      },
    },
    analysis: {
      includeCoverageGapAnalysis: true,
      includeCostBenefitAnalysis: true,
      includeProbabilityAnalysis: true,
    },
  };

  it('should calculate disability insurance needs', () => {
    const input = DisabilityInsuranceInputSchema.parse(baseInput);
    const result = DisabilityInsuranceAnalyzer.analyze(input);
    expect(result).toBeDefined();
    expect(result.recommendedCoverage).toBeGreaterThan(0);
    expect(result.monthlyPremium).toBeGreaterThan(0);
  });

  it('should provide recommendations', () => {
    const input = DisabilityInsuranceInputSchema.parse(baseInput);
    const result = DisabilityInsuranceAnalyzer.analyze(input);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should calculate cost metrics', () => {
    const input = DisabilityInsuranceInputSchema.parse(baseInput);
    const result = DisabilityInsuranceAnalyzer.analyze(input);
    expect(result.totalCost).toBeGreaterThan(0);
    expect(result.costBenefitRatio).toBeGreaterThan(0);
  });

  it('should identify risks', () => {
    const input = DisabilityInsuranceInputSchema.parse(baseInput);
    const result = DisabilityInsuranceAnalyzer.analyze(input);
    expect(result.risks).toBeDefined();
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it('should adjust premiums for age and occupation risk', () => {
    const base = DisabilityInsuranceAnalyzer.analyze(
      DisabilityInsuranceInputSchema.parse(baseInput)
    );

    const younger = DisabilityInsuranceAnalyzer.analyze(
      DisabilityInsuranceInputSchema.parse({
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 25,
        },
      })
    );

    const older = DisabilityInsuranceAnalyzer.analyze(
      DisabilityInsuranceInputSchema.parse({
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          age: 45,
        },
      })
    );

    const highRisk = DisabilityInsuranceAnalyzer.analyze(
      DisabilityInsuranceInputSchema.parse({
        ...baseInput,
        personalInfo: {
          ...baseInput.personalInfo,
          occupationClass: 'high-risk',
        },
      })
    );

    expect(younger.monthlyPremium).toBeLessThan(base.monthlyPremium);
    expect(older.monthlyPremium).toBeGreaterThan(base.monthlyPremium);
    expect(highRisk.monthlyPremium).toBeGreaterThan(base.monthlyPremium);
  });
});

