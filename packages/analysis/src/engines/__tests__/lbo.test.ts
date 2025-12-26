/**
 * LBO Model Tests
 */

import { describe, expect, it } from 'vitest';
import type { LBOInput } from '../../schemas/lbo.js';
import { LBOModel } from '../lbo.js';

describe('LBOModel', () => {
  const baseInput: LBOInput = {
    targetCompany: {
      ebitda: 50000000,
      revenue: 200000000,
      debt: 100000000,
      equity: 150000000,
    },
    transaction: {
      purchasePrice: 300000000,
      equityContribution: 100000000,
      debtAmount: 200000000,
      transactionFees: 5000000,
    },
    financing: {
      seniorDebt: {
        amount: 150000000,
        interestRate: 0.06,
        term: 7,
      },
      mezzanineDebt: {
        amount: 50000000,
        interestRate: 0.12,
        term: 7,
      },
    },
    projections: {
      ebitdaGrowth: 0.05,
      revenueGrowth: 0.05,
      exitMultiple: 8,
      holdingPeriod: 5,
    },
    analysis: {
      includeIRR: true,
      includeMOIC: true,
      includeDebtPaydown: true,
      includeExitScenarios: true,
    },
  };

  it('should calculate initial metrics', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.initialMetrics).toBeDefined();
    expect(result.initialMetrics.purchaseMultiple).toBeGreaterThan(0);
    expect(result.initialMetrics.leverage).toBeGreaterThan(0);
  });

  it('should calculate debt service', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.debtService).toBeDefined();
    expect(result.debtService.totalDebtService).toBeGreaterThan(0);
  });

  it('should project cash flows', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.cashFlowProjections).toBeDefined();
    expect(Array.isArray(result.cashFlowProjections)).toBe(true);
    expect(result.cashFlowProjections.length).toBe(5);
  });

  it('should calculate exit value', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.exitValue).toBeDefined();
    expect(result.exitValue.exitValue).toBeGreaterThan(0);
  });

  it('should calculate returns when requested', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.returns).toBeDefined();
    expect(result.returns?.irr).toBeGreaterThanOrEqual(0);
    expect(result.returns?.moic).toBeGreaterThan(0);
  });

  it('should analyze debt paydown', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.debtPaydown).toBeDefined();
    expect(result.debtPaydown?.debtPaydown).toBeGreaterThanOrEqual(0);
  });
});
