import { z } from 'zod';

export const StartupFinancialModelInputSchema = z.object({
  companyInfo: z.object({
    name: z.string().optional(),
    industry: z.string().optional(),
    stage: z.enum(['idea', 'seed', 'series-a', 'series-b', 'series-c', 'growth']).default('seed'),
    businessModel: z
      .enum(['saas', 'marketplace', 'ecommerce', 'hardware', 'services', 'other'])
      .default('saas'),
  }),
  currentSituation: z.object({
    currentCash: z.number().min(0),
    monthlyBurnRate: z.number().min(0),
    currentRevenue: z.number().min(0).default(0),
    currentMRR: z.number().min(0).default(0), // Monthly Recurring Revenue
    currentCustomers: z.number().min(0).default(0),
  }),
  revenueProjections: z.object({
    revenueModel: z
      .enum(['subscription', 'transaction', 'advertising', 'licensing', 'mixed'])
      .default('subscription'),
    monthlyRevenue: z.array(
      z.object({
        month: z.number().min(1).max(60),
        revenue: z.number().min(0),
        newCustomers: z.number().min(0).default(0),
        churnRate: z.number().min(0).max(1).default(0.05),
        averageRevenuePerUser: z.number().min(0).default(0),
      })
    ),
    growthAssumptions: z.object({
      customerGrowthRate: z.number().min(0).max(1).default(0.1), // 10% monthly
      revenuePerCustomer: z.number().min(0).default(0),
      churnRate: z.number().min(0).max(1).default(0.05),
    }),
  }),
  expenses: z.object({
    fixedCosts: z.object({
      salaries: z.number().min(0),
      rent: z.number().min(0).default(0),
      utilities: z.number().min(0).default(0),
      insurance: z.number().min(0).default(0),
      otherFixed: z.number().min(0).default(0),
    }),
    variableCosts: z.object({
      costOfGoodsSold: z.number().min(0).max(1).default(0.2), // 20% of revenue
      marketing: z.number().min(0).max(1).default(0.3), // 30% of revenue
      sales: z.number().min(0).max(1).default(0.1), // 10% of revenue
      customerAcquisitionCost: z.number().min(0).default(0),
    }),
  }),
  funding: z.object({
    fundingRounds: z
      .array(
        z.object({
          round: z.string(),
          amount: z.number().min(0),
          date: z.string(), // ISO date
          valuation: z.number().min(0).optional(),
          dilution: z.number().min(0).max(1).optional(), // Percentage
        })
      )
      .default([]),
    plannedFunding: z
      .array(
        z.object({
          round: z.string(),
          targetAmount: z.number().min(0),
          targetDate: z.string(), // ISO date
          useOfFunds: z.string().optional(),
        })
      )
      .default([]),
  }),
  milestones: z
    .array(
      z.object({
        milestone: z.string(),
        targetDate: z.string(), // ISO date
        requiredFunding: z.number().min(0).default(0),
        keyMetrics: z
          .object({
            revenue: z.number().min(0).optional(),
            customers: z.number().min(0).optional(),
            mrr: z.number().min(0).optional(),
          })
          .optional(),
      })
    )
    .default([]),
  analysis: z.object({
    includeBurnRate: z.boolean().default(true),
    includeRunway: z.boolean().default(true),
    includeUnitEconomics: z.boolean().default(true),
    includeFundingNeeds: z.boolean().default(true),
    includeMilestoneTracking: z.boolean().default(true),
    projectionMonths: z.number().min(6).max(60).default(24),
  }),
});

export type StartupFinancialModelInput = z.infer<typeof StartupFinancialModelInputSchema>;
