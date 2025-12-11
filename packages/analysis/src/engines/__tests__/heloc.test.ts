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
});
