/**
 * 1031 Exchange Tests
 */

import { describe, expect, it } from 'vitest';
import type { OneZeroThreeOneExchangeInput } from '../../schemas/1031-exchange.js';
import { OneZeroThreeOneExchangeAnalyzer } from '../1031-exchange.js';

describe('OneZeroThreeOneExchangeAnalyzer', () => {
  const baseInput: OneZeroThreeOneExchangeInput = {
    relinquishedProperty: {
      propertyType: 'real-estate',
      purchasePrice: 500000,
      adjustedBasis: 400000,
      salePrice: 600000,
      accumulatedDepreciation: 50000,
      sellingExpenses: 30000,
    },
    replacementProperty: {
      purchasePrice: 700000,
      closingCosts: 20000,
    },
    exchangeDetails: {
      exchangeType: 'delayed',
      identificationDeadline: '2024-05-15',
      closingDeadline: '2024-11-15',
      qualifiedIntermediary: true,
    },
    taxInfo: {
      federalTaxRate: {
        ordinary: 0.37,
        capitalGains: 0.2,
      },
      stateTaxRate: 0.05,
      includeDepreciationRecapture: true,
    },
    analysis: {
      includeTaxDeferral: true,
      includeBootAnalysis: true,
      includeComplianceCheck: true,
      includeReplacementAnalysis: true,
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
    expect(result.taxDeferral.deferredTaxAmount).toBeGreaterThanOrEqual(0);
  });

  it('should analyze boot', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
    expect(result.bootAnalysis).toBeDefined();
  });

  it('should perform compliance check', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
    expect(result.complianceCheck).toBeDefined();
    expect(result.complianceCheck.isCompliant).toBeDefined();
  });

  it('should analyze replacement property', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(baseInput);
    expect(result.replacementAnalysis).toBeDefined();
  });

  it('should flag compliance issues and replacement shortfall', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      relinquishedProperty: {
        ...baseInput.relinquishedProperty,
        salePrice: 600000,
        sellingPrice: 600000,
        adjustedBasis: 590000,
        accumulatedDepreciation: 0,
        sellingExpenses: 0,
      },
      replacementProperty: {
        ...baseInput.replacementProperty,
        purchasePrice: 400000,
        closingCosts: 0,
      },
      exchangeDetails: {
        ...baseInput.exchangeDetails,
        exchangeType: 'reverse',
        identificationDeadline: '',
        closingDeadline: '',
        qualifiedIntermediary: 'false' as unknown as boolean,
      },
      analysis: {
        includeTaxDeferral: false,
        includeDepreciationRecapture: false,
        includeBootAnalysis: false,
        includeComparison: false,
        includeComplianceCheck: true,
        includeReplacementAnalysis: true,
      },
    } as unknown as OneZeroThreeOneExchangeInput);

    expect(result.complianceCheck).toBeDefined();
    expect(result.complianceCheck.isCompliant).toBe(false);
    expect(result.complianceCheck.issues.length).toBeGreaterThan(0);
    expect(result.replacementAnalysis?.meetsReinvestmentRequirement).toBe(false);
  });

  it('should recommend caution for small tax savings with boot tax', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      relinquishedProperty: {
        ...baseInput.relinquishedProperty,
        salePrice: 505000,
        sellingPrice: 505000,
        adjustedBasis: 500000,
        accumulatedDepreciation: 0,
      },
      boot: {
        cashReceived: 8000,
        debtRelief: 2000,
      },
      taxInfo: {
        ...baseInput.taxInfo,
        netInvestmentIncomeTax: true,
        niiTaxRate: 0.038,
      },
      analysis: {
        includeTaxDeferral: true,
        includeDepreciationRecapture: true,
        includeBootAnalysis: true,
        includeComparison: true,
        includeComplianceCheck: false,
        includeReplacementAnalysis: false,
      },
    } as unknown as OneZeroThreeOneExchangeInput);

    expect(result.comparison?.recommendation).toBe(
      'Tax savings may not justify exchange complexity'
    );
    expect(result.recommendations).toContain('Tax on boot received: $2500');
  });

  it('should coerce string inputs and fallback invalid rates', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      relinquishedProperty: {
        ...baseInput.relinquishedProperty,
        salePrice: 510000,
        sellingPrice: 510000,
        adjustedBasis: 500000,
        accumulatedDepreciation: 0,
      },
      exchangeDetails: {
        ...baseInput.exchangeDetails,
        qualifiedIntermediary: 'true' as unknown as boolean,
      },
      taxInfo: {
        federalTaxRate: {
          ordinary: '0.3',
          capitalGains: 'not-a-number',
          depreciationRecapture: '0.25',
        },
        stateTaxRate: 'Infinity',
        netInvestmentIncomeTax: 'maybe',
        niiTaxRate: '0.04',
        includeDepreciationRecapture: 'maybe',
      },
      analysis: {
        includeTaxDeferral: true,
        includeDepreciationRecapture: true,
        includeBootAnalysis: false,
        includeComparison: true,
        includeComplianceCheck: false,
        includeReplacementAnalysis: false,
      },
    } as unknown as OneZeroThreeOneExchangeInput);

    expect(result.comparison?.taxWithoutExchange).toBe(2000);
  });

  it('should keep default recommendation for large tax savings', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      ...baseInput,
      relinquishedProperty: {
        ...baseInput.relinquishedProperty,
        salePrice: 700000,
        sellingPrice: 700000,
        adjustedBasis: 400000,
        accumulatedDepreciation: 0,
      },
      boot: {
        cashReceived: 50000,
      },
      analysis: {
        includeTaxDeferral: true,
        includeDepreciationRecapture: false,
        includeBootAnalysis: false,
        includeComparison: true,
        includeComplianceCheck: false,
        includeReplacementAnalysis: false,
      },
    } as unknown as OneZeroThreeOneExchangeInput);

    expect(result.comparison?.recommendation).toBe(
      '1031 exchange provides significant tax deferral'
    );
  });

  it('should fall back when optional sections are missing', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze({
      exchangeTimeline: {
        identificationDeadline: '2024-05-15',
        closingDeadline: '2024-11-15',
        qualifiedIntermediary: true,
        exchangeType: 'delayed',
      },
    } as unknown as OneZeroThreeOneExchangeInput);

    expect(result.summary).toBeDefined();
    expect(result.summary.taxDeferred).toBe(0);
    expect(result.summary.taxOnBoot).toBe(0);
  });

  it('should default timeline fields when exchange timeline is omitted', () => {
    const result = OneZeroThreeOneExchangeAnalyzer.analyze(
      {} as unknown as OneZeroThreeOneExchangeInput
    );

    expect(result.summary).toBeDefined();
    expect(result.recommendations).toContain('Identification deadline: ');
    expect(result.recommendations).toContain('Closing deadline: ');
  });
});
