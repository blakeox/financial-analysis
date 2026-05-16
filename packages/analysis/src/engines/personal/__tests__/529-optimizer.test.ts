/**
 * 529 Plan Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { FiveTwoNineOptimizerInput } from '../../../schemas/529-optimizer.js';
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

  const cloneInput = (): FiveTwoNineOptimizerInput =>
    JSON.parse(JSON.stringify(baseInput)) as FiveTwoNineOptimizerInput;

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
        {
          state: 'CA',
          stateTaxDeduction: false,
          maxDeduction: 0,
          fees: 0.001,
          investmentOptions: 'good',
          minimumContribution: 0,
        },
        {
          state: 'NY',
          stateTaxDeduction: true,
          maxDeduction: 5000,
          fees: 0.0015,
          investmentOptions: 'good',
          minimumContribution: 0,
        },
      ],
    };
    const result = FiveTwoNineOptimizer.analyze(inputWithStates);
    expect(result.stateComparison).toBeDefined();
  });

  it('uses default average return when no accounts exist', () => {
    const result = FiveTwoNineOptimizer.analyze(baseInput);
    expect(result.currentAccountAnalysis.averageReturn).toBeCloseTo(0.07, 6);
  });

  it('calculates average return from existing accounts', () => {
    const input = cloneInput();
    input.current529Accounts = [
      {
        state: 'CA',
        accountType: 'direct',
        currentBalance: 10000,
        annualContribution: 1000,
        fees: 0.001,
        investmentReturn: 0.06,
      },
      {
        state: 'NV',
        accountType: 'advisor-sold',
        currentBalance: 20000,
        annualContribution: 2000,
        fees: 0.002,
        investmentReturn: 0.08,
      },
    ];

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.currentAccountAnalysis.averageReturn).toBeCloseTo(0.07, 6);
  });

  it('falls back to home state when no state options are provided', () => {
    const input = cloneInput();
    input.strategy.includeMultiStateComparison = true;
    input.state529Options = undefined;

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.stateComparison?.states).toEqual([]);
    expect(result.stateComparison?.bestState).toBe('CA');
  });

  it('selects best state based on net benefit', () => {
    const input = cloneInput();
    input.state529Options = [
      {
        state: 'CA',
        stateTaxDeduction: true,
        maxDeduction: 4000,
        fees: 0.001,
        investmentOptions: 'good',
        minimumContribution: 0,
      },
      {
        state: 'NV',
        stateTaxDeduction: true,
        maxDeduction: 4000,
        fees: 0.0005,
        investmentOptions: 'good',
        minimumContribution: 0,
      },
    ];

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.stateComparison?.bestState).toBe('CA');
    expect(result.stateComparison?.states[0]?.taxSavings).toBeCloseTo(400, 6);
  });

  it('handles no projection when disabled and financial aid not expected', () => {
    const input = cloneInput();
    input.analysis.includeProjection = false;
    input.financialAid.expectFinancialAid = false;

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.projections).toBeUndefined();
    expect(result.aidImpact?.recommendation).toContain('minimal impact');
  });

  it('reports minimal aid impact for low aid reduction', () => {
    const input = cloneInput();
    input.financialAid.expectedAidPercentage = 0.01;

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.aidImpact?.recommendation).toContain('minimal impact');
  });

  it('omits shortfall analysis when disabled', () => {
    const input = cloneInput();
    input.analysis.includeShortfallAnalysis = false;

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.shortfallAnalysis).toBeUndefined();
  });

  it('skips state comparison and aid impact when flags are disabled', () => {
    const input = cloneInput();
    input.strategy.includeMultiStateComparison = false;
    input.financialAid.includeAidImpact = false;
    input.children = [
      {
        age: 8,
        yearsUntilCollege: 10,
        expectedCollegeCost: 0,
        collegeType: 'public-in-state',
      },
      {
        age: 5,
        yearsUntilCollege: 13,
        expectedCollegeCost: undefined as unknown as number,
        collegeType: 'public-in-state',
      },
    ];

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.stateComparison).toBeUndefined();
    expect(result.aidImpact).toBeUndefined();
    expect(result.educationCosts.totalCost).toBe(0);
  });

  it('handles zero projection balance and keeps aid warning', () => {
    const input = cloneInput();
    input.analysis.includeProjection = true;
    input.contributionPlan.annualContribution = 0;
    input.children = [
      {
        age: 18,
        yearsUntilCollege: 0,
        expectedCollegeCost: 100000,
        collegeType: 'public-in-state',
      },
    ];

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.projections?.totalBalance).toBe(0);
    expect(result.projections?.perChildProjections[0]?.projectedBalance).toBe(0);
    expect(result.aidImpact?.recommendation).toBe('529 plan may reduce financial aid eligibility');
  });

  it('adds shortfall and optimal state recommendations when applicable', () => {
    const input = cloneInput();
    input.state529Options = [
      {
        state: 'CA',
        stateTaxDeduction: true,
        maxDeduction: 4000,
        fees: 0.001,
        investmentOptions: 'good',
        minimumContribution: 0,
      },
      {
        state: 'UT',
        stateTaxDeduction: false,
        maxDeduction: 0,
        fees: 0.0005,
        investmentOptions: 'good',
        minimumContribution: 0,
      },
      {
        state: 'NV',
        stateTaxDeduction: false,
        maxDeduction: 0,
        fees: 0.0002,
        investmentOptions: 'good',
        minimumContribution: 0,
      },
    ];
    input.children = [
      {
        age: 10,
        yearsUntilCollege: 8,
        expectedCollegeCost: 300000,
        collegeType: 'public-in-state',
      },
    ];

    const result = FiveTwoNineOptimizer.analyze(input);
    expect(result.stateComparison?.bestState).toBe('CA');
    expect(result.recommendations.some((rec) => rec.startsWith('Shortfall:'))).toBe(true);
    expect(result.recommendations.some((rec) => rec.startsWith('Optimal state plan:'))).toBe(true);
    expect(result.recommendations.some((rec) => rec.includes('financial aid'))).toBe(true);
  });

  it('should perform comprehensive analysis', () => {
    const result = FiveTwoNineOptimizer.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.educationCosts).toBeDefined();
    expect(result.currentAccountAnalysis).toBeDefined();
    expect(result.projections).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });
});
