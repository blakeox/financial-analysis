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
