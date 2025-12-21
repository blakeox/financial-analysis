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
});

