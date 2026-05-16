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
      annualEBITDA: 500000,
      totalAssets: 1000000,
      totalDebt: 200000,
    },
    ownership: {
      currentOwners: [
        {
          name: 'Owner 1',
          ownershipPercentage: 1,
          age: 55,
          expectedExitAge: 65,
        },
      ],
      totalOwnership: 1,
    },
    valuation: {
      valuationMethod: 'market-multiple',
      estimatedValue: 2500000,
      valuationMultiple: 5,
    },
    successionOptions: {
      transferMethod: 'family-transfer',
      buyerType: 'family-member',
    },
    taxPlanning: {
      federalEstateTaxExemption: 13400000,
      stateEstateTaxExemption: 0,
      estateTaxRate: 0.4,
      giftTaxExemption: 18000,
      includeGRAT: false,
      includeFLP: false,
    },
    buySellAgreement: {
      hasAgreement: false,
    },
    analysis: {
      includeTaxAnalysis: true,
      includeEstateTaxImpact: true,
      includeTransferStrategies: true,
      includeTimingAnalysis: true,
      includeFundingAnalysis: true,
    },
  };

  it('should calculate business succession planning', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should perform valuation when requested', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput) as any;
    expect(result.valuationAnalysis).toBeDefined();
    expect(result.valuationAnalysis.estimatedValue).toBeGreaterThan(0);
  });

  it('should analyze tax implications', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput) as any;
    expect(result.taxAnalysis).toBeDefined();
  });

  it('should provide transfer strategies', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput) as any;
    expect(result.transferStrategies).toBeDefined();
  });

  it('should analyze funding options', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze(baseInput) as any;
    expect(result.fundingAnalysis).toBeDefined();
  });

  it('should handle income approach valuation with urgent timing', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze({
      ...baseInput,
      ownership: {
        ...baseInput.ownership,
        currentOwners: [
          {
            name: 'Owner 1',
            ownershipPercentage: 1,
            age: 64,
            expectedExitAge: 65,
          },
        ],
      },
      valuation: {
        valuationMethod: 'income-approach',
        estimatedValue: 1000000,
      },
    } as BusinessSuccessionPlanningInput) as any;

    expect(result.valuationAnalysis.estimatedValue).toBe(2500000);
    expect(result.timingAnalysis.recommendation).toContain('URGENT');
  });

  it('should calculate gift taxes and life insurance funding', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze({
      ...baseInput,
      valuation: {
        valuationMethod: 'asset-based',
        estimatedValue: 3000000,
      },
      successionOptions: {
        transferMethod: 'gift',
        salePrice: 3000000,
      },
      taxPlanning: {
        ...baseInput.taxPlanning,
        federalEstateTaxExemption: 0,
        stateEstateTaxExemption: 0,
      },
      buySellAgreement: {
        hasAgreement: true,
        fundingMethod: 'life-insurance',
      },
    } as BusinessSuccessionPlanningInput) as any;

    expect(result.taxAnalysis.giftTax).toBeGreaterThan(0);
    expect(result.estateTaxImpact.estateTax).toBeGreaterThan(0);
    expect(result.fundingAnalysis.lifeInsuranceNeeded).toBeGreaterThan(0);
    expect(result.recommendations.join(' ')).toContain('Estate tax');
  });

  it('should skip optional analyses when disabled', () => {
    const result = BusinessSuccessionPlanningCalculator.analyze({
      ...baseInput,
      analysis: {
        includeTaxAnalysis: false,
        includeEstateTaxImpact: false,
        includeTransferStrategies: false,
        includeTimingAnalysis: false,
        includeFundingAnalysis: false,
      },
    } as BusinessSuccessionPlanningInput) as any;

    expect(result.taxAnalysis).toBeUndefined();
    expect(result.estateTaxImpact).toBeUndefined();
    expect(result.transferStrategies).toBeUndefined();
    expect(result.timingAnalysis).toBeUndefined();
    expect(result.fundingAnalysis).toBeUndefined();
  });
});
