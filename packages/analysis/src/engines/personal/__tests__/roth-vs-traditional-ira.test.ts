/**
 * Roth vs Traditional IRA Tests
 */

import { describe, expect, it } from 'vitest';
import type { RothVsTraditionalIRAInput } from '../../../schemas/roth-vs-traditional-ira.js';
import { RothVsTraditionalIRACalculator } from '../roth-vs-traditional-ira.js';

describe('RothVsTraditionalIRACalculator', () => {
  const baseInput: RothVsTraditionalIRAInput = {
    personalInfo: {
      age: 35,
      retirementAge: 65,
      currentTaxBracket: 0.22,
      expectedRetirementTaxBracket: 0.15,
    },
    contributionDetails: {
      annualContribution: 6500,
      catchUpContribution: 0,
      yearsToContribute: 30,
    },
    accountDetails: {
      currentTraditionalBalance: 0,
      currentRothBalance: 0,
      expectedReturn: 0.07,
    },
    taxInfo: {
      currentMarginalTaxRate: 0.22,
      expectedRetirementMarginalTaxRate: 0.15,
      stateTaxRate: 0.05,
      stateTaxDeduction: false,
    },
    withdrawalStrategy: {
      annualWithdrawalAmount: 50000,
      withdrawalStartAge: 65,
      includeRequiredMinimumDistributions: true,
      rmdsStartAge: 73,
    },
    analysis: {
      includeConversionAnalysis: true,
      includeTaxBracketOptimization: true,
      projectionYears: 30,
    },
  };

  it('should calculate Roth vs Traditional comparison', () => {
    const result = RothVsTraditionalIRACalculator.analyze(baseInput) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.rothFinalValue).toBeGreaterThan(0);
    expect(result.summary.traditionalFinalValue).toBeGreaterThan(0);
  });

  it('should calculate after-tax values', () => {
    const result = RothVsTraditionalIRACalculator.analyze(baseInput) as any;
    expect(result.summary.rothAfterTax).toBeGreaterThan(0);
    expect(result.summary.traditionalAfterTax).toBeGreaterThan(0);
  });

  it('should provide recommendation', () => {
    const result = RothVsTraditionalIRACalculator.analyze(baseInput) as any;
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should include conversion analysis when requested', () => {
    const result = RothVsTraditionalIRACalculator.analyze(baseInput) as any;
    expect(result.conversionAnalysis).toBeDefined();
  });

  it('should calculate tax bracket optimization', () => {
    const result = RothVsTraditionalIRACalculator.analyze(baseInput) as any;
    expect(result.taxAnalysis).toBeDefined();
  });

  it('should recommend Traditional IRA when after-tax values are equal', () => {
    const input: RothVsTraditionalIRAInput = {
      ...baseInput,
      taxInfo: {
        ...baseInput.taxInfo,
        expectedRetirementMarginalTaxRate: 0,
        stateTaxRate: 0,
      },
    };

    const result = RothVsTraditionalIRACalculator.analyze(input) as any;
    expect(result.recommendations).toContain(
      'Traditional IRA provides better after-tax value in your situation'
    );
  });

  it('should recommend Roth contributions when retirement tax rate is higher', () => {
    const input: RothVsTraditionalIRAInput = {
      ...baseInput,
      taxInfo: {
        ...baseInput.taxInfo,
        currentMarginalTaxRate: 0.1,
        expectedRetirementMarginalTaxRate: 0.25,
      },
    };

    const result = RothVsTraditionalIRACalculator.analyze(input) as any;
    expect(result.recommendations).toContain(
      'Consider Roth contributions since retirement tax rate may be higher'
    );
  });
});

