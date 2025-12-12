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

  it('should analyze tax impact', () => {
    const result = EquipmentLeaseVsBuyCalculator.analyze(baseInput);
    expect(result.taxImpactAnalysis).toBeDefined();
  });
});
