export interface TaxLossHarvestingResult {
  totalTaxLoss: number;
  harvestableLosses: Array<{
    symbol: string;
    lossAmount: number;
    washSaleRisk: boolean;
  }>;
  recommendedActions: string[];
  projectedTaxSavings: number;
  washSalePeriod: number;
  recommendations: string[];
  risks: string[];
}