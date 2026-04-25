import { describe, expect, it } from 'vitest';
import { AccountsReceivableAgingTool } from '../tools/accounts-receivable-aging';

describe('AccountsReceivableAgingTool', () => {
  const validInput = {
    receivables: {
      totalReceivables: 10000,
      invoices: [
        {
          invoiceNumber: 'AR-001',
          invoiceDate: '2025-01-01',
          dueDate: '2025-01-31',
          invoiceAmount: 6000,
          amountOutstanding: 6000,
          daysOutstanding: 15,
          agingBucket: 'current',
        },
        {
          invoiceNumber: 'AR-002',
          invoiceDate: '2024-09-01',
          dueDate: '2024-09-30',
          invoiceAmount: 4000,
          amountOutstanding: 4000,
          daysOutstanding: 120,
          agingBucket: 'over-90',
        },
      ],
    },
    creditPolicy: {
      paymentTerms: 30,
      creditLimit: 20000,
    },
    historicalData: {
      averageCollectionPeriod: 35,
      badDebtPercentage: 0.02,
      annualSales: 150000,
      annualCreditSales: 120000,
    },
    analysis: {
      includeDSO: true,
      includeAgingAnalysis: true,
      includeBadDebtForecast: true,
      includeCollectionRecommendations: true,
      includeCreditPolicyOptimization: true,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(AccountsReceivableAgingTool.toolName).toBe('analyze_accounts_receivable_aging');
    expect(AccountsReceivableAgingTool.inputSchema.required).toEqual(['receivables']);
  });

  it('calculates dso, overdue receivables, and bad debt', async () => {
    const result = (await AccountsReceivableAgingTool.execute(validInput)) as {
      summary: {
        totalReceivables: number;
        daysSalesOutstanding: number;
        overdueAmount: number;
        estimatedBadDebt: number;
      };
    };

    expect(result.summary.totalReceivables).toBeCloseTo(10000, 6);
    expect(result.summary.daysSalesOutstanding).toBeCloseTo(30.42, 2);
    expect(result.summary.overdueAmount).toBeCloseTo(4000, 6);
    expect(result.summary.estimatedBadDebt).toBeCloseTo(2060, 6);
  });

  it('rejects invalid input', async () => {
    await expect(
      AccountsReceivableAgingTool.execute({
        ...validInput,
        receivables: {
          ...validInput.receivables,
          invoices: [
            {
              ...validInput.receivables.invoices[0],
              agingBucket: 'invalid-bucket',
            },
          ],
        },
      })
    ).rejects.toThrow();
  });
});
