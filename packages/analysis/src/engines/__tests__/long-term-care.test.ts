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
});

