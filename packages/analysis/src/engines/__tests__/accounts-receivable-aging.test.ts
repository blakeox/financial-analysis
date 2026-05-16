/**
 * Accounts Receivable Aging Tests
 */

import { describe, expect, it } from 'vitest';
import type { AccountsReceivableAgingInput } from '../../schemas/accounts-receivable-aging.js';
import { AccountsReceivableAgingAnalyzer } from '../accounts-receivable-aging.js';

describe('AccountsReceivableAgingAnalyzer', () => {
  const baseInput: AccountsReceivableAgingInput = {
    receivables: {
      totalReceivables: 100000,
      invoices: [
        {
          invoiceNumber: 'INV001',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-15',
          invoiceAmount: 10000,
          amountOutstanding: 10000,
          daysOutstanding: 45,
          agingBucket: '1-30',
        },
        {
          invoiceNumber: 'INV002',
          invoiceDate: '2024-01-01',
          dueDate: '2024-02-01',
          invoiceAmount: 20000,
          amountOutstanding: 20000,
          daysOutstanding: 60,
          agingBucket: '31-60',
        },
      ],
    },
    creditPolicy: {
      paymentTerms: 30,
      creditLimit: 0,
    },
    historicalData: {
      averageCollectionPeriod: 35,
      badDebtPercentage: 0.02,
      annualSales: 1000000,
      annualCreditSales: 800000,
    },
    analysis: {
      includeDSO: true,
      includeAgingAnalysis: true,
      includeBadDebtForecast: true,
      includeCollectionRecommendations: true,
      includeCreditPolicyOptimization: true,
    },
  };

  const cloneInput = (): AccountsReceivableAgingInput =>
    JSON.parse(JSON.stringify(baseInput)) as AccountsReceivableAgingInput;

  it('should calculate accounts receivable aging analysis', () => {
    const result = AccountsReceivableAgingAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should calculate DSO when requested', () => {
    const result = AccountsReceivableAgingAnalyzer.analyze(baseInput);
    expect(result.dsoAnalysis).toBeDefined();
    expect(result.dsoAnalysis.daysSalesOutstanding).toBeGreaterThan(0);
  });

  it('should perform aging analysis', () => {
    const result = AccountsReceivableAgingAnalyzer.analyze(baseInput);
    expect(result.agingAnalysis).toBeDefined();
    expect(result.agingAnalysis.agingBuckets).toBeDefined();
  });

  it('should forecast bad debt', () => {
    const result = AccountsReceivableAgingAnalyzer.analyze(baseInput);
    expect(result.badDebtForecast).toBeDefined();
    expect(result.badDebtForecast.estimatedBadDebt).toBeGreaterThanOrEqual(0);
  });

  it('should provide collection recommendations', () => {
    const result = AccountsReceivableAgingAnalyzer.analyze(baseInput);
    expect(result.collectionRecommendations).toBeDefined();
    expect(Array.isArray(result.collectionRecommendations)).toBe(true);
  });

  it('flags DSO significantly above target', () => {
    const input = cloneInput();
    input.historicalData.annualCreditSales = 100000;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.dsoAnalysis?.interpretation).toContain('significantly above target');
  });

  it('flags DSO well below target', () => {
    const input = cloneInput();
    input.historicalData.annualCreditSales = 1825000;
    input.creditPolicy.paymentTerms = 30;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.dsoAnalysis?.interpretation).toContain('excellent collection performance');
  });

  it('handles zero annual credit sales', () => {
    const input = cloneInput();
    input.historicalData.annualCreditSales = 0;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.dsoAnalysis?.dso).toBe(0);
  });

  it('builds aging buckets and collection actions for past-due invoices', () => {
    const input = cloneInput();
    input.receivables.invoices = [
      {
        invoiceNumber: 'INV003',
        invoiceDate: '2024-01-01',
        dueDate: '2024-02-01',
        invoiceAmount: 5000,
        amountOutstanding: 5000,
        daysOutstanding: 15,
        agingBucket: 'current',
      },
      {
        invoiceNumber: 'INV004',
        invoiceDate: '2024-01-01',
        dueDate: '2024-02-01',
        invoiceAmount: 8000,
        amountOutstanding: 8000,
        daysOutstanding: 45,
        agingBucket: '31-60',
      },
      {
        invoiceNumber: 'INV005',
        invoiceDate: '2023-12-01',
        dueDate: '2024-01-01',
        invoiceAmount: 12000,
        amountOutstanding: 12000,
        daysOutstanding: 75,
        agingBucket: '61-90',
      },
      {
        invoiceNumber: 'INV006',
        invoiceDate: '2023-10-01',
        dueDate: '2023-11-01',
        invoiceAmount: 20000,
        amountOutstanding: 20000,
        daysOutstanding: 120,
        agingBucket: 'over-90',
      },
    ];
    input.receivables.totalReceivables = 45000;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.agingAnalysis?.currentAmount).toBe(5000);
    expect(result.agingAnalysis?.overdueAmount).toBe(40000);
    expect(result.collectionRecommendations).toEqual([
      {
        bucket: 'over-90',
        action: 'Immediate collection action required - consider collection agency',
        priority: 1,
      },
      {
        bucket: '61-90',
        action: 'Send final notice and consider payment plan',
        priority: 2,
      },
      {
        bucket: '31-60',
        action: 'Follow up with customer - send reminder',
        priority: 3,
      },
    ]);
  });

  it('returns zero bad debt when aging analysis is disabled', () => {
    const input = cloneInput();
    input.analysis.includeAgingAnalysis = false;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.badDebtForecast?.estimatedBadDebt).toBe(0);
    expect(result.badDebtForecast?.byBucket).toEqual([]);
  });

  it('optimizes credit policy when collection period is high and limit is zero', () => {
    const input = cloneInput();
    input.historicalData.averageCollectionPeriod = 60;
    input.creditPolicy.creditLimit = 0;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.creditPolicyOptimization?.recommendedTerms).toBe(30);
    expect(result.creditPolicyOptimization?.recommendedCreditLimit).toBe(150000);
  });

  it('handles current-only receivables with no collection actions', () => {
    const input = cloneInput();
    input.receivables.invoices = [
      {
        invoiceNumber: 'INV007',
        invoiceDate: '2024-01-10',
        dueDate: '2024-02-10',
        invoiceAmount: 15000,
        amountOutstanding: 15000,
        daysOutstanding: 10,
        agingBucket: 'current',
      },
    ];
    input.receivables.totalReceivables = 15000;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.agingAnalysis?.overdueAmount).toBe(0);
    expect(result.collectionRecommendations).toEqual([]);
  });

  it('uses existing credit policy terms and limit when collection period is healthy', () => {
    const input = cloneInput();
    input.historicalData.averageCollectionPeriod = 40;
    input.creditPolicy.paymentTerms = 45;
    input.creditPolicy.creditLimit = 50000;

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.creditPolicyOptimization?.recommendedTerms).toBe(45);
    expect(result.creditPolicyOptimization?.recommendedCreditLimit).toBe(50000);
  });

  it('skips optional analyses when disabled', () => {
    const input = cloneInput();
    input.analysis = {
      includeDSO: false,
      includeAgingAnalysis: false,
      includeBadDebtForecast: false,
      includeCollectionRecommendations: false,
      includeCreditPolicyOptimization: false,
    };

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.dsoAnalysis).toBeUndefined();
    expect(result.agingAnalysis).toBeUndefined();
    expect(result.badDebtForecast).toBeUndefined();
    expect(result.collectionRecommendations).toBeUndefined();
    expect(result.creditPolicyOptimization).toBeUndefined();
    expect(result.recommendations).toEqual([]);
  });

  it('defaults payment terms and handles zero totals', () => {
    const input = cloneInput();
    input.creditPolicy.paymentTerms = 0;
    input.receivables.totalReceivables = 0;
    input.receivables.invoices = [
      {
        invoiceNumber: 'INV008',
        invoiceDate: '2024-02-01',
        dueDate: '2024-03-01',
        invoiceAmount: 0,
        amountOutstanding: 0,
        daysOutstanding: 0,
        agingBucket: 'current',
      },
    ];

    const result = AccountsReceivableAgingAnalyzer.analyze(input);
    expect(result.dsoAnalysis?.targetDSO).toBe(30);
    const currentBucket = result.agingAnalysis?.agingBuckets.find(
      (bucket: any) => bucket.bucket === 'current'
    );
    expect(currentBucket?.percentage).toBe(0);
  });

  it('falls back to historical bad debt rate for unknown buckets', () => {
    const result = (AccountsReceivableAgingAnalyzer as any).forecastBadDebt(
      {
        buckets: [{ bucket: 'unknown', amount: 1000 }],
      },
      {
        averageCollectionPeriod: 30,
        badDebtPercentage: 0.25,
        annualSales: 100000,
        annualCreditSales: 50000,
      }
    );

    expect(result.byBucket[0].estimatedBadDebt).toBe(250);
  });
});
