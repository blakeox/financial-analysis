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
