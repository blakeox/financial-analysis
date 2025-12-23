/**
 * HSA Optimization Tests
 */

import { describe, expect, it } from 'vitest';
import type { HSAOptimizationInput } from '../../../schemas/hsa-optimization.js';
import { HSAOptimizer } from '../hsa-optimization.js';

describe('HSAOptimizer', () => {
  const baseInput: HSAOptimizationInput = {
    personalInfo: {
      age: 35,
      filingStatus: 'single',
      currentHSABalance: 5000,
    },
    contributionLimits: {
      individualLimit: 4150,
      familyLimit: 8300,
      catchUpContribution: 1000,
    },
    hsaDetails: {
      annualContribution: 3000,
      employerContribution: 500,
      investmentReturn: 0.07,
    },
    medicalExpenses: {
      annualMedicalExpenses: 2000,
      expectedRetirementMedicalCosts: 300000,
      yearsUntilRetirement: 30,
    },
    strategy: {
      optimizeFor: 'hybrid',
      useForCurrentExpenses: false,
      saveReceipts: true,
    },
    taxInfo: {
      federalTaxRate: 0.22,
      stateTaxRate: 0.05,
      ficaTaxRate: 0.0765,
    },
  };

  it('should calculate HSA optimization analysis', () => {
    const result = HSAOptimizer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalTaxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should calculate contribution optimization', () => {
    const result = HSAOptimizer.analyze(baseInput);
    expect(result.contributionOptimization).toBeDefined();
    expect(result.contributionOptimization.optimalContribution).toBeGreaterThanOrEqual(0);
  });

  it('should calculate retirement healthcare projections', () => {
    const result = HSAOptimizer.analyze(baseInput);
    expect(result.retirementProjections).toBeDefined();
    expect(result.retirementProjections.projectedBalance).toBeGreaterThanOrEqual(0);
  });

  it('should calculate tax savings breakdown', () => {
    const result = HSAOptimizer.analyze(baseInput);
    expect(result.taxSavings).toBeDefined();
    expect(result.taxSavings.annualTaxSavings).toBeGreaterThanOrEqual(0);
  });

  it('should provide recommendations', () => {
    const result = HSAOptimizer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });
});

