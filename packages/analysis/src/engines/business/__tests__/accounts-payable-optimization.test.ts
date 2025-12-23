/**
 * Accounts Payable Optimization Tests
 */

import { describe, expect, it } from 'vitest';
import type { AccountsPayableOptimizationInput } from '../../../schemas/accounts-payable-optimization.js';
import { AccountsPayableOptimizer } from '../accounts-payable-optimization.js';

describe('AccountsPayableOptimizer', () => {
  const baseInput: AccountsPayableOptimizationInput = {
    payables: {
      totalPayables: 100000,
      invoices: [
        {
          invoiceNumber: 'INV001',
          vendorName: 'Vendor A',
          invoiceDate: '2024-01-01',
          dueDate: '2024-02-01',
          invoiceAmount: 10000,
          paymentTerms: 'Net 30',
          earlyPaymentDiscount: {
            discountPercentage: 0.02,
            discountDays: 10,
          },
        },
        {
          invoiceNumber: 'INV002',
          vendorName: 'Vendor B',
          invoiceDate: '2024-01-15',
          dueDate: '2024-02-15',
          invoiceAmount: 20000,
          paymentTerms: 'Net 30',
          earlyPaymentDiscount: {
            discountPercentage: 0,
            discountDays: 0,
          },
        },
      ],
    },
    paymentTerms: {
      standardTerms: 'Net 30',
      earlyPaymentDiscounts: [
        {
          vendor: 'Vendor A',
          discountPercentage: 0.02,
          discountDays: 10,
          annualInvoiceVolume: 120000,
        },
      ],
    },
    cashFlow: {
      currentCash: 200000,
      monthlyCashFlow: 50000,
      costOfCapital: 0.1,
    },
    vendorRelationships: {
      criticalVendors: ['Vendor A'],
      vendorPaymentHistory: [
        {
          vendor: 'Vendor A',
          averagePaymentDays: 28,
          relationshipScore: 8,
        },
      ],
    },
    strategy: {
      optimizeFor: 'balanced',
      includeEarlyPaymentAnalysis: true,
    },
    analysis: {
      includeDiscountAnalysis: true,
      includeCashFlowImpact: true,
      includePaymentSchedule: true,
      includeVendorOptimization: true,
    },
  };

  it('should calculate accounts payable optimization', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should analyze early payment discounts', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.discountAnalysis).toBeDefined();
    expect(result.discountAnalysis.totalSavings).toBeGreaterThanOrEqual(0);
  });

  it('should calculate cash flow impact', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.cashFlowImpact).toBeDefined();
  });

  it('should provide payment schedule', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.paymentSchedule).toBeDefined();
    expect(Array.isArray(result.paymentSchedule.schedule)).toBe(true);
  });

  it('should analyze vendors', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.vendorOptimization).toBeDefined();
  });

  it('should perform comprehensive analysis', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.discountAnalysis).toBeDefined();
    expect(result.cashFlowImpact).toBeDefined();
    expect(result.paymentSchedule).toBeDefined();
    expect(result.vendorOptimization).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });
});

