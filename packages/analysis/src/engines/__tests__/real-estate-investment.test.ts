/**
 * Real Estate Investment Analyzer Tests
 */

import { describe, expect, it } from 'vitest';
import type { RealEstateInvestmentInput } from '../../schemas/real-estate-investment.js';
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
});
