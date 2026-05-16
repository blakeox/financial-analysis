/**
 * Equipment Lease vs Buy Tests
 */

import { describe, expect, it } from 'vitest';
import type { EquipmentLeaseVsBuyInput } from '../../../schemas/equipment-lease-vs-buy.js';
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
      securityDeposit: 0,
      buyoutOption: false,
      buyoutPrice: 0,
      maintenanceIncluded: true,
      annualMaintenanceCost: 0,
    },
    purchaseTerms: {
      downPayment: 20000,
      loanTerm: 5,
      interestRate: 0.08,
      annualMaintenanceCost: 5000,
      insuranceCost: 1000,
    },
    taxInfo: {
      federalTaxRate: 0.21,
      stateTaxRate: 0,
      section179Eligible: true,
      section179Deduction: 1000000,
      bonusDepreciationEligible: true,
      bonusDepreciationPercentage: 0.6,
      depreciationMethod: 'macrs',
    },
    financialAssumptions: {
      opportunityCostRate: 0.1,
      inflationRate: 0.03,
      analysisPeriod: 5,
    },
    analysis: {
      includeNPV: true,
      includeIRR: true,
      includeCashFlowComparison: true,
      includeTaxImpact: true,
    },
  };

  it('should calculate equipment lease vs buy comparison', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.leaseTotalCost).toBeGreaterThan(0);
    expect(result.summary.purchaseTotalCost).toBeGreaterThan(0);
  });

  it('should calculate NPV when requested', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result.leaseAnalysis.npv).toBeDefined();
    expect(result.purchaseAnalysis.npv).toBeDefined();
  });

  // IRR not currently implemented in engine
  // it('should calculate IRR when requested', () => {
  //   const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput);
  //   expect(result.irrAnalysis).toBeDefined();
  // });

  it('should provide recommendation', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should expose IRR and tax impact placeholders when requested', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput) as any;

    expect(result.irrAnalysis).toBeDefined();
    expect(result.irrAnalysis.note).toContain('not implemented');
    expect(result.taxImpactAnalysis).toBeDefined();
    expect(result.taxImpactAnalysis.leaseTaxSavings).toBeGreaterThanOrEqual(0);
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

  it('defaults optional fields when missing', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze({
      ...baseInput,
      leaseTerms: {
        ...baseInput.leaseTerms,
        securityDeposit: undefined,
      },
      purchaseTerms: {
        ...baseInput.purchaseTerms,
        insuranceCost: undefined,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        stateTaxRate: undefined,
        section179Deduction: undefined,
        bonusDepreciationPercentage: undefined,
      },
    } as EquipmentLeaseVsBuyInput) as any;

    expect(result.leaseAnalysis.totalFees).toBe(baseInput.leaseTerms.downPayment);
    expect(result.purchaseAnalysis.totalMaintenance).toBeGreaterThan(0);
    expect(result.purchaseAnalysis.taxSavings).toBeGreaterThan(0);
  });

  it('respects analysis period override from analysis input', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze({
      ...baseInput,
      financialAssumptions: {
        ...baseInput.financialAssumptions,
        analysisPeriod: 8,
      },
      analysis: {
        ...baseInput.analysis,
        analysisPeriod: 4,
      },
    } as EquipmentLeaseVsBuyInput) as any;

    expect(result.recommendations.some((item: string) => item.includes('over 4 years'))).toBe(true);
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

  it('can recommend buying when purchase NPV is higher', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze({
      ...baseInput,
      equipmentInfo: {
        ...baseInput.equipmentInfo,
        purchasePrice: 80000,
        expectedResidualValue: 40000,
      },
      leaseTerms: {
        ...baseInput.leaseTerms,
        leaseTerm: 5,
        monthlyPayment: 300,
      },
      purchaseTerms: {
        ...baseInput.purchaseTerms,
        loanTerm: 5,
        interestRate: 0.02,
        annualMaintenanceCost: 200,
        insuranceCost: 100,
      },
      taxInfo: {
        federalTaxRate: 0.35,
        stateTaxRate: 0.05,
        section179Eligible: true,
        section179Deduction: 100000,
        bonusDepreciationEligible: true,
        bonusDepreciationPercentage: 1,
        depreciationMethod: 'macrs',
      },
      financialAssumptions: {
        opportunityCostRate: 0.08,
        inflationRate: 0.02,
        analysisPeriod: 5,
      },
      analysis: {
        includeNPV: true,
        includeIRR: false,
        includeCashFlowComparison: false,
        includeTaxImpact: false,
      },
    } as EquipmentLeaseVsBuyInput) as any;

    expect(result.recommendation.recommendedOption).toBe('buy');
  });
});
