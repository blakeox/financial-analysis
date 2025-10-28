export interface CCAnalysisInput {
  targetCompany: {
    name: string;
    ticker?: string;
    industry: string;
    marketCap: number;
    enterpriseValue: number;
    revenue: number;
    ebitda: number;
    netIncome: number;
  };
  peerCompanies: Array<{
    name: string;
    ticker: string;
    marketCap: number;
    enterpriseValue: number;
    revenue: number;
    ebitda: number;
    netIncome: number;
    tradingPrice: number;
  }>;
  analysisSettings: {
    multiplesToAnalyze: Array<'ev-revenue' | 'ev-ebitda' | 'pe' | 'pb' | 'ps'>;
    outlierThreshold: number;
    includeOutliers: boolean;
  };
  goals: {
    analysisType: 'trading-multiples' | 'premium-discount' | 'outlier-detection';
    includeValuationRange: boolean;
  };
}

export interface CCAnalysisResult {
  summary: {
    targetValuation: number;
    peerAverageValuation: number;
    premiumDiscount: number;
    valuationRange: { low: number; high: number };
  };
  recommendations: string[];
  insights: string[];
}
