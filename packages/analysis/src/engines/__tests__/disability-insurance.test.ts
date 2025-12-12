/**
 * Disability Insurance Tests
 */

import { describe, expect, it } from 'vitest';
import type { DisabilityInsuranceInput } from '../../schemas/disability-insurance.js';
import { DisabilityInsuranceCalculator } from '../disability-insurance.js';

describe('DisabilityInsuranceCalculator', () => {
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
    },
    analysis: {
      includeCoverageGapAnalysis: true,
      includeCostBenefitAnalysis: true,
      includeProbabilityAnalysis: true,
    },
  };

  it('should calculate disability insurance needs', () => {
    const result = DisabilityInsuranceCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.needsAnalysis).toBeDefined();
    expect(result.needsAnalysis.recommendedCoverage).toBeGreaterThan(0);
  });

  it('should identify coverage gaps', () => {
    const result = DisabilityInsuranceCalculator.analyze(baseInput);
    expect(result.coverageGapAnalysis).toBeDefined();
    expect(result.coverageGapAnalysis.coverageGap).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = DisabilityInsuranceCalculator.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should calculate cost-benefit analysis', () => {
    const result = DisabilityInsuranceCalculator.analyze(baseInput);
    expect(result.costBenefitAnalysis).toBeDefined();
  });

  it('should compare own-occupation vs any-occupation', () => {
    const result = DisabilityInsuranceCalculator.analyze(baseInput);
    expect(result.definitionComparison).toBeDefined();
  });
});
