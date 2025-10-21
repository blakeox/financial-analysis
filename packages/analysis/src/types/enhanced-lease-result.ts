import { z } from 'zod';

// Individual payment item in the schedule
export interface EnhancedLeasePaymentItem {
  month: number;
  date: string;
  basePayment: number;
  escalatedPayment: number;
  additionalCosts: {
    camCharges: number;
    propertyTaxes: number;
    insurance: number;
    utilities: number;
    maintenance: number;
    managementFee: number;
    total: number;
  };
  percentageRent: number;
  totalPayment: number;
  cumulativePaid: number;
  effectiveRate: number;
  presentValue: number;
  interestComponent: number;
  principalComponent: number;
  remainingBalance: number;
}

// Escalation summary
export interface EscalationSummary {
  type: string;
  totalEscalations: number;
  averageAnnualIncrease: number;
  effectiveRate: number;
  firstEscalationMonth: number;
  lastEscalationMonth: number;
}

// Renewal option analysis
export interface RenewalAnalysis {
  optionNumber: number;
  termMonths: number;
  projectedMonthlyPayment: number;
  totalOptionCost: number;
  presentValue: number;
  effectiveRate: number;
}

// Purchase option analysis
export interface PurchaseOptionAnalysis {
  available: boolean;
  purchasePrice?: number;
  residualValue?: number;
  fairMarketValueEstimate?: number;
  breakEvenMonth?: number;
  netPresentValueBenefit?: number;
}

// Lease vs Buy comparison
export interface LeaseVsBuyAnalysis {
  leaseOption: {
    totalCost: number;
    presentValue: number;
    monthlyPayment: number;
    totalInterest: number;
  };
  buyOption: {
    purchasePrice: number;
    loanPayment: number;
    totalLoanCost: number;
    presentValue: number;
    taxBenefits: number;
    netCost: number;
  };
  recommendation: 'lease' | 'buy';
  savingsAmount: number;
  breakEvenPoint: number;
}

// Financial metrics summary
export interface FinancialMetrics {
  totalCost: number;
  presentValue: number;
  futureValue: number;
  effectiveAnnualRate: number;
  internalRateOfReturn: number;
  paybackPeriod: number;
  totalInterestPaid: number;
  averageMonthlyPayment: number;
  costPerMonth: number;
  costPerYear: number;
}

// Risk analysis
export interface RiskAnalysis {
  earlyTerminationCost: number;
  totalCommitment: number;
  flexibilityScore: number; // 0-100 scale
  renewalRisk: 'low' | 'medium' | 'high';
  rateEscalationRisk: 'low' | 'medium' | 'high';
}

// Main enhanced lease analysis result
export interface EnhancedLeaseAnalysisResult {
  // Basic information
  leaseType: string;
  termMonths: number;
  startDate: string;
  endDate: string;
  
  // Payment schedule
  schedule: EnhancedLeasePaymentItem[];
  
  // Financial summary
  metrics: FinancialMetrics;
  
  // Escalation analysis
  escalationSummary?: EscalationSummary | undefined;
  
  // Options analysis
  renewalOptions: RenewalAnalysis[];
  purchaseOption?: PurchaseOptionAnalysis | undefined;
  
  // Comparison analysis
  leaseVsBuy?: LeaseVsBuyAnalysis | undefined;
  
  // Risk assessment
  riskAnalysis: RiskAnalysis;
  
  // Additional insights
  insights: {
    effectiveRent: number;
    occupancyCost: number;
    totalCommitment: number;
    flexibilityRating: string;
    recommendations: string[];
  };
  
  // Sensitivity analysis (optional)
  sensitivity?: {
    rateIncrease1Percent: {
      totalCostChange: number;
      monthlyPaymentChange: number;
    };
    termExtension6Months: {
      totalCostChange: number;
      monthlyPaymentChange: number;
    };
    escalationRateChange: {
      totalCostChange: number;
      effectiveRateChange: number;
    };
  } | undefined;
}

// Export type schema for validation
export const EnhancedLeaseAnalysisResultSchema = z.object({
  leaseType: z.string(),
  termMonths: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  schedule: z.array(z.object({
    month: z.number(),
    date: z.string(),
    basePayment: z.number(),
    escalatedPayment: z.number(),
    additionalCosts: z.object({
      camCharges: z.number(),
      propertyTaxes: z.number(),
      insurance: z.number(),
      utilities: z.number(),
      maintenance: z.number(),
      managementFee: z.number(),
      total: z.number(),
    }),
    percentageRent: z.number(),
    totalPayment: z.number(),
    cumulativePaid: z.number(),
    effectiveRate: z.number(),
    presentValue: z.number(),
    interestComponent: z.number(),
    principalComponent: z.number(),
    remainingBalance: z.number(),
  })),
  metrics: z.object({
    totalCost: z.number(),
    presentValue: z.number(),
    futureValue: z.number(),
    effectiveAnnualRate: z.number(),
    internalRateOfReturn: z.number(),
    paybackPeriod: z.number(),
    totalInterestPaid: z.number(),
    averageMonthlyPayment: z.number(),
    costPerMonth: z.number(),
    costPerYear: z.number(),
  }),
  escalationSummary: z.object({
    type: z.string(),
    totalEscalations: z.number(),
    averageAnnualIncrease: z.number(),
    effectiveRate: z.number(),
    firstEscalationMonth: z.number(),
    lastEscalationMonth: z.number(),
  }).optional(),
  renewalOptions: z.array(z.object({
    optionNumber: z.number(),
    termMonths: z.number(),
    projectedMonthlyPayment: z.number(),
    totalOptionCost: z.number(),
    presentValue: z.number(),
    effectiveRate: z.number(),
  })),
  purchaseOption: z.object({
    available: z.boolean(),
    purchasePrice: z.number().optional(),
    residualValue: z.number().optional(),
    fairMarketValueEstimate: z.number().optional(),
    breakEvenMonth: z.number().optional(),
    netPresentValueBenefit: z.number().optional(),
  }).optional(),
  leaseVsBuy: z.object({
    leaseOption: z.object({
      totalCost: z.number(),
      presentValue: z.number(),
      monthlyPayment: z.number(),
      totalInterest: z.number(),
    }),
    buyOption: z.object({
      purchasePrice: z.number(),
      loanPayment: z.number(),
      totalLoanCost: z.number(),
      presentValue: z.number(),
      taxBenefits: z.number(),
      netCost: z.number(),
    }),
    recommendation: z.enum(['lease', 'buy']),
    savingsAmount: z.number(),
    breakEvenPoint: z.number(),
  }).optional(),
  riskAnalysis: z.object({
    earlyTerminationCost: z.number(),
    totalCommitment: z.number(),
    flexibilityScore: z.number(),
    renewalRisk: z.enum(['low', 'medium', 'high']),
    rateEscalationRisk: z.enum(['low', 'medium', 'high']),
  }),
  insights: z.object({
    effectiveRent: z.number(),
    occupancyCost: z.number(),
    totalCommitment: z.number(),
    flexibilityRating: z.string(),
    recommendations: z.array(z.string()),
  }),
  sensitivity: z.object({
    rateIncrease1Percent: z.object({
      totalCostChange: z.number(),
      monthlyPaymentChange: z.number(),
    }),
    termExtension6Months: z.object({
      totalCostChange: z.number(),
      monthlyPaymentChange: z.number(),
    }),
    escalationRateChange: z.object({
      totalCostChange: z.number(),
      effectiveRateChange: z.number(),
    }),
  }).optional(),
});