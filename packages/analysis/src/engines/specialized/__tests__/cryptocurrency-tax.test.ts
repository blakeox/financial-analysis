/**
 * Cryptocurrency Tax Tests
 */

import { describe, expect, it } from 'vitest';
import type { CryptocurrencyTaxInput } from '../../../schemas/cryptocurrency-tax.js';
import { CryptocurrencyTaxCalculator } from '../cryptocurrency-tax.js';

describe('CryptocurrencyTaxCalculator', () => {
  const baseInput: CryptocurrencyTaxInput = {
    personalInfo: {
      country: 'US',
      taxYear: 2024,
      filingStatus: 'single',
    },
    taxInfo: {
      federalTaxRate: {
        shortTerm: 0.22,
        longTerm: 0.15,
      },
      stateTaxRate: 0.05,
      incomeBracket: 0.22,
    },
    incomeTransactions: {
      miningIncome: 0,
      stakingRewards: 0,
      defiYield: 0,
      airdrops: 0,
      forks: 0,
    },
    transactions: [
      {
        date: '2024-01-01',
        transactionType: 'buy',
        asset: 'BTC',
        quantity: 1,
        pricePerUnit: 40000,
        totalValue: 40000,
        fees: 0,
        costBasis: 40000,
        proceeds: undefined,
        counterpartyAsset: undefined,
        counterpartyQuantity: undefined,
        counterpartyValue: undefined,
      },
      {
        date: '2024-06-01',
        transactionType: 'sell',
        asset: 'BTC',
        quantity: 0.5,
        pricePerUnit: 35000,
        totalValue: 17500,
        fees: 0,
        costBasis: undefined,
        proceeds: 17500,
        counterpartyAsset: undefined,
        counterpartyQuantity: undefined,
        counterpartyValue: undefined,
      },
    ],
    costBasisMethod: 'fifo',
    analysis: {
      includeRealizedGains: true,
      includeUnrealizedGains: true,
      includeTaxLossHarvesting: true,
      includeWashSaleAnalysis: true,
      includeMethodComparison: false,
    },
  };

  it('should calculate cryptocurrency tax', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalRealizedGains).toBeDefined();
  });

  it('should calculate realized gains', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.realizedGains).toBeDefined();
    expect(result.realizedGains!.totalGains).toBeDefined();
  });

  it('should calculate income tax', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.incomeTax).toBeDefined();
    expect(result.incomeTax.totalTax).toBeDefined();
  });

  it('should analyze wash sales when requested', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.washSaleAnalysis).toBeDefined();
  });

  it('should generate recommendations', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

