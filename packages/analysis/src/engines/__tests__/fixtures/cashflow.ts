import { CashFlowInputSchema, type CashFlowInput } from '../../cashflow';

/**
 * Provides a reusable baseline input for DCF cash flow tests.
 * The overrides type is intentionally loose to keep the tests ergonomic.
 */
export const createBasicCashflowInput = (overrides: Record<string, unknown> = {}): CashFlowInput => {
  return CashFlowInputSchema.parse({
    cashFlows: [
      { period: 0, cashFlow: -100000, description: 'Initial Investment', category: 'capital-expenditure' },
      { period: 1, cashFlow: 30000, description: 'Year 1 Cash Flow', category: 'revenue' },
      { period: 2, cashFlow: 35000, description: 'Year 2 Cash Flow', category: 'revenue' },
      { period: 3, cashFlow: 40000, description: 'Year 3 Cash Flow', category: 'revenue' },
      { period: 4, cashFlow: 45000, description: 'Year 4 Cash Flow', category: 'revenue' },
    ],
    discounting: {
      discountRate: 0.1,
      riskFreeRate: 0.03,
      marketRiskPremium: 0.08,
      terminalGrowthRate: 0.03,
      taxRate: 0.25,
    },
    analysis: {
      includeTerminalValue: false,
      includeSensitivity: true,
      includeScenarios: true,
    },
    ...(overrides as Partial<CashFlowInput>),
  });
};
