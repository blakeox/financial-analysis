/**
 * Social Security Optimizer Tests
 */

import { describe, expect, it } from 'vitest';
import type { SocialSecurityInput } from '../../../schemas/social-security.js';
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
});
