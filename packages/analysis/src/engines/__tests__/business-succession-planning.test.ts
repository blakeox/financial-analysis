/**
 * Business Succession Planning Tests
 */

import { describe, expect, it } from 'vitest';
import type { BusinessSuccessionPlanningInput } from '../../schemas/business-succession-planning.js';
import { BusinessSuccessionPlanningCalculator } from '../business-succession-planning.js';

describe('BusinessSuccessionPlanningCalculator', () => {
  const baseInput: BusinessSuccessionPlanningInput = {
    businessInfo: {
      businessName: 'Test Business',
      businessType: 'llc',
      annualRevenue: 2000000,
      businessValue: 5000000,
    },
    ownerInfo: {
      age: 55,
      ownershipPercentage: 1,
      expectedRetirementAge: 65,
    },
    successionOptions: {
      successionType: 'family-transfer',
      hasBuySellAgreement: false,
      buySellFunding: 'life-insurance',
    },
    estatePlanning: {
      estateTaxExemption: 12920000,
      includeGiftingStrategy: true,
      annualGiftExclusion: 18000,
    },
    analysis: {
      includeValuation: true,
      includeTaxAnalysis: true,
      includeTransitionPlan: true,
      includeFundingAnalysis: true,
      projectionYears: 10,
    },
  };

  it('should calculate business succession planning', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should perform valuation when requested', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput);
    expect(result.valuation).toBeDefined();
    expect(result.valuation.businessValue).toBeGreaterThan(0);
  });

  it('should analyze tax implications', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput);
    expect(result.taxAnalysis).toBeDefined();
    expect(result.taxAnalysis.estateTaxLiability).toBeGreaterThanOrEqual(0);
  });

  it('should provide transition plan', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput);
    expect(result.transitionPlan).toBeDefined();
  });

  it('should analyze funding options', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput);
    expect(result.fundingAnalysis).toBeDefined();
  });
});
