import { z } from 'zod';

export const EquipmentLeaseVsBuyInputSchema = z.object({
  equipmentInfo: z.object({
    description: z.string().optional(),
    purchasePrice: z.number().min(0),
    usefulLife: z.number().min(1).max(20).default(5), // years
    expectedResidualValue: z.number().min(0).default(0),
  }),
  leaseTerms: z.object({
    leaseType: z
      .enum(['operating-lease', 'capital-lease', 'finance-lease'])
      .default('operating-lease'),
    leaseTerm: z.number().min(1).max(10).default(5), // years
    monthlyPayment: z.number().min(0),
    downPayment: z.number().min(0).default(0),
    securityDeposit: z.number().min(0).default(0),
    buyoutOption: z.boolean().default(false),
    buyoutPrice: z.number().min(0).default(0),
    maintenanceIncluded: z.boolean().default(false),
    annualMaintenanceCost: z.number().min(0).default(0),
  }),
  purchaseTerms: z.object({
    downPayment: z.number().min(0).default(0),
    loanTerm: z.number().min(1).max(10).default(5), // years
    interestRate: z.number().min(0).max(0.2).default(0.08),
    annualMaintenanceCost: z.number().min(0).default(0),
    insuranceCost: z.number().min(0).default(0),
  }),
  taxInfo: z.object({
    federalTaxRate: z.number().min(0).max(0.5).default(0.21),
    stateTaxRate: z.number().min(0).max(0.2).default(0),
    section179Eligible: z.boolean().default(true),
    section179Deduction: z.number().min(0).default(0),
    bonusDepreciationEligible: z.boolean().default(true),
    bonusDepreciationPercentage: z.number().min(0).max(1).default(0.6),
    depreciationMethod: z.enum(['straight-line', 'macrs']).default('macrs'),
  }),
  financialAssumptions: z.object({
    opportunityCostRate: z.number().min(0).max(0.2).default(0.1),
    inflationRate: z.number().min(0).max(0.1).default(0.03),
    analysisPeriod: z.number().min(1).max(20).default(5), // years
  }).default({
    opportunityCostRate: 0.1,
    inflationRate: 0.03,
    analysisPeriod: 5,
  }),
  analysis: z.object({
    includeNPV: z.boolean().default(true),
    includeIRR: z.boolean().default(true),
    includeCashFlowComparison: z.boolean().default(true),
    includeTaxImpact: z.boolean().default(true),
    analysisPeriod: z.number().min(1).max(20).default(5),
  }),
});

export type EquipmentLeaseVsBuyInput = z.infer<typeof EquipmentLeaseVsBuyInputSchema>;



