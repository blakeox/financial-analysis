/**
 * 529 Plan Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { FiveTwoNineOptimizerInput } from '../../schemas/529-optimizer.js';
import { FiveTwoNineOptimizer } from '../529-optimizer.js';

describe('FiveTwoNineOptimizer', () => {
  const baseInput: FiveTwoNineOptimizerInput = {
    personalInfo: {
      stateOfResidence: 'CA',
      filingStatus: 'married-joint',
      stateTaxRate: 0.1,
    },
    children: [
      {
        age: 10,
        yearsUntilCollege: 8,
        expectedCollegeCost: 200000,
        collegeType: 'public-in-state',
      },
    ],
    current529Accounts: [],
    contributionPlan: {
      annualContribution: 5000,
      contributionIncrease: 0.03,
    },
    financialAid: {
      expectFinancialAid: true,
      expectedAidPercentage: 0.3,
    },
    strategy: {
      optimizeFor: 'max-tax-benefit',
      includeMultiStateComparison: true,
    },
    analysis: {
      includeProjection: true,
      includeShortfallAnalysis: true,
      includeRolloverAnalysis: true,
    },
  };

  it('should calculate 529 plan optimization', () => {
    const result = FiveTwoNineOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.projected529Balance.toNumber()).toBeGreaterThan(0);
  });

  it('should calculate projected balance at college start', () => {
    const result = FiveTwoNineOptimizer.analyze(baseInput);
    expect(result.projections).toBeDefined();
    expect(result.projections.totalBalance).toBeGreaterThan(0);
  });

  it('should analyze shortfall when requested', () => {
    const result = FiveTwoNineOptimizer.analyze(baseInput);
    expect(result.summary.shortfall).toBeDefined();
  });

  it('should provide recommendations', () => {
    const result = FiveTwoNineOptimizer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should compare state plans when requested', () => {
    const inputWithStates: FiveTwoNineOptimizerInput = {
      ...baseInput,
      state529Options: [
        { state: 'CA', stateTaxDeduction: false, maxDeduction: 0, fees: 0.001, investmentOptions: 'good', minimumContribution: 0 },
        { state: 'NY', stateTaxDeduction: true, maxDeduction: 5000, fees: 0.0015, investmentOptions: 'good', minimumContribution: 0 }
      ]
    };
    const result = FiveTwoNineOptimizer.analyze(inputWithStates);
    expect(result.stateComparison).toBeDefined();
  });
});

