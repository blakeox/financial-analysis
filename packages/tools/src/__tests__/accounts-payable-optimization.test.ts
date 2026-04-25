import { describe, expect, it } from 'vitest';
import { AccountsPayableOptimizationTool } from '../tools/accounts-payable-optimization';

describe('AccountsPayableOptimizationTool', () => {
  const validInput = {
    payables: {
      totalPayables: 10000,
      invoices: [
        {
          invoiceNumber: 'INV-001',
          vendorName: 'Vendor A',
          invoiceDate: '2025-01-01',
          dueDate: '2025-01-31',
          invoiceAmount: 10000,
          paymentTerms: 'Net 30',
          earlyPaymentDiscount: {
            discountPercentage: 0.02,
            discountDays: 10,
          },
        },
      ],
    },
    cashFlow: {
      currentCash: 50000,
      monthlyCashFlow: 10000,
      costOfCapital: 0.1,
    },
    strategy: {
      optimizeFor: 'max-discounts',
      includeEarlyPaymentAnalysis: true,
    },
    analysis: {
      includeDiscountAnalysis: true,
      includeCashFlowImpact: true,
      includePaymentSchedule: true,
      includeVendorAnalysis: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(AccountsPayableOptimizationTool.toolName).toBe('analyze_accounts_payable_optimization');
    expect(AccountsPayableOptimizationTool.inputSchema.required).toEqual(['payables', 'cashFlow']);
  });

  it('calculates discount savings and cash flow impact', async () => {
    const result = (await AccountsPayableOptimizationTool.execute(validInput)) as {
      summary: {
        totalPayables: number;
        potentialDiscountSavings: number;
        cashFlowImpact: number;
        optimalPaymentDays: number;
      };
    };

    expect(result.summary.totalPayables).toBeCloseTo(10000, 6);
    expect(result.summary.potentialDiscountSavings).toBeCloseTo(1742.47, 2);
    expect(result.summary.cashFlowImpact).toBeCloseTo(2290.41, 2);
    expect(result.summary.optimalPaymentDays).toBeCloseTo(0, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      AccountsPayableOptimizationTool.execute({
        ...validInput,
        cashFlow: {
          ...validInput.cashFlow,
          costOfCapital: 0.8,
        },
      })
    ).rejects.toThrow();
  });
});
