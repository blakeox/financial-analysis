export interface RealOptionsResult {
  // Base project valuation
  npv: number;
  irr: number;
  paybackPeriod: number;

  // Real options valuation
  optionValue: number;
  totalValue: number; // NPV + Option Value
  optionToProjectRatio: number;

  // Option Greeks
  delta: number; // Sensitivity to underlying value
  gamma: number; // Sensitivity of delta
  theta: number; // Time decay
  rho: number; // Sensitivity to interest rate

  // Analysis
  recommendation: string;
  insights: string[];
  risks: string[];
}