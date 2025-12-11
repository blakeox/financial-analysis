import { z } from 'zod';

export const RealEstateInvestmentInputSchema = z.object({
  propertyInfo: z.object({
    purchasePrice: z.number().min(0),
    propertyType: z.enum([
      'residential',
      'commercial',
      'multifamily',
      'industrial',
      'retail',
      'office',
    ]),
    squareFeet: z.number().min(0).optional(),
    units: z.number().min(0).optional(),
  }),
  financing: z.object({
    downPayment: z.number().min(0),
    loanAmount: z.number().min(0),
    interestRate: z.number().min(0).max(0.2),
    loanTerm: z.number().min(5).max(30),
    loanType: z.enum(['conventional', 'commercial', 'hard-money', 'cash']).default('conventional'),
  }),
  income: z.object({
    monthlyRent: z.number().min(0),
    annualRentIncrease: z.number().min(0).max(0.1).default(0.03),
    occupancyRate: z.number().min(0).max(1).default(0.95),
    otherIncome: z.number().min(0).default(0),
  }),
  expenses: z.object({
    propertyTaxes: z.number().min(0),
    insurance: z.number().min(0),
    maintenance: z.number().min(0),
    propertyManagement: z.number().min(0).default(0),
    utilities: z.number().min(0).default(0),
    otherExpenses: z.number().min(0).default(0),
    vacancyRate: z.number().min(0).max(0.2).default(0.05),
  }),
  projections: z.object({
    holdingPeriod: z.number().min(1).max(30).default(10),
    appreciationRate: z.number().min(-0.1).max(0.1).default(0.03),
    saleCosts: z.number().min(0).max(0.1).default(0.06),
  }),
  analysis: z.object({
    includeCapRate: z.boolean().default(true),
    includeCashOnCash: z.boolean().default(true),
    includeIRR: z.boolean().default(true),
    includeNOI: z.boolean().default(true),
  }),
});

export type RealEstateInvestmentInput = z.infer<typeof RealEstateInvestmentInputSchema>;
