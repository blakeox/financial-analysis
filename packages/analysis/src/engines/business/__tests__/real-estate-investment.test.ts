/**
 * Real Estate Investment Analyzer Tests
 */

import { describe, expect, it } from 'vitest';
import type { RealEstateInvestmentInput } from '../../../schemas/real-estate-investment.js';
import { RealEstateInvestmentAnalyzer } from '../real-estate-investment.js';

describe('RealEstateInvestmentAnalyzer', () => {
  const baseInput: RealEstateInvestmentInput = {
    propertyInfo: {
      purchasePrice: 500000,
      propertyType: 'residential',
      squareFeet: 2000,
      units: 1,
    },
    financing: {
      downPayment: 100000,
      loanAmount: 400000,
      interestRate: 0.04,
      loanTerm: 30,
      loanType: 'conventional',
    },
    income: {
      monthlyRent: 3000,
      annualRentIncrease: 0.03,
      occupancyRate: 0.95,
      otherIncome: 0,
    },
    expenses: {
      propertyTaxes: 6000,
      insurance: 2000,
      maintenance: 3000,
      propertyManagement: 0,
      utilities: 0,
      otherExpenses: 1000,
      vacancyRate: 0.05,
    },
    projections: {
      holdingPeriod: 10,
      appreciationRate: 0.03,
      saleCosts: 0.06,
    },
    analysis: {
      includeCapRate: true,
      includeCashOnCash: true,
      includeIRR: true,
      includeNOI: true,
    },
  };

  it('should calculate NOI', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.noi).toBeDefined();
    expect(result.noi?.annualNOI).toBeGreaterThan(0);
  });

  it('should calculate cap rate', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result.capRate).toBeDefined();
    expect(result.capRate?.capRate).toBeGreaterThan(0);
    expect(result.capRate?.capRate).toBeLessThan(1);
  });

  it('should calculate cash-on-cash return', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result.cashOnCash).toBeDefined();
    expect(result.cashOnCash?.cashOnCashReturn).toBeDefined();
  });

  it('should calculate mortgage payment', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result.mortgagePayment).toBeDefined();
    expect(result.mortgagePayment.monthlyPayment).toBeGreaterThan(0);
  });

  it('should calculate cash flow', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result.cashFlow).toBeDefined();
    expect(result.cashFlow.monthlyCashFlow).toBeDefined();
  });

  it('should calculate IRR when requested', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result.irr).toBeDefined();
    expect(result.irr?.irr).toBeGreaterThanOrEqual(0);
  });

  it('should generate summary and recommendations', () => {
    const result = RealEstateInvestmentAnalyzer.analyze(baseInput);
    expect(result.summary).toBeDefined();
    expect(result.summary.capRate).toBeDefined();
    expect(result.summary.cashOnCashReturn).toBeDefined();
    expect(result.summary.irr).toBeDefined();

    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should handle cash purchases with zero mortgage payment', () => {
    const result = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 300000,
        propertyType: 'residential',
        squareFeet: 1500,
        units: 1,
      },
      financing: {
        downPayment: 300000,
        loanAmount: 0,
        interestRate: 0.05,
        loanTerm: 30,
        loanType: 'cash',
      },
      income: {
        monthlyRent: 2500,
        annualRentIncrease: 0.02,
        occupancyRate: 0.95,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 3000,
        insurance: 1200,
        maintenance: 1500,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 0,
        vacancyRate: 0.05,
      },
      projections: {
        holdingPeriod: 5,
        appreciationRate: 0.02,
        saleCosts: 0.06,
      },
    });

    expect(result.mortgagePayment.monthlyPayment).toBe(0);
    expect(result.cashOnCash?.cashOnCashReturn).toBeGreaterThan(0);
  });

  it('should flag negative cash flow in recommendations', () => {
    const result = RealEstateInvestmentAnalyzer.analyze({
      propertyInfo: {
        purchasePrice: 400000,
        propertyType: 'residential',
        squareFeet: 1800,
        units: 1,
      },
      financing: {
        downPayment: 80000,
        loanAmount: 320000,
        interestRate: 0.08,
        loanTerm: 30,
        loanType: 'conventional',
      },
      income: {
        monthlyRent: 1500,
        annualRentIncrease: 0.01,
        occupancyRate: 0.85,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 6000,
        insurance: 2000,
        maintenance: 3000,
        propertyManagement: 1200,
        utilities: 1500,
        otherExpenses: 1000,
        vacancyRate: 0.1,
      },
      projections: {
        holdingPeriod: 5,
        appreciationRate: 0,
        saleCosts: 0.06,
      },
      analysis: {
        includeCapRate: true,
        includeCashOnCash: true,
        includeIRR: true,
        includeNOI: true,
      },
    });

    expect(result.cashFlow.monthlyCashFlow).toBeLessThan(0);
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Negative cash flow'),
      ])
    );
    expect(result.cashOnCash?.interpretation).toContain('Negative cash flow');
  });

  it('should interpret mid-tier cap rate bands', () => {
    const goodCapRate = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 100000,
        propertyType: 'residential',
        squareFeet: 900,
        units: 1,
      },
      income: {
        monthlyRent: 1000,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 3000,
        insurance: 1000,
        maintenance: 1000,
        propertyManagement: 0,
        utilities: 500,
        otherExpenses: 500,
        vacancyRate: 0,
      },
    });

    const moderateCapRate = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 100000,
        propertyType: 'residential',
        squareFeet: 900,
        units: 1,
      },
      income: {
        monthlyRent: 1000,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 4000,
        insurance: 2000,
        maintenance: 1000,
        propertyManagement: 0,
        utilities: 500,
        otherExpenses: 500,
        vacancyRate: 0,
      },
    });

    expect(goodCapRate.capRate?.interpretation).toContain('Good cap rate');
    expect(moderateCapRate.capRate?.interpretation).toContain('Moderate cap rate');
  });

  it('should handle cash-on-cash interpretations and zero down payment', () => {
    const goodCashOnCash = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      financing: {
        downPayment: 100000,
        loanAmount: 0,
        interestRate: 0.05,
        loanTerm: 30,
        loanType: 'cash',
      },
      income: {
        monthlyRent: 1200,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 4000,
        insurance: 1000,
        maintenance: 1000,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 0,
        vacancyRate: 0,
      },
    });

    const zeroDownPayment = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      financing: {
        downPayment: 0,
        loanAmount: 0,
        interestRate: 0.05,
        loanTerm: 30,
        loanType: 'cash',
      },
      income: {
        monthlyRent: 1000,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 2000,
        insurance: 1000,
        maintenance: 500,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 0,
        vacancyRate: 0,
      },
    });

    expect(goodCashOnCash.cashOnCash?.interpretation).toContain('Good cash-on-cash return');
    expect(zeroDownPayment.cashOnCash?.cashOnCashReturn).toBe(0);
    expect(zeroDownPayment.cashOnCash?.interpretation).toContain('Positive but modest');
  });

  it('should interpret good and moderate IRR bands', () => {
    const goodIRR = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 100000,
        propertyType: 'residential',
        squareFeet: 800,
        units: 1,
      },
      financing: {
        downPayment: 100000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 30,
        loanType: 'cash',
      },
      income: {
        monthlyRent: 0,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 0,
        insurance: 0,
        maintenance: 0,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 0,
        vacancyRate: 0,
      },
      projections: {
        holdingPeriod: 5,
        appreciationRate: 0.1,
        saleCosts: 0,
      },
      analysis: {
        includeCapRate: false,
        includeCashOnCash: false,
        includeIRR: true,
        includeNOI: false,
      },
    });

    const moderateIRR = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 100000,
        propertyType: 'residential',
        squareFeet: 800,
        units: 1,
      },
      financing: {
        downPayment: 100000,
        loanAmount: 0,
        interestRate: 0,
        loanTerm: 30,
        loanType: 'cash',
      },
      income: {
        monthlyRent: 0,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 0,
        insurance: 0,
        maintenance: 0,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 0,
        vacancyRate: 0,
      },
      projections: {
        holdingPeriod: 5,
        appreciationRate: 0.06,
        saleCosts: 0,
      },
      analysis: {
        includeCapRate: false,
        includeCashOnCash: false,
        includeIRR: true,
        includeNOI: false,
      },
    });

    expect(goodIRR.irr?.interpretation).toContain('Good IRR');
    expect(moderateIRR.irr?.interpretation).toContain('Moderate IRR');
  });

  it('should return zero cash flow margin when NOI is non-positive', () => {
    const result = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      income: {
        monthlyRent: 0,
        annualRentIncrease: 0,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 3000,
        insurance: 1500,
        maintenance: 1000,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 500,
        vacancyRate: 0,
      },
    });

    expect(result.noi?.annualNOI).toBeLessThanOrEqual(0);
    expect(result.cashFlow.cashFlowMargin).toBe(0);
  });

  it('should provide cap rate interpretations for strong and weak deals', () => {
    const strongCapRate = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 500000,
        propertyType: 'multifamily',
        squareFeet: 3000,
        units: 4,
      },
      income: {
        monthlyRent: 6000,
        annualRentIncrease: 0.03,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 4000,
        insurance: 1500,
        maintenance: 2000,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 500,
        vacancyRate: 0.05,
      },
    });

    const weakCapRate = RealEstateInvestmentAnalyzer.analyze({
      ...baseInput,
      propertyInfo: {
        purchasePrice: 400000,
        propertyType: 'residential',
        squareFeet: 1200,
        units: 1,
      },
      income: {
        monthlyRent: 2000,
        annualRentIncrease: 0.02,
        occupancyRate: 0.9,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 15000,
        insurance: 4000,
        maintenance: 3000,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 2000,
        vacancyRate: 0.1,
      },
    });

    expect(strongCapRate.capRate?.interpretation).toContain('Excellent cap rate');
    expect(weakCapRate.capRate?.interpretation).toContain('Low cap rate');
  });

  it('should interpret IRR bands and respect analysis flags', () => {
    const highReturn = RealEstateInvestmentAnalyzer.analyze({
      propertyInfo: {
        purchasePrice: 200000,
        propertyType: 'residential',
        squareFeet: 1000,
        units: 1,
      },
      financing: {
        downPayment: 200000,
        loanAmount: 0,
        interestRate: 0.05,
        loanTerm: 30,
        loanType: 'cash',
      },
      income: {
        monthlyRent: 2500,
        annualRentIncrease: 0.02,
        occupancyRate: 1,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 2000,
        insurance: 800,
        maintenance: 1200,
        propertyManagement: 0,
        utilities: 0,
        otherExpenses: 0,
        vacancyRate: 0.05,
      },
      projections: {
        holdingPeriod: 5,
        appreciationRate: 0.1,
        saleCosts: 0.02,
      },
      analysis: {
        includeCapRate: true,
        includeCashOnCash: true,
        includeIRR: true,
        includeNOI: true,
      },
    });

    const lowReturn = RealEstateInvestmentAnalyzer.analyze({
      propertyInfo: {
        purchasePrice: 400000,
        propertyType: 'residential',
        squareFeet: 1600,
        units: 1,
      },
      financing: {
        downPayment: 100000,
        loanAmount: 300000,
        interestRate: 0.07,
        loanTerm: 30,
        loanType: 'conventional',
      },
      income: {
        monthlyRent: 1500,
        annualRentIncrease: 0.01,
        occupancyRate: 0.85,
        otherIncome: 0,
      },
      expenses: {
        propertyTaxes: 7000,
        insurance: 2500,
        maintenance: 4000,
        propertyManagement: 1200,
        utilities: 1000,
        otherExpenses: 1200,
        vacancyRate: 0.1,
      },
      projections: {
        holdingPeriod: 5,
        appreciationRate: 0,
        saleCosts: 0.06,
      },
      analysis: {
        includeCapRate: false,
        includeCashOnCash: false,
        includeIRR: true,
        includeNOI: true,
      },
    });

    expect(highReturn.irr?.interpretation).toContain('Excellent IRR');
    expect(lowReturn.irr?.interpretation).toContain('Low IRR');
    expect(lowReturn.capRate).toBeUndefined();
    expect(lowReturn.cashOnCash).toBeUndefined();
  });
});
