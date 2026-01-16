/**
 * 401(k) Employer Match Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { EmployerMatch401kInput } from '../../../schemas/401k-match.js';
import { EmployerMatch401kOptimizer } from '../401k-match.js';

describe('EmployerMatch401kOptimizer', () => {
  const baseInput: EmployerMatch401kInput = {
    planDetails: {
      employerMatch: 0.5,
      matchLimit: 0.06,
      vestingSchedule: 'immediate',
      vestingYears: 0,
      currentVestingPercentage: 1,
    },
    employeeInfo: {
      annualSalary: 100000,
      currentContribution: 0.03,
      currentBalance: 50000,
      yearsOfService: 5,
    },
    analysis: {
      includeMaximization: true,
      includeVestingAnalysis: true,
      includeTaxAnalysis: true,
    },
  };

  it('should calculate current match', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.currentMatch).toBeDefined();
    expect(result.currentMatch.annualMatch).toBeGreaterThan(0);
  });

  it('should calculate maximum match', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.maximumMatch).toBeDefined();
    expect(result.maximumMatch.annualMatch).toBeGreaterThan(result.currentMatch.annualMatch);
  });

  it('should optimize contribution when requested', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.optimization).toBeDefined();
    expect(result.optimization?.optimalContributionPercent).toBeGreaterThanOrEqual(0);
    expect(result.optimization?.optimalContributionPercent).toBeLessThanOrEqual(1);
  });

  it('should analyze vesting when requested', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.vestingAnalysis).toBeDefined();
    expect(result.vestingAnalysis?.vestedMatch).toBeGreaterThanOrEqual(0);
  });

  it('should analyze tax benefits when requested', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.taxAnalysis).toBeDefined();
    expect(result.taxAnalysis?.taxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should flag when not maximizing match', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.currentMatch.isMaximized).toBe(false);
    expect(result.recommendations.join(' ')).toContain('Not maximizing employer match');
    expect(result.summary.matchLeftOnTable).toBeGreaterThan(0);
  });

  it('should recognize when match is maximized', () => {
    const input: EmployerMatch401kInput = {
      ...baseInput,
      employeeInfo: {
        ...baseInput.employeeInfo,
        currentContribution: 0.06,
      },
    };

    const result = EmployerMatch401kOptimizer.analyze(input);
    expect(result.currentMatch.isMaximized).toBe(true);
    expect(result.recommendations.join(' ')).toContain('Maximizing employer match');
  });

  it('should compute optimization ROI when additional contribution is needed', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.optimization).toBeDefined();
    expect(result.optimization!.additionalContributionNeeded).toBeGreaterThan(0);
    expect(result.optimization!.roi).toBeGreaterThan(0);
  });

  it('should handle immediate vesting', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput);
    expect(result.vestingAnalysis?.vestingStatus).toBe('Fully Vested');
    expect(result.vestingAnalysis?.yearsToFullVesting).toBe(0);
  });

  it('should handle cliff vesting when not fully vested', () => {
    const input: EmployerMatch401kInput = {
      ...baseInput,
      planDetails: {
        ...baseInput.planDetails,
        vestingSchedule: 'cliff',
        vestingYears: 3,
      },
      employeeInfo: {
        ...baseInput.employeeInfo,
        yearsOfService: 1,
      },
    };

    const result = EmployerMatch401kOptimizer.analyze(input);
    expect(result.vestingAnalysis?.vestedMatch).toBe(0);
    expect(result.vestingAnalysis?.unvestedMatch).toBeGreaterThan(0);
    expect(result.vestingAnalysis?.vestingStatus).toContain('Cliff vesting');
    expect(result.vestingAnalysis?.yearsToFullVesting).toBe(2);
  });

  it('should handle graded vesting percentage', () => {
    const input: EmployerMatch401kInput = {
      ...baseInput,
      planDetails: {
        ...baseInput.planDetails,
        vestingSchedule: 'graded',
        vestingYears: 4,
      },
      employeeInfo: {
        ...baseInput.employeeInfo,
        yearsOfService: 2,
      },
    };

    const result = EmployerMatch401kOptimizer.analyze(input);
    expect(result.vestingAnalysis?.vestingStatus).toContain('Graded vesting');
    expect(result.vestingAnalysis?.yearsToFullVesting).toBe(2);
    expect(result.vestingAnalysis?.vestedMatch).toBeGreaterThan(0);
    expect(result.vestingAnalysis?.unvestedMatch).toBeGreaterThan(0);
  });

  it('should omit optional analyses when disabled', () => {
    const input: EmployerMatch401kInput = {
      ...baseInput,
      analysis: {
        includeMaximization: false,
        includeVestingAnalysis: false,
        includeTaxAnalysis: false,
      },
    };

    const result = EmployerMatch401kOptimizer.analyze(input);
    expect(result.optimization).toBeUndefined();
    expect(result.vestingAnalysis).toBeUndefined();
    expect(result.taxAnalysis).toBeUndefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should perform comprehensive analysis', () => {
    const result = EmployerMatch401kOptimizer.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.currentMatch).toBeDefined();
    expect(result.maximumMatch).toBeDefined();
    expect(result.optimization).toBeDefined();
    expect(result.vestingAnalysis).toBeDefined();
    expect(result.taxAnalysis).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });
});
