/**
 * Represents account balance for a single year.
 */
export interface AccountYearBalance {
  accountType: string;
  contribution: string;
  employerMatch: string;
  growthThisYear: string;
  balance: string;
}

/**
 * Represents a single year in the retirement projection.
 */
export interface RetirementYear {
  year: number;
  age: number;
  totalContribution: string;
  totalEmployerMatch: string;
  totalGrowth: string;
  totalBalance: string;
  realValue: string; // Adjusted for inflation
  accounts: AccountYearBalance[];
}

/**
 * Analysis of employer match optimization.
 */
export interface EmployerMatchAnalysis {
  currentMatchAmount: string;
  maxPossibleMatch: string;
  unmatchedAmount: string;
  contributionNeededForFullMatch: string;
  isOptimized: boolean;
  recommendations: string[];
}

/**
 * Tax-advantaged savings summary.
 */
export interface TaxAdvantageAnalysis {
  totalPreTaxContributions: string;
  totalRothContributions: string;
  estimatedTaxSavings: string; // Based on assumed tax bracket
  taxDiversificationScore: string; // Percentage mix
  recommendations: string[];
}

/**
 * Withdrawal strategy analysis.
 */
export interface WithdrawalAnalysis {
  strategy: string;
  firstYearWithdrawal: string;
  projectedMonthlyIncome: string;
  portfolioLastsUntilAge: number;
  probabilityOfSuccess: string; // Monte Carlo or simple projection
  recommendations: string[];
}

/**
 * Summary of retirement savings analysis.
 */
export interface RetirementSummary {
  currentTotalBalance: string;
  projectedBalanceAtRetirement: string;
  realValueAtRetirement: string;
  totalContributions: string;
  totalEmployerMatch: string;
  totalGrowth: string;
  yearsToRetirement: number;
  replacementRatio: string; // Percentage of pre-retirement income
  onTrack: boolean;
  shortfall?: string | undefined;
}

/**
 * Complete result of retirement savings analysis.
 */
export interface RetirementResult {
  input: {
    currentAge: number;
    retirementAge: number;
    currentIncome: string;
    totalAccounts: number;
    totalCurrentBalance: string;
    totalAnnualContribution: string;
    expectedAnnualReturn: string;
  };
  projectionSchedule: RetirementYear[];
  summary: RetirementSummary;
  employerMatchAnalysis: EmployerMatchAnalysis;
  taxAdvantageAnalysis: TaxAdvantageAnalysis;
  withdrawalAnalysis: WithdrawalAnalysis;
  recommendations: string[];
  metadata: {
    calculatedAt: string;
    version: string;
  };
}
