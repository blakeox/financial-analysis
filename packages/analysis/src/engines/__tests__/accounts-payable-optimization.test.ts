/**
 * Accounts Payable Optimization Tests
 */

import { describe, expect, it } from 'vitest';
import type { AccountsPayableOptimizationInput } from '../../schemas/accounts-payable-optimization.js';
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
    cashFlow: {
      currentCash: 200000,
      monthlyCashFlow: 50000,
      costOfCapital: 0.1,
    },
    strategy: {
      optimizeFor: 'balanced',
      includeEarlyPaymentAnalysis: true,
    },
    analysis: {
      includeDiscountAnalysis: true,
      includeCashFlowImpact: true,
      includePaymentSchedule: true,
      includeVendorAnalysis: true,
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
    expect(result.discountAnalysis.totalPotentialSavings).toBeGreaterThanOrEqual(0);
  });

  it('should calculate cash flow impact', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.cashFlowImpact).toBeDefined();
  });

  it('should provide payment schedule', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.paymentSchedule).toBeDefined();
    expect(Array.isArray(result.paymentSchedule)).toBe(true);
  });

  it('should analyze vendors', () => {
    const result = AccountsPayableOptimizer.analyze(baseInput);
    expect(result.vendorAnalysis).toBeDefined();
  });

  it('should recommend early payment discounts for standard vendors', () => {
    const result = AccountsPayableOptimizer.analyze({
      ...baseInput,
      payables: {
        ...baseInput.payables,
        invoices: [
          ...baseInput.payables.invoices,
          {
            invoiceNumber: 'INV003',
            vendorName: undefined,
            invoiceDate: '2024-01-20',
            dueDate: '2024-02-20',
            invoiceAmount: 5000,
            paymentTerms: 'Net 30',
            earlyPaymentDiscount: {
              discountPercentage: 0.02,
              discountDays: 10,
            },
          },
        ],
      },
      vendorRelationships: {
        criticalVendors: ['Vendor A'],
        vendorPaymentHistory: [],
      },
      strategy: {
        ...baseInput.strategy,
        optimizeFor: 'max-discounts',
      },
      analysis: {
        ...baseInput.analysis,
        includeVendorAnalysis: true,
      },
    } as AccountsPayableOptimizationInput);

    expect(result.vendorAnalysis).toBeDefined();
    const vendorAnalysis = result.vendorAnalysis as any;
    expect(vendorAnalysis.standardVendorPayments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          vendor: 'Unknown',
          recommendedAction: 'Take early payment discount',
        }),
      ])
    );
    expect(result.recommendations).toEqual(
      expect.arrayContaining(['Focus on maximizing early payment discounts'])
    );
  });

  it('should include cash flow focus recommendation', () => {
    const result = AccountsPayableOptimizer.analyze({
      ...baseInput,
      strategy: {
        ...baseInput.strategy,
        optimizeFor: 'max-cash-flow',
      },
    } as AccountsPayableOptimizationInput);

    expect(result.recommendations).toEqual(
      expect.arrayContaining(['Focus on maximizing cash flow by extending payment terms'])
    );
  });

  it('should keep default discount recommendation when rate is below cost of capital', () => {
    const result = AccountsPayableOptimizer.analyze({
      ...baseInput,
      paymentTerms: {
        standardTerms: 30,
        earlyPaymentDiscounts: [
          {
            vendor: 'Vendor A',
            discountPercentage: 0.01,
            discountDays: 10,
            annualInvoiceVolume: 10000,
          },
        ],
      },
      cashFlow: {
        currentCash: 200000,
        monthlyCashFlow: 50000,
        costOfCapital: 0.2,
      },
    } as AccountsPayableOptimizationInput);

    expect(result.discountAnalysis).toBeDefined();
    expect(result.discountAnalysis.discounts[0].recommendation).toBe(
      'Take discount if cash available'
    );
    expect(result.cashFlowImpact.optimizedPaymentDays).toBe(
      result.cashFlowImpact.currentPaymentDays
    );
  });

  it('should skip optional analyses when disabled', () => {
    const result = AccountsPayableOptimizer.analyze({
      ...baseInput,
      analysis: {
        includeDiscountAnalysis: false,
        includeCashFlowImpact: false,
        includePaymentSchedule: false,
        includeVendorAnalysis: false,
        projectionMonths: 3,
      },
    } as AccountsPayableOptimizationInput);

    expect(result.discountAnalysis).toBeUndefined();
    expect(result.cashFlowImpact).toBeUndefined();
    expect(result.paymentSchedule).toEqual([]);
    expect(result.vendorAnalysis).toBeUndefined();
  });
});
