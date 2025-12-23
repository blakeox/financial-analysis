/**
 * Car Lease vs Buy Tests
 */

import { describe, expect, it } from 'vitest';
import type { CarLeaseVsBuyInput } from '../../../schemas/car-lease-vs-buy.js';
import { CarLeaseVsBuyCalculator } from '../car-lease-vs-buy.js';

describe('CarLeaseVsBuyCalculator', () => {
  const baseInput: CarLeaseVsBuyInput = {
    vehicleInfo: {
      msrp: 35000,
      negotiatedPrice: 32000,
      residualValue: 18000,
    },
    leaseTerms: {
      leaseTerm: 36,
      downPayment: 2000,
      monthlyPayment: 350,
      moneyFactor: 0.001,
      residualPercentage: 0.5,
      mileageAllowance: 12000,
      excessMileageFee: 0.25,
      acquisitionFee: 0,
      dispositionFee: 0,
      securityDeposit: 0,
    },
    purchaseTerms: {
      loanTerm: 60,
      downPayment: 5000,
      interestRate: 0.05,
      salesTaxRate: 0.08,
      registrationFee: 0,
      titleFee: 0,
    },
    ownershipCosts: {
      annualInsurance: 1500,
      annualMaintenance: 800,
      annualRepairs: 500,
      fuelCost: 2000,
      expectedOwnershipYears: 6,
    },
    financialAssumptions: {
      opportunityCostRate: 0.07,
      expectedDepreciation: 0.15,
      tradeInValue: 0,
    },
    analysis: {
      analysisPeriod: 3,
      includeTaxBenefits: true,
      includeEarlyTermination: false,
    },
  };

  it('should calculate lease vs buy comparison', () => {
    const result = CarLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.summary.leaseTotalCost).toBeGreaterThan(0);
    expect(result.summary.purchaseTotalCost).toBeGreaterThan(0);
  });

  it('should calculate total cost of ownership', () => {
    const result = CarLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result.summary).toBeDefined();
    expect(result.summary.leaseTotalCost).toBeGreaterThan(0);
    expect(result.summary.purchaseTotalCost).toBeGreaterThan(0);
  });

  it('should provide recommendation', () => {
    const result = CarLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should calculate break-even analysis', () => {
    const result = CarLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result.comparison).toBeDefined();
    expect(result.comparison.breakEvenYears).toBeDefined();
  });

  it('should include opportunity cost analysis', () => {
    const result = CarLeaseVsBuyCalculator.analyze(baseInput) as any;
    expect(result.purchaseAnalysis).toBeDefined();
    expect(result.purchaseAnalysis.opportunityCost).toBeDefined();
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = CarLeaseVsBuyCalculator.analyze(baseInput) as any;

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('leaseAnalysis');
      expect(result).toHaveProperty('purchaseAnalysis');
      expect(result).toHaveProperty('comparison');
      expect(result).toHaveProperty('recommendations');
    });
  });
});

