export interface InternationalTaxPlanningResult {
  taxLiability: {
    usFederalTax: number;
    foreignTax: number;
    totalTax: number;
    foreignTaxCredit: number;
    netTaxOwed: number;
  };
  treatyBenefits: string[];
  recommendedStructures: string[];
  complianceRequirements: string[];
  projectedSavings: number;
  recommendations: string[];
  risks: string[];
}