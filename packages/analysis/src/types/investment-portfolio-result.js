export interface InvestmentPortfolioInput {
  personalInfo: {
    age: number;
    maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
    dependents: number;
    employmentStatus: 'employed' | 'self-employed' | 'unemployed' | 'retired';
  };
  currentPortfolio: {
    totalValue: number;
    holdings: Array<{
      symbol: string;
      name: string;
      shares: number;
      currentPrice: number;
      sector: string;
      assetClass: 'stock' | 'bond' | 'etf' | 'mutual-fund' | 'cash' | 'alternative';
    }>;
    cashReserve: number;
  };
  goals: {
    targetAllocation: {
      stocks: number;
      bonds: number;
      cash: number;
      alternatives: number;
    };
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    timeHorizon: number;
    rebalancingFrequency: 'monthly' | 'quarterly' | 'annually' | 'never';
  };
}

export interface InvestmentPortfolioResult {
  summary: {
    currentValue: number;
    targetAllocation: Record<string, number>;
    actualAllocation: Record<string, number>;
    portfolioScore: number;
  };
  recommendations: string[];
  insights: string[];
}
