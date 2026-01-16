/**
 * Tax Loss Harvesting Tests
 */

import { describe, expect, it } from 'vitest';
import type { TaxLossHarvestingInput } from '../../../schemas/tax-loss-harvesting.js';
import { TaxLossHarvestingOptimizer } from '../tax-loss-harvesting.js';

describe('TaxLossHarvestingOptimizer', () => {
  const baseInput: TaxLossHarvestingInput = {
    portfolio: {
      holdings: [
        {
          symbol: 'AAPL',
          shares: 100,
          costBasis: 15000,
          currentPrice: 120,
          purchaseDate: '2023-01-15',
          holdingPeriod: 'long-term',
        },
        {
          symbol: 'MSFT',
          shares: 50,
          costBasis: 16000,
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
    expect(result.harvestableLosses).toBeDefined();
    expect(Array.isArray(result.harvestableLosses)).toBe(true);
  });

  it('should calculate potential tax savings', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.projectedTaxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should analyze wash sale rules', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.washSalePeriod).toBeDefined();
  });

  it('should provide harvesting recommendations', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should provide recommended actions for harvestable losses', () => {
    const result = TaxLossHarvestingOptimizer.analyze(baseInput);
    expect(result.recommendedActions.length).toBeGreaterThan(0);
    expect(result.recommendedActions[0]).toContain('Harvest loss');
    expect(result.harvestableLosses[0].washSaleRisk).toBe(false);
  });

  it('should return zero savings when no losses exist', () => {
    const noLossInput: TaxLossHarvestingInput = {
      ...baseInput,
      portfolio: {
        ...baseInput.portfolio,
        holdings: [
          {
            symbol: 'AAPL',
            shares: 100,
            costBasis: 150,
            currentPrice: 170,
            purchaseDate: '2023-01-15',
            holdingPeriod: 'long-term',
          },
        ],
      },
    };

    const result = TaxLossHarvestingOptimizer.analyze(noLossInput);
    expect(result.totalTaxLoss).toBe(0);
    expect(result.projectedTaxSavings).toBe(0);
    expect(result.harvestableLosses.length).toBe(0);
    expect(result.recommendedActions.length).toBe(0);
  });
});

