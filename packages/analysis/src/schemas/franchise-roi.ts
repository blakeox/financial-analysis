import { z } from 'zod';

const RawFranchiseROIInputSchema = z.object({
  franchiseInfo: z.object({
    franchiseName: z.string().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    franchiseType: z
      .enum(['retail', 'restaurant', 'service', 'home-based', 'other'])
      .default('service'),
  }),
  initialInvestment: z.object({
    franchiseFee: z.number().min(0),
    // Accept both the newer detailed breakdown and the older/tool-style keys
    realEstate: z.number().min(0).optional(),
    realEstateCost: z.number().min(0).optional(),
    equipment: z.number().min(0).optional(),
    equipmentCost: z.number().min(0).optional(),
    inventory: z.number().min(0).optional(),
    workingCapital: z.number().min(0).optional(),
    otherCosts: z.number().min(0).optional(),
    // totalInvestment is the normalized field; initialInvestment is a common alias
    totalInvestment: z.number().min(0).optional(),
    initialInvestment: z.number().min(0).optional(),
  }),
  ongoingCosts: z.object({
    royaltyFee: z.number().min(0).max(1).default(0.05), // 5% of revenue
    marketingFee: z.number().min(0).max(1).default(0.02), // 2% of revenue
    annualOperatingExpenses: z.number().min(0).optional(),
    annualOperatingCosts: z.number().min(0).optional(),
    annualRent: z.number().min(0).default(0),
    annualUtilities: z.number().min(0).default(0),
    annualInsurance: z.number().min(0).default(0),
    annualSalaries: z.number().min(0).default(0),
  }),
  revenueProjections: z.object({
    firstYearRevenue: z.number().min(0),
    revenueGrowthRate: z.number().min(0).max(1).default(0.1), // 10% annual growth
    revenueProjectionYears: z.number().min(1).max(20).optional(),
    // Some callers include grossMargin; the ROI engine doesn’t require it.
    grossMargin: z.number().min(0).max(1).optional(),
    seasonality: z
      .array(
        z.object({
          month: z.number().min(1).max(12),
          revenueMultiplier: z.number().min(0).max(2).default(1),
        })
      )
      .optional(),
  }),
  territory: z
    .object({
      exclusiveTerritory: z.boolean().default(true),
      territorySize: z.string().optional(),
      territoryRestrictions: z.string().optional(),
    })
    .optional(),
  exitStrategy: z
    .object({
      expectedExitYear: z.number().min(1).max(30).default(10),
      expectedExitValue: z.number().min(0).default(0),
      exitMultiple: z.number().min(0).default(0), // Multiple of revenue or EBITDA
    })
    .optional(),
  analysis: z.object({
    includeROI: z.boolean().default(true),
    includePaybackPeriod: z.boolean().default(true),
    includeNPV: z.boolean().default(true),
    includeIRR: z.boolean().default(true),
    includeBreakEven: z.boolean().default(true),
    includeSensitivityAnalysis: z.boolean().optional(),
    includeScenarioAnalysis: z.boolean().optional(),
    projectionYears: z.number().min(1).max(20).optional(),
  }),
});

export const FranchiseROIInputSchema = RawFranchiseROIInputSchema.transform((raw) => {
  const realEstate = raw.initialInvestment.realEstate ?? raw.initialInvestment.realEstateCost ?? 0;
  const equipment = raw.initialInvestment.equipment ?? raw.initialInvestment.equipmentCost ?? 0;
  const inventory = raw.initialInvestment.inventory ?? 0;
  const workingCapital = raw.initialInvestment.workingCapital ?? 0;
  const otherCosts = raw.initialInvestment.otherCosts ?? 0;

  const computedTotalInvestment =
    raw.initialInvestment.totalInvestment ??
    raw.initialInvestment.initialInvestment ??
    raw.initialInvestment.franchiseFee +
      realEstate +
      equipment +
      inventory +
      workingCapital +
      otherCosts;

  const revenueProjectionYears =
    raw.revenueProjections.revenueProjectionYears ?? raw.analysis.projectionYears ?? 10;

  const annualOperatingExpenses =
    raw.ongoingCosts.annualOperatingExpenses ?? raw.ongoingCosts.annualOperatingCosts ?? 0;

  const includeSensitivityAnalysis =
    raw.analysis.includeSensitivityAnalysis ?? raw.analysis.includeScenarioAnalysis ?? false;

  return {
    franchiseInfo: raw.franchiseInfo,
    initialInvestment: {
      franchiseFee: raw.initialInvestment.franchiseFee,
      realEstate,
      equipment,
      inventory,
      workingCapital,
      otherCosts,
      totalInvestment: computedTotalInvestment,
    },
    ongoingCosts: {
      ...raw.ongoingCosts,
      annualOperatingExpenses,
    },
    revenueProjections: {
      firstYearRevenue: raw.revenueProjections.firstYearRevenue,
      revenueGrowthRate: raw.revenueProjections.revenueGrowthRate,
      revenueProjectionYears,
      seasonality: raw.revenueProjections.seasonality,
    },
    territory: raw.territory ?? {
      exclusiveTerritory: true,
    },
    exitStrategy: raw.exitStrategy ?? {
      expectedExitYear: revenueProjectionYears,
      expectedExitValue: 0,
      exitMultiple: 0,
    },
    analysis: {
      includeROI: raw.analysis.includeROI,
      includePaybackPeriod: raw.analysis.includePaybackPeriod,
      includeNPV: raw.analysis.includeNPV,
      includeIRR: raw.analysis.includeIRR,
      includeBreakEven: raw.analysis.includeBreakEven,
      includeSensitivityAnalysis,
    },
  };
});

export type FranchiseROIInput = z.infer<typeof FranchiseROIInputSchema>;
