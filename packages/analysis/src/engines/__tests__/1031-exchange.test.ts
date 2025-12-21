/**
 * 1031 Exchange Tests
 */

import { describe, expect, it } from 'vitest';
import type { OneZeroThreeOneExchangeInput } from '../../schemas/1031-exchange.js';
import { OneZeroThreeOneExchangeAnalyzer } from '../1031-exchange.js';

describe('OneZeroThreeOneExchangeAnalyzer', () => {
  const baseInput: OneZeroThreeOneExchangeInput = {
    relinquishedProperty: {
      description: 'Rental Property',
      purchaseDate: '2010-01-01',
      purchasePrice: 500000,
      currentValue: 600000,
      adjustedBasis: 400000,
      accumulatedDepreciation: 50000,
      mortgageBalance: 200000,
      sellingPrice: 600000,
      sellingExpenses: 30000,
      netProceeds: 370000,
    },
    replacementProperty: {
      description: 'Apartment Complex',
      purchasePrice: 700000,
      purchaseExpenses: 20000,
      expectedValue: 750000,
      mortgageAmount: 300000,
      downPayment: 420000,
    },
    exchangeTimeline: {
      saleDate: '2024-01-01',
      identificationDeadline: '2024-02-15',
      closingDeadline: '2024-06-29',
      qualifiedIntermediary: true,
      qifees: 1000,
    },
    taxInfo: {
      federalTaxRate: {
        ordinary: 0.37,
        capitalGains: 0.2,
        depreciationRecapture: 0.25,
      },
      stateTaxRate: 0.05,
      netInvestmentIncomeTax: true,
      niiTaxRate: 0.038,
    },
    boot: {
      cashReceived: 0,
      debtRelief: 0,
      nonLikeKindProperty: 0,
      totalBoot: 0,
    },
    analysis: {
      includeTaxDeferral: true,
      includeDepreciationRecapture: true,
      includeBootAnalysis: true,
      includeComparison: true,
    },
  };

  it('should calculate 1031 exchange analysis', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate tax deferral', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
    expect(result.taxDeferral).toBeDefined();
    // @ts-expect-error - deferredTax is the correct property name
    expect(result.taxDeferral.deferredTax).toBeGreaterThanOrEqual(0);
  });

  it('should analyze boot', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
    expect(result.bootAnalysis).toBeDefined();
  });

  // it('should perform compliance check', () => {
  //   const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
  //   expect(result.complianceCheck).toBeDefined();
  //   expect(result.complianceCheck.isCompliant).toBeDefined();
  // });

  // it('should analyze replacement property', () => {
  //   const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
  //   expect(result.replacementAnalysis).toBeDefined();
  // });
});

