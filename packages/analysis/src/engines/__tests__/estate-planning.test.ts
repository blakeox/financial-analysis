/**
 * Estate Planning Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { EstatePlanningInput } from '../../schemas/estate-planning.js';
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
});
