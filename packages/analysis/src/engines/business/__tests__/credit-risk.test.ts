/**
 * Credit Risk Analyzer Tests
 */

import { describe, expect, it } from 'vitest';
import type { CreditRiskInput } from '../../../schemas/credit-risk.js';
import { CreditRiskAnalyzer } from '../credit-risk.js';

describe('CreditRiskAnalyzer', () => {
  const baseInput: CreditRiskInput = {
    borrowerInfo: {
      companyName: 'Test Company',
      industry: 'Technology',
      yearsInBusiness: 10,
    },
    financials: {
      annualRevenue: 10000000,
      ebitda: 2000000,
      netIncome: 1000000,
      totalDebt: 5000000,
      totalAssets: 15000000,
      cashAndEquivalents: 2000000,
      currentLiabilities: 3000000,
    },
    debtInfo: {
      exposureAtDefault: 5000000,
      currentRating: 'BBB',
      recoveryRate: 0.4,
    },
    analysis: {
      includePD: true,
      includeLGD: true,
      includeEL: true,
      includeStressTesting: false,
    },
  };

  const analyze = (overrides: Partial<CreditRiskInput>) =>
    CreditRiskAnalyzer.analyze({
      ...baseInput,
      ...overrides,
      borrowerInfo: {
        ...baseInput.borrowerInfo,
        ...(overrides.borrowerInfo ?? {}),
      },
      financials: {
        ...baseInput.financials,
        ...(overrides.financials ?? {}),
      },
      debtInfo: {
        ...baseInput.debtInfo,
        ...(overrides.debtInfo ?? {}),
      },
      analysis: {
        ...baseInput.analysis,
        ...(overrides.analysis ?? {}),
      },
    } as CreditRiskInput);

  it('should calculate financial ratios', () => {
    const result = analyze({});
    expect(result).toBeDefined();
    expect(result.ratios).toBeDefined();
    expect(result.ratios.debtToEquity).toBeGreaterThan(0);
    expect(result.ratios.debtToEBITDA).toBeGreaterThan(0);
  });

  it('should calculate Probability of Default when requested', () => {
    const result = analyze({});
    expect(result.probabilityOfDefault).toBeDefined();
    expect(result.probabilityOfDefault?.pd).toBeGreaterThanOrEqual(0);
    expect(result.probabilityOfDefault?.pd).toBeLessThanOrEqual(1);
  });

  it('should calculate Loss Given Default when requested', () => {
    const result = analyze({});
    expect(result.lossGivenDefault).toBeDefined();
    expect(result.lossGivenDefault?.lgd).toBeGreaterThanOrEqual(0);
    expect(result.lossGivenDefault?.lgd).toBeLessThanOrEqual(1);
  });

  it('should calculate Expected Loss when requested', () => {
    const result = analyze({});
    expect(result.expectedLoss).toBeDefined();
    expect(result.expectedLoss?.el).toBeGreaterThanOrEqual(0);
  });

  it('should assess credit rating', () => {
    const result = analyze({});
    expect(result.creditRating).toBeDefined();
    expect(result.creditRating.rating).toBeDefined();
    expect(result.creditRating.riskLevel).toMatch(/low|medium|high/);
  });

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = analyze({});
    
    // Check summary
    expect(result.summary).toBeDefined();
    expect(result.summary.pd).toBeDefined();
    expect(result.summary.lgd).toBeDefined();
    expect(result.summary.expectedLoss).toBeDefined();
    expect(result.summary.creditRating).toBeDefined();
    expect(result.summary.riskLevel).toBeDefined();
    
    // Check recommendations
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(typeof result.recommendations[0]).toBe('string');
  });

  it('should omit optional sections when disabled', () => {
    const result = analyze({
      analysis: {
        includePD: false,
        includeLGD: false,
        includeEL: false,
        includeStressTesting: false,
      },
    }) as any;

    expect(result.probabilityOfDefault).toBeUndefined();
    expect(result.lossGivenDefault).toBeUndefined();
    expect(result.expectedLoss).toBeUndefined();
    expect(result.stressTesting).toBeUndefined();
    expect(result.summary.pd).toBeUndefined();
    expect(result.summary.lgd).toBeUndefined();
    expect(result.summary.expectedLoss).toBeUndefined();
    expect(result.creditRating).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('should cap PD at 50% and produce Very High rating for extreme risk', () => {
    const result = analyze({
      borrowerInfo: { yearsInBusiness: 1 },
      financials: {
        totalDebt: 50_000_000,
        totalAssets: 10_000_000,
        ebitda: 1_000_000,
        cashAndEquivalents: 0,
        currentLiabilities: 5_000_000,
      },
    }) as any;

    expect(result.ratios.debtToEquity).toBe(999);
    expect(result.probabilityOfDefault.pd).toBe(0.5);
    expect(result.probabilityOfDefault.pdRating).toBe('Very High');
    expect(result.probabilityOfDefault.factors.join('\n')).toContain('Very high debt-to-EBITDA');
    expect(result.probabilityOfDefault.factors.join('\n')).toContain('Cannot cover interest payments');
    expect(result.probabilityOfDefault.factors.join('\n')).toContain('Current ratio below 1.0');
    expect(result.probabilityOfDefault.factors.join('\n')).toContain('Newer business');
  });

  it('should vary LGD interpretation across recovery rates', () => {
    const low = analyze({ debtInfo: { recoveryRate: 0.8 } }) as any;
    expect(low.lossGivenDefault.lgd).toBeCloseTo(0.2);
    expect(low.lossGivenDefault.interpretation).toContain('Low loss');

    const moderate = analyze({ debtInfo: { recoveryRate: 0.6 } }) as any;
    expect(moderate.lossGivenDefault.lgd).toBeCloseTo(0.4);
    expect(moderate.lossGivenDefault.interpretation).toContain('Moderate');

    const high = analyze({ debtInfo: { recoveryRate: 0.2 } }) as any;
    expect(high.lossGivenDefault.lgd).toBeCloseTo(0.8);
    expect(high.lossGivenDefault.interpretation).toContain('High loss');
  });

  it('should vary expected loss interpretation across PD/LGD combinations', () => {
    const low = analyze({
      debtInfo: { recoveryRate: 0.8, exposureAtDefault: 1_000_000 },
      financials: {
        totalDebt: 1_000_000,
        ebitda: 2_000_000,
        cashAndEquivalents: 500_000,
        totalAssets: 5_000_000,
        currentLiabilities: 1_000_000,
      },
    }) as any;
    expect(low.probabilityOfDefault.pd).toBeCloseTo(0.02);
    expect(low.expectedLoss.interpretation).toContain('Low expected loss');

    const moderate = analyze({
      debtInfo: { recoveryRate: 0.6, exposureAtDefault: 1_000_000 },
      financials: {
        totalDebt: 5_000_000,
        ebitda: 900_000,
        cashAndEquivalents: 500_000,
        totalAssets: 10_000_000,
        currentLiabilities: 1_000_000,
      },
    }) as any;
    expect(moderate.probabilityOfDefault.pd).toBeCloseTo(0.1);
    expect(moderate.expectedLoss.interpretation).toContain('Moderate expected loss');

    const high = analyze({
      debtInfo: { recoveryRate: 0.6, exposureAtDefault: 1_000_000 },
      financials: {
        totalDebt: 20_000_000,
        ebitda: 1_000_000,
        cashAndEquivalents: 2_000_000,
        totalAssets: 25_000_000,
        currentLiabilities: 2_000_000,
      },
    }) as any;
    expect(high.probabilityOfDefault.pd).toBeCloseTo(0.27);
    expect(high.expectedLoss.interpretation).toContain('High expected loss');
  });

  it('should run stress testing and use default PD when PD is disabled', () => {
    const result = analyze({
      analysis: {
        includePD: false,
        includeLGD: true,
        includeEL: false,
        includeStressTesting: true,
      },
    }) as any;

    expect(result.probabilityOfDefault).toBeUndefined();
    expect(result.stressTesting).toBeDefined();
    expect(result.stressTesting.scenarios).toHaveLength(3);
    // Default PD is 0.02; mild recession multiplier: (1 + 0.15*2) = 1.3
    expect(result.stressTesting.scenarios[0].stressedPD).toBeCloseTo(0.026);
  });

  it('should apply moderate interest coverage adjustment when interest coverage is between 1.5 and 2.0', () => {
    const result = analyze({
      financials: {
        totalDebt: 20_000_000,
        ebitda: 1_800_000,
        cashAndEquivalents: 2_000_000,
        totalAssets: 25_000_000,
        currentLiabilities: 2_000_000,
      },
    }) as any;

    expect(result.ratios.interestCoverage).toBeGreaterThanOrEqual(1.5);
    expect(result.ratios.interestCoverage).toBeLessThan(2);
    expect(result.probabilityOfDefault.factors.join('\n')).toContain('Moderate interest coverage');
  });

  it("should produce an 'A' credit rating for moderate leverage but elevated PD", () => {
    const result = analyze({
      borrowerInfo: { yearsInBusiness: 1 },
      financials: {
        totalDebt: 3_000_000,
        ebitda: 1_000_000,
        cashAndEquivalents: 0,
        totalAssets: 2_000_000,
        currentLiabilities: 2_000_000,
      },
    }) as any;

    expect(result.probabilityOfDefault.pd).toBeCloseTo(0.2);
    expect(result.creditRating.rating).toBe('A');
    expect(result.creditRating.riskLevel).toBe('low');
  });

  it("should produce a 'BBB' credit rating for higher leverage and elevated PD", () => {
    const result = analyze({
      borrowerInfo: { yearsInBusiness: 1 },
      financials: {
        totalDebt: 5_000_000,
        ebitda: 1_000_000,
        cashAndEquivalents: 0,
        totalAssets: 1_000_000,
        currentLiabilities: 2_000_000,
      },
    }) as any;

    expect(result.probabilityOfDefault.pd).toBeGreaterThan(0.15);
    expect(result.creditRating.rating).toBe('BBB');
    expect(result.creditRating.riskLevel).toBe('medium');
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = analyze({}) as any;

      expect(result).toHaveProperty('ratios');
      expect(result).toHaveProperty('probabilityOfDefault');
      expect(result).toHaveProperty('lossGivenDefault');
      expect(result).toHaveProperty('expectedLoss');
      expect(result).toHaveProperty('creditRating');
      expect(result).toHaveProperty('stressTesting');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('Credit rating scoring (internal)', () => {
    it("should map score in the 50s to a 'BB' rating", () => {
      const assessed = (CreditRiskAnalyzer as any).assessCreditRating(
        { debtToEBITDA: 5, interestCoverage: 10 },
        { pd: 0.31 }
      ) as any;

      expect(assessed.rating).toBe('BB');
      expect(assessed.riskLevel).toBe('medium');
      expect(assessed.factors.join('\n')).toContain('High debt-to-EBITDA');
      expect(assessed.factors.join('\n')).toContain('Very high probability of default');
    });
  });
});
