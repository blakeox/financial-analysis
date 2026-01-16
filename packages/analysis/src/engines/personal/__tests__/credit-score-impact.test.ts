/**
 * Credit Score Impact Tests
 */

import { describe, expect, it } from 'vitest';
import type { CreditScoreImpactInput } from '../../../schemas/credit-score-impact.js';
import { CreditScoreImpactAnalyzer } from '../credit-score-impact.js';

describe('CreditScoreImpactAnalyzer', () => {
  const baseInput: CreditScoreImpactInput = {
    currentCredit: {
      currentScore: 720,
      creditBureau: 'fico-8',
    },
    creditHistory: {
      averageAgeOfAccounts: 60,
      oldestAccountAge: 120,
      totalAccounts: 10,
      openAccounts: 5,
    },
    paymentHistory: {
      onTimePayments: 100,
      latePayments30Days: 0,
      latePayments60Days: 0,
      latePayments90Days: 0,
      collections: 0,
      bankruptcies: 0,
    },
    creditUtilization: {
      totalCreditLimit: 50000,
      totalCreditUsed: 15000,
      utilizationPercentage: 0.3,
      individualCardUtilization: [],
    },
    creditMix: {
      creditCards: 5,
      installmentLoans: 2,
      mortgages: 1,
      otherAccounts: 0,
    },
    recentActivity: {
      hardInquiries: 2,
      inquiriesLast6Months: 1,
      inquiriesLast12Months: 2,
      newAccounts: 1,
      accountsOpenedLast6Months: 0,
    },
    plannedActions: {
      payDownDebt: {
        amount: 5000,
        targetUtilization: 0.2,
      },
      openNewAccount: false,
      requestCreditLimitIncrease: false,
    },
    analysis: {
      includeScoreProjection: true,
      includeActionRecommendations: true,
      includeTimelineAnalysis: true,
      projectionMonths: 12,
    },
  };

  it('should calculate credit score impact analysis', () => {
    const result = CreditScoreImpactAnalyzer.analyze(baseInput);
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.currentScore).toBeGreaterThanOrEqual(300);
    expect(result.summary.currentScore).toBeLessThanOrEqual(850);
  });

  it('should project score changes', () => {
    const result = CreditScoreImpactAnalyzer.analyze(baseInput);
    expect(result.scoreProjection).toBeDefined();
    expect(result.scoreProjection.projectedScore).toBeGreaterThanOrEqual(300);
    expect(result.scoreProjection.projectedScore).toBeLessThanOrEqual(850);
  });

  it('should provide action recommendations', () => {
    const result = CreditScoreImpactAnalyzer.analyze(baseInput);
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should analyze utilization impact', () => {
    const result = CreditScoreImpactAnalyzer.analyze(baseInput);
    expect(result.utilizationAnalysis).toBeDefined();
  });

  it('should provide timeline analysis', () => {
    const result = CreditScoreImpactAnalyzer.analyze(baseInput);
    expect(result.timelineAnalysis).toBeDefined();
  });

  it('should classify utilization status across thresholds', () => {
    const excellent = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.05,
      },
    });
    const good = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.25,
      },
    });
    const fair = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.45,
      },
    });
    const poor = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.75,
      },
    });

    expect(excellent.utilizationAnalysis.status).toBe('excellent');
    expect(good.utilizationAnalysis.status).toBe('good');
    expect(fair.utilizationAnalysis.status).toBe('fair');
    expect(poor.utilizationAnalysis.status).toBe('poor');
  });

  it('should omit timeline analysis when projection is disabled', () => {
    const result = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      analysis: {
        includeScoreProjection: false,
        includeActionRecommendations: true,
        includeTimelineAnalysis: true,
        projectionMonths: 12,
      },
    });

    expect(result.scoreProjection).toBeUndefined();
    expect(result.timelineAnalysis).toBeUndefined();
  });

  it('should skip action and timeline analysis when disabled', () => {
    const result = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      analysis: {
        includeScoreProjection: true,
        includeActionRecommendations: false,
        includeTimelineAnalysis: false,
        projectionMonths: 6,
      },
    });

    expect(result.scoreProjection).toBeDefined();
    expect(result.actionRecommendations).toBeUndefined();
    expect(result.timelineAnalysis).toBeUndefined();
    expect(result.recommendations.join(' ')).not.toContain('Priority:');
  });

  it('should allow empty action recommendations when no triggers apply', () => {
    const result = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.2,
      },
      plannedActions: {
        openNewAccount: false,
        requestCreditLimitIncrease: false,
      },
    });

    expect(result.actionRecommendations.priorityActions.length).toBe(0);
  });

  it('should handle new account projections without debt paydown', () => {
    const result = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.35,
      },
      plannedActions: {
        openNewAccount: true,
        requestCreditLimitIncrease: true,
      },
    });

    const reasons = result.scoreProjection.scoreChanges.map((change: any) => change.reason);
    expect(reasons).toEqual(expect.arrayContaining(['New account inquiry']));
    expect(reasons).not.toEqual(expect.arrayContaining(['Continued on-time payments']));
    expect(result.actionRecommendations.priorityActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'Reduce credit utilization below 30%' }),
        expect.objectContaining({ action: 'Request credit limit increase' }),
      ])
    );
    expect(result.recommendations.join(' ')).not.toContain('Pay down debt to reduce utilization');
  });

  it('should classify credit health bands from current score', () => {
    const excellent = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      currentCredit: {
        currentScore: 760,
        creditBureau: 'fico-8',
      },
    });
    const good = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      currentCredit: {
        currentScore: 720,
        creditBureau: 'fico-8',
      },
    });
    const fair = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      currentCredit: {
        currentScore: 660,
        creditBureau: 'fico-8',
      },
    });
    const poor = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      currentCredit: {
        currentScore: 620,
        creditBureau: 'fico-8',
      },
    });

    expect(excellent.summary.creditHealth).toBe('excellent');
    expect(good.summary.creditHealth).toBe('good');
    expect(fair.summary.creditHealth).toBe('fair');
    expect(poor.summary.creditHealth).toBe('poor');
  });

  it('should compute score factor branches across health bands', () => {
    const excellent = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      creditHistory: {
        ...baseInput.creditHistory,
        averageAgeOfAccounts: 120,
      },
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.05,
      },
      creditMix: {
        creditCards: 1,
        installmentLoans: 1,
        mortgages: 1,
        otherAccounts: 0,
      },
      recentActivity: {
        ...baseInput.recentActivity,
        hardInquiries: 0,
      },
    });

    const good = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      paymentHistory: {
        ...baseInput.paymentHistory,
        onTimePayments: 90,
      },
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.5,
      },
      creditHistory: {
        ...baseInput.creditHistory,
        averageAgeOfAccounts: 40,
      },
      creditMix: {
        creditCards: 1,
        installmentLoans: 0,
        mortgages: 0,
        otherAccounts: 0,
      },
      recentActivity: {
        ...baseInput.recentActivity,
        hardInquiries: 1,
      },
    });

    const fair = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      paymentHistory: {
        ...baseInput.paymentHistory,
        onTimePayments: 80,
      },
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.7,
      },
      creditHistory: {
        ...baseInput.creditHistory,
        averageAgeOfAccounts: 24,
      },
      creditMix: {
        creditCards: 0,
        installmentLoans: 0,
        mortgages: 0,
        otherAccounts: 0,
      },
      recentActivity: {
        ...baseInput.recentActivity,
        hardInquiries: 4,
      },
    });

    const poor = CreditScoreImpactAnalyzer.analyze({
      ...baseInput,
      paymentHistory: {
        ...baseInput.paymentHistory,
        onTimePayments: 50,
      },
      creditUtilization: {
        ...baseInput.creditUtilization,
        utilizationPercentage: 0.9,
      },
      creditHistory: {
        ...baseInput.creditHistory,
        averageAgeOfAccounts: 6,
      },
      creditMix: {
        creditCards: 0,
        installmentLoans: 0,
        mortgages: 0,
        otherAccounts: 0,
      },
      recentActivity: {
        ...baseInput.recentActivity,
        hardInquiries: 8,
      },
    });

    expect(excellent.scoreFactors.overallHealth).toBe('excellent');
    expect(good.scoreFactors.overallHealth).toBe('good');
    expect(fair.scoreFactors.overallHealth).toBe('fair');
    expect(poor.scoreFactors.overallHealth).toBe('poor');
  });

  describe('Comprehensive Analysis', () => {
    it('should return all required fields in the analysis result', () => {
      const result = CreditScoreImpactAnalyzer.analyze(baseInput) as any;

      expect(result).toHaveProperty('scoreFactors');
      expect(result).toHaveProperty('scoreProjection');
      expect(result).toHaveProperty('actionRecommendations');
      expect(result).toHaveProperty('utilizationAnalysis');
      expect(result).toHaveProperty('timelineAnalysis');
      expect(result).toHaveProperty('recommendations');
    });
  });
});

