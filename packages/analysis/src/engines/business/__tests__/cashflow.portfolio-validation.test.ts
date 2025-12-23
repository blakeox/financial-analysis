import { describe, it, expect } from 'vitest';
import {
  CashFlowAnalyzer,
  CashFlowInputSchema,
  type CashFlowInput,
} from '../cashflow';
import { createBasicCashflowInput } from './fixtures/cashflow';

/**
 * Covers portfolio comparisons, inflation adjustments, and schema/edge-case validation.
 */
describe('CashFlowAnalyzer - Portfolio & Validation', () => {
  describe('Project Comparison', () => {
    const projectA: CashFlowInput = CashFlowInputSchema.parse({
      cashFlows: [
        { period: 0, cashFlow: -100000, category: 'capital-expenditure' },
        { period: 1, cashFlow: 40000, category: 'revenue' },
        { period: 2, cashFlow: 50000, category: 'revenue' },
        { period: 3, cashFlow: 60000, category: 'revenue' },
      ],
      discounting: {
        discountRate: 0.1,
        terminalGrowthRate: 0.03,
        taxRate: 0.25,
      },
      analysis: { includeTerminalValue: false, includeSensitivity: false, includeScenarios: false },
    });

    const projectB: CashFlowInput = CashFlowInputSchema.parse({
      cashFlows: [
        { period: 0, cashFlow: -50000, category: 'capital-expenditure' },
        { period: 1, cashFlow: 20000, category: 'revenue' },
        { period: 2, cashFlow: 25000, category: 'revenue' },
        { period: 3, cashFlow: 30000, category: 'revenue' },
      ],
      discounting: {
        discountRate: 0.1,
        terminalGrowthRate: 0.03,
        taxRate: 0.25,
      },
      analysis: { includeTerminalValue: false, includeSensitivity: false, includeScenarios: false },
    });

    const projectC: CashFlowInput = CashFlowInputSchema.parse({
      cashFlows: [
        { period: 0, cashFlow: -75000, category: 'capital-expenditure' },
        { period: 1, cashFlow: 30000, category: 'revenue' },
        { period: 2, cashFlow: 35000, category: 'revenue' },
        { period: 3, cashFlow: 40000, category: 'revenue' },
      ],
      discounting: {
        discountRate: 0.1,
        terminalGrowthRate: 0.03,
        taxRate: 0.25,
      },
      analysis: { includeTerminalValue: false, includeSensitivity: false, includeScenarios: false },
    });

    it('compares multiple projects', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
      ]);

      expect(comparison.projects).toBeDefined();
      expect(comparison.projects.length).toBe(2);
    });

    it('ranks projects by NPV', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
        { name: 'Project C', input: projectC },
      ]);

      // Projects should be sorted by NPV descending
      for (let i = 0; i < comparison.projects.length - 1; i++) {
        expect(comparison.projects[i]!.npv).toBeGreaterThanOrEqual(comparison.projects[i + 1]!.npv);
      }
    });

    it('assigns ranking to each project', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
      ]);

      expect(comparison.projects[0]!.ranking).toBe(1);
      expect(comparison.projects[1]!.ranking).toBe(2);
    });

    it('recommends best project for mutually exclusive decision', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
      ]);

      expect(comparison.mutuallyExclusive).toBeDefined();
      expect(comparison.mutuallyExclusive.recommended).toBeDefined();
      expect(comparison.mutuallyExclusive.reason).toBeDefined();
    });

    it('includes NPV difference for mutually exclusive', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
      ]);

      expect(comparison.mutuallyExclusive.npvDifference).toBeDefined();
    });

    it('optimizes portfolio under capital rationing', () => {
      const comparison = CashFlowAnalyzer.compareProjects(
        [
          { name: 'Project A', input: projectA },
          { name: 'Project B', input: projectB },
          { name: 'Project C', input: projectC },
        ],
        125000
      );

      expect(comparison.capitalRationing).toBeDefined();
      expect(comparison.capitalRationing.budgetConstraint).toBe(125000);
      expect(comparison.capitalRationing.optimalPortfolio).toBeDefined();
      expect(comparison.capitalRationing.totalCapitalUsed).toBeLessThanOrEqual(125000);
    });

    it('calculates efficiency ratio for capital rationing', () => {
      const comparison = CashFlowAnalyzer.compareProjects(
        [
          { name: 'Project A', input: projectA },
          { name: 'Project B', input: projectB },
        ],
        150000
      );

      expect(comparison.capitalRationing.efficiencyRatio).toBeDefined();
      expect(comparison.capitalRationing.efficiencyRatio).toBeGreaterThan(0);
    });

    it('includes capital required for each project', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
      ]);

      comparison.projects.forEach(project => {
        expect(project.capitalRequired).toBeGreaterThan(0);
      });
    });

    it('includes all key metrics for each project', () => {
      const comparison = CashFlowAnalyzer.compareProjects([
        { name: 'Project A', input: projectA },
        { name: 'Project B', input: projectB },
      ]);

      comparison.projects.forEach(project => {
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('npv');
        expect(project).toHaveProperty('irr');
        expect(project).toHaveProperty('paybackPeriod');
        expect(project).toHaveProperty('profitabilityIndex');
        expect(project).toHaveProperty('capitalRequired');
        expect(project).toHaveProperty('ranking');
      });
    });
  });

  describe('Inflation Adjustments', () => {
    it('applies inflation adjustments when specified', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -100000, category: 'capital-expenditure', inflationAdjusted: false },
          { period: 1, cashFlow: 30000, category: 'revenue', inflationAdjusted: true },
          { period: 2, cashFlow: 30000, category: 'revenue', inflationAdjusted: true },
        ],
        analysis: {
          inflationRate: 0.05,
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      // Cash flows should be inflation-adjusted, resulting in different values
      expect(result.detailedCashFlows[1]?.originalCashFlow).toBeGreaterThan(30000);
    });

    it('does not adjust period 0 cash flows', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -100000, category: 'capital-expenditure', inflationAdjusted: true },
          { period: 1, cashFlow: 30000, category: 'revenue' },
        ],
        analysis: {
          inflationRate: 0.05,
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      // Period 0 should remain unchanged
      expect(result.detailedCashFlows[0]?.originalCashFlow).toBe(-100000);
    });
  });

  describe('Edge Cases', () => {
    it('handles single cash flow', () => {
      const input = createBasicCashflowInput({
        cashFlows: [{ period: 0, cashFlow: -50000, category: 'capital-expenditure' }],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.npv).toBe(-50000);
    });

    it('handles all positive cash flows', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: 10000, category: 'revenue' },
          { period: 1, cashFlow: 20000, category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.npv).toBeGreaterThan(0);
      expect(result.paybackPeriod).toBeLessThanOrEqual(0);
    });

    it('handles all negative cash flows', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -10000, category: 'capital-expenditure' },
          { period: 1, cashFlow: -5000, category: 'operating-expense' },
        ],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.npv).toBeLessThan(0);
      expect(result.paybackPeriod).toBe(Infinity);
    });

    it('handles large cash flow values', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -1000000000, category: 'capital-expenditure' },
          { period: 1, cashFlow: 500000000, category: 'revenue' },
          { period: 2, cashFlow: 600000000, category: 'revenue' },
          { period: 3, cashFlow: 700000000, category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(Number.isFinite(result.npv)).toBe(true);
      expect(Number.isFinite(result.irr)).toBe(true);
    });

    it('handles very small cash flow values', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -0.01, category: 'capital-expenditure' },
          { period: 1, cashFlow: 0.005, category: 'revenue' },
          { period: 2, cashFlow: 0.008, category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(Number.isFinite(result.npv)).toBe(true);
    });

    it('handles unsorted cash flows', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 2, cashFlow: 35000, category: 'revenue' },
          { period: 0, cashFlow: -100000, category: 'capital-expenditure' },
          { period: 3, cashFlow: 40000, category: 'revenue' },
          { period: 1, cashFlow: 30000, category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.npv).toBeDefined();
      expect(result.detailedCashFlows[0]?.period).toBe(0);
      expect(result.detailedCashFlows[3]?.period).toBe(3);
    });

    it('handles cash flows with dates', () => {
      const input = createBasicCashflowInput({
        cashFlows: [
          { period: 0, cashFlow: -100000, date: '2024-01-01', category: 'capital-expenditure' },
          { period: 1, cashFlow: 50000, date: '2024-12-31', category: 'revenue' },
          { period: 2, cashFlow: 60000, date: '2025-12-31', category: 'revenue' },
        ],
        analysis: {
          includeTerminalValue: false,
          includeSensitivity: false,
          includeScenarios: false,
        },
      });

      const result = CashFlowAnalyzer.analyze(input);

      expect(result.detailedCashFlows[0]?.date).toBe('2024-01-01');
      expect(result.detailedCashFlows[1]?.date).toBe('2024-12-31');
    });
  });

  describe('Schema Validation', () => {
    it('validates discount rate range', () => {
      expect(() => {
        CashFlowInputSchema.parse({
          cashFlows: [{ period: 0, cashFlow: -1000 }],
          discounting: {
            discountRate: 1.5,
            terminalGrowthRate: 0.03,
            taxRate: 0.25,
          },
        });
      }).toThrow();
    });

    it('validates terminal growth rate range', () => {
      expect(() => {
        CashFlowInputSchema.parse({
          cashFlows: [{ period: 0, cashFlow: -1000 }],
          discounting: {
            discountRate: 0.1,
            terminalGrowthRate: 0.15,
            taxRate: 0.25,
          },
        });
      }).toThrow();
    });

    it('requires at least one cash flow', () => {
      expect(() => {
        CashFlowInputSchema.parse({
          cashFlows: [],
          discounting: {
            discountRate: 0.1,
            terminalGrowthRate: 0.03,
            taxRate: 0.25,
          },
        });
      }).toThrow();
    });

    it('validates cash flow category enum', () => {
      expect(() => {
        CashFlowInputSchema.parse({
          cashFlows: [{ period: 0, cashFlow: -1000, category: 'invalid-category' }],
          discounting: {
            discountRate: 0.1,
            terminalGrowthRate: 0.03,
            taxRate: 0.25,
          },
        });
      }).toThrow();
    });

    it('applies default values correctly', () => {
      const input = CashFlowInputSchema.parse({
        cashFlows: [{ period: 0, cashFlow: -1000 }],
        discounting: {
          discountRate: 0.1,
        },
      });

      expect(input.discounting.terminalGrowthRate).toBe(0.03);
      expect(input.discounting.taxRate).toBe(0.25);
      expect(input.analysis.includeTerminalValue).toBe(true);
    });
  });
});
