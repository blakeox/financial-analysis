/**
 * Represents a payment for a single loan in a month.
 */
export interface LoanPayment {
  loanName: string;
  payment: string;
  principal: string;
  interest: string;
  balance: string;
}

/**
 * Represents a single month in the loan payoff schedule.
 */
export interface StudentLoanMonth {
  month: number;
  payments: LoanPayment[];
  totalPayment: string;
  totalInterest: string;
  remainingBalance: string;
}

/**
 * Summary for a single loan.
 */
export interface LoanSummary {
  name: string;
  loanType: string;
  originalBalance: string;
  totalPaid: string;
  totalInterest: string;
  monthsToPayoff: number;
}

/**
 * Summary of the standard repayment strategy.
 */
export interface StandardPayoffSummary {
  strategy: string;
  totalMonthsToPayoff: number;
  totalInterestPaid: string;
  totalAmountPaid: string;
  averageMonthlyPayment: string;
  loanSummaries: LoanSummary[];
}

/**
 * Analysis of income-driven repayment plan.
 */
export interface IncomeDrivenAnalysis {
  planType: string;
  monthlyPaymentYear1: string;
  monthlyPaymentFinal: string;
  totalMonthsToPayoff: number;
  totalAmountPaid: string;
  totalInterestPaid: string;
  potentialForgiveness: string;
  comparisonToStandard: {
    paymentDifference: string;
    interestDifference: string;
    timeDifference: number; // months
    recommended: boolean;
    reason: string;
  };
}

/**
 * Analysis of refinancing option.
 */
export interface RefinancingAnalysis {
  newInterestRate: string;
  newTermMonths: number;
  closingCosts: string;
  newMonthlyPayment: string;
  totalAmountPaid: string;
  totalInterestPaid: string;
  totalSavings: string;
  recommended: boolean;
  reason: string;
  warnings: string[];
}

/**
 * Complete result of student loan analysis.
 */
export interface StudentLoanResult {
  input: {
    totalLoans: number;
    totalBalance: string;
    weightedAverageRate: string;
    extraMonthlyPayment: string;
    paymentStrategy: string;
  };
  payoffSchedule: StudentLoanMonth[];
  summary: StandardPayoffSummary;
  incomeDrivenAnalysis?: IncomeDrivenAnalysis | undefined;
  refinancingAnalysis?: RefinancingAnalysis | undefined;
  recommendations: string[];
  metadata: {
    calculatedAt: string;
    version: string;
  };
}
