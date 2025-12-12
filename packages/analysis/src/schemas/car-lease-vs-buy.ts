import { z } from 'zod';

export const CarLeaseVsBuyInputSchema = z.object({
  vehicleInfo: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    msrp: z.number().min(0),
    negotiatedPrice: z.number().min(0),
    residualValue: z.number().min(0).optional(), // For lease
  }),
  leaseTerms: z.object({
    leaseTerm: z.number().min(24).max(60).default(36), // months
    downPayment: z.number().min(0).default(0),
    monthlyPayment: z.number().min(0),
    moneyFactor: z.number().min(0).default(0.001), // Equivalent to interest rate
    residualPercentage: z.number().min(0).max(1).default(0.5), // 50% of MSRP
    mileageAllowance: z.number().min(0).default(12000), // miles per year
    excessMileageFee: z.number().min(0).default(0.25), // per mile
    acquisitionFee: z.number().min(0).default(0),
    dispositionFee: z.number().min(0).default(0),
    securityDeposit: z.number().min(0).default(0),
  }),
  purchaseTerms: z.object({
    loanTerm: z.number().min(12).max(84).default(60), // months
    downPayment: z.number().min(0).default(0),
    interestRate: z.number().min(0).max(0.2).default(0.05),
    salesTaxRate: z.number().min(0).max(0.2).default(0.08),
    registrationFee: z.number().min(0).default(0),
    titleFee: z.number().min(0).default(0),
  }),
  ownershipCosts: z.object({
    annualInsurance: z.number().min(0),
    annualMaintenance: z.number().min(0).default(0),
    annualRepairs: z.number().min(0).default(0),
    fuelCost: z.number().min(0).default(0), // per year
    expectedOwnershipYears: z.number().min(1).max(20).default(6),
  }),
  financialAssumptions: z.object({
    opportunityCostRate: z.number().min(0).max(0.2).default(0.07), // Investment return
    expectedDepreciation: z.number().min(0).max(1).default(0.15), // Annual depreciation
    tradeInValue: z.number().min(0).default(0).optional(),
  }),
  analysis: z.object({
    analysisPeriod: z.number().min(1).max(10).default(3), // years
    includeTaxBenefits: z.boolean().default(true),
    includeEarlyTermination: z.boolean().default(false),
  }),
});

export type CarLeaseVsBuyInput = z.infer<typeof CarLeaseVsBuyInputSchema>;


