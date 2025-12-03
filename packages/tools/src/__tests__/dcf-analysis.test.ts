import { describe, expect, it } from 'vitest';
import { DCFAnalysisTool } from '../tools/dcf-analysis';

describe('DCFAnalysisTool', () => {
  // Valid input matching DCFValuationInputSchema from analysis package
  const validInput = {
    companyData: {
      name: 'Test Company',
      industry: 'Technology',
      size: 'medium' as const,
      country: 'US',
      currency: 'USD',
    },
    historicalFinancials: {
      revenue: [
        { year: 2021, amount: 80000000, growthRate: 0.15 },
        { year: 2022, amount: 92000000, growthRate: 0.15 },
        { year: 2023, amount: 100000000, growthRate: 0.087 },
      ],
      ebitda: [
        { year: 2021, amount: 16000000, margin: 0.2 },
        { year: 2022, amount: 18400000, margin: 0.2 },
        { year: 2023, amount: 20000000, margin: 0.2 },
      ],
      ebit: [
        { year: 2021, amount: 12000000, margin: 0.15 },
        { year: 2022, amount: 13800000, margin: 0.15 },
        { year: 2023, amount: 15000000, margin: 0.15 },
      ],
      netIncome: [
        { year: 2021, amount: 9000000, margin: 0.1125 },
        { year: 2022, amount: 10350000, margin: 0.1125 },
        { year: 2023, amount: 11250000, margin: 0.1125 },
      ],
      capex: [
        { year: 2021, amount: 4000000, asPercentOfRevenue: 0.05 },
        { year: 2022, amount: 4600000, asPercentOfRevenue: 0.05 },
        { year: 2023, amount: 5000000, asPercentOfRevenue: 0.05 },
      ],
      workingCapital: [
        { year: 2021, amount: 8000000, asPercentOfRevenue: 0.1 },
        { year: 2022, amount: 9200000, asPercentOfRevenue: 0.1 },
        { year: 2023, amount: 10000000, asPercentOfRevenue: 0.1 },
      ],
      depreciation: [
        { year: 2021, amount: 4000000 },
        { year: 2022, amount: 4600000 },
        { year: 2023, amount: 5000000 },
      ],
      taxRate: [
        { year: 2021, rate: 0.25 },
        { year: 2022, rate: 0.25 },
        { year: 2023, rate: 0.25 },
      ],
    },
    forecastAssumptions: {
      forecastPeriod: 5,
      revenueGrowth: {
        year1: 0.1,
        year2: 0.08,
        year3: 0.06,
        year4: 0.05,
        year5: 0.04,
        terminalGrowth: 0.025,
      },
      ebitdaMargin: {
        year1: 0.2,
        year2: 0.21,
        year3: 0.22,
        year4: 0.22,
        year5: 0.22,
        terminalMargin: 0.22,
      },
      capexAsPercentOfRevenue: {
        year1: 0.05,
        year2: 0.05,
        year3: 0.04,
        year4: 0.04,
        year5: 0.04,
        terminalPercent: 0.04,
      },
      workingCapitalAsPercentOfRevenue: {
        year1: 0.1,
        year2: 0.1,
        year3: 0.1,
        year4: 0.1,
        year5: 0.1,
        terminalPercent: 0.1,
      },
      depreciationAsPercentOfRevenue: {
        year1: 0.05,
        year2: 0.05,
        year3: 0.04,
        year4: 0.04,
        year5: 0.04,
        terminalPercent: 0.04,
      },
      taxRate: 0.25,
    },
    waccInput: {
      riskFreeRate: 0.03,
      marketRiskPremium: 0.06,
      beta: 1.2,
      costOfDebt: 0.05,
      debtToEquityRatio: 0.3,
      taxRate: 0.25,
    },
    terminalValue: {
      method: 'gordon-growth' as const,
      terminalGrowthRate: 0.025,
    },
    analysis: {
      includeSensitivity: true,
      includeScenarios: true,
      includeMonteCarlo: false,
    },
  };

  describe('metadata', () => {
    it('has correct tool name', () => {
      expect(DCFAnalysisTool.toolName).toBe('analyze_dcf_valuation');
    });

    it('has a description', () => {
      expect(DCFAnalysisTool.description).toBeTruthy();
    });

    it('has required input schema fields', () => {
      const schema = DCFAnalysisTool.inputSchema;
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('companyData');
      expect(schema.required).toContain('historicalFinancials');
      expect(schema.required).toContain('forecastAssumptions');
      expect(schema.required).toContain('waccInput');
    });
  });

  describe('execute', () => {
    it('performs DCF valuation analysis with valid input', async () => {
      const result = await DCFAnalysisTool.execute(validInput);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('valuation');
    });

    it('returns valuation data', async () => {
      const result = await DCFAnalysisTool.execute(validInput);
      expect(result).toBeDefined();
      const typedResult = result as { valuation?: unknown; wacc?: unknown };
      expect(typedResult.valuation).toBeDefined();
      expect(typedResult.wacc).toBeDefined();
    });

    it('throws error for invalid input', async () => {
      const invalidInput = {
        companyData: {
          name: 'Test',
          // Missing required fields
        },
      };

      await expect(DCFAnalysisTool.execute(invalidInput)).rejects.toThrow();
    });

    it('throws error for empty input', async () => {
      await expect(DCFAnalysisTool.execute({})).rejects.toThrow();
    });
  });
});
