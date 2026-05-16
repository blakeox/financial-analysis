import { z } from 'zod';

export const RevenueRecognitionInputSchema = z.object({
  companyInfo: z.object({
    industry: z.string().optional(),
    revenueModel: z
      .enum(['product', 'service', 'subscription', 'licensing', 'mixed'])
      .default('service'),
    accountingStandard: z.enum(['asc-606', 'ifrs-15', 'other']).default('asc-606'),
  }),
  contracts: z.array(
    z.object({
      contractId: z.string(),
      contractValue: z.number().min(0),
      contractStartDate: z.string(), // ISO date
      contractEndDate: z.string(), // ISO date
      performanceObligations: z.array(
        z.object({
          obligationId: z.string(),
          description: z.string().optional(),
          standaloneSellingPrice: z.number().min(0),
          fulfillmentMethod: z.enum(['over-time', 'point-in-time']),
          fulfillmentPeriod: z
            .object({
              startDate: z.string(), // ISO date
              endDate: z.string(), // ISO date
            })
            .optional(),
        })
      ),
      paymentTerms: z.object({
        upfrontPayment: z.number().min(0).default(0),
        milestonePayments: z
          .array(
            z.object({
              milestone: z.string(),
              amount: z.number().min(0),
              date: z.string(), // ISO date
            })
          )
          .default([]),
        recurringPayments: z
          .object({
            amount: z.number().min(0),
            frequency: z.enum(['monthly', 'quarterly', 'annually']),
            startDate: z.string(), // ISO date
            endDate: z.string(), // ISO date
          })
          .optional(),
      }),
    })
  ),
  analysis: z.object({
    includeRevenueSchedule: z.boolean().default(true),
    includeDeferredRevenue: z.boolean().default(true),
    includeContractAssetAnalysis: z.boolean().default(true),
    includeComplianceCheck: z.boolean().default(true),
    projectionPeriod: z.number().min(1).max(10).default(5), // years
  }),
});

export type RevenueRecognitionInput = z.infer<typeof RevenueRecognitionInputSchema>;
