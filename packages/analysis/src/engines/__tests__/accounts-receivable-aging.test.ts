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
});
