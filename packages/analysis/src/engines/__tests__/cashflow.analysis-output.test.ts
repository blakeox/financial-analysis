import { describe, it, expect } from 'vitest';
import { CashFlowAnalyzer } from '../cashflow';
import { createBasicCashflowInput } from './fixtures/cashflow';

/**
 * Covers cash flow summaries, detailed schedules, terminal value, sensitivity, and scenario analyses.
 */
describe('CashFlowAnalyzer - Analysis Outputs', () => {
  describe('Cash Flow Summary', () => {
    it('calculates total inflows correctly', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      const expectedInflows = 30000 + 35000 + 40000 + 45000;
      expect(result.cashFlowSummary.totalInflows).toBeCloseTo(expectedInflows, 0);
    });

    it('calculates total outflows correctly', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      expect(result.cashFlowSummary.totalOutflows).toBeCloseTo(100000, 0);
    });

    it('calculates net cash flow correctly', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      const expectedNet = result.cashFlowSummary.totalInflows - result.cashFlowSummary.totalOutflows;
      expect(result.cashFlowSummary.netCashFlow).toBeCloseTo(expectedNet, 0);
    });

    it('tracks peak cumulative cash flow', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      expect(result.cashFlowSummary.peakCumulativeCashFlow).toBeDefined();
    });

    it('tracks worst cumulative cash flow', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      // Worst should be negative (initial investment)
      expect(result.cashFlowSummary.worstCumulativeCashFlow).toBeLessThan(0);
    });
  });

  describe('Detailed Cash Flows', () => {
    it('generates detailed breakdown for each period', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      expect(result.detailedCashFlows).toBeDefined();
      expect(result.detailedCashFlows.length).toBe(input.cashFlows.length);
    });

    it('calculates discount factors correctly', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      // Period 0 should have discount factor of 1
      const period0 = result.detailedCashFlows.find(cf => cf.period === 0);
      expect(period0?.discountFactor).toBeCloseTo(1, 4);

      // Period 1 should have discount factor of 1/(1+r)
      const period1 = result.detailedCashFlows.find(cf => cf.period === 1);
      expect(period1?.discountFactor).toBeCloseTo(1 / 1.1, 4);
    });

    it('calculates present values correctly', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      result.detailedCashFlows.forEach(cf => {
        const expectedPV = cf.originalCashFlow * cf.discountFactor;
        expect(cf.presentValue).toBeCloseTo(expectedPV, 1);
      });
    });

    it('tracks cumulative present value', () => {
      const input = createBasicCashflowInput();
      const result = CashFlowAnalyzer.analyze(input);

      // Cumulative PV should match sum of individual PVs
      let runningSum = 0;
      result.detailedCashFlows.forEach(cf => {
        runningSum += cf.presentValue;
        expect(cf.cumulativePV).toBeCloseTo(runningSum, 1);
      });
    });
  });

  describe('Terminal Value Analysis', () => {
    it('calculates terminal value with perpetual growth method', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -100000, category: 'capital-expenditure' },
          { period: 1, cashFlow: 20000, category: 'revenue' },
          { period: 2, cashFlow: 22000, category: 'revenue' },
          { period: 3, cashFlow: 24000, category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: true,
          terminalValueMethod: 'perpetual-growth',
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.terminalValue).toBeDefined();
      expect(result.terminalValue.method).toBe('perpetual-growth');
      expect(result.terminalValue.growthRate).toBe(0.03);
    });

    it('calculates terminal value with exit multiple method', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -100000, category: 'capital-expenditure' },
          { period: 1, cashFlow: 20000, category: 'revenue' },
          { period: 2, cashFlow: 25000, category: 'revenue' },
          { period: 3, cashFlow: 30000, category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: true,
          terminalValueMethod: 'exit-multiple',
          exitMultiple: 5,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.terminalValue.method).toBe('exit-multiple');
      expect(result.terminalValue.multiple).toBe(5);
    });

    it('terminal value increases total NPV', () => {
      const withoutTV = createBasicCashflowInput({
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const withTV = createBasicCashflowInput({
        analysis: {
          includeTerminalValue: true,
          terminalValueMethod: 'perpetual-growth',
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const withoutResult = CashFlowAnalyzer.analyze(withoutTV);
      const withResult = CashFlowAnalyzer.analyze(withTV);

      // Terminal value should add to NPV (when there's positive operating cash flow)
      expect(withResult.npv).toBeGreaterThanOrEqual(withoutResult.npv);
    });

    it('explicit terminal value method does not add extra cash flow', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -100000, category: 'capital-expenditure' },
          { period: 1, cashFlow: 30000, category: 'revenue' },
          { period: 2, cashFlow: 35000, category: 'revenue' },
          { period: 3, cashFlow: 150000, category: 'terminal-value' },
        ],
        analysis: {
          includeTerminalValue: true,
          terminalValueMethod: 'explicit',
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.terminalValue.method).toBe('explicit');
    });
  });

  describe('Sensitivity Analysis', () => {
    it('performs sensitivity analysis when enabled', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeSensitivity: true,
          sensitivityParameters: ['discountRate', 'terminalGrowthRate', 'cashFlows'],
          includeTerminalValue: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.sensitivity).toBeDefined();
      expect(result.sensitivity.length).toBeGreaterThan(0);
    });

    it('generates scenarios for each sensitivity parameter', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeSensitivity: true,
          sensitivityParameters: ['discountRate'],
          includeTerminalValue: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      const discountRateSensitivity = result.sensitivity.find(s => s.parameter === 'discountRate');
      expect(discountRateSensitivity).toBeDefined();
      expect(discountRateSensitivity?.scenarios.length).toBeGreaterThan(0);
    });

    it('sensitivity analysis includes NPV, IRR, and payback for each scenario', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeSensitivity: true,
          sensitivityParameters: ['discountRate'],
          includeTerminalValue: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      result.sensitivity.forEach(param => {
        param.scenarios.forEach(scenario => {
          expect(scenario).toHaveProperty('npv');
          expect(scenario).toHaveProperty('irr');
          expect(scenario).toHaveProperty('paybackPeriod');
        });
      });
    });

    it('generates tornado chart data', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeSensitivity: true,
          sensitivityParameters: ['discountRate'],
          includeTerminalValue: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      result.sensitivity.forEach(param => {
        expect(param.tornadoChart).toBeDefined();
        expect(param.tornadoChart.length).toBeGreaterThan(0);
        expect(param.tornadoChart[0]).toHaveProperty('impact');
      });
    });

    it('skips sensitivity analysis when disabled', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeSensitivity: false,
          includeTerminalValue: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.sensitivity).toEqual([]);
    });
  });

  describe('Scenario Analysis', () => {
    it('generates base, optimistic, and pessimistic scenarios', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeScenarios: true,
          includeSensitivity: false,
          includeTerminalValue: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.length).toBe(3);

      const scenarioNames = result.scenarios.map(s => s.name);
      expect(scenarioNames).toContain('Base Case');
      expect(scenarioNames).toContain('Optimistic');
      expect(scenarioNames).toContain('Pessimistic');
    });

    it('scenario probabilities sum to 1', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeScenarios: true,
          includeSensitivity: false,
          includeTerminalValue: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      const totalProbability = result.scenarios.reduce((sum, s) => sum + s.probability, 0);
      expect(totalProbability).toBeCloseTo(1, 2);
    });

    it('optimistic scenario has higher NPV than base case', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeScenarios: true,
          includeSensitivity: false,
          includeTerminalValue: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      const baseCase = result.scenarios.find(s => s.name === 'Base Case');
      const optimistic = result.scenarios.find(s => s.name === 'Optimistic');

      expect(optimistic?.npv).toBeGreaterThan(baseCase?.npv ?? 0);
    });

    it('pessimistic scenario has lower NPV than base case', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeScenarios: true,
          includeSensitivity: false,
          includeTerminalValue: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      const baseCase = result.scenarios.find(s => s.name === 'Base Case');
      const pessimistic = result.scenarios.find(s => s.name === 'Pessimistic');

      expect(pessimistic?.npv).toBeLessThan(baseCase?.npv ?? 0);
    });

    it('scenarios include descriptions', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeScenarios: true,
          includeSensitivity: false,
          includeTerminalValue: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      result.scenarios.forEach(scenario => {
        expect(scenario.description).toBeDefined();
        expect(scenario.description.length).toBeGreaterThan(0);
      });
    });

    it('skips scenario analysis when disabled', () => {
      const input = createBasicCashflowInput({
        analysis: {
          includeScenarios: false,
          includeSensitivity: false,
          includeTerminalValue: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.scenarios).toEqual([]);
    });
  });
});
