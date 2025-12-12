/**
 * Credit Score Impact Tests
 */

import { describe, expect, it } from 'vitest';
import type { CreditScoreImpactInput } from '../../schemas/credit-score-impact.js';
import { CreditScoreImpactAnalyzer } from '../credit-score-impact.js';

describe('CreditScoreImpactAnalyzer', () => {
  const baseInput: CreditScoreImpactInput = {
    currentCredit: {
      currentScore: 720,
      creditBureau: 'fico-8',
    },
    creditUtilization: {
      totalCreditLimit: 50000,
      totalCreditUsed: 15000,
      utilizationPercentage: 0.3,
    },
    paymentHistory: {
      onTimePayments: 100,
      latePayments30Days: 0,
      latePayments60Days: 0,
      latePayments90Days: 0,
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
});
