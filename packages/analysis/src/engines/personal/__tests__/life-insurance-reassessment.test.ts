/**
 * Life Insurance Reassessment Tests
 */

import { describe, expect, it } from 'vitest';
import type { LifeInsuranceReassessmentInput } from '../../../schemas/life-insurance-reassessment.js';
import { LifeInsuranceReassessmentCalculator } from '../life-insurance-reassessment.js';

describe('LifeInsuranceReassessmentCalculator', () => {
  const baseInput: LifeInsuranceReassessmentInput = {
    personalInfo: {
      age: 40,
      healthStatus: 'good',
      smoker: false,
      gender: 'male',
    },
    currentPolicies: [
      {
        policyType: 'term',
        faceAmount: 500000,
        annualPremium: 500,
        cashValue: 0,
        policyAge: 5,
      },
    ],
    financialSituation: {
      annualIncome: 100000,
      totalAssets: 500000,
      totalDebt: 200000,
      monthlyExpenses: 5000,
      dependents: 2,
      yearsUntilRetirement: 25,
    },
    needsAnalysis: {
      incomeReplacement: {
        yearsOfIncome: 10,
        replacementPercentage: 0.7,
      },
      debtPayoff: {
        mortgageBalance: 200000,
        otherDebt: 0,
      },
      educationFunding: {
        childrenCount: 2,
        educationCostPerChild: 200000,
      },
      finalExpenses: 10000,
      estateTaxes: 0,
    },
    analysis: {
      includeCoverageGapAnalysis: true,
      includePolicyOptimization: true,
      includeConversionAnalysis: true,
      includeTermVsPermanent: true,
    },
  };

  it('should calculate life insurance needs', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.needsAnalysis).toBeDefined();
    expect(result.needsAnalysis.totalNeeded).toBeGreaterThan(0);
  });

  it('should identify coverage gaps', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze(baseInput);
    expect(result.coverageGapAnalysis).toBeDefined();
    expect(result.coverageGapAnalysis.coverageGap).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should compare term vs permanent insurance', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze(baseInput);
    expect(result.termVsPermanentComparison).toBeDefined();
  });

  it('should analyze policy optimization', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze(baseInput);
    expect(result.policyOptimization).toBeDefined();
  });

  it('should flag excess coverage and recommend decrease', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze({
      ...baseInput,
      currentPolicies: [
        {
          policyType: 'term',
          faceAmount: 2500000,
          annualPremium: 2000,
          cashValue: 0,
          policyAge: 5,
        },
      ],
    });

    expect(result.coverageGapAnalysis).toBeDefined();
    expect(result.coverageGapAnalysis.excess).toBeGreaterThan(0);
    expect(result.summary.recommendation).toBe('decrease');
    expect(result.recommendations.some((item) => item.includes('Excess coverage'))).toBe(true);
  });

  it('should omit optional analyses when disabled', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze({
      ...baseInput,
      analysis: {
        includeCoverageGapAnalysis: false,
        includePolicyOptimization: false,
        includeConversionAnalysis: false,
        includeTermVsPermanent: false,
      },
    });

    expect(result.coverageGapAnalysis).toBeUndefined();
    expect(result.policyOptimization).toBeUndefined();
    expect(result.termVsPermanentComparison).toBeUndefined();
    expect(result.summary.recommendation).toBe('maintain');
  });

  it('should include potential savings recommendation when optimization yields savings', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze({
      ...baseInput,
      currentPolicies: [
        {
          policyType: 'term',
          faceAmount: 1500000,
          annualPremium: 20000,
          cashValue: 0,
          policyAge: 5,
        },
      ],
    });

    expect(result.policyOptimization).toBeDefined();
    expect(result.policyOptimization.potentialSavings).toBeGreaterThan(0);
    expect(result.recommendations.some((item) => item.includes('Potential savings:'))).toBe(true);
  });

  it('should handle zero needs and coverage', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze({
      ...baseInput,
      currentPolicies: [],
      needsAnalysis: {
        incomeReplacement: {
          yearsOfIncome: 0,
          replacementPercentage: 0,
        },
        debtPayoff: {
          mortgageBalance: 0,
          otherDebt: 0,
        },
        educationFunding: {
          childrenCount: 0,
          educationCostPerChild: 0,
        },
        finalExpenses: 0,
        estateTaxes: 0,
      },
    });

    expect(result.coverageGapAnalysis).toBeDefined();
    expect(result.coverageGapAnalysis.gapPercentage).toBe(0);
    expect(result.coverageGapAnalysis.excessPercentage).toBe(0);
    expect(result.summary.recommendation).toBe('maintain');
  });

  it('should track permanent policy coverage', () => {
    const result = LifeInsuranceReassessmentCalculator.analyze({
      ...baseInput,
      currentPolicies: [
        {
          policyType: 'whole',
          faceAmount: 300000,
          annualPremium: 1500,
          cashValue: 20000,
          policyAge: 5,
        },
      ],
    });

    expect(result.currentCoverageAnalysis.permanentCoverage).toBeGreaterThan(0);
    expect(result.currentCoverageAnalysis.termCoverage).toBe(0);
  });
});

