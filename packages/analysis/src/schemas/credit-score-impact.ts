import { z } from 'zod';

export const CreditScoreImpactInputSchema = z.object({
  currentCredit: z.object({
    currentScore: z.number().min(300).max(850),
    creditBureau: z
      .enum(['fico-8', 'fico-9', 'vantagescore-3', 'vantagescore-4'])
      .default('fico-8'),
  }),
  creditHistory: z.object({
    averageAgeOfAccounts: z.number().min(0).default(0), // months
    oldestAccountAge: z.number().min(0).default(0), // months
    totalAccounts: z.number().min(0).default(0),
    openAccounts: z.number().min(0).default(0),
  }),
  paymentHistory: z.object({
    onTimePayments: z.number().min(0).max(100).default(100), // percentage
    latePayments30Days: z.number().min(0).default(0),
    latePayments60Days: z.number().min(0).default(0),
    latePayments90Days: z.number().min(0).default(0),
    collections: z.number().min(0).default(0),
    bankruptcies: z.number().min(0).default(0),
  }),
  creditUtilization: z.object({
    totalCreditLimit: z.number().min(0),
    totalCreditUsed: z.number().min(0),
    utilizationPercentage: z.number().min(0).max(1).default(0),
    individualCardUtilization: z
      .array(
        z.object({
          cardName: z.string().optional(),
          limit: z.number().min(0),
          balance: z.number().min(0),
          utilization: z.number().min(0).max(1),
        })
      )
      .default([]),
  }),
  creditMix: z.object({
    creditCards: z.number().min(0).default(0),
    installmentLoans: z.number().min(0).default(0),
    mortgages: z.number().min(0).default(0),
    otherAccounts: z.number().min(0).default(0),
  }),
  recentActivity: z.object({
    hardInquiries: z.number().min(0).default(0),
    inquiriesLast6Months: z.number().min(0).default(0),
    inquiriesLast12Months: z.number().min(0).default(0),
    newAccounts: z.number().min(0).default(0),
    accountsOpenedLast6Months: z.number().min(0).default(0),
  }),
  plannedActions: z.object({
    payDownDebt: z
      .object({
        amount: z.number().min(0).default(0),
        targetUtilization: z.number().min(0).max(1).default(0.3),
      })
      .optional(),
    openNewAccount: z.boolean().default(false),
    closeAccount: z.boolean().default(false),
    requestCreditLimitIncrease: z.boolean().default(false),
    consolidateDebt: z.boolean().default(false),
  }),
  analysis: z.object({
    includeScoreProjection: z.boolean().default(true),
    includeActionRecommendations: z.boolean().default(true),
    includeTimelineAnalysis: z.boolean().default(true),
    projectionMonths: z.number().min(1).max(24).default(12),
  }),
});

export type CreditScoreImpactInput = z.infer<typeof CreditScoreImpactInputSchema>;



