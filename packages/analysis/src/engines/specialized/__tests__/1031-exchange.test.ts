/**
 * 1031 Exchange Tests
 */

import { describe, expect, it } from 'vitest';
import type { OneZeroThreeOneExchangeInput } from '../../../schemas/1031-exchange.js';
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

  it('should perform comprehensive analysis', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.taxDeferral).toBeDefined();
    expect(result.depreciationRecapture).toBeDefined();
    expect(result.bootAnalysis).toBeDefined();
    expect(result.comparison).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  it('should flag low tax savings and boot tax recommendations', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      relinquishedProperty: {
        ...baseInput.relinquishedProperty,
        sellingPrice: 505000,
        adjustedBasis: 500000,
        accumulatedDepreciation: 0,
      },
      boot: {
        ...baseInput.boot,
        cashReceived: 10000,
        totalBoot: 10000,
      },
      exchangeTimeline: {
        ...baseInput.exchangeTimeline,
        qualifiedIntermediary: false,
      },
    });

    expect(result.comparison?.recommendation).toBe(
      'Tax savings may not justify exchange complexity'
    );
    expect(result.recommendations).toContain('Tax on boot received: $2500');
    expect(result.recommendations).toContain(
      'CRITICAL: Use qualified intermediary for valid exchange'
    );
  });

  it('should omit optional analyses when flags are disabled', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeTaxDeferral: false,
        includeDepreciationRecapture: false,
        includeBootAnalysis: false,
        includeComparison: false,
      },
    });

    expect(result.taxDeferral).toBeUndefined();
    expect(result.depreciationRecapture).toBeUndefined();
    expect(result.bootAnalysis).toBeUndefined();
    expect(result.comparison).toBeUndefined();
    expect(result.recommendations).toContain('Identification deadline: 2024-02-15');
  });

  it('should keep default recommendation when tax savings are large', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      relinquishedProperty: {
        ...baseInput.relinquishedProperty,
        sellingPrice: 700000,
        adjustedBasis: 400000,
      },
      boot: {
        ...baseInput.boot,
        totalBoot: 50000,
      },
    });

    expect(result.comparison?.recommendation).toBe(
      '1031 exchange provides significant tax deferral'
    );
  });

  it('should handle comparison without tax deferral', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        includeTaxDeferral: false,
        includeComparison: true,
      },
    });

    expect(result.taxDeferral).toBeUndefined();
    expect(result.comparison?.taxWithExchange).toBe(0);
  });
});
