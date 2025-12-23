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

  it('should calculate financial ratios', () => {
    const result = CreditRiskAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.ratios).toBeDefined();
    expect(result.ratios.debtToEquity).toBeGreaterThan(0);
    expect(result.ratios.debtToEBITDA).toBeGreaterThan(0);
  });

  it('should calculate Probability of Default when requested', () => {
    const result = CreditRiskAnalyzer.analyze(baseInput);
    expect(result.probabilityOfDefault).toBeDefined();
    expect(result.probabilityOfDefault?.pd).toBeGreaterThanOrEqual(0);
    expect(result.probabilityOfDefault?.pd).toBeLessThanOrEqual(1);
  });

  it('should calculate Loss Given Default when requested', () => {
    const result = CreditRiskAnalyzer.analyze(baseInput);
    expect(result.lossGivenDefault).toBeDefined();
    expect(result.lossGivenDefault?.lgd).toBeGreaterThanOrEqual(0);
    expect(result.lossGivenDefault?.lgd).toBeLessThanOrEqual(1);
  });

  it('should calculate Expected Loss when requested', () => {
    const result = CreditRiskAnalyzer.analyze(baseInput);
    expect(result.expectedLoss).toBeDefined();
    expect(result.expectedLoss?.el).toBeGreaterThanOrEqual(0);
  });

  it('should assess credit rating', () => {
    const result = CreditRiskAnalyzer.analyze(baseInput);
    expect(result.creditRating).toBeDefined();
    expect(result.creditRating.rating).toBeDefined();
    expect(result.creditRating.riskLevel).toMatch(/low|medium|high/);
  });

  it('should provide comprehensive analysis with summary and recommendations', () => {
    const result = CreditRiskAnalyzer.analyze(baseInput);
    
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

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = CreditRiskAnalyzer.analyze(baseInput) as any;

      expect(result).toHaveProperty('ratios');
      expect(result).toHaveProperty('probabilityOfDefault');
      expect(result).toHaveProperty('lossGivenDefault');
      expect(result).toHaveProperty('expectedLoss');
      expect(result).toHaveProperty('creditRating');
      expect(result).toHaveProperty('stressTesting');
      expect(result).toHaveProperty('recommendations');
    });
  });
});
