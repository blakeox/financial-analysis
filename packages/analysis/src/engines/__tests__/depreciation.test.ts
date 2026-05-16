/**
 * Depreciation Tests
 */

import { describe, expect, it } from 'vitest';
import { DepreciationInputSchema, type DepreciationInput } from '../../schemas/depreciation.js';
import { DepreciationCalculator } from '../depreciation.js';

describe('DepreciationCalculator', () => {
  const baseInput: DepreciationInput = {
    assetInfo: {
      purchaseDate: '2024-01-01',
      purchaseCost: 100000,
      salvageValue: 10000,
      usefulLife: 5,
      assetClass: 'equipment',
      businessUsePercentage: 1,
    },
    depreciationMethod: 'straight-line',
    taxInfo: {
      taxYear: 2024,
      federalTaxRate: 0.21,
      stateTaxRate: 0.05,
      section179Limit: 1080000,
      bonusDepreciationPercentage: 0.6,
      section179Threshold: 2900000,
    },
    analysis: {
      includeSchedule: true,
      includeTaxSavings: true,
      includeMethodComparison: false,
      projectionYears: 5,
    },
  };

  it('should calculate depreciation', () => {
    const input = DepreciationInputSchema.parse(baseInput);
    const result = DepreciationCalculator.analyze(input) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalDepreciation).toBeGreaterThan(0);
  });

  it('should generate depreciation schedule when requested', () => {
    const input = DepreciationInputSchema.parse(baseInput);
    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.depreciationSchedule).toBeDefined();
    expect(Array.isArray(result.depreciationSchedule.schedule)).toBe(true);
  });

  it('should calculate tax savings', () => {
    const input = DepreciationInputSchema.parse(baseInput);
    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.taxSavings).toBeDefined();
    expect(result.taxSavings.totalSavings).toBeGreaterThanOrEqual(0);
  });

  it('should handle MACRS method', () => {
    const macrsInput: DepreciationInput = {
      ...baseInput,
      depreciationMethod: 'macrs',
      macrsDetails: {
        propertyClass: '5-year',
        convention: 'half-year',
      },
    };
    const input = DepreciationInputSchema.parse(macrsInput);
    const result = DepreciationCalculator.analyze(input) as any;

    expect(result).toBeDefined();
    expect(result.summary.totalDepreciation).toBeGreaterThan(0);
  });

  it('should handle Section 179', () => {
    const section179Input: DepreciationInput = {
      ...baseInput,
      depreciationMethod: 'section-179',
    };
    const input = DepreciationInputSchema.parse(section179Input);
    const result = DepreciationCalculator.analyze(input) as any;
    expect(result).toBeDefined();
  });
});
