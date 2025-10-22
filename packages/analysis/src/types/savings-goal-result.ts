/**
 * Represents a single month in the savings projection.
 */
export interface SavingsMonth {
  month: number;
  contribution: string;
  interest: string;
  balance: string;
  realValue: string; // Adjusted for inflation
}

/**
 * Summary of the savings goal analysis.
 */
export interface SavingsGoalSummary {
  goalAmount: string;
  currentSavings: string;
  monthlyContribution: string;
  monthsToGoal: number;
  yearsToGoal: string;
  totalContributions: string;
  totalInterestEarned: string;
  finalBalance: string;
  realValueAtGoal: string; // Adjusted for inflation
  inflationImpact: string; // Difference between nominal and real value
  effectiveAnnualReturn: string; // Return rate minus inflation
}

/**
 * Alternative scenario showing required contribution or time.
 */
export interface AlternativeScenario {
  description: string;
  requiredMonthlyContribution?: string;
  monthsToGoal?: number;
  yearsToGoal?: string;
  totalContributions?: string;
}

/**
 * Goal-specific recommendations based on goal type.
 */
export interface GoalRecommendations {
  goalType: string;
  recommendations: string[];
  targetMultiplier?: string | undefined; // For emergency funds (e.g., "6" for 6 months expenses)
}

/**
 * Complete result of savings goal analysis.
 */
export interface SavingsGoalResult {
  input: {
    goalAmount: string;
    currentSavings: string;
    monthlyContribution: string;
    annualReturnRate: string;
    inflationRate: string;
    timeHorizonMonths?: number | undefined;
    goalType: string;
  };
  savingsSchedule: SavingsMonth[];
  summary: SavingsGoalSummary;
  alternativeScenarios: AlternativeScenario[];
  recommendations: GoalRecommendations;
  metadata: {
    calculatedAt: string;
    version: string;
  };
}
