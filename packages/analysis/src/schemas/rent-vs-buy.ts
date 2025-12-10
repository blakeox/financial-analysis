/**
 * Rent vs Buy Calculator Schema
 *
 * Zod validation schemas for rent vs buy comparison analysis.
 */

import { z } from 'zod';

export const FilingStatusSchema = z.enum(['single', 'married', 'head']);
export type FilingStatus = z.infer<typeof FilingStatusSchema>;

export const RentVsBuyInputSchema = z.object({
  // Home purchase parameters
  homePrice: z.number().min(0).describe('Purchase price of the home'),
  downPayment: z.number().min(0).describe('Down payment amount'),
  interestRate: z
    .number()
    .min(0)
    .max(100)
    .describe('Annual mortgage interest rate as percentage (e.g., 6.5 for 6.5%)'),
  loanTermYears: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(30)
    .describe('Mortgage term in years'),

  // Home ownership costs
  propertyTaxRate: z
    .number()
    .min(0)
    .max(10)
    .default(1.2)
    .describe('Annual property tax rate as percentage of home value'),
  propertyTaxIncreaseRate: z
    .number()
    .min(0)
    .max(20)
    .default(2)
    .describe('Annual property tax increase rate as percentage'),
  homeInsurance: z.number().min(0).default(150).describe('Monthly home insurance cost'),
  hoaFees: z.number().min(0).default(0).describe('Monthly HOA fees'),
  maintenanceRate: z
    .number()
    .min(0)
    .max(10)
    .default(1)
    .describe('Annual maintenance cost as percentage of home value'),

  // Transaction costs
  closingCostRate: z
    .number()
    .min(0)
    .max(10)
    .default(3)
    .describe('Closing costs as percentage of home price'),
  sellingCostRate: z
    .number()
    .min(0)
    .max(15)
    .default(6)
    .describe('Selling costs as percentage of home value (agent fees, etc.)'),

  // Rental parameters
  monthlyRent: z.number().min(0).describe('Current monthly rent'),
  rentIncreaseRate: z
    .number()
    .min(0)
    .max(20)
    .default(3)
    .describe('Annual rent increase rate as percentage'),
  rentersInsurance: z.number().min(0).default(20).describe('Monthly renters insurance cost'),
  securityDepositMonths: z
    .number()
    .min(0)
    .max(3)
    .default(1)
    .describe('Security deposit in months of rent'),

  // Market assumptions
  appreciationRate: z
    .number()
    .min(-20)
    .max(30)
    .default(3)
    .describe('Annual home appreciation rate as percentage'),
  investmentReturnRate: z
    .number()
    .min(0)
    .max(30)
    .default(7)
    .describe('Annual investment return rate as percentage'),
  inflationRate: z
    .number()
    .min(0)
    .max(20)
    .default(2.5)
    .describe('Annual inflation rate as percentage'),

  // Tax parameters
  marginalTaxRate: z
    .number()
    .min(0)
    .max(50)
    .default(22)
    .describe('Marginal tax rate as percentage'),
  filingStatus: FilingStatusSchema.default('single').describe('Tax filing status'),
  otherItemizedDeductions: z
    .number()
    .min(0)
    .default(0)
    .describe('Other itemized deductions (state taxes, charitable, etc.)'),

  // Analysis timeframe
  yearsToAnalyze: z
    .number()
    .int()
    .min(1)
    .max(40)
    .default(10)
    .describe('Number of years to analyze'),
});

export type RentVsBuyInput = z.infer<typeof RentVsBuyInputSchema>;
