/**
 * Disability Insurance Tests
 */

import { describe, expect, it } from 'vitest';
import type { DisabilityInsuranceInput } from '../../../schemas/disability-insurance.js';
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
        futureIncreaseOption: false,
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
    const result = DisabilityInsuranceAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.recommendedCoverage).toBeGreaterThan(0);
  });

  it('should calculate costs', () => {
    const result = DisabilityInsuranceAnalyzer.analyze(baseInput);
    expect(result.monthlyPremium).toBeGreaterThan(0);
    expect(result.totalCost).toBeGreaterThan(0);
  });

  it('should provide recommendations', () => {
    const result = DisabilityInsuranceAnalyzer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

