import { z } from 'zod';

export const FranchiseROIInputSchema = z.object({
  franchiseInfo: z.object({
    franchiseName: z.string().optional(),
    industry: z.string().optional(),
    franchiseType: z
      .enum(['retail', 'restaurant', 'service', 'home-based', 'other'])
      .default('service'),
  }),
  initialInvestment: z.object({
    franchiseFee: z.number().min(0),
    realEstate: z.number().min(0).default(0),
    equipment: z.number().min(0).default(0),
    inventory: z.number().min(0).default(0),
    workingCapital: z.number().min(0).default(0),
    otherCosts: z.number().min(0).default(0),
    totalInvestment: z.number().min(0),
  }),
  ongoingCosts: z.object({
    royaltyFee: z.number().min(0).max(1).default(0.05), // 5% of revenue
    marketingFee: z.number().min(0).max(1).default(0.02), // 2% of revenue
    annualOperatingExpenses: z.number().min(0).default(0),
    annualRent: z.number().min(0).default(0),
    annualUtilities: z.number().min(0).default(0),
    annualInsurance: z.number().min(0).default(0),
    annualSalaries: z.number().min(0).default(0),
  }),
  revenueProjections: z.object({
    firstYearRevenue: z.number().min(0),
    revenueGrowthRate: z.number().min(0).max(1).default(0.1), // 10% annual growth
    revenueProjectionYears: z.number().min(1).max(20).default(10),
    seasonality: z
      .array(
        z.object({
          month: z.number().min(1).max(12),
          revenueMultiplier: z.number().min(0).max(2).default(1),
        })
      )
      .optional(),
  }),
  territory: z.object({
    exclusiveTerritory: z.boolean().default(true),
    territorySize: z.string().optional(),
    territoryRestrictions: z.string().optional(),
  }),
  exitStrategy: z.object({
    expectedExitYear: z.number().min(1).max(30).default(10),
    expectedExitValue: z.number().min(0).default(0),
    exitMultiple: z.number().min(0).default(0), // Multiple of revenue or EBITDA
  }),
  analysis: z.object({
    includeROI: z.boolean().default(true),
    includePaybackPeriod: z.boolean().default(true),
    includeNPV: z.boolean().default(true),
    includeIRR: z.boolean().default(true),
    includeBreakEven: z.boolean().default(true),
    includeSensitivityAnalysis: z.boolean().default(true),
  }),
});

export type FranchiseROIInput = z.infer<typeof FranchiseROIInputSchema>;


