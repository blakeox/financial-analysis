/**
 * Estate Planning Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { EstatePlanningInput } from '../../../schemas/estate-planning.js';
import { EstatePlanningCalculator } from '../estate-planning.js';

describe('EstatePlanningCalculator', () => {
  const baseInput: EstatePlanningInput = {
    personalInfo: {
      age: 65,
      maritalStatus: 'married',
      stateOfResidence: 'CA',
    },
    assets: {
      totalAssets: 5000000,
      realEstate: 2000000,
      investments: 2000000,
      retirementAccounts: 1000000,
      businessInterests: 0,
      otherAssets: 0,
    },
    estatePlan: {
      hasWill: true,
      hasTrust: false,
      beneficiaries: 2,
      charitableGiving: 0,
    },
    taxInfo: {
      federalEstateTaxExemption: 12920000,
      stateEstateTaxExemption: 0,
      expectedGrowthRate: 0.05,
      yearsToProject: 20,
    },
    analysis: {
      includeEstateTaxProjection: true,
      includeInheritanceProjection: true,
      includeTrustAnalysis: false,
    },
  };

  it('should project estate value', () => {
    const result = EstatePlanningCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.projectedEstate).toBeDefined();
    expect(result.projectedEstate.projectedValue).toBeGreaterThan(baseInput.assets.totalAssets);
  });

  it('should calculate estate tax when requested', () => {
    const result = EstatePlanningCalculator.analyze(baseInput);
    expect(result.estateTax).toBeDefined();
    expect(result.estateTax?.totalTax).toBeGreaterThanOrEqual(0);
  });

  it('should calculate inheritance when requested', () => {
    const result = EstatePlanningCalculator.analyze(baseInput);
    expect(result.inheritance).toBeDefined();
    expect(result.inheritance?.netInheritance).toBeGreaterThanOrEqual(0);
  });

  it('should optimize gift tax', () => {
    const result = EstatePlanningCalculator.analyze(baseInput);
    expect(result.giftTaxOptimization).toBeDefined();
    expect(result.giftTaxOptimization.taxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = EstatePlanningCalculator.analyze(baseInput);

    // Check summary
    expect(result.summary).toBeDefined();
    expect(result.summary.currentEstateValue).toBeDefined();
    expect(result.summary.projectedEstateValue).toBeDefined();
    expect(result.summary.estimatedEstateTax).toBeDefined();
    expect(result.summary.netInheritance).toBeDefined();

    // Check recommendations
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.recommendations[0]).toBe('string');
  });

  it('should include trust analysis when requested and no trust exists', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      estatePlan: {
        ...baseInput.estatePlan,
        hasTrust: false,
      },
      analysis: {
        ...baseInput.analysis,
        includeTrustAnalysis: true,
      },
    }) as any;

    expect(result.trustAnalysis).toBeDefined();
    expect(result.trustAnalysis.benefits.length).toBeGreaterThan(0);
    expect(result.trustAnalysis.trustRecommendation).toContain('Consider');
  });

  it('should note when a trust is already in place', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      estatePlan: {
        ...baseInput.estatePlan,
        hasTrust: true,
      },
      analysis: {
        ...baseInput.analysis,
        includeTrustAnalysis: true,
      },
    }) as any;

    expect(result.trustAnalysis).toBeDefined();
    expect(result.trustAnalysis.benefits.length).toBe(0);
    expect(result.trustAnalysis.taxSavings).toBe(0);
    expect(result.trustAnalysis.trustRecommendation).toContain('trust in place');
  });

  it('should compute estate tax in the lower bracket and include tax recommendation', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      personalInfo: {
        ...baseInput.personalInfo,
        maritalStatus: 'single',
      },
      assets: {
        ...baseInput.assets,
        totalAssets: 15000,
        realEstate: 0,
        investments: 15000,
        retirementAccounts: 0,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        federalEstateTaxExemption: 0,
        stateEstateTaxExemption: 0,
        expectedGrowthRate: 0,
        yearsToProject: 0,
      },
    }) as any;

    expect(result.estateTax.totalTax).toBeGreaterThan(0);
    expect(result.estateTax.federalTax).toBeGreaterThan(0);
    expect(result.recommendations.join(' ')).toContain('Estimated estate tax');
  });

  it('should apply the top federal estate tax bracket for large estates', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      personalInfo: {
        ...baseInput.personalInfo,
        maritalStatus: 'single',
      },
      assets: {
        ...baseInput.assets,
        totalAssets: 2000000,
        realEstate: 1500000,
        investments: 500000,
        retirementAccounts: 0,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        federalEstateTaxExemption: 0,
        stateEstateTaxExemption: 0,
        expectedGrowthRate: 0,
        yearsToProject: 0,
      },
    }) as any;

    expect(result.estateTax.federalTax).toBeGreaterThan(0);
    expect(result.estateTax.effectiveRate).toBeGreaterThan(0);
    expect(result.recommendations.join(' ')).toContain('Consider establishing a trust');
  });

  it('should handle a small estate with no estate tax', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      assets: {
        ...baseInput.assets,
        totalAssets: 300000,
        realEstate: 100000,
        investments: 100000,
        retirementAccounts: 100000,
      },
      personalInfo: {
        ...baseInput.personalInfo,
        maritalStatus: 'single',
      },
      taxInfo: {
        ...baseInput.taxInfo,
        federalEstateTaxExemption: 12920000,
        stateEstateTaxExemption: 300000,
        expectedGrowthRate: 0,
        yearsToProject: 0,
      },
    }) as any;

    expect(result.estateTax.totalTax).toBe(0);
    expect(result.inheritance.netInheritance).toBeGreaterThan(0);
  });

  it('should calculate inheritance without beneficiaries', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      estatePlan: {
        ...baseInput.estatePlan,
        beneficiaries: 0,
      },
    }) as any;

    expect(result.inheritance.perBeneficiary).toBe(result.inheritance.netInheritance);
  });

  it('should recommend creating a will when missing', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      estatePlan: {
        ...baseInput.estatePlan,
        hasWill: false,
      },
    }) as any;

    expect(result.recommendations.join(' ')).toContain('No will in place');
  });

  it('should omit estate tax and inheritance when disabled', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      analysis: {
        includeEstateTaxProjection: false,
        includeInheritanceProjection: false,
        includeTrustAnalysis: false,
      },
    }) as any;

    expect(result.estateTax).toBeUndefined();
    expect(result.inheritance).toBeUndefined();
    expect(result.trustAnalysis).toBeUndefined();
    expect(result.summary.estimatedEstateTax).toBeUndefined();
    expect(result.summary.netInheritance).toBeUndefined();
  });

  it('should calculate inheritance without estate tax projection', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      taxInfo: {
        ...baseInput.taxInfo,
        expectedGrowthRate: 0,
        yearsToProject: 0,
      },
      analysis: {
        includeEstateTaxProjection: false,
        includeInheritanceProjection: true,
        includeTrustAnalysis: false,
      },
    }) as any;

    expect(result.estateTax).toBeUndefined();
    expect(result.inheritance.netInheritance).toBe(result.inheritance.grossInheritance);
    expect(result.inheritance.taxPercentage).toBe(0);
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = EstatePlanningCalculator.analyze(baseInput);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('projectedEstate');
      expect(result).toHaveProperty('estateTax');
      expect(result).toHaveProperty('inheritance');
      expect(result).toHaveProperty('trustAnalysis');
      expect(result).toHaveProperty('giftTaxOptimization');
      expect(result).toHaveProperty('recommendations');
    });
  });
});
