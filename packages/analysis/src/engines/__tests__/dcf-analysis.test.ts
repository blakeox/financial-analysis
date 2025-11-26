/**
 * DCF Valuation Engine Test Suite
 * Comprehensive tests for DCF valuation functionality
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { DCFValuationEngine, DCFValuationInput } from '../dcf-analysis';

describe('DCFValuationEngine', () => {
  let sampleInput: DCFValuationInput;

  beforeEach(() => {
    sampleInput = {
      companyData: {
        name: 'Test Company Inc.',
        industry: 'Technology',
        size: 'large',
        country: 'US',
        currency: 'USD',
      },
      historicalFinancials: {
        revenue: [
          { year: 2020, amount: 1000000000, growthRate: 0.1 },
          { year: 2021, amount: 1100000000, growthRate: 0.1 },
          { year: 2022, amount: 1210000000, growthRate: 0.1 },
        ],
        ebitda: [
          { year: 2020, amount: 200000000, margin: 0.2 },
          { year: 2021, amount: 220000000, margin: 0.2 },
          { year: 2022, amount: 242000000, margin: 0.2 },
        ],
        ebit: [
          { year: 2020, amount: 150000000, margin: 0.15 },
          { year: 2021, amount: 165000000, margin: 0.15 },
          { year: 2022, amount: 181500000, margin: 0.15 },
        ],
        netIncome: [
          { year: 2020, amount: 120000000, margin: 0.12 },
          { year: 2021, amount: 132000000, margin: 0.12 },
          { year: 2022, amount: 145200000, margin: 0.12 },
        ],
        capex: [
          { year: 2020, amount: 50000000, asPercentOfRevenue: 0.05 },
          { year: 2021, amount: 55000000, asPercentOfRevenue: 0.05 },
          { year: 2022, amount: 60500000, asPercentOfRevenue: 0.05 },
        ],
        workingCapital: [
          { year: 2020, amount: 100000000, asPercentOfRevenue: 0.1 },
          { year: 2021, amount: 110000000, asPercentOfRevenue: 0.1 },
          { year: 2022, amount: 121000000, asPercentOfRevenue: 0.1 },
        ],
        depreciation: [
          { year: 2020, amount: 50000000 },
          { year: 2021, amount: 55000000 },
          { year: 2022, amount: 60500000 },
        ],
        taxRate: [
          { year: 2020, rate: 0.25 },
          { year: 2021, rate: 0.25 },
          { year: 2022, rate: 0.25 },
        ],
      },
      forecastAssumptions: {
        forecastPeriod: 5,
        revenueGrowth: {
          year1: 0.08,
          year2: 0.07,
          year3: 0.06,
          year4: 0.05,
          year5: 0.04,
          terminalGrowth: 0.025,
        },
        ebitdaMargin: {
          year1: 0.22,
          year2: 0.23,
          year3: 0.24,
          year4: 0.25,
          year5: 0.25,
          terminalMargin: 0.25,
        },
        capexAsPercentOfRevenue: {
          year1: 0.05,
          year2: 0.05,
          year3: 0.05,
          year4: 0.05,
          year5: 0.05,
          terminalPercent: 0.05,
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
          year3: 0.05,
          year4: 0.05,
          year5: 0.05,
          terminalPercent: 0.05,
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
        method: 'gordon-growth',
        terminalGrowthRate: 0.025,
      },
      analysis: {
        discountRate: 0.1,
        taxRate: 0.25,
        terminalGrowthRate: 0.025,
        includeAccretionDilution: true,
        includeSensitivity: true,
        includeScenarios: true,
        forecastPeriod: 5,
      },
    };
  });

  describe('Basic DCF Analysis', () => {
    it('should calculate WACC correctly', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.wacc).toBeDefined();
      expect(result.wacc.costOfEquity).toBeCloseTo(0.102, 2); // 3% + 1.2 * 6%
      expect(result.wacc.afterTaxCostOfDebt).toBeCloseTo(0.0375, 3); // 5% * (1 - 0.25)
      expect(result.wacc.wacc).toBeCloseTo(0.087, 2); // Weighted average (within 1%)
      expect(result.wacc.equityWeight).toBeCloseTo(0.769, 2); // 1 / (1 + 0.3)
      expect(result.wacc.debtWeight).toBeCloseTo(0.231, 2); // 0.3 / (1 + 0.3)
    });

    it('should generate cash flow projections', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.cashFlowProjections).toBeDefined();
      expect(result.cashFlowProjections).toHaveLength(5);

      // Check first year projection
      const firstYear = result.cashFlowProjections[0];
      expect(firstYear.year).toBe(new Date().getFullYear() + 1);
      expect(firstYear.revenue).toBeGreaterThan(0);
      expect(firstYear.ebitda).toBeGreaterThan(0);
      expect(firstYear.freeCashFlow).toBeDefined();
      expect(firstYear.presentValue).toBeGreaterThan(0);
    });

    it('should calculate terminal value', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.terminalValue).toBeDefined();
      expect(result.terminalValue.method).toBe('Gordon Growth Model');
      expect(result.terminalValue.terminalValue).toBeGreaterThan(0);
      expect(result.terminalValue.presentValueOfTerminalValue).toBeGreaterThan(0);
    });

    it('should calculate enterprise value', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.valuation).toBeDefined();
      expect(result.valuation.enterpriseValue).toBeGreaterThan(0);
      expect(result.valuation.equityValue).toBeGreaterThan(0);
      expect(result.valuation.valuePerShare).toBeGreaterThan(0);
    });
  });

  describe('Sensitivity Analysis', () => {
    it('should perform sensitivity analysis when requested', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.sensitivity).toBeDefined();
      expect(result.sensitivity?.revenueGrowth).toBeDefined();
      expect(result.sensitivity?.wacc).toBeDefined();

      // Check revenue growth sensitivity
      const revenueSensitivity = result.sensitivity?.revenueGrowth;
      expect(revenueSensitivity).toHaveLength(9); // -10% to +30% in 5% increments
      expect(revenueSensitivity?.[0].rate).toBeCloseTo(-0.1, 2);
      expect(revenueSensitivity?.[8].rate).toBeCloseTo(0.3, 2);
    });

    it('should show valuation sensitivity to WACC changes', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      const waccSensitivity = result.sensitivity?.wacc;
      expect(waccSensitivity).toBeDefined();
      expect(waccSensitivity?.length).toBeGreaterThan(0);

      // Higher WACC should result in lower valuation
      if (waccSensitivity && waccSensitivity.length > 1) {
        const firstValue = waccSensitivity[0].valuation;
        const lastValue = waccSensitivity[waccSensitivity.length - 1].valuation;
        expect(firstValue).toBeGreaterThan(lastValue);
      }
    });
  });

  describe('Scenario Analysis', () => {
    it('should perform scenario analysis when requested', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.scenarios).toBeDefined();
      expect(result.scenarios?.baseCase).toBeGreaterThan(0);
      expect(result.scenarios?.bullCase).toBeGreaterThan(0);
      expect(result.scenarios?.bearCase).toBeGreaterThan(0);
      expect(result.scenarios?.probabilityWeighted).toBeGreaterThan(0);

      // Bull case should be higher than base case
      expect(result.scenarios?.bullCase).toBeGreaterThan(result.scenarios?.baseCase || 0);

      // Bear case should be lower than base case
      expect(result.scenarios?.bearCase).toBeLessThan(result.scenarios?.baseCase || 0);
    });
  });

  describe('Monte Carlo Analysis', () => {
    it('should perform Monte Carlo analysis when requested', () => {
      const inputWithMonteCarlo = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 1000,
        },
      };

      const result = DCFValuationEngine.analyze(inputWithMonteCarlo);

      expect(result.monteCarlo).toBeDefined();
      expect(result.monteCarlo?.meanValuation).toBeGreaterThan(0);
      expect(result.monteCarlo?.medianValuation).toBeGreaterThan(0);
      expect(result.monteCarlo?.standardDeviation).toBeGreaterThan(0);
      expect(result.monteCarlo?.confidenceIntervals).toBeDefined();
      expect(result.monteCarlo?.probabilityOfUpside).toBeGreaterThanOrEqual(0);
      expect(result.monteCarlo?.probabilityOfUpside).toBeLessThanOrEqual(1);
    });
  });

  describe('Key Metrics', () => {
    it('should calculate key financial metrics', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.keyMetrics).toBeDefined();
      expect(result.keyMetrics.revenueCAGR).toBeGreaterThan(0);
      expect(result.keyMetrics.ebitdaCAGR).toBeGreaterThan(0);
      expect(result.keyMetrics.averageEbitdaMargin).toBeGreaterThan(0);
      expect(result.keyMetrics.averageEbitdaMargin).toBeLessThan(1);
    });
  });

  describe('Insights and Recommendations', () => {
    it('should generate insights', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should generate warnings', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should generate recommendations', () => {
      const result = DCFValuationEngine.analyze(sampleInput);

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);

      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation.category).toBeDefined();
        expect(recommendation.priority).toMatch(/^(high|medium|low)$/);
        expect(recommendation.description).toBeDefined();
        expect(recommendation.impact).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', () => {
      const invalidInput = {
        ...sampleInput,
        waccInput: {
          ...sampleInput.waccInput,
          beta: -1, // Invalid negative beta
        },
      };

      expect(() => DCFValuationEngine.analyze(invalidInput)).toThrow();
    });

    it('should handle missing historical data', () => {
      const inputWithoutHistory = {
        ...sampleInput,
        historicalFinancials: {
          ...sampleInput.historicalFinancials,
          revenue: [], // Empty revenue array
        },
      };

      expect(() => DCFValuationEngine.analyze(inputWithoutHistory)).toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete analysis within reasonable time', () => {
      const startTime = Date.now();
      DCFValuationEngine.analyze(sampleInput);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle Monte Carlo simulation efficiently', () => {
      const inputWithMonteCarlo = {
        ...sampleInput,
        analysis: {
          ...sampleInput.analysis,
          includeMonteCarlo: true,
          monteCarloSimulations: 1000,
        },
      };

      const startTime = Date.now();
      const result = DCFValuationEngine.analyze(inputWithMonteCarlo);
      const endTime = Date.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.monteCarlo).toBeDefined();
    });
  });
});
