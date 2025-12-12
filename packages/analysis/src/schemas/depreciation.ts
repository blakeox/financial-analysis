import { z } from 'zod';

export const DepreciationInputSchema = z.object({
  assetInfo: z.object({
    assetDescription: z.string().optional(),
    purchaseDate: z.string(), // ISO date
    purchaseCost: z.number().min(0),
    salvageValue: z.number().min(0).default(0),
    usefulLife: z.number().min(1).max(50), // years
    assetClass: z
      .enum(['equipment', 'vehicle', 'building', 'furniture', 'computer', 'other'])
      .default('equipment'),
    businessUsePercentage: z.number().min(0).max(1).default(1), // 100% business use
  }),
  depreciationMethod: z
    .enum([
      'straight-line',
      'declining-balance',
      'double-declining-balance',
      'sum-of-years-digits',
      'macrs',
      'section-179',
      'bonus-depreciation',
    ])
    .default('straight-line'),
  taxInfo: z.object({
    taxYear: z.number().min(2000).max(2100).default(2024),
    federalTaxRate: z.number().min(0).max(0.5).default(0.21), // Corporate rate
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    section179Limit: z.number().min(0).default(1080000), // 2024 limit
    section179Threshold: z.number().min(0).default(2900000), // 2024 threshold
    bonusDepreciationPercentage: z.number().min(0).max(1).default(0.6), // 60% for 2024
  }),
  macrsDetails: z
    .object({
      propertyClass: z
        .enum([
          '3-year',
          '5-year',
          '7-year',
          '10-year',
          '15-year',
          '20-year',
          '27.5-year',
          '39-year',
        ])
        .default('5-year'),
      convention: z.enum(['half-year', 'mid-month', 'mid-quarter']).default('half-year'),
    })
    .optional(),
  disposal: z
    .object({
      disposalDate: z.string().optional(), // ISO date
      disposalProceeds: z.number().min(0).default(0),
      includeDisposalAnalysis: z.boolean().default(false),
    })
    .optional(),
  analysis: z.object({
    includeSchedule: z.boolean().default(true),
    includeTaxSavings: z.boolean().default(true),
    includeMethodComparison: z.boolean().default(false),
    projectionYears: z.number().min(1).max(50),
  }),
});

export type DepreciationInput = z.infer<typeof DepreciationInputSchema>;


