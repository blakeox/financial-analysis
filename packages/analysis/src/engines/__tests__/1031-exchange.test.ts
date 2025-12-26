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
});

