/**
 * Insurance Needs Calculator Tests
 */

import { describe, expect, it } from 'vitest';
import type { InsuranceNeedsInput } from '../../../schemas/insurance-needs.js';
import { InsuranceNeedsCalculator } from '../insurance-needs.js';

describe('InsuranceNeedsCalculator', () => {
  const baseInput: InsuranceNeedsInput = {
    personalInfo: {
      age: 35,
      maritalStatus: 'married',
      dependents: 2,
      employmentStatus: 'employed',
      healthStatus: 'good',
      occupation: 'Software Engineer',
      annualIncome: 120000,
      monthlyExpenses: 6000,
    },
    currentInsurance: {
      lifeInsurance: {
        termLife: {
          coverage: 500000,
          termYears: 20,
          monthlyPremium: 50,
          beneficiary: 'Spouse',
        },
        wholeLife: {
          coverage: 0,
          cashValue: 0,
          monthlyPremium: 0,
        },
      },
      disabilityInsurance: {
        shortTerm: {
          coverage: 0,
          waitingPeriod: 0,
          benefitPeriod: 0,
          monthlyPremium: 0,
        },
        longTerm: {
          coverage: 0,
          waitingPeriod: 0,
          benefitPeriod: 0,
          monthlyPremium: 0,
        },
      },
      longTermCare: {
        coverage: 0,
        dailyBenefit: 0,
        benefitPeriod: 0,
        eliminationPeriod: 0,
        monthlyPremium: 0,
      },
      healthInsurance: {
        coverage: 'PPO',
        monthlyPremium: 400,
        deductible: 2000,
        outOfPocketMax: 5000,
      },
    },
    financialSituation: {
      totalAssets: 500000,
      totalDebts: 300000,
      emergencyFund: 20000,
      retirementSavings: 150000,
      otherIncome: 0,
      socialSecurityBenefit: 0,
    },
    goals: {
      incomeReplacementRatio: 0.7,
      debtPayoffGoal: true,
      educationFunding: 100000,
      retirementGoal: 2000000,
      legacyGoal: 0,
    },
    analysis: {
      includeLifeInsurance: true,
      includeDisabilityInsurance: true,
      includeLongTermCare: true,
      includeHealthInsurance: true,
    },
  };

  it('should calculate life insurance needs', () => {
    const result = InsuranceNeedsCalculator.analyze(baseInput);
    expect(result.lifeInsuranceAnalysis).toBeDefined();
    expect(result.lifeInsuranceAnalysis.totalRecommendedCoverage).toBeGreaterThan(0);
    expect(result.lifeInsuranceAnalysis.coverageGap).toBeGreaterThanOrEqual(0);
  });

  it('should calculate disability insurance needs', () => {
    const result = InsuranceNeedsCalculator.analyze(baseInput);
    expect(result.disabilityInsuranceAnalysis).toBeDefined();
    expect(result.disabilityInsuranceAnalysis.incomeReplacementNeeds).toBeGreaterThan(0);
  });

  it('should calculate long-term care needs', () => {
    const result = InsuranceNeedsCalculator.analyze(baseInput);
    expect(result.longTermCareAnalysis).toBeDefined();
    expect(result.longTermCareAnalysis.projectedCosts).toBeDefined();
  });

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = InsuranceNeedsCalculator.analyze(baseInput);
    
    // Check insurance summary
    expect(result.insuranceSummary).toBeDefined();
    expect(result.insuranceSummary.totalRecommendedCoverage).toBeGreaterThan(0);
    expect(result.insuranceSummary.insuranceHealthScore).toBeGreaterThanOrEqual(0);
    expect(result.insuranceSummary.insuranceHealthScore).toBeLessThanOrEqual(100);
    expect(result.insuranceSummary.priorityRecommendations).toBeDefined();
    expect(result.insuranceSummary.priorityRecommendations.length).toBeGreaterThan(0);
    
    // Check risk assessment
    expect(result.riskAssessment).toBeDefined();
    expect(result.riskAssessment.overallRiskLevel).toMatch(/low|medium|high/);
    expect(result.riskAssessment.riskFactors.length).toBeGreaterThan(0);
    
    // Check cost analysis
    expect(result.costAnalysis).toBeDefined();
    expect(result.costAnalysis.affordabilityAssessment).toMatch(/affordable|stretch|unaffordable/);
    
    // Check insights and recommendations
    expect(result.insights).toBeDefined();
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
