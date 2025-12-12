/**
 * Tax Loss Harvesting Tests
 */

import { describe, expect, it } from 'vitest';
import type { TaxLossHarvestingInput } from '../../schemas/tax-loss-harvesting.js';
import { TaxLossHarvestingOptimizer } from '../tax-loss-harvesting.js';

describe('TaxLossHarvestingOptimizer', () => {
  const baseInput: TaxLossHarvestingInput = {
    portfolio: {
      holdings: [
        {
          symbol: 'AAPL',
          shares: 100,
          costBasis: 150,
          currentPrice: 120,
          purchaseDate: '2023-01-15',
          holdingPeriod: 'long-term',
        },
        {
          symbol: 'MSFT',
          shares: 50,
          costBasis: 300,
          currentPrice: 280,
          purchaseDate: '2023-06-01',
          holdingPeriod: 'short-term',
        },
      ],
      totalValue: 26000,
    },
    taxInfo: {
      federalTaxRate: {
        shortTerm: 0.37,
        longTerm: 0.2,
      },
      stateTaxRate: 0.05,
      incomeBracket: 0.22,
    },
    realizedGains: {
      shortTermGains: 5000,
      longTermGains: 10000,
      ordinaryIncome: 0,
    },
    harvestingStrategy: {
      maxHarvestAmount: 3000,
      includeWashSaleRules: true,
      washSaleWindow: 30,
      replacementSecuritySimilarity: 'similar',
    },
    analysis: {
      includeTaxSavingsProjection: true,
      includeCarryForwardAnalysis: true,
      projectionYears: 5,
    },
  };

  it('should identify tax-loss harvesting opportunities', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.opportunities).toBeDefined();
    expect(Array.isArray(result.opportunities)).toBe(true);
  });

  it('should calculate potential tax savings', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.taxSavings).toBeDefined();
    expect(result.taxSavings.potentialSavings).toBeGreaterThanOrEqual(0);
  });

  it('should analyze wash sale rules', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.washSaleAnalysis).toBeDefined();
  });

  it('should provide harvesting recommendations', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should include carry-forward analysis when requested', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.carryForwardAnalysis).toBeDefined();
  });
});

