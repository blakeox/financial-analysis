/**
 * Charitable Giving Tests
 */

import { describe, expect, it } from 'vitest';
import type { CharitableGivingInput } from '../../schemas/charitable-giving.js';
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
    const result = CharitableGivingOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalTaxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should calculate tax deduction value', () => {
    const result = CharitableGivingOptimizer.analyze(baseInput);
    expect(result.taxDeduction).toBeDefined();
    expect(result.taxDeduction.federalTaxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should compare giving methods when requested', () => {
    const result = CharitableGivingOptimizer.analyze(baseInput);
    expect(result.methodComparison).toBeDefined();
    expect(Array.isArray(result.methodComparison)).toBe(true);
  });

  it('should provide recommendations', () => {
    const result = CharitableGivingOptimizer.analyze(baseInput);
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
    const result = CharitableGivingOptimizer.analyze(securitiesInput);
    expect(result).toBeDefined();
    expect(result.summary.totalTaxSavings).toBeGreaterThan(0);
  });
});

