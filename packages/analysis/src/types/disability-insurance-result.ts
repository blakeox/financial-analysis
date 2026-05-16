export interface DisabilityInsuranceResult {
  recommendedCoverage: number;
  monthlyPremium: number;
  benefitAmount: number;
  eliminationPeriod: number;
  benefitPeriod: string;
  totalCost: number;
  costBenefitRatio: number;
  recommendations: string[];
  risks: string[];
}
