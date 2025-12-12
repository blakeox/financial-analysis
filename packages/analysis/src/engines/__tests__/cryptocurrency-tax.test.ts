/**
 * Cryptocurrency Tax Tests
 */

import { describe, expect, it } from 'vitest';
import type { CryptocurrencyTaxInput } from '../../schemas/cryptocurrency-tax.js';
import { CryptocurrencyTaxCalculator } from '../cryptocurrency-tax.js';

describe('CryptocurrencyTaxCalculator', () => {
  const baseInput: CryptocurrencyTaxInput = {
    personalInfo: {
      taxYear: 2024,
      filingStatus: 'single',
      federalTaxRate: 0.22,
      stateTaxRate: 0.05,
    },
    transactions: [
      {
        transactionType: 'buy',
        asset: 'BTC',
        date: '2024-01-01',
        amount: 1,
        costBasis: 40000,
        fairMarketValue: 40000,
        proceeds: 0,
        holdingPeriod: 'short-term',
      },
      {
        transactionType: 'sell',
        asset: 'BTC',
        date: '2024-06-01',
        amount: 0.5,
        costBasis: 20000,
        fairMarketValue: 35000,
        proceeds: 17500,
        holdingPeriod: 'short-term',
      },
    ],
    costBasisMethod: 'fifo',
    analysis: {
      includeCapitalGains: true,
      includeOrdinaryIncome: true,
      includeWashSaleAnalysis: true,
      includeForm8949: true,
    },
  };

  it('should calculate cryptocurrency tax', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate capital gains', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.capitalGains).toBeDefined();
    expect(result.capitalGains.totalCapitalGains).toBeDefined();
  });

  it('should calculate ordinary income', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.ordinaryIncome).toBeDefined();
  });

  it('should analyze wash sales when requested', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.washSaleAnalysis).toBeDefined();
  });

  it('should generate Form 8949 data when requested', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.form8949Data).toBeDefined();
    expect(Array.isArray(result.form8949Data)).toBe(true);
  });
});

