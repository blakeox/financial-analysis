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

  it('should include trust analysis when a trust exists', () => {
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
    } as EstatePlanningInput);

    expect(result.trustAnalysis).toBeDefined();
    expect(result.trustAnalysis.benefits.length).toBe(0);
    expect(result.trustAnalysis.trustRecommendation).toContain('You have a trust in place');
  });

  it('should recommend creating a will when missing', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      estatePlan: {
        ...baseInput.estatePlan,
        hasWill: false,
      },
    } as EstatePlanningInput);

    expect(result.recommendations.join(' ')).toContain('No will in place');
  });

  it('should handle inheritance when beneficiaries are zero', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      estatePlan: {
        ...baseInput.estatePlan,
        beneficiaries: 0,
      },
    } as EstatePlanningInput);

    expect(result.inheritance.perBeneficiary).toBe(result.inheritance.netInheritance);
  });

  it('calculates estate tax in highest bracket for large estates', () => {
    const result = EstatePlanningCalculator.analyze({
      ...baseInput,
      assets: {
        ...baseInput.assets,
        totalAssets: 30000000,
        realEstate: 10000000,
        investments: 15000000,
        retirementAccounts: 5000000,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        federalEstateTaxExemption: 1000000,
        stateEstateTaxExemption: 0,
        expectedGrowthRate: 0,
        yearsToProject: 0,
      },
    } as EstatePlanningInput);

    expect(result.estateTax.totalTax).toBeGreaterThan(0);
    expect(result.estateTax.federalTax).toBeGreaterThan(0);
  });
});
