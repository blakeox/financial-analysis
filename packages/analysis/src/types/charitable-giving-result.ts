export interface CharitableGivingResult {
  totalTaxSavings: number;
  optimalGivingStrategy: string;
  recommendedCharities: string[];
  projectedImpact: {
    immediateTaxBenefit: number;
    longTermPhilanthropicImpact: number;
    estateTaxReduction: number;
  };
  recommendations: string[];
  risks: string[];
}