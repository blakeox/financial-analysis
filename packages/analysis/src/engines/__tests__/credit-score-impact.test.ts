/**
 * Credit Score Impact Tests
 */

import { describe, expect, it } from 'vitest';
import { CreditScoreImpactInputSchema } from '../../schemas/credit-score-impact.js';
import { CreditScoreImpactAnalyzer } from '../credit-score-impact.js';

describe('CreditScoreImpactAnalyzer', () => {
  const baseInput: any = {
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
    creditHistory: {},
    creditMix: {},
    recentActivity: {},
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
    const input = CreditScoreImpactInputSchema.parse(baseInput);
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;
    expect(result).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.currentScore).toBeGreaterThanOrEqual(300);
    expect(result.summary.currentScore).toBeLessThanOrEqual(850);
  });

  it('should project score changes', () => {
    const input = CreditScoreImpactInputSchema.parse(baseInput);
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;
    expect(result.scoreProjection).toBeDefined();
    expect(result.scoreProjection.projectedScore).toBeGreaterThanOrEqual(300);
    expect(result.scoreProjection.projectedScore).toBeLessThanOrEqual(850);
  });

  it('should provide action recommendations', () => {
    const input = CreditScoreImpactInputSchema.parse(baseInput);
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('should analyze utilization impact', () => {
    const input = CreditScoreImpactInputSchema.parse(baseInput);
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;
    expect(result.scoreFactors).toBeDefined();
    expect(result.scoreFactors.utilizationScore).toBeDefined();
  });

  it('should provide timeline analysis', () => {
    const input = CreditScoreImpactInputSchema.parse(baseInput);
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;
    expect(result.scoreProjection).toBeDefined();
    expect(result.scoreProjection.scoreChanges).toBeDefined();
    expect(Array.isArray(result.scoreProjection.scoreChanges)).toBe(true);
  });

  it('should project changes for new accounts and debt paydown', () => {
    const input = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      creditUtilization: {
        totalCreditLimit: 50000,
        totalCreditUsed: 30000,
        utilizationPercentage: 0.6,
      },
      plannedActions: {
        payDownDebt: {
          amount: 20000,
          targetUtilization: 0.25,
        },
        openNewAccount: true,
        requestCreditLimitIncrease: true,
      },
      analysis: {
        ...baseInput.analysis,
        projectionMonths: 2,
      },
    });
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;

    const reasons = result.scoreProjection.scoreChanges.map((change: any) => change.reason);
    expect(reasons).toEqual(
      expect.arrayContaining([
        'Reduced credit utilization',
        'New account inquiry',
        'Continued on-time payments',
      ])
    );
    expect(result.actionRecommendations.priorityActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'Reduce credit utilization below 30%' }),
        expect.objectContaining({ action: 'Request credit limit increase' }),
      ])
    );
  });

  it('should compute score factors for long credit history and inquiry-free profile', () => {
    const input = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      currentCredit: {
        currentScore: 780,
        creditBureau: 'fico-8',
      },
      creditHistory: {
        averageAgeOfAccounts: 120,
        oldestAccountAge: 180,
        totalAccounts: 8,
        openAccounts: 5,
      },
      paymentHistory: {
        onTimePayments: 80,
        latePayments30Days: 0,
        latePayments60Days: 0,
        latePayments90Days: 0,
      },
      creditMix: {
        creditCards: 0,
        installmentLoans: 0,
        mortgages: 0,
        otherAccounts: 0,
      },
      recentActivity: {
        hardInquiries: 0,
      },
    });
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;

    expect(result.scoreFactors.creditMixScore).toBe(0);
    expect(result.summary.creditHealth).toBe('excellent');
  });

  it('should skip projections and recommendations when disabled', () => {
    const input = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      analysis: {
        includeScoreProjection: false,
        includeActionRecommendations: false,
        includeTimelineAnalysis: false,
        projectionMonths: 12,
      },
      plannedActions: {
        openNewAccount: false,
        requestCreditLimitIncrease: false,
      },
    });
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;

    expect(result.scoreProjection).toBeUndefined();
    expect(result.actionRecommendations).toBeUndefined();
    expect(result.recommendations).toEqual(
      expect.arrayContaining(['Current credit health: good'])
    );
  });

  it('should include paydown debt recommendation when specified', () => {
    const input = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      plannedActions: {
        payDownDebt: {
          amount: 4000,
          targetUtilization: 0.15,
        },
        openNewAccount: false,
        requestCreditLimitIncrease: false,
      },
    });
    const result = CreditScoreImpactAnalyzer.analyze(input) as any;

    expect(result.recommendations.join(' ')).toContain(
      'Pay down debt to reduce utilization to 15%'
    );
  });

  it('should classify fair and poor credit health bands', () => {
    const fairInput = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      currentCredit: {
        currentScore: 660,
        creditBureau: 'fico-8',
      },
    });
    const poorInput = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      currentCredit: {
        currentScore: 600,
        creditBureau: 'fico-8',
      },
    });

    const fairResult = CreditScoreImpactAnalyzer.analyze(fairInput) as any;
    const poorResult = CreditScoreImpactAnalyzer.analyze(poorInput) as any;

    expect(fairResult.summary.creditHealth).toBe('fair');
    expect(poorResult.summary.creditHealth).toBe('poor');
  });

  it('should handle high utilization, mixed credit, and repeated projections', () => {
    const input = CreditScoreImpactInputSchema.parse({
      ...baseInput,
      creditHistory: {
        averageAgeOfAccounts: 120,
        oldestAccountAge: 200,
        totalAccounts: 8,
        openAccounts: 6,
      },
      paymentHistory: {
        onTimePayments: 90,
        latePayments30Days: 1,
        latePayments60Days: 0,
        latePayments90Days: 0,
      },
      creditUtilization: {
        totalCreditLimit: 50000,
        totalCreditUsed: 30000,
        utilizationPercentage: 0.6,
      },
      creditMix: {
        creditCards: 2,
        installmentLoans: 1,
        mortgages: 1,
      },
      recentActivity: {
        hardInquiries: 3,
      },
      plannedActions: {
        payDownDebt: {
          amount: 10000,
          targetUtilization: 0.3,
        },
        openNewAccount: true,
        requestCreditLimitIncrease: true,
      },
      analysis: {
        includeScoreProjection: true,
        includeActionRecommendations: true,
        includeTimelineAnalysis: true,
        projectionMonths: 3,
      },
    });

    const result = CreditScoreImpactAnalyzer.analyze(input) as any;
    const reasons = result.scoreProjection.scoreChanges.map((change: any) => change.reason);

    expect(reasons).toEqual(
      expect.arrayContaining([
        'Reduced credit utilization',
        'New account inquiry',
        'Continued on-time payments',
      ])
    );
    expect(result.actionRecommendations.priorityActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'Reduce credit utilization below 30%' }),
        expect.objectContaining({ action: 'Pay down $10000 in debt' }),
        expect.objectContaining({ action: 'Request credit limit increase' }),
      ])
    );
  });
});

