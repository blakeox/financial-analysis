export interface OptionGreeks {
  delta: number; // Rate of change of option price with respect to underlying price
  gamma: number; // Rate of change of delta with respect to underlying price
  theta: number; // Rate of change of option price with respect to time (time decay)
  vega: number; // Rate of change of option price with respect to volatility
  rho: number; // Rate of change of option price with respect to interest rate

  // Additional Greeks
  lambda?: number; // Leverage (elasticity)
  vanna?: number; // Sensitivity of delta to volatility
  charm?: number; // Delta decay (rate of change of delta over time)
  vomma?: number; // Sensitivity of vega to volatility
}

export interface OptionPricing {
  theoreticalValue: number; // Fair value of the option
  intrinsicValue: number; // Max(S-K, 0) for call, Max(K-S, 0) for put
  timeValue: number; // Theoretical value - intrinsic value

  // Moneyness
  moneyness: 'ITM' | 'ATM' | 'OTM'; // In/At/Out of the money
  inMoneyAmount: number; // How much in the money

  // Probabilities
  probabilityITM: number; // Probability of being in the money at expiration
  probabilityProfit: number; // Probability of profit considering premium paid

  // Break-even
  breakEvenPrice: number; // Underlying price at break-even

  // Cost basis
  premium: number; // Premium per share
  totalCost: number; // Premium * contract size
  maxProfit: number; // Maximum possible profit
  maxLoss: number; // Maximum possible loss
}

export interface EarlyExerciseAnalysis {
  shouldExerciseEarly: boolean;
  optimalExerciseDate?: string; // ISO date
  earlyExerciseValue: number;
  holdValue: number; // Value of holding to expiration
  exerciseBoundary: number; // Stock price level triggering early exercise
}

export interface ImpliedVolatilityResult {
  impliedVolatility: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  iterations: number;
  convergenceError: number;
}

export interface ScenarioAnalysis {
  priceScenarios: Array<{
    underlyingPrice: number;
    optionValue: number;
    profitLoss: number;
    percentReturn: number;
  }>;

  // Sensitivity to volatility
  volatilityScenarios: Array<{
    volatility: number;
    optionValue: number;
  }>;

  // Time decay
  timeDecayScenarios: Array<{
    daysToExpiration: number;
    optionValue: number;
    theta: number;
  }>;
}

export interface StrategyAnalysis {
  strategyName: string;
  totalCost: number;
  totalCredit: number;
  netCost: number;
  maxProfit: number;
  maxLoss: number;
  breakEvenPoints: number[];
  riskRewardRatio: number;

  // P&L at expiration for different prices
  payoffDiagram: Array<{
    underlyingPrice: number;
    profitLoss: number;
  }>;

  // Combined Greeks
  combinedGreeks: OptionGreeks;
}

export interface RiskMetrics {
  leverageRatio: number;
  probabilityOfLoss: number;
  expectedReturn: number;
  sharpeRatio?: number;

  // Risk classifications
  volatilityRisk: 'Low' | 'Medium' | 'High';
  timeDecayRisk: 'Low' | 'Medium' | 'High';
  liquidityRisk?: 'Low' | 'Medium' | 'High';
}

export interface OptionsPricingResult {
  optionType: string;
  optionStyle: string;
  strikePrice: number;
  currentPrice: number;
  expirationDate: string;
  daysToExpiration: number;

  // Pricing results
  pricing: OptionPricing;

  // Greeks
  greeks: OptionGreeks;

  // Analysis components
  scenarioAnalysis: ScenarioAnalysis;
  riskMetrics: RiskMetrics;

  // Optional analyses
  earlyExerciseAnalysis?: EarlyExerciseAnalysis;
  impliedVolatility?: ImpliedVolatilityResult;
  strategyAnalysis?: StrategyAnalysis;

  // Model information
  pricingModel: string;
  volatility: number;
  riskFreeRate: number;
  dividendYield: number;

  // Insights and recommendations
  insights: string[];
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';

  // Additional metadata
  calculationDate: string;
  assumptions: string[];
  warnings: string[];
}
