/**
 * Charitable Giving Tests
 */

import { describe, expect, it } from 'vitest';
import {
  CharitableGivingInputSchema,
  type CharitableGivingInput,
} from '../../schemas/charitable-giving.js';
import { CharitableGivingOptimizer } from '../charitable-giving.js';

describe('CharitableGivingOptimizer', () => {
  const baseInput: CharitableGivingInput = {
    personalInfo: {
      age: 50,
      filingStatus: 'married-joint',
      adjustedGrossIncome: 150000,
    },
    taxInfo: {
      federalTaxRate: 0.24,
      stateTaxRate: 0.05,
      itemizeDeductions: true,
      standardDeduction: 29200,
    },
    givingDetails: {
      annualGivingAmount: 10000,
      givingMethod: 'cash',
    },
    strategy: {
      optimizeFor: 'max-tax-benefit',
      bunchingStrategy: false,
      includeEstatePlanning: false,
    },
    analysis: {
      compareMethods: true,
      includeMultiYearProjection: true,
      projectionYears: 5,
    },
  };

  it('should calculate charitable giving optimization', () => {
    const input = CharitableGivingInputSchema.parse(baseInput);
    const result = CharitableGivingOptimizer.analyze(input);
    expect(result).toBeDefined();
    expect(result.totalTaxSavings).toBeDefined();
    expect(result.totalTaxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should calculate tax deduction value', () => {
    const input = CharitableGivingInputSchema.parse(baseInput);
    const result = CharitableGivingOptimizer.analyze(input);
    expect(result.projectedImpact).toBeDefined();
    expect(result.projectedImpact.immediateTaxBenefit).toBeGreaterThanOrEqual(0);
  });

  it('should determine optimal giving strategy', () => {
    const input = CharitableGivingInputSchema.parse(baseInput);
    const result = CharitableGivingOptimizer.analyze(input);
    expect(result.optimalGivingStrategy).toBeDefined();
    expect(typeof result.optimalGivingStrategy).toBe('string');
  });

  it('should provide recommendations', () => {
    const input = CharitableGivingInputSchema.parse(baseInput);
    const result = CharitableGivingOptimizer.analyze(input);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should handle appreciated securities', () => {
    const securitiesInput: CharitableGivingInput = {
      ...baseInput,
      givingDetails: {
        annualGivingAmount: 10000,
        givingMethod: 'appreciated-securities',
        appreciatedAssetDetails: {
          assetType: 'stocks',
          costBasis: 5000,
          currentValue: 10000,
          holdingPeriod: 'long-term',
        },
      },
    };
    const input = CharitableGivingInputSchema.parse(securitiesInput);
    const result = CharitableGivingOptimizer.analyze(input);
    expect(result).toBeDefined();
    expect(result.totalTaxSavings).toBeGreaterThan(0);
  });
});
