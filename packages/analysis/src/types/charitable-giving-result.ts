export interface CharitableGivingResult {
  totalTaxSavings: number;
  optimalGivingStrategy: string;
  recommendedCharities: string[];
  methodComparison?: Array<{
    method: 'cash' | 'appreciated-securities' | 'donor-advised-fund' | 'qcd' | 'trust';
    estimatedTaxSavings: number;
    summary: string;
  }>;
  projectedImpact: {
    immediateTaxBenefit: number;
    longTermPhilanthropicImpact: number;
    estateTaxReduction: number;
  };
  recommendations: string[];
  risks: string[];
}
