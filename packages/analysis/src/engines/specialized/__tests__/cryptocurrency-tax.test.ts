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
        pricePerUnit: 10000,
        totalValue: 10000,
        fees: 0,
      },
      {
        date: '2024-02-01',
        transactionType: 'buy',
        asset: 'BTC',
        quantity: 1,
        pricePerUnit: 20000,
        totalValue: 20000,
        fees: 0,
      },
      {
        date: '2024-06-01',
        transactionType: 'sell',
        asset: 'BTC',
        quantity: 1,
        pricePerUnit: 30000,
        totalValue: 30000,
        fees: 0,
        proceeds: 30000,
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
    expect(result.summary.totalRealizedGains).toBeGreaterThan(0);
  });

  it('calculates realized gains using FIFO', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.realizedGains).toBeDefined();
    expect(result.realizedGains!.totalGains).toBe(20000);
  });

  it('calculates realized gains using LIFO', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      costBasisMethod: 'lifo',
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    expect(result.realizedGains!.totalGains).toBe(10000);
  });

  it('calculates realized gains using highest-cost basis', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      costBasisMethod: 'highest-cost',
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    expect(result.realizedGains!.totalGains).toBe(10000);
  });

  it('calculates realized gains using lowest-cost basis', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      costBasisMethod: 'lowest-cost',
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    expect(result.realizedGains!.totalGains).toBe(20000);
  });

  it('uses provided cost basis for specific-identification', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      costBasisMethod: 'specific-identification',
      transactions: [
        ...baseInput.transactions,
        {
          date: '2024-07-01',
          transactionType: 'sell',
          asset: 'BTC',
          quantity: 0.5,
          pricePerUnit: 40000,
          totalValue: 20000,
          fees: 0,
          proceeds: 20000,
          costBasis: 15000,
        },
      ],
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    const lastGain = result.realizedGains!.gains[result.realizedGains!.gains.length - 1]!;

    expect(lastGain.costBasis).toBe(15000);
    expect(lastGain.gain).toBe(5000);
  });

  it('includes unrealized gains when enabled', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.unrealizedGains).toBeDefined();
    expect(result.unrealizedGains!.totalUnrealizedGains).toBeDefined();
  });

  it('returns zero tax-loss harvesting when no losses', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.taxLossHarvesting!.harvestableLosses).toBe(0);
    expect(result.taxLossHarvesting!.recommendation).toContain('No tax-loss');
  });

  it('identifies tax-loss harvesting when losses exist', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      transactions: [
        {
          date: '2024-01-01',
          transactionType: 'buy',
          asset: 'ETH',
          quantity: 1,
          pricePerUnit: 2000,
          totalValue: 2000,
          fees: 0,
        },
        {
          date: '2024-03-01',
          transactionType: 'sell',
          asset: 'ETH',
          quantity: 1,
          pricePerUnit: 1000,
          totalValue: 1000,
          fees: 0,
          proceeds: 1000,
        },
      ],
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    expect(result.taxLossHarvesting!.harvestableLosses).toBeGreaterThan(0);
    expect(result.taxLossHarvesting!.recommendation).toContain('harvesting');
  });

  it('flags potential wash sales on quick buyback', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      transactions: [
        {
          date: '2024-01-01',
          transactionType: 'buy',
          asset: 'BTC',
          quantity: 1,
          pricePerUnit: 10000,
          totalValue: 10000,
          fees: 0,
        },
        {
          date: '2024-02-01',
          transactionType: 'sell',
          asset: 'BTC',
          quantity: 1,
          pricePerUnit: 9000,
          totalValue: 9000,
          fees: 0,
          proceeds: 9000,
        },
        {
          date: '2024-02-15',
          transactionType: 'buy',
          asset: 'BTC',
          quantity: 1,
          pricePerUnit: 9500,
          totalValue: 9500,
          fees: 0,
        },
      ],
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    const risks = result.washSaleAnalysis!.washSaleRisks;
    expect(risks[0].risk).toBe('potential-wash-sale');
  });

  it('calculates income tax from mining, staking, defi, airdrops, and forks', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      incomeTransactions: {
        miningIncome: 1000,
        stakingRewards: 500,
        defiYield: 250,
        airdrops: 100,
        forks: 150,
      },
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    expect(result.incomeTax.totalIncome).toBe(2000);
    expect(result.incomeTax.totalTax).toBeGreaterThan(0);
  });

  it('calculates total tax liability with gains', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.totalTaxLiability.totalTax).toBeGreaterThan(0);
    expect(result.totalTaxLiability.capitalGainsTax).toBeGreaterThan(0);
  });

  it('does not charge capital gains tax when net gains are negative', () => {
    const input: CryptocurrencyTaxInput = {
      ...baseInput,
      transactions: [
        {
          date: '2024-01-01',
          transactionType: 'buy',
          asset: 'BTC',
          quantity: 1,
          pricePerUnit: 30000,
          totalValue: 30000,
          fees: 0,
        },
        {
          date: '2024-02-01',
          transactionType: 'sell',
          asset: 'BTC',
          quantity: 1,
          pricePerUnit: 20000,
          totalValue: 20000,
          fees: 0,
          proceeds: 20000,
        },
      ],
    };

    const result = CryptocurrencyTaxCalculator.analyze(input);
    expect(result.summary.netCapitalGains).toBeLessThan(0);
    expect(result.totalTaxLiability.capitalGainsTax).toBe(0);
  });

  it('includes method name in recommendations', () => {
    const result = CryptocurrencyTaxCalculator.analyze(baseInput);
    expect(result.recommendations.join(' ')).toContain('FIFO');
  });
});
