import { describe, expect, it } from 'vitest';
import type { BusinessFinancialHealthInput } from '../../../schemas/business-financial-health.js';
import { BusinessFinancialHealthAnalyzer } from '../business-financial-health.js';

describe('BusinessFinancialHealthAnalyzer', () => {
  const baseInput: BusinessFinancialHealthInput = {
    businessInfo: {
      yearsInBusiness: 6,
      industry: 'Technology',
      employeeCount: 25,
    },
    financials: {
      annualRevenue: 1_000_000,
      annualEBITDA: 200_000,
      currentDebt: 200_000,
      monthlyDebtPayments: 2000,
      cashOnHand: 150_000,
      accountsReceivable: 50_000,
      accountsPayable: 50_000,
      creditScore: 740,
    },
  };

  it('returns summary with score and metrics', () => {
    const result = BusinessFinancialHealthAnalyzer.analyze(baseInput) as any;

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.metrics).toBeDefined();
    expect(result.metrics.debtToEBITDA).toBeGreaterThan(0);
    expect(result.metrics.currentRatio).toBeGreaterThan(0);
    expect(result.metrics.quickRatio).toBeGreaterThan(0);
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.weaknesses).toBeInstanceOf(Array);
    expect(result.interpretation).toBeTruthy();
  });

  it('rewards low debt-to-EBITDA', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        currentDebt: 100_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.debtToEBITDA).toBeLessThan(2);
    expect(result.strengths.join(' ')).toContain('Low debt-to-EBITDA');
  });

  it('penalizes high debt-to-EBITDA > 5', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        annualEBITDA: 50_000,
        currentDebt: 400_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.debtToEBITDA).toBeGreaterThan(5);
    expect(result.weaknesses.join(' ')).toContain('High debt-to-EBITDA');
  });

  it('penalizes moderate debt-to-EBITDA > 3', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        annualEBITDA: 100_000,
        currentDebt: 350_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.debtToEBITDA).toBeGreaterThan(3);
    expect(result.metrics.debtToEBITDA).toBeLessThanOrEqual(5);
    expect(result.weaknesses.join(' ')).toContain('Moderate debt-to-EBITDA');
  });

  it('rewards strong current ratio', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        cashOnHand: 300_000,
        accountsReceivable: 100_000,
        accountsPayable: 100_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.currentRatio).toBeGreaterThan(2);
    expect(result.strengths.join(' ')).toContain('current ratio');
  });

  it('penalizes current ratio below 1.0', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        cashOnHand: 10_000,
        accountsReceivable: 5_000,
        accountsPayable: 50_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.currentRatio).toBeLessThan(1);
    expect(result.weaknesses.join(' ')).toContain('Current ratio below 1.0');
  });

  it('rewards strong quick ratio', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        cashOnHand: 200_000,
        accountsPayable: 100_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.quickRatio).toBeGreaterThan(1.5);
    expect(result.strengths.join(' ')).toContain('quick ratio');
  });

  it('penalizes low quick ratio below 0.5', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        cashOnHand: 10_000,
        accountsPayable: 50_000,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.quickRatio).toBeLessThan(0.5);
    expect(result.weaknesses.join(' ')).toContain('Low quick ratio');
  });

  it('rewards established business history', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      businessInfo: {
        ...baseInput.businessInfo,
        yearsInBusiness: 10,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.strengths.join(' ')).toContain('Established business history');
  });

  it('penalizes newer businesses under 2 years', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      businessInfo: {
        ...baseInput.businessInfo,
        yearsInBusiness: 1,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.weaknesses.join(' ')).toContain('Newer business');
  });

  it('rewards excellent credit score', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        creditScore: 780,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.strengths.join(' ')).toContain('Excellent credit score');
  });

  it('penalizes low credit score', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        creditScore: 580,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.weaknesses.join(' ')).toContain('Low credit score');
  });

  it('handles zero accounts payable by treating ratios as high', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        accountsPayable: 0,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.currentRatio).toBeGreaterThan(100);
    expect(result.metrics.quickRatio).toBeGreaterThan(100);
  });

  it('handles zero EBITDA as extreme leverage', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      financials: {
        ...baseInput.financials,
        annualEBITDA: 0,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;

    expect(result.metrics.debtToEBITDA).toBe(999);
  });

  it('interprets excellent financial health at high scores', () => {
    const result = BusinessFinancialHealthAnalyzer.analyze(baseInput) as any;
    expect(result.interpretation).toContain('Excellent financial health');
  });

  it('interprets good financial health at mid scores', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      businessInfo: {
        ...baseInput.businessInfo,
        yearsInBusiness: 3,
      },
      financials: {
        ...baseInput.financials,
        annualEBITDA: 100_000,
        currentDebt: 400_000,
        cashOnHand: 40_000,
        accountsReceivable: 0,
        accountsPayable: 50_000,
        creditScore: undefined,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;
    expect(result.interpretation).toContain('Good financial health');
  });

  it('interprets moderate financial health near the lower threshold', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      businessInfo: {
        ...baseInput.businessInfo,
        yearsInBusiness: 3,
      },
      financials: {
        ...baseInput.financials,
        annualEBITDA: 100_000,
        currentDebt: 400_000,
        cashOnHand: 20_000,
        accountsReceivable: 20_000,
        accountsPayable: 50_000,
        creditScore: undefined,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;
    expect(result.interpretation).toContain('Moderate financial health');
  });

  it('interprets weak financial health at low scores', () => {
    const input: BusinessFinancialHealthInput = {
      ...baseInput,
      businessInfo: {
        ...baseInput.businessInfo,
        yearsInBusiness: 1,
      },
      financials: {
        ...baseInput.financials,
        annualEBITDA: 50_000,
        currentDebt: 400_000,
        cashOnHand: 10_000,
        accountsReceivable: 15_000,
        accountsPayable: 50_000,
        creditScore: 580,
      },
    };

    const result = BusinessFinancialHealthAnalyzer.analyze(input) as any;
    expect(result.interpretation).toContain('Weak financial health');
  });
});
