import { describe, it, expect } from 'vitest';
import { BusinessFinancialHealthAnalyzer } from '../business-financial-health';
import { BusinessFinancialHealthInput } from '../../../schemas/business-financial-health';

describe('BusinessFinancialHealthAnalyzer', () => {
  const basicInput: BusinessFinancialHealthInput = {
    businessInfo: {
      yearsInBusiness: 5,
      industry: 'Technology',
      employeeCount: 10,
    },
    financials: {
      annualRevenue: 1000000,
      annualEBITDA: 200000,
      currentDebt: 100000,
      monthlyDebtPayments: 2000,
      cashOnHand: 50000,
      accountsReceivable: 20000,
      accountsPayable: 10000,
      creditScore: 750,
    },
  };

  it('should calculate financial health score', () => {
    const result = BusinessFinancialHealthAnalyzer.analyze(basicInput);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should return all required fields in the analysis result', () => {
    const result = BusinessFinancialHealthAnalyzer.analyze(basicInput);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('strengths');
    expect(result).toHaveProperty('weaknesses');
    expect(result).toHaveProperty('interpretation');
  });
});
