/**
 * Monthly payment allocation for a specific debt
 */
export interface DebtPayment {
  debtName: string;
  payment: string; // Total payment this month
  principal: string; // Principal portion
  interest: string; // Interest portion
  balance: string; // Remaining balance
}

/**
 * Month-by-month payoff progress
 */
export interface PayoffMonth {
  month: number;
  payments: DebtPayment[];
  totalPayment: string; // Total across all debts
  totalInterest: string; // Total interest this month
  remainingBalance: string; // Total remaining balance
}

/**
 * Summary for a single debt's payoff
 */
export interface DebtSummary {
  name: string;
  originalBalance: string;
  totalPaid: string;
  totalInterest: string;
  monthsToPayoff: number;
}

/**
 * Overall payoff strategy summary
 */
export interface PayoffStrategySummary {
  strategy: 'avalanche' | 'snowball';
  totalMonthsToPayoff: number;
  totalInterestPaid: string;
  totalAmountPaid: string;
  monthlyPayment: string; // Average monthly payment
  debtSummaries: DebtSummary[];
}

/**
 * Balance transfer scenario analysis
 */
export interface BalanceTransferAnalysis {
  transferredAmount: string; // Amount transferred
  transferFee: string; // One-time transfer fee
  totalSavings: string; // Interest saved vs original debts
  monthsToPayoff: number;
  totalInterestPaid: string; // Interest on transferred balance
  recommended: boolean; // Whether transfer is beneficial
  savings: string; // Net savings after fees
}

/**
 * Complete debt payoff analysis result
 */
export interface DebtPayoffResult {
  input: {
    totalDebtBalance: string;
    numberOfDebts: number;
    totalMinimumPayment: string;
    extraMonthlyPayment: string;
    strategy: 'avalanche' | 'snowball';
  };

  // Primary strategy results
  payoffSchedule: PayoffMonth[];
  summary: PayoffStrategySummary;

  // Alternative strategy comparison
  alternativeStrategy?: PayoffStrategySummary;
  comparisonSavings: string; // How much better is chosen strategy

  // Balance transfer analysis (if applicable)
  balanceTransfer?: BalanceTransferAnalysis | undefined;

  metadata: {
    timestamp: string;
    calculationMethod: string;
  };
}
