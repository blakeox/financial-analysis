/**
 * Rent vs Buy Calculator Result Types
 *
 * Type definitions for rent vs buy comparison analysis results.
 */

/**
 * Year-by-year analysis data point
 */
export interface YearByYearData {
  year: number;
  housingCost: number;
  equity: number;
  cumulativeCost: number;
}

/**
 * Cost breakdown for a scenario
 */
export interface ScenarioBreakdown {
  housingCosts: number;
  taxBenefits: number;
  opportunityCost: number;
  appreciation: number;
  shouldItemize?: boolean;
  potentialItemized?: number;
  standardDeduction?: number;
  pmiCost?: number;
  capitalGains?: number;
  capitalGainsTax?: number;
  securityDeposit?: number;
}

/**
 * Results for a single scenario (buying or renting)
 */
export interface ScenarioResult {
  name: string;
  totalCost: number;
  monthlyPayment: number;
  equity: number;
  netPosition: number;
  breakdown: ScenarioBreakdown;
  yearByYear: YearByYearData[];
}

/**
 * Comparison factors between buying and renting
 */
export interface ComparisonFactors {
  costAdvantage: string;
  equityBuilding: number;
  flexibility: string;
  taxBenefits: number;
}

/**
 * Comparison summary between buying and renting
 */
export interface ComparisonSummary {
  difference: number;
  breakEvenYear: number | null;
  recommendation: string;
  factors: ComparisonFactors;
}

/**
 * Complete rent vs buy analysis result
 */
export interface RentVsBuyResult {
  buy: ScenarioResult;
  rent: ScenarioResult;
  comparison: ComparisonSummary;
  timestamp: string;
  inputSummary: {
    homePrice: number;
    monthlyRent: number;
    yearsAnalyzed: number;
    downPaymentPercent: number;
  };
}
