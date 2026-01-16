
import { describe, expect, it } from 'vitest';
import type { DepreciationInput } from '../../../schemas/depreciation.js';
import { DepreciationCalculator } from '../depreciation.js';

describe('DepreciationCalculator Coverage Tests', () => {
  const baseAsset = {
    purchaseDate: '2024-01-01',
    purchaseCost: 100000,
    salvageValue: 10000,
    usefulLife: 5,
    assetClass: 'equipment' as const,
    businessUsePercentage: 1,
  };

  const baseTax = {
    taxYear: 2024,
    federalTaxRate: 0.21,
    stateTaxRate: 0.05,
    section179Limit: 1080000,
    section179Threshold: 2900000,
    bonusDepreciationPercentage: 0.6,
  };

  const baseAnalysis = {
    includeSchedule: true,
    includeTaxSavings: true,
    includeMethodComparison: true,
    projectionYears: 5,
  };

  it('should calculate Straight-Line depreciation correctly', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: baseAnalysis,
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const schedule = result.depreciationSchedule.schedule;

    // Depreciable Base = 100,000 - 10,000 = 90,000
    // Annual Depreciation = 90,000 / 5 = 18,000
    expect(schedule[0].depreciation).toBe(18000);
    expect(schedule[4].depreciation).toBe(18000);
    expect(result.summary.totalDepreciation).toBe(90000);
    expect(result.summary.bookValue).toBe(10000); // Should hit salvage value
  });

  it('should calculate Double Declining Balance correctly', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset, // 100k cost, 10k salvage, 5 yr life
      depreciationMethod: 'double-declining-balance',
      taxInfo: baseTax,
      analysis: baseAnalysis,
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const schedule = result.depreciationSchedule.schedule;

    // Rate = 2 / 5 = 0.4 (40%)
    // Year 1: 100,000 * 40% = 40,000
    // Book Val End Y1: 60,000
    expect(schedule[0].depreciation).toBe(40000);
    expect(schedule[0].bookValue).toBe(60000);

    // Year 2: 60,000 * 40% = 24,000
    // Book Val End Y2: 36,000
    expect(schedule[1].depreciation).toBe(24000);
    expect(schedule[1].bookValue).toBe(36000);

    // It should never depreciate below salvage value (10,000)
    expect(result.summary.bookValue).toBeGreaterThanOrEqual(10000);
  });

  it('should calculate Declining Balance correctly', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'declining-balance',
      taxInfo: baseTax,
      analysis: baseAnalysis,
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const schedule = result.depreciationSchedule.schedule;

    // Rate = 1.5 / 5 = 0.3 (30%)
    // Year 1: 100,000 * 30% = 30,000
    expect(schedule[0].depreciation).toBe(30000);
    expect(schedule[0].bookValue).toBe(70000);
  });

  it('should calculate Sum of Years Digits correctly', () => {
     const input: DepreciationInput = {
      assetInfo: baseAsset, // 100k cost, 10k salvage, 5 yr life
      depreciationMethod: 'sum-of-years-digits',
      taxInfo: baseTax,
      analysis: baseAnalysis,
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const schedule = result.depreciationSchedule.schedule;

    // Sum of years = 1+2+3+4+5 = 15
    // Depreciable Base = 90,000
    // Year 1: 90,000 * (5/15) = 30,000
    expect(schedule[0].depreciation).toBe(30000);
    
    // Year 5: 90,000 * (1/15) = 6,000
    expect(schedule[4].depreciation).toBe(6000);
  });

  it('should handle MACRS with missing details (no depreciation)', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'macrs',
      taxInfo: baseTax,
      analysis: baseAnalysis,
      // macrsDetails intentionally omitted
    };

    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.summary.totalDepreciation).toBe(0);
    expect(result.summary.bookValue).toBe(100000);
    expect(result.depreciationSchedule.schedule[0].depreciation).toBe(0);
  });

  it('should handle MACRS non-half-year convention', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'macrs',
      taxInfo: baseTax,
      analysis: baseAnalysis,
      macrsDetails: {
        propertyClass: '5-year',
        convention: 'mid-month',
      },
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const year1 = result.depreciationSchedule.schedule[0];

    // With the simplified MACRS formula, year 1 uses the non-half-year branch.
    // See `calculateMACRS`: min(40,000, 90,000 * (1 - 0.6)) = 36,000.
    expect(year1.depreciation).toBe(36000);
  });

  it('should handle Section 179 with a binding limit', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'section-179',
      taxInfo: {
        ...baseTax,
        section179Limit: 50000,
      },
      analysis: baseAnalysis,
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const schedule = result.depreciationSchedule.schedule;

    expect(schedule[0].depreciation).toBe(50000);
    expect(schedule[1].depreciation).toBe(0);
    expect(result.summary.totalDepreciation).toBe(50000);
  });

  it('should handle Bonus Depreciation', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'bonus-depreciation',
      taxInfo: {
        ...baseTax,
        bonusDepreciationPercentage: 0.6,
      },
      analysis: baseAnalysis,
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const schedule = result.depreciationSchedule.schedule;

    expect(schedule[0].depreciation).toBe(60000);
    expect(schedule[1].depreciation).toBe(0);
    expect(result.summary.totalDepreciation).toBe(60000);
  });

  it('should omit tax savings when disabled', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: {
        ...baseAnalysis,
        includeTaxSavings: false,
      },
    };

    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.taxSavings).toBeUndefined();
    expect(result.recommendations.join('\n')).not.toContain('Total tax savings');
  });

  it('should analyze disposal correctly (Gain)', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: baseAnalysis,
      disposal: {
        disposalDate: '2029-01-01',
        disposalProceeds: 20000, // Sold for 20k
        includeDisposalAnalysis: true
      }
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const disposal = result.disposalAnalysis;

    // Book Value at end is 10,000 (Salvage)
    // Sold for 20,000
    // Gain = 10,000
    expect(disposal.bookValue).toBe(10000);
    expect(disposal.gainOrLoss).toBe(10000);
    expect(disposal.taxOnDisposal).toBeGreaterThan(0);
  });

  it('should analyze disposal correctly (Loss)', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: baseAnalysis,
      disposal: {
        disposalDate: '2029-01-01',
        disposalProceeds: 5000, // Sold for 5k
        includeDisposalAnalysis: true
      }
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const disposal = result.disposalAnalysis;

    // Book Value at end is 10,000
    // Sold for 5,000
    // Loss = -5,000
    expect(disposal.gainOrLoss).toBe(-5000);
    // Calculated logic says tax is 0 if loss (simplified)
    expect(disposal.taxOnDisposal).toBe(0); 
  });

  it('should analyze disposal without schedule when schedule disabled', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: {
        ...baseAnalysis,
        includeSchedule: false,
        includeTaxSavings: true,
      },
      disposal: {
        disposalDate: '2026-01-01',
        disposalProceeds: 12345,
        includeDisposalAnalysis: true,
      },
    };

    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.depreciationSchedule).toBeUndefined();
    expect(result.disposalAnalysis).toBeDefined();
    expect(result.disposalAnalysis.bookValue).toBe(100000);
    expect(result.disposalAnalysis.netProceeds).toBe(12345);

    // Tax savings should still exist (computed from undefined schedule as 0s)
    expect(result.taxSavings).toBeDefined();
    expect(result.taxSavings.totalSavings).toBe(0);
  });

  it('should compare methods correctly', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: { ...baseAnalysis, includeMethodComparison: true },
    };

    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.methodComparison).toBeDefined();
    expect(result.methodComparison.methods.length).toBeGreaterThan(1);
    expect(result.methodComparison.bestMethod).toBeDefined();
  });

  it('should select an accelerated method as best for short horizons', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'straight-line',
      taxInfo: baseTax,
      analysis: {
        ...baseAnalysis,
        projectionYears: 2,
        includeMethodComparison: true,
      },
      macrsDetails: {
        propertyClass: '5-year',
        convention: 'half-year',
      },
    };

    const result = DepreciationCalculator.analyze(input) as any;
    expect(result.methodComparison).toBeDefined();
    // Over short horizons, accelerated methods can dominate straight-line in this simplified model.
    expect(result.methodComparison.bestMethod).toBe('double-declining-balance');
  });

  it('should default MACRS property class to 5-year when unknown', () => {
    const input: DepreciationInput = {
      assetInfo: baseAsset,
      depreciationMethod: 'macrs',
      taxInfo: baseTax,
      analysis: baseAnalysis,
      macrsDetails: {
        propertyClass: 'unknown' as any,
        convention: 'half-year',
      },
    };

    const result = DepreciationCalculator.analyze(input) as any;
    const year1 = result.depreciationSchedule.schedule[0];

    // Defaults usefulLife to 5; half-year year-1 depreciation matches straight-line year-1 amount.
    expect(year1.depreciation).toBe(18000);
  });
});
