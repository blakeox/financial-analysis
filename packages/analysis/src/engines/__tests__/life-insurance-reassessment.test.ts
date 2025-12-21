/**
 * Life Insurance Reassessment Tests
 */

import { describe, expect, it } from 'vitest';
import type { LifeInsuranceReassessmentInput } from '../../schemas/life-insurance-reassessment.js';
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
});

