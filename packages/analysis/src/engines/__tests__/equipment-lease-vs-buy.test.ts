/**
 * Equipment Lease vs Buy Tests
 */

import { describe, expect, it } from 'vitest';
import type { EquipmentLeaseVsBuyInput } from '../../schemas/equipment-lease-vs-buy.js';
import { EquipmentLeaseVsBuyCalculator } from '../equipment-lease-vs-buy.js';

describe('EquipmentLeaseVsBuyCalculator', () => {
  const baseInput: EquipmentLeaseVsBuyInput = {
    equipmentInfo: {
      purchasePrice: 100000,
      usefulLife: 5,
      expectedResidualValue: 20000,
    },
    leaseTerms: {
      leaseType: 'operating-lease',
      leaseTerm: 5,
      monthlyPayment: 2000,
      downPayment: 0,
      buyoutOption: false,
      buyoutPrice: 0,
      maintenanceIncluded: true,
    },
    purchaseTerms: {
      downPayment: 20000,
      loanTerm: 5,
      interestRate: 0.08,
      annualMaintenanceCost: 5000,
    },
    taxInfo: {
      federalTaxRate: 0.21,
      section179Eligible: true,
      bonusDepreciationEligible: true,
    },
    analysis: {
      includeNPV: true,
      includeIRR: true,
      includeCashFlowComparison: true,
      includeTaxImpact: true,
      analysisPeriod: 5,
    },
  };

  it('should calculate equipment lease vs buy comparison', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.comparison.leaseTotalCost).toBeGreaterThan(0);
    expect(result.comparison.purchaseTotalCost).toBeGreaterThan(0);
  });

  it('should calculate NPV when requested', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput);
    expect(result.npvAnalysis).toBeDefined();
  });

  it('should calculate IRR when requested', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput);
    expect(result.irrAnalysis).toBeDefined();
  });

  it('should provide recommendation', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput);
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation.recommendedOption).toBeDefined();
  });

  it('should generate leasing recommendation messaging', () => {
    const recommendations = (EquipmentLeaseVsBuyCalculator as any).generateRecommendations(
      { betterOption: 'lease', costDifference: 10000 },
      5
    );

    expect(
      recommendations.some((item: string) => item.includes('Leasing provides tax benefits'))
    ).toBe(true);
  });

  it('should generate buying recommendation messaging', () => {
    const recommendations = (EquipmentLeaseVsBuyCalculator as any).generateRecommendations(
      { betterOption: 'buy', costDifference: 10000 },
      5
    );

    expect(recommendations.some((item: string) => item.includes('Buying provides ownership'))).toBe(
      true
    );
  });

  it('uses useful life as analysis period when missing', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze({
      ...baseInput,
      financialAssumptions: undefined,
      analysis: {
        includeNPV: false,
        includeIRR: false,
        includeCashFlowComparison: false,
        includeTaxImpact: false,
      },
      equipmentInfo: {
        ...baseInput.equipmentInfo,
        usefulLife: 7,
      },
    } as EquipmentLeaseVsBuyInput) as any;

    expect(result.npvAnalysis).toBeUndefined();
    expect(result.irrAnalysis).toBeUndefined();
    expect(result.taxImpactAnalysis).toBeUndefined();
    expect(result.recommendations.some((item: string) => item.includes('over 7 years'))).toBe(true);
  });

  it('handles zero-interest purchase loans and security deposits', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze({
      ...baseInput,
      leaseTerms: {
        ...baseInput.leaseTerms,
        downPayment: 2000,
        securityDeposit: 3000,
      },
      purchaseTerms: {
        ...baseInput.purchaseTerms,
        interestRate: 0,
        insuranceCost: 0,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        section179Eligible: false,
        bonusDepreciationEligible: false,
      },
    } as EquipmentLeaseVsBuyInput) as any;

    expect(result.leaseAnalysis.totalFees).toBe(5000);
    expect(result.purchaseAnalysis.totalInterest).toBe(0);
  });

  it('can recommend leasing when lease NPV is higher', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze({
      ...baseInput,
      leaseTerms: {
        ...baseInput.leaseTerms,
        leaseTerm: 3,
        monthlyPayment: 500,
        downPayment: 0,
        securityDeposit: 0,
      },
      purchaseTerms: {
        ...baseInput.purchaseTerms,
        loanTerm: 3,
        interestRate: 0.2,
        annualMaintenanceCost: 10000,
        insuranceCost: 3000,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        section179Eligible: false,
        bonusDepreciationEligible: false,
      },
      financialAssumptions: {
        opportunityCostRate: 0.1,
        inflationRate: 0.03,
        analysisPeriod: 3,
      },
      analysis: {
        includeNPV: true,
        includeIRR: false,
        includeCashFlowComparison: false,
        includeTaxImpact: false,
        analysisPeriod: 3,
      },
    } as EquipmentLeaseVsBuyInput) as any;

    expect(result.recommendation.recommendedOption).toBe('lease');
  });
});
