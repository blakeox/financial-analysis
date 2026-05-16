/**
 * Project Finance Analyzer Tests
 */

import { describe, expect, it } from 'vitest';
import type { ProjectFinanceInput } from '../../../schemas/project-finance.js';
import { ProjectFinanceAnalyzer } from '../project-finance.js';

describe('ProjectFinanceAnalyzer', () => {
  const baseInput: ProjectFinanceInput = {
    projectInfo: {
      name: 'Test Project',
      type: 'infrastructure',
      duration: 10,
    },
    cashFlows: {
      initialInvestment: 1000000,
      annualCashFlows: [
        {
          year: 1,
          revenue: 500000,
          operatingExpenses: 300000,
          capitalExpenditures: 0,
          workingCapital: 0,
        },
        {
          year: 2,
          revenue: 600000,
          operatingExpenses: 350000,
          capitalExpenditures: 0,
          workingCapital: 0,
        },
        {
          year: 3,
          revenue: 700000,
          operatingExpenses: 400000,
          capitalExpenditures: 0,
          workingCapital: 0,
        },
      ],
    },
    financing: {
      equityPercentage: 30,
      debtPercentage: 70,
      costOfEquity: 0.12,
      costOfDebt: 0.06,
      taxRate: 0.25,
    },
    analysis: {
      includeNPV: true,
      includeIRR: true,
      includePayback: true,
      includeSensitivity: true,
    },
  };

  it('should calculate WACC', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.wacc).toBeGreaterThan(0);
    expect(result.wacc).toBeLessThan(1);
  });

  it('should calculate free cash flows', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    expect(result.freeCashFlows).toBeDefined();
    expect(Array.isArray(result.freeCashFlows)).toBe(true);
    expect(result.freeCashFlows.length).toBe(3);
  });

  it('should calculate NPV when requested', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    expect(result.npv).toBeDefined();
    expect(result.npv?.npv).toBeDefined();
  });

  it('should calculate IRR when requested', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    expect(result.irr).toBeDefined();
    expect(result.irr?.irr).toBeGreaterThanOrEqual(0);
    expect(result.irr?.irr).toBeLessThanOrEqual(1);
  });

  it('should calculate payback period', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    expect(result.payback).toBeDefined();
    expect(result.payback?.simplePayback).toBeGreaterThan(0);
  });

  it('should perform sensitivity analysis when requested', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    expect(result.sensitivity).toBeDefined();
    expect(result.sensitivity?.revenueSensitivity).toBeDefined();
  });

  it('should use discount rate override when provided', () => {
    const result = ProjectFinanceAnalyzer.analyze({
      ...baseInput,
      analysis: {
        ...baseInput.analysis,
        discountRate: 0.08,
      },
    });

    expect(result.wacc).toBeGreaterThan(0);
    expect(result.summary.projectViability).toBeDefined();
    expect(result.summary.discountedPayback).toBeDefined();
  });

  it('should return marginal viability when NPV or IRR disabled', () => {
    const result = ProjectFinanceAnalyzer.analyze({
      ...baseInput,
      analysis: {
        includeNPV: false,
        includeIRR: false,
        includePayback: false,
        includeSensitivity: false,
      },
    });

    expect(result.npv).toBeUndefined();
    expect(result.irr).toBeUndefined();
    expect(result.payback).toBeUndefined();
    expect(result.sensitivity).toBeUndefined();
    expect(result.summary.projectViability).toBe('marginal');
  });

  it('should flag high risk for negative NPV and long payback', () => {
    const result = ProjectFinanceAnalyzer.analyze({
      projectInfo: {
        name: 'Stress Project',
        type: 'energy',
        duration: 12,
      },
      cashFlows: {
        initialInvestment: 1500000,
        annualCashFlows: Array.from({ length: 12 }, (_, index) => ({
          year: index + 1,
          revenue: 120000,
          operatingExpenses: 200000,
          capitalExpenditures: 5000,
          workingCapital: 2000,
        })),
      },
      financing: {
        equityPercentage: 40,
        debtPercentage: 60,
        costOfEquity: 0.14,
        costOfDebt: 0.08,
        taxRate: 0.25,
      },
      analysis: {
        includeNPV: true,
        includeIRR: true,
        includePayback: true,
        includeSensitivity: false,
      },
    });

    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment?.overallRisk).toBe('high');
    expect(result.payback?.simplePayback).toBeGreaterThan(10);
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Negative NPV'),
        expect.stringContaining('High risk project'),
      ])
    );
  });

  it('should generate sensitivity ranges for revenue, cost, and discount rates', () => {
    const result = ProjectFinanceAnalyzer.analyze(baseInput);
    const sensitivity = result.sensitivity as {
      revenueSensitivity: Array<{ change: number }>;
      costSensitivity: Array<{ change: number }>;
      discountRateSensitivity: Array<{ discountRate: number }>;
    };

    expect(sensitivity.revenueSensitivity.length).toBe(9);
    expect(sensitivity.costSensitivity.length).toBe(9);
    expect(sensitivity.discountRateSensitivity.length).toBe(10);
  });

  it('should classify viable projects with strong NPV and IRR', () => {
    const result = ProjectFinanceAnalyzer.analyze({
      projectInfo: {
        name: 'High Return Project',
        type: 'technology',
        duration: 5,
      },
      cashFlows: {
        initialInvestment: 400000,
        annualCashFlows: [
          {
            year: 1,
            revenue: 500000,
            operatingExpenses: 180000,
            capitalExpenditures: 20000,
            workingCapital: 5000,
          },
          {
            year: 2,
            revenue: 550000,
            operatingExpenses: 190000,
            capitalExpenditures: 20000,
            workingCapital: 5000,
          },
          {
            year: 3,
            revenue: 600000,
            operatingExpenses: 200000,
            capitalExpenditures: 20000,
            workingCapital: 5000,
          },
          {
            year: 4,
            revenue: 650000,
            operatingExpenses: 210000,
            capitalExpenditures: 20000,
            workingCapital: 5000,
          },
          {
            year: 5,
            revenue: 700000,
            operatingExpenses: 220000,
            capitalExpenditures: 20000,
            workingCapital: 5000,
          },
        ],
      },
      financing: {
        equityPercentage: 50,
        debtPercentage: 50,
        costOfEquity: 0.12,
        costOfDebt: 0.06,
        taxRate: 0.21,
      },
      analysis: {
        includeNPV: true,
        includeIRR: true,
        includePayback: true,
        includeSensitivity: true,
        discountRate: 0.08,
      },
    });

    expect(result.summary.projectViability).toBe('viable');
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Positive NPV'),
        expect.stringContaining('IRR'),
      ])
    );
  });
});
