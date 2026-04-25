import { describe, expect, it } from 'vitest';
import { CreditScoreImpactTool } from '../tools/credit-score-impact';

describe('CreditScoreImpactTool', () => {
  const validInput = {
    currentCredit: {
      currentScore: 680,
      creditBureau: 'fico-8',
    },
    creditHistory: {
      averageAgeOfAccounts: 60,
      oldestAccountAge: 120,
      totalAccounts: 8,
      openAccounts: 6,
    },
    paymentHistory: {
      onTimePayments: 98,
      latePayments30Days: 1,
      latePayments60Days: 0,
      latePayments90Days: 0,
      collections: 0,
      bankruptcies: 0,
    },
    creditUtilization: {
      totalCreditLimit: 20000,
      totalCreditUsed: 10000,
      utilizationPercentage: 0.5,
      individualCardUtilization: [],
    },
    creditMix: {
      creditCards: 3,
      installmentLoans: 1,
      mortgages: 0,
      otherAccounts: 0,
    },
    recentActivity: {
      hardInquiries: 2,
      inquiriesLast6Months: 2,
      inquiriesLast12Months: 3,
      newAccounts: 1,
      accountsOpenedLast6Months: 1,
    },
    plannedActions: {
      payDownDebt: {
        amount: 5000,
        targetUtilization: 0.3,
      },
      openNewAccount: false,
      closeAccount: false,
      requestCreditLimitIncrease: true,
      consolidateDebt: false,
    },
    analysis: {
      includeScoreProjection: true,
      includeActionRecommendations: true,
      includeTimelineAnalysis: true,
      projectionMonths: 6,
    },
  } as const;

  it('exposes the expected metadata', () => {
    expect(CreditScoreImpactTool.toolName).toBe('analyze_credit_score_impact');
    expect(CreditScoreImpactTool.inputSchema.required).toEqual(['currentCredit', 'creditUtilization']);
  });

  it('projects score improvement from planned actions', async () => {
    const result = (await CreditScoreImpactTool.execute(validInput)) as {
      summary: {
        currentScore: number;
        projectedScore: number;
        scoreChange: number;
        creditHealth: string;
      };
    };

    expect(result.summary.currentScore).toBeCloseTo(680, 6);
    expect(result.summary.projectedScore).toBeCloseTo(715, 6);
    expect(result.summary.scoreChange).toBeCloseTo(35, 6);
    expect(result.summary.creditHealth).toBe('fair');
  });

  it('rejects invalid input', async () => {
    await expect(
      CreditScoreImpactTool.execute({
        ...validInput,
        currentCredit: {
          ...validInput.currentCredit,
          currentScore: 900,
        },
      })
    ).rejects.toThrow();
  });
});
