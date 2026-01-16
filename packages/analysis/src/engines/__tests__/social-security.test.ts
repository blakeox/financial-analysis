/**
 * Social Security Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { SocialSecurityInput } from '../../schemas/social-security.js';
import { SocialSecurityOptimizer } from '../social-security.js';

describe('SocialSecurityOptimizer', () => {
  const baseInput: SocialSecurityInput = {
    personalInfo: {
      birthDate: '1960-01-01',
      currentAge: 65,
      fullRetirementAge: 67,
      lifeExpectancy: 85,
    },
    earnings: {
      currentAnnualEarnings: 75000,
      averageLifetimeEarnings: 70000,
    },
    maritalStatus: 'single',
    claimingStrategy: {
      primaryClaimingAge: 67,
    },
    goals: {
      optimizeFor: 'maximum-lifetime',
      includeBreakEvenAnalysis: true,
    },
  };

  it('should calculate PIA correctly', () => {
    const result = SocialSecurityOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.primaryInsuranceAmount).toBeGreaterThan(0);
  });

  it('should provide benefit scenarios for different claiming ages', () => {
    const result = SocialSecurityOptimizer.analyze(baseInput);
    expect(result.benefitScenarios).toBeDefined();
    expect(Array.isArray(result.benefitScenarios)).toBe(true);
    expect(result.benefitScenarios.length).toBeGreaterThan(0);
  });

  it('should calculate lifetime benefits', () => {
    const result = SocialSecurityOptimizer.analyze(baseInput);
    expect(result.lifetimeBenefits).toBeDefined();
    expect(Array.isArray(result.lifetimeBenefits)).toBe(true);
  });

  it('should include break-even analysis when requested', () => {
    const result = SocialSecurityOptimizer.analyze(baseInput);
    expect(result.breakEvenAnalysis).toBeDefined();
    expect(result.breakEvenAnalysis?.breakEvenAge).toBeGreaterThan(0);
  });

  it('should recommend optimal strategy', () => {
    const result = SocialSecurityOptimizer.analyze(baseInput);
    expect(result.optimalStrategy).toBeDefined();
    expect(result.optimalStrategy.optimalAge).toBeGreaterThanOrEqual(62);
    expect(result.optimalStrategy.optimalAge).toBeLessThanOrEqual(70);
  });

  it('should handle married status with spousal benefits', () => {
    const marriedInput: SocialSecurityInput = {
      ...baseInput,
      maritalStatus: 'married',
      spouseInfo: {
        birthDate: '1962-01-01',
        currentAge: 63,
        fullRetirementAge: 67,
        currentAnnualEarnings: 50000,
      },
    };
    const result = SocialSecurityOptimizer.analyze(marriedInput);
    expect(result.spousalBenefits).toBeDefined();
  });

  it('applies early and delayed claiming benefit adjustments', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      personalInfo: {
        ...baseInput.personalInfo,
        fullRetirementAge: 67,
      },
    });

    const early = result.benefitScenarios.find((s: { claimingAge: number }) => s.claimingAge === 62);
    const fra = result.benefitScenarios.find((s: { claimingAge: number }) => s.claimingAge === 67);
    const delayed = result.benefitScenarios.find((s: { claimingAge: number }) => s.claimingAge === 70);

    expect(early.monthlyBenefit).toBeLessThan(fra.monthlyBenefit);
    expect(delayed.monthlyBenefit).toBeGreaterThan(fra.monthlyBenefit);
  });

  it('skips break-even analysis when disabled', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      goals: {
        ...baseInput.goals,
        includeBreakEvenAnalysis: false,
      },
    });

    expect(result.breakEvenAnalysis).toBeUndefined();
    expect(result.summary.breakEvenAge).toBeUndefined();
  });

  it('recommends survivor benefit strategy when optimized', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      maritalStatus: 'married',
      spouseInfo: {
        birthDate: '1963-01-01',
        currentAge: 62,
        fullRetirementAge: 67,
        currentAnnualEarnings: 35000,
      },
      goals: {
        optimizeFor: 'survivor-benefits',
        includeBreakEvenAnalysis: true,
      },
    });

    expect(result.optimalStrategy.optimalAge).toBe(70);
    expect(result.recommendations.some((rec: string) => rec.includes('Survivor benefits'))).toBe(true);
  });

  it('adds spousal benefit recommendation when available', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      maritalStatus: 'married',
      spouseInfo: {
        birthDate: '1964-01-01',
        currentAge: 64,
        fullRetirementAge: 67,
        currentAnnualEarnings: 20000,
        averageLifetimeEarnings: 15000,
      },
    });

    expect(result.recommendations.some((rec: string) => rec.includes('Spousal benefits available'))).toBe(true);
  });

  it('defaults break-even age when benefits are zero', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      earnings: {
        currentAnnualEarnings: 0,
      },
      goals: {
        optimizeFor: 'maximum-lifetime',
        includeBreakEvenAnalysis: true,
      },
    });

    expect(result.summary.primaryInsuranceAmount).toBe(0);
    expect(result.breakEvenAnalysis?.breakEvenAge).toBe(80);
    expect(result.recommendations.join(' ')).toContain('0% increase');
  });

  it('optimizes for maximum monthly benefit when requested', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      earnings: {
        currentAnnualEarnings: 600000,
      },
      goals: {
        optimizeFor: 'maximum-monthly',
        includeBreakEvenAnalysis: false,
      },
    });

    expect(result.summary.primaryInsuranceAmount).toBe(3822);
    expect(result.optimalStrategy.optimalAge).toBe(70);
    expect(result.recommendations[0]).toContain('Delayed claiming for maximum monthly benefit');
  });

  it('chooses early claiming when life expectancy is short', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      personalInfo: {
        ...baseInput.personalInfo,
        lifeExpectancy: 68,
      },
      goals: {
        optimizeFor: 'maximum-lifetime',
        includeBreakEvenAnalysis: true,
      },
    });

    expect(result.optimalStrategy.optimalAge).toBe(62);
    expect(result.optimalStrategy.strategy).toContain('Early claiming maximizes lifetime benefits');
    expect(result.recommendations.join(' ')).toContain('Consider health and life expectancy');
  });

  it('chooses delayed claiming when life expectancy is long', () => {
    const result = SocialSecurityOptimizer.analyze({
      ...baseInput,
      personalInfo: {
        ...baseInput.personalInfo,
        lifeExpectancy: 100,
      },
      goals: {
        optimizeFor: 'maximum-lifetime',
        includeBreakEvenAnalysis: false,
      },
    });

    expect(result.optimalStrategy.optimalAge).toBe(70);
    expect(result.optimalStrategy.strategy).toContain('Delayed claiming maximizes lifetime benefits');
  });
});
