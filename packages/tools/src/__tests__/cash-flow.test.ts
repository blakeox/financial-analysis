import { describe, expect, it } from 'vitest';
import { CashFlowAnalysisTool } from '../tools/cash-flow';

describe('CashFlowAnalysisTool', () => {
  // Input matching CashFlowAnalysisInputSchema from analysis package
  const validInput = {
    companyName: 'Test Company',
    analysisStartDate: '2024-01-01',
    analysisPeriodMonths: 12,
    cashFlowItems: [
      {
        id: 'rev-1',
        description: 'Monthly Revenue',
        amount: 50000,
        type: 'operating' as const,
        category: 'revenue' as const,
        frequency: 'monthly' as const,
        startMonth: 1,
        growthRate: 0.02,
        isRecurring: true,
      },
      {
        id: 'exp-1',
        description: 'Operating Expenses',
        amount: -30000,
        type: 'operating' as const,
        category: 'operating-expenses' as const,
        frequency: 'monthly' as const,
        startMonth: 1,
        growthRate: 0.01,
        isRecurring: true,
      },
    ],
    openingCashBalance: 100000,
    minimumCashBalance: 25000,
    method: 'direct' as const,
    discountRate: 0.10,
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(CashFlowAnalysisTool.toolName).toBe('analyze_cash_flow');
    });

    it('has a description', () => {
      expect(CashFlowAnalysisTool.description).toBeTruthy();
      expect(CashFlowAnalysisTool.description.length).toBeGreaterThan(100);
    });

    it('has required input schema fields', () => {
      const schema = CashFlowAnalysisTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('analysisPeriodMonths');
    });

    it('supports direct and indirect analysis methods', () => {
      const methods = CashFlowAnalysisTool.inputSchema.properties.analysisMethod.enum;
      expect(methods).toContain('direct');
      expect(methods).toContain('indirect');
    });
  });

  describe('execute', () => {
    it('performs cash flow analysis with valid input', async () => {
      const resultStr = await CashFlowAnalysisTool.execute(validInput);
      const result = JSON.parse(resultStr);

      expect(result.error).toBeUndefined();
      expect(result.monthlyCashFlows).toBeDefined();
      expect(result.monthlyCashFlows.length).toBe(12);
    });

    it('returns monthly projections', async () => {
      const resultStr = await CashFlowAnalysisTool.execute(validInput);
      const result = JSON.parse(resultStr);

      expect(result.monthlyCashFlows[0]).toHaveProperty('month');
      expect(result.monthlyCashFlows[0]).toHaveProperty('netCashFlow');
      expect(result.monthlyCashFlows[0]).toHaveProperty('closingBalance');
    });

    it('calculates metrics', async () => {
      const resultStr = await CashFlowAnalysisTool.execute(validInput);
      const result = JSON.parse(resultStr);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.freeCashFlow).toBeDefined();
      expect(result.metrics.npv).toBeDefined();
    });

    it('includes liquidity analysis', async () => {
      const resultStr = await CashFlowAnalysisTool.execute(validInput);
      const result = JSON.parse(resultStr);

      expect(result.liquidityAnalysis).toBeDefined();
      expect(result.liquidityAnalysis.currentLiquidity).toBeDefined();
    });

    it('returns error for invalid input', async () => {
      const invalidInput = {
        analysisPeriodMonths: 12,
        // Missing required cashFlowItems
      };

      const resultStr = await CashFlowAnalysisTool.execute(invalidInput);
      const result = JSON.parse(resultStr);

      expect(result.error).toBeDefined();
    });
  });
});
