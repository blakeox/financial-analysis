export interface DCFAnalysisInput {
  companyInfo: {
    name: string;
    ticker?: string;
    industry: string;
    businessModel: string;
  };
  financialData: {
    revenue: number[];
    ebitda: number[];
    capex: number[];
    workingCapital: number[];
    debt: number;
    cash: number;
    sharesOutstanding: number;
  };
  assumptions: {
    revenueGrowthRate: number;
    ebitdaMargin: number;
    terminalGrowthRate: number;
    wacc: number;
    projectionYears: number;
  };
  goals: {
    analysisType: 'base-case' | 'sensitivity' | 'scenario' | 'monte-carlo';
    includeSensitivity: boolean;
    includeScenario: boolean;
  };
}

export interface DCFAnalysisResult {
  summary: {
    enterpriseValue: number;
    equityValue: number;
    sharePrice: number;
    valuationRange: { low: number; high: number };
  };
  recommendations: string[];
  insights: string[];
}
