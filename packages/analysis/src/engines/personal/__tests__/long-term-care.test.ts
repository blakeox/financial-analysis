/**
 * Long-Term Care Tests
 */

import { describe, expect, it } from 'vitest';
import type { LongTermCareInput } from '../../../schemas/long-term-care.js';
import { LongTermCareCalculator } from '../long-term-care.js';

describe('LongTermCareCalculator', () => {
  const baseInput: LongTermCareInput = {
    personalInfo: {
      age: 55,
      gender: 'male',
      healthStatus: 'good',
      familyHistory: {
        hasLTCNeeds: false,
        averageLTCDuration: 0,
      },
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
      otherInsurance: {
        hasMedicaid: false,
        hasMedicare: true,
        hasHybridPolicy: false,
      },
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
    const result = LongTermCareCalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.estimatedLifetimeCost).toBeGreaterThan(0);
  });

  it('should calculate funding gap', () => {
    const result = LongTermCareCalculator.analyze(baseInput) as any;
    expect(result.selfFundingAnalysis).toBeDefined();
    expect(result.selfFundingAnalysis.shortfall).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = LongTermCareCalculator.analyze(baseInput) as any;
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it.skip('should include probability analysis when requested', () => {
    const result = LongTermCareCalculator.analyze(baseInput) as any;
    expect(result.probabilityAnalysis).toBeDefined();
  });

  it('should compare self-funding vs insurance', () => {
    const result = LongTermCareCalculator.analyze(baseInput) as any;
    expect(result.selfFundingAnalysis).toBeDefined();
    expect(result.careCostAnalysis).toBeDefined();
    expect(result.careCostAnalysis.lifetimeCost).toBeGreaterThan(0);
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
    }) as any;

    expect(result.insuranceAnalysis).toBeDefined();
    expect(result.insuranceAnalysis.coverageAmount).toBeGreaterThan(0);
    expect(result.recommendations.join(' ')).toContain('positive net benefit');
  });

  it('should compute hybrid strategy coverage when selected', () => {
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
    }) as any;

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
    }) as any;

    expect(result.recommendations.join(' ')).toContain('Self-funding shortfall');
  });

  it('should cap self-funding coverage at 100%', () => {
    const result = LongTermCareCalculator.analyze({
      ...baseInput,
      financialResources: {
        ...baseInput.financialResources,
        currentAssets: 10000000,
        expectedRetirementAssets: 10000000,
      },
      strategy: {
        fundingMethod: 'self-fund',
      },
    }) as any;

    expect(result.selfFundingAnalysis.coveragePercentage).toBe(100);
  });
});

