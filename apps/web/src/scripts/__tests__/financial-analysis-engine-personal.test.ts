import { describe, expect, it } from 'vitest';
import { FinancialAnalysisEngine } from '../analysis/financial-analysis-engine';
import {
  analyzeDebtPayoffFromResult,
  analyzeRetirementFromResult,
} from '../analysis/financial-analysis-engine-personal';

describe('financial-analysis-engine-personal', () => {
  it('builds debt payoff insights from engine result shape', () => {
    const analysis = analyzeDebtPayoffFromResult({
      input: {
        totalDebtBalance: '12000',
        extraMonthlyPayment: '200',
        strategy: 'avalanche',
      },
      summary: {
        strategy: 'avalanche',
        totalMonthsToPayoff: 24,
        totalInterestPaid: '1800',
        monthlyPayment: '650',
      },
      comparisonSavings: '350',
    });

    expect(analysis.insights.length).toBeGreaterThanOrEqual(2);
    expect(analysis.summary.totalMonthsToPayoff).toBe(24);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });

  it('builds retirement insights from simple calculator result', () => {
    const analysis = analyzeRetirementFromResult({
      yearsToRetirement: 30,
      projectedBalanceAtRetirement: 850000,
      inflationAdjustedBalance: 420000,
      monthlyRetirementIncome: 2800,
      replacementRatio: 0.62,
      savingsRate: 0.12,
      annualContribution: 12000,
    });

    expect(analysis.insights.some((i) => i.title.includes('replacement'))).toBe(true);
    expect(analysis.riskAssessment.overallRisk).toBe('medium');
  });

  it('routes debt-payoff through analyzeForModelType', () => {
    const analysis = FinancialAnalysisEngine.analyzeForModelType('debt-payoff', {
      summary: { totalMonthsToPayoff: 18, totalInterestPaid: '900', strategy: 'snowball' },
      input: { totalDebtBalance: '5000' },
      comparisonSavings: '0',
    });

    expect(analysis.insights.length).toBeGreaterThan(0);
  });
});
