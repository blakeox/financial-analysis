/**
 * Auto loan analysis input schema
 *
 * This schema is consumed by:
 * - `AutoLoanAnalysisEngine`
 * - API route `/v1/api/analysis/auto-loan-analysis`
 * - MCP tool wrappers
 */

import { z } from 'zod';

export const AutoLoanAnalysisInputSchema = z.object({
  // Vehicle Information
  vehicle: z.object({
    make: z.string(),
    model: z.string(),
    year: z
      .number()
      .min(1990)
      .max(new Date().getFullYear() + 2),
    msrp: z.number().min(0),
    negotiatedPrice: z.number().min(0),
    tradeInValue: z.number().min(0).default(0),
    downPayment: z.number().min(0).default(0),
  }),

  // Loan Terms
  loanTerms: z.object({
    loanAmount: z.number().min(0),
    interestRate: z.number().min(0).max(0.5), // 0-50% APR
    termMonths: z.number().min(12).max(84), // 1-7 years
    salesTaxRate: z.number().min(0).max(0.2).default(0.08), // 0-20%
    fees: z.object({
      documentationFee: z.number().min(0).default(500),
      titleFee: z.number().min(0).default(100),
      registrationFee: z.number().min(0).default(200),
      otherFees: z.number().min(0).default(0),
    }),
  }),

  // Lease Terms (for comparison)
  leaseTerms: z
    .object({
      leaseAmount: z.number().min(0),
      moneyFactor: z.number().min(0).max(0.01), // 0-0.01 (equivalent to APR/2400)
      termMonths: z.number().min(24).max(48), // 2-4 years
      residualValue: z.number().min(0),
      securityDeposit: z.number().min(0).default(0),
      acquisitionFee: z.number().min(0).default(1000),
      dispositionFee: z.number().min(0).default(400),
    })
    .optional(),

  // Analysis Parameters
  analysis: z.object({
    includeLeaseComparison: z.boolean().default(true),
    includeRefinancingAnalysis: z.boolean().default(true),
    includeTCOAnalysis: z.boolean().default(true),
    includePaymentSchedule: z.boolean().default(true),
    refinancingRates: z.array(z.number()).default([0.03, 0.04, 0.05, 0.06]),
    ownershipYears: z.number().min(1).max(10).default(5),
  }),

  // TCO Parameters
  tcoParameters: z.object({
    annualMileage: z.number().min(0).default(12000),
    fuelCostPerGallon: z.number().min(0).default(3.5),
    mpg: z.number().min(0).default(25),
    maintenanceCostPerYear: z.number().min(0).default(1000),
    insuranceCostPerYear: z.number().min(0).default(1200),
    registrationCostPerYear: z.number().min(0).default(100),
    depreciationRate: z.number().min(0).max(1).default(0.15), // 15% per year
  }),
});

export type AutoLoanAnalysisInput = z.infer<typeof AutoLoanAnalysisInputSchema>;
