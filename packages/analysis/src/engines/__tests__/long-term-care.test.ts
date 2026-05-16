/**
 * Long-Term Care Tests
 */

import { describe, expect, it } from 'vitest';
import type { LongTermCareInput } from '../../schemas/long-term-care.js';
import { LongTermCareCalculator } from '../long-term-care.js';

describe('LongTermCareCalculator', () => {
  const baseInput: LongTermCareInput = {
    personalInfo: {
      age: 55,
      gender: 'male',
      healthStatus: 'good',
    },
    careNeeds: {
      expectedCareStartAge: 80,
      expectedCareDuration: 3,
      careType: 'mixed',
      annualCareCost: 100000,
      careCostInflation: 0.05,
    },
    insuranceOptions: {
      hasLTCInsurance: false,
    },
    financialResources: {
      currentAssets: 500000,
      annualIncome: 100000,
      expectedRetirementAssets: 2000000,
    },
    strategy: {
      fundingMethod: 'hybrid',
    },
    analysis: {
      includeProbabilityAnalysis: true,
      includeScenarioAnalysis: true,
      projectionYears: 30,
    },
  };

  it('should calculate long-term care needs analysis', () => {
    const result = LongTermCareCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalLifetimeCost).toBeGreaterThan(0);
  });

  it('should calculate funding gap', () => {
    const result = LongTermCareCalculator.analyze(baseInput);
    expect(result.fundingAnalysis).toBeDefined();
    expect(result.fundingAnalysis.fundingGap).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = LongTermCareCalculator.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should include probability analysis when requested', () => {
    const result = LongTermCareCalculator.analyze(baseInput);
    expect(result.probabilityAnalysis).toBeDefined();
  });

  it('should compare self-funding vs insurance', () => {
    const result = LongTermCareCalculator.analyze(baseInput);
    expect(result.comparison).toBeDefined();
    expect(result.comparison.selfFundingCost).toBeGreaterThan(0);
  });

  it('should omit probability analysis when disabled', () => {
    const result = LongTermCareCalculator.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeProbabilityAnalysis: false,
      },
    });

    expect(result.probabilityAnalysis).toBeUndefined();
  });

  it('should analyze insurance when policy details are provided', () => {
    const result = LongTermCareCalculator.analyze({
      ...baseInput,
      insuranceOptions: {
        hasLTCInsurance: true,
        policyDetails: {
          dailyBenefit: 200,
          benefitPeriod: 3,
          inflationProtection: true,
          eliminationPeriod: 90,
          annualPremium: 1000,
        },
      },
    });

    expect(result.insuranceAnalysis).toBeDefined();
    expect(result.insuranceAnalysis.coverageAmount).toBeGreaterThan(0);
    expect(result.recommendations.join(' ')).toContain('positive net benefit');
  });

  it('should compute hybrid strategy coverage', () => {
    const result = LongTermCareCalculator.analyze({
      ...baseInput,
      insuranceOptions: {
        hasLTCInsurance: true,
        policyDetails: {
          dailyBenefit: 150,
          benefitPeriod: 2,
          inflationProtection: false,
          eliminationPeriod: 90,
          annualPremium: 2000,
        },
      },
      strategy: {
        fundingMethod: 'hybrid',
      },
    });

    expect(result.hybridAnalysis).toBeDefined();
    expect(result.hybridAnalysis.coveragePercentage).toBeGreaterThan(0);
  });

  it('should recommend insurance when self-funding has a shortfall', () => {
    const result = LongTermCareCalculator.analyze({
      ...baseInput,
      strategy: {
        fundingMethod: 'self-fund',
      },
      financialResources: {
        ...baseInput.financialResources,
        currentAssets: 100000,
        expectedRetirementAssets: 0,
      },
    });

    expect(result.recommendations.join(' ')).toContain('Self-funding shortfall');
  });

  it('should cap self-funding coverage at 100%', () => {
    const result = LongTermCareCalculator.analyze({
      ...baseInput,
      strategy: {
        fundingMethod: 'self-fund',
      },
      financialResources: {
        ...baseInput.financialResources,
        currentAssets: 10000000,
        expectedRetirementAssets: 10000000,
      },
    });

    expect(result.selfFundingAnalysis.coveragePercentage).toBe(100);
  });
});
