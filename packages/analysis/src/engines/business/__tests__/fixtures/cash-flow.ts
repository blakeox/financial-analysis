import type { CashFlowAnalysisInput } from '../../../../schemas/cash-flow.js';
import { CashFlowAnalysisInputSchema } from '../../../../schemas/cash-flow.js';

const BASE_INPUT: CashFlowAnalysisInput = CashFlowAnalysisInputSchema.parse({
  analysisStartDate: '2024-01-01',
  analysisPeriodMonths: 12,
  method: 'direct',
  openingCashBalance: 100000,
  minimumCashBalance: 20000,
  discountRate: 0.08,
  cashFlowItems: [
    {
      description: 'Monthly Revenue',
      type: 'operating',
      category: 'revenue',
      amount: 50000,
      isRecurring: true,
      frequency: 'monthly',
      growthRate: 0.02,
    },
    {
      description: 'Payroll Expenses',
      type: 'operating',
      category: 'operating-expenses',
      amount: -25000,
      isRecurring: true,
      frequency: 'monthly',
      growthRate: 0.01,
    },
    {
      description: 'Rent',
      type: 'operating',
      category: 'operating-expenses',
      amount: -5000,
      isRecurring: true,
      frequency: 'monthly',
      growthRate: 0,
    },
    {
      description: 'Equipment Purchase',
      type: 'investing',
      category: 'capital-expenditure',
      amount: -20000,
      isRecurring: false,
      frequency: 'one-time',
      growthRate: 0,
      date: '2024-03-01',
    },
  ],
});

export const createBasicCashFlowInput = (
  overrides: Partial<CashFlowAnalysisInput> = {}
): CashFlowAnalysisInput =>
  CashFlowAnalysisInputSchema.parse({
    ...BASE_INPUT,
    ...overrides,
    cashFlowItems: overrides.cashFlowItems ?? BASE_INPUT.cashFlowItems,
  });
