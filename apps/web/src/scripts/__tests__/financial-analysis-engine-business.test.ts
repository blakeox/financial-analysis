import { describe, expect, it } from 'vitest';
import { FinancialAnalysisEngine } from '../analysis/financial-analysis-engine';
import { hasAnalysisEngine } from '../analysis/analysis-event-contract';
import {
  analyzeMaAnalysisFromResult,
  analyzeUnitEconomicsFromResult,
} from '../analysis/financial-analysis-engine-business';

describe('financial-analysis-engine-business', () => {
  it('registers business model types for impact summary', () => {
    expect(hasAnalysisEngine('unit-economics')).toBe(true);
    expect(hasAnalysisEngine('business-valuation')).toBe(true);
    expect(hasAnalysisEngine('dcf-valuation')).toBe(true);
    expect(hasAnalysisEngine('ma-analysis')).toBe(true);
    expect(hasAnalysisEngine('student-loans')).toBe(true);
  });

  it('builds unit economics insights from engine metrics', () => {
    const analysis = analyzeUnitEconomicsFromResult({
      ltvToCacRatio: 2.1,
      cac: 400,
      ltv: 840,
      paybackPeriodMonths: 14,
      churnRate: 4.2,
      grossMarginPercent: 72,
      summary: { overallHealth: 'needs-improvement' },
      insights: ['Improve retention to lift LTV'],
      recommendations: ['Test annual plans to reduce churn'],
    });

    expect(analysis.insights.some((i) => i.title.includes('LTV:CAC'))).toBe(true);
    expect(analysis.recommendations.length).toBeGreaterThan(0);
  });

  it('builds M&A insights from simple client result', () => {
    const analysis = analyzeMaAnalysisFromResult({
      transactionValue: 50_000_000,
      premiumPercentage: 25,
      epsAccretionPercentage: -3.5,
      totalSynergies: 5_000_000,
      leverageRatio: 3.8,
    });

    expect(analysis.insights.some((i) => i.title.includes('EPS'))).toBe(true);
    expect(analysis.riskAssessment.overallRisk).toBe('high');
  });

  it('unwraps nested student loan payload', () => {
    const analysis = FinancialAnalysisEngine.analyzeForModelType('student-loans', {
      result: {
        summary: { totalMonthsToPayoff: 96, totalInterestPaid: '4200' },
        input: { totalBalance: '35000', paymentStrategy: 'avalanche' },
      },
      forgivenessInsights: { eligible: true, summary: 'May qualify for PSLF' },
    });

    expect(analysis.insights.length).toBeGreaterThanOrEqual(3);
    expect(analysis.summary.totalMonthsToPayoff).toBe(96);
  });
});
