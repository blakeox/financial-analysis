/**
 * LBO Model Tests
 */

import { describe, expect, it } from 'vitest';
import type { LBOInput } from '../../../schemas/lbo.js';
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

  it('should generate summary, recommendations, and risk assessment', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.summary).toBeDefined();
    expect(result.summary.irr).toBeDefined();
    expect(result.summary.moic).toBeDefined();

    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);

    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.overallRisk).toBeDefined();
  });

  it('should analyze exit scenarios', () => {
    const result = LBOModel.analyze(baseInput);
    expect(result.exitScenarios).toBeDefined();
    expect(result.exitScenarios.base).toBeDefined();
    expect(result.exitScenarios.optimistic).toBeDefined();
    expect(result.exitScenarios.pessimistic).toBeDefined();
  });

  it('should flag high risk factors for highly leveraged deals', () => {
    const highRiskInput: LBOInput = {
      ...baseInput,
      targetCompany: {
        ebitda: 10000000,
        revenue: 50000000,
        debt: 100000000,
        equity: 20000000,
      },
      transaction: {
        purchasePrice: 200000000,
        equityContribution: 20000000,
        debtAmount: 180000000,
        transactionFees: 5000000,
      },
      financing: {
        seniorDebt: {
          amount: 150000000,
          interestRate: 0.15,
          term: 5,
        },
        mezzanineDebt: {
          amount: 30000000,
          interestRate: 0.2,
          term: 5,
        },
      },
      projections: {
        ...baseInput.projections,
        ebitdaGrowth: 0,
        revenueGrowth: 0,
        holdingPeriod: 3,
      },
    };

    const result = LBOModel.analyze(highRiskInput);
    expect(result.riskAssessment?.overallRisk).toBe('high');
    expect(
      result.riskAssessment?.riskFactors.some((risk: any) => risk.factor === 'High Debt-to-EBITDA')
    ).toBe(true);
    expect(
      result.riskAssessment?.riskFactors.some((risk: any) => risk.factor === 'High Leverage')
    ).toBe(true);
    expect(
      result.riskAssessment?.riskFactors.some(
        (risk: any) => risk.factor === 'Negative Cash Flow Periods'
      )
    ).toBe(true);
    expect(result.recommendations).toContain(
      'High risk transaction - ensure strong operational improvements and exit strategy'
    );
    expect(result.recommendations).toContain(
      'Very high leverage - focus on rapid debt paydown and operational efficiency'
    );
  });

  it('should flag moderate debt-to-EBITDA risk', () => {
    const moderateRiskInput: LBOInput = {
      ...baseInput,
      targetCompany: {
        ...baseInput.targetCompany,
        ebitda: 50000000,
      },
      transaction: {
        ...baseInput.transaction,
        debtAmount: 225000000,
        equityContribution: 75000000,
      },
      projections: {
        ...baseInput.projections,
        holdingPeriod: 4,
      },
    };

    const result = LBOModel.analyze(moderateRiskInput);
    expect(
      result.riskAssessment?.riskFactors.some(
        (risk: any) => risk.factor === 'Moderate Debt-to-EBITDA'
      )
    ).toBe(true);
  });

  it('handles zero equity contribution and zero EBITDA', () => {
    const result = LBOModel.analyze({
      ...baseInput,
      targetCompany: {
        ...baseInput.targetCompany,
        ebitda: 0,
      },
      transaction: {
        ...baseInput.transaction,
        equityContribution: 0,
        debtAmount: 0,
      },
      financing: {
        ...baseInput.financing,
        mezzanineDebt: {
          ...baseInput.financing.mezzanineDebt,
          amount: 0,
        },
      },
      analysis: {
        ...baseInput.analysis,
        includeIRR: false,
        includeMOIC: false,
        includeDebtPaydown: false,
        includeExitScenarios: false,
      },
    } as LBOInput);

    expect(result.initialMetrics.leverage).toBe(999);
    expect(result.initialMetrics.debtToEBITDA).toBe(999);
    expect(result.returns).toBeUndefined();
    expect(result.debtPaydown).toBeUndefined();
    expect(result.exitScenarios).toBeUndefined();
  });

  it('treats mezzanine debt as optional when amount is zero', () => {
    const result = LBOModel.analyze({
      ...baseInput,
      financing: {
        ...baseInput.financing,
        mezzanineDebt: {
          amount: 0,
          interestRate: 0.12,
          term: 7,
        },
      },
    } as LBOInput);

    expect(result.debtService.mezzanineDebtService).toBe(0);
  });

  it('classifies medium risk when multiple medium factors are present', () => {
    const result = LBOModel.analyze({
      ...baseInput,
      targetCompany: {
        ebitda: 40000000,
        revenue: 180000000,
        debt: 150000000,
        equity: 100000000,
      },
      transaction: {
        purchasePrice: 250000000,
        equityContribution: 70000000,
        debtAmount: 180000000,
        transactionFees: 5000000,
      },
      financing: {
        seniorDebt: {
          amount: 140000000,
          interestRate: 0.1,
          term: 6,
        },
        mezzanineDebt: {
          amount: 40000000,
          interestRate: 0.15,
          term: 6,
        },
      },
      projections: {
        ebitdaGrowth: 0,
        revenueGrowth: 0.01,
        exitMultiple: 7,
        holdingPeriod: 4,
      },
    } as LBOInput);

    expect(result.riskAssessment.overallRisk).toBe('medium');
    expect(result.riskAssessment.riskFactors.length).toBeGreaterThanOrEqual(2);
  });
});
