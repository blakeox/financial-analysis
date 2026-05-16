export interface MonthlyCashFlow {
  month: number;
  date: string; // ISO date

  // Operating cash flows
  operatingInflows: number;
  operatingOutflows: number;
  netOperatingCashFlow: number;

  // Investing cash flows
  investingInflows: number;
  investingOutflows: number;
  netInvestingCashFlow: number;

  // Financing cash flows
  financingInflows: number;
  financingOutflows: number;
  netFinancingCashFlow: number;

  // Totals
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;

  // Balances
  openingBalance: number;
  closingBalance: number;

  // Cumulative
  cumulativeCashFlow: number;

  // Working capital
  workingCapitalChange?: number;

  // Non-cash items (for indirect method)
  depreciation?: number;
  amortization?: number;
}

export interface CashFlowByCategory {
  category: string;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  percentOfTotal: number;
  monthlyAverage: number;
}

export interface CashFlowMetrics {
  // Summary metrics
  totalOperatingCashFlow: number;
  totalInvestingCashFlow: number;
  totalFinancingCashFlow: number;
  freeCashFlow: number; // Operating CF - CapEx

  // Averages
  averageMonthlyOperatingCF: number;
  averageMonthlyFreeCF: number;

  // Ratios
  operatingCashFlowRatio: number; // Operating CF / Current Liabilities
  cashFlowToDebtRatio: number; // Operating CF / Total Debt
  cashFlowMargin: number; // Operating CF / Revenue
  cashReturnOnAssets?: number; // Operating CF / Total Assets

  // Quality metrics
  cashFlowQuality: number; // Operating CF / Net Income (if available)
  capitalExpenditure: number;
  maintenanceCapEx: number;
  growthCapEx: number;

  // Liquidity metrics
  cashConversionCycle?: number; // Days (if working capital provided)
  burnRate: number; // Average monthly negative cash flow (if applicable)
  runway: number; // Months until cash depletion (0 if positive CF)

  // Investment metrics
  npv: number; // Net Present Value
  irr?: number; // Internal Rate of Return
  paybackPeriod?: number; // Months to recover investment
}

export interface CashFlowRatios {
  operatingCashFlowRatio: number;
  cashFlowToDebtRatio: number;
  cashFlowMargin: number;
  freeCashFlowYield: number;
  cashFlowCoverage: number; // Operating CF / Total Debt Service
  defensiveInterval?: number; // Liquid assets / Daily expenses
}

export interface WorkingCapitalAnalysis {
  netWorkingCapital: number;
  cashConversionCycle: number; // Days
  daysReceivable: number;
  daysInventory: number;
  daysPayable: number;

  workingCapitalTurnover: number;
  workingCapitalChange: number; // Period over period

  efficiency: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface ScenarioComparison {
  scenarioName: string;
  totalCashFlow: number;
  freeCashFlow: number;
  closingBalance: number;
  npv: number;
  variance: number; // Variance from base case
  variancePercent: number;
}

export interface CashFlowForecast {
  forecastMonths: MonthlyCashFlow[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  trendAnalysis: {
    trend: 'Improving' | 'Stable' | 'Declining';
    slope: number;
    projection: number; // Projected cash at end of forecast
  };
}

export interface LiquidityAnalysis {
  currentLiquidity: 'Excellent' | 'Good' | 'Adequate' | 'Poor' | 'Critical';
  monthsOfCoverage: number; // How many months current cash covers expenses
  minimumBalanceViolations: number; // Number of months below minimum
  maxDrawdown: number; // Largest negative balance reached
  recoveryTime?: number; // Months to recover from lowest point
}

export interface RiskAssessment {
  cashFlowVolatility: number; // Standard deviation
  coefficientOfVariation: number;
  liquidityRisk: 'Low' | 'Medium' | 'High';
  operatingRisk: 'Low' | 'Medium' | 'High';
  financingRisk: 'Low' | 'Medium' | 'High';

  riskFactors: string[];
  mitigationStrategies: string[];
}

export interface CashFlowAnalysisResult {
  // Basic information
  companyName?: string;
  analysisStartDate: string;
  analysisEndDate: string;
  analysisPeriodMonths: number;
  method: string;

  // Monthly breakdown
  monthlyCashFlows: MonthlyCashFlow[];

  // Summary by category
  cashFlowByCategory: CashFlowByCategory[];

  // Financial metrics
  metrics: CashFlowMetrics;
  ratios: CashFlowRatios;

  // Analysis components
  workingCapitalAnalysis?: WorkingCapitalAnalysis;
  liquidityAnalysis: LiquidityAnalysis;
  riskAssessment: RiskAssessment;

  // Scenario analysis
  scenarioComparisons?: ScenarioComparison[];

  // Forecast
  forecast?: CashFlowForecast;

  // Key insights
  insights: string[];
  warnings: string[];
  recommendations: string[];

  // Overall assessment
  overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';

  // Additional metadata
  calculationDate: string;
  assumptions: string[];
}
