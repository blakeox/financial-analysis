/**
 * HELOC Analyzer Tests
 */

import { describe, expect, it } from 'vitest';
import type { HELOCInput } from '../../schemas/heloc.js';
import { HELOCAnalyzer } from '../heloc.js';

describe('HELOCAnalyzer', () => {
  const baseInput: HELOCInput = {
    propertyInfo: {
      currentHomeValue: 500000,
      currentMortgageBalance: 300000,
      mortgageInterestRate: 0.04,
      yearsRemaining: 25,
    },
    helocDetails: {
      creditLimit: 100000,
      interestRate: 0.06,
      drawPeriod: 10,
      repaymentPeriod: 20,
      initialDraw: 50000,
      annualFee: 0,
    },
    usage: {
      purpose: 'home-improvement',
      drawAmount: 50000,
      drawTiming: 'immediate',
    },
    comparison: {
      compareToRefinancing: true,
      compareToPersonalLoan: false,
    },
  };

  it('should calculate available equity', () => {
    const result = HELOCAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary.availableEquity).toBe(200000);
    expect(result.summary.equityPercentage).toBeGreaterThan(0);
  });

  it('should calculate HELOC payments', () => {
    const result = HELOCAnalyzer.analyze(baseInput);
    expect(result.helocAnalysis).toBeDefined();
    expect(result.helocAnalysis.monthlyPayment).toBeGreaterThan(0);
    expect(result.helocAnalysis.totalInterest).toBeGreaterThan(0);
  });

  it('should compare to refinancing when requested', () => {
    const result = HELOCAnalyzer.analyze(baseInput);
    expect(result.refinancingComparison).toBeDefined();
  });

  it('should assess risks', () => {
    const result = HELOCAnalyzer.analyze(baseInput);
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.overallRisk).toMatch(/low|medium|high/);
  });

  it('should calculate tax implications for home improvement', () => {
    const result = HELOCAnalyzer.analyze(baseInput);
    expect(result.taxAnalysis).toBeDefined();
    expect(result.taxAnalysis.note).toContain('tax-deductible');
  });

  it('should compare to personal loan when enabled', () => {
    const result = HELOCAnalyzer.analyze({
      ...baseInput,
      comparison: {
        compareToRefinancing: false,
        compareToPersonalLoan: true,
        personalLoanRate: 0.11,
      },
    });

    expect(result.refinancingComparison).toBeUndefined();
    expect(result.personalLoanComparison).toBeDefined();
    expect(result.personalLoanComparison.comparison.recommendation).toMatch(
      /HELOC typically offers lower rates|Personal loan may be simpler/
    );
    expect(result.recommendations).toEqual(
      expect.arrayContaining([result.personalLoanComparison.comparison.recommendation])
    );
  });

  it('should mark non-home-improvement use as non-deductible', () => {
    const result = HELOCAnalyzer.analyze({
      ...baseInput,
      usage: {
        ...baseInput.usage,
        purpose: 'debt-consolidation',
      },
    });

    expect(result.taxAnalysis.note).toContain('NOT tax-deductible');
    expect(result.recommendations).toEqual(
      expect.arrayContaining([expect.stringContaining('NOT tax-deductible')])
    );
  });

  it('should flag high risk for low equity and high credit limit', () => {
    const result = HELOCAnalyzer.analyze({
      propertyInfo: {
        currentHomeValue: 300000,
        currentMortgageBalance: 280000,
        mortgageInterestRate: 0.055,
        yearsRemaining: 20,
      },
      helocDetails: {
        creditLimit: 150000,
        interestRate: 0.12,
        drawPeriod: 1,
        repaymentPeriod: 5,
        initialDraw: 100000,
        annualFee: 200,
      },
      usage: {
        purpose: 'other',
        drawAmount: 100000,
        drawTiming: 'immediate',
      },
      comparison: {
        compareToRefinancing: false,
        compareToPersonalLoan: false,
      },
    });

    const factors = result.riskAssessment.riskFactors.map(
      (factor: { factor: string }) => factor.factor
    );
    expect(result.riskAssessment.overallRisk).toBe('high');
    expect(factors).toEqual(
      expect.arrayContaining([
        'Low Equity',
        'High Credit Limit',
        'High Payment Relative to Property Value',
      ])
    );
  });

  it('should classify medium risk with multiple medium factors', () => {
    const result = HELOCAnalyzer.analyze({
      propertyInfo: {
        currentHomeValue: 400000,
        currentMortgageBalance: 300000,
        mortgageInterestRate: 0.05,
        yearsRemaining: 25,
      },
      helocDetails: {
        creditLimit: 90000,
        interestRate: 0.07,
        drawPeriod: 5,
        repaymentPeriod: 15,
        initialDraw: 50000,
        annualFee: 0,
      },
      usage: {
        purpose: 'education',
        drawAmount: 50000,
        drawTiming: 'as-needed',
      },
      comparison: {
        compareToRefinancing: false,
        compareToPersonalLoan: false,
      },
    });

    expect(result.riskAssessment.overallRisk).toBe('medium');
    expect(result.riskAssessment.mitigations).toEqual(
      expect.arrayContaining([
        'Build more equity before taking HELOC to reduce risk',
        'Consider a lower credit limit to maintain equity buffer',
      ])
    );
  });

  it('should include interest-only and amortizing payment scenarios', () => {
    const result = HELOCAnalyzer.analyze(baseInput);
    expect(result.paymentScenarios).toBeDefined();
    expect(result.paymentScenarios.interestOnly.drawPeriodPayment).toBeGreaterThan(0);
    expect(result.paymentScenarios.amortizing.monthlyPayment).toBeGreaterThan(0);
    expect(
      result.paymentScenarios.interestOnlyThenAmortizing.repaymentPeriodPayment
    ).toBeGreaterThan(result.paymentScenarios.interestOnlyThenAmortizing.drawPeriodPayment);
  });

  it('recommends cash-out refinancing when HELOC is less favorable', () => {
    const result = HELOCAnalyzer.analyze({
      ...baseInput,
      helocDetails: {
        ...baseInput.helocDetails,
        interestRate: 0.12,
        creditLimit: 120000,
      },
      usage: {
        ...baseInput.usage,
        drawAmount: 100000,
      },
      comparison: {
        compareToRefinancing: true,
        compareToPersonalLoan: false,
        newMortgageRate: 0.03,
      },
    });

    expect(result.refinancingComparison).toBeDefined();
    expect(result.refinancingComparison.comparison.recommendation).toContain(
      'Cash-out refinancing may provide better terms'
    );
    expect(result.recommendations).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Cash-out refinancing may provide better terms'),
      ])
    );
  });

  it('defaults personal loan rate when not provided', () => {
    const result = HELOCAnalyzer.analyze({
      ...baseInput,
      comparison: {
        compareToRefinancing: false,
        compareToPersonalLoan: true,
      },
    });

    expect(result.personalLoanComparison).toBeDefined();
    expect(result.personalLoanComparison.personalLoan.totalCost).toBeGreaterThan(0);
  });

  it('classifies low risk when equity is strong and credit limit is modest', () => {
    const result = HELOCAnalyzer.analyze({
      propertyInfo: {
        currentHomeValue: 600000,
        currentMortgageBalance: 100000,
        mortgageInterestRate: 0.045,
        yearsRemaining: 20,
      },
      helocDetails: {
        creditLimit: 50000,
        interestRate: 0.05,
        drawPeriod: 10,
        repaymentPeriod: 15,
        initialDraw: 20000,
        annualFee: 0,
      },
      usage: {
        purpose: 'home-improvement',
        drawAmount: 20000,
        drawTiming: 'immediate',
      },
      comparison: {
        compareToRefinancing: false,
        compareToPersonalLoan: false,
      },
    });

    expect(result.riskAssessment.overallRisk).toBe('low');
  });
});
