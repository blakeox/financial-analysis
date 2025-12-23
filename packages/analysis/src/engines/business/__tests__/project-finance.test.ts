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
});
