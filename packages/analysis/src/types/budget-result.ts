/**
 * Summary of income sources.
 */
export interface IncomeSummary {
  totalMonthlyIncome: string;
  totalAnnualIncome: string;
  sources: Array<{
    name: string;
    type: string;
    monthlyAmount: string;
    percentOfTotal: string;
  }>;
}

/**
 * Summary of expenses by category.
 */
export interface ExpenseSummary {
  totalMonthlyExpenses: string;
  totalAnnualExpenses: string;
  fixedExpenses: string;
  variableExpenses: string;
  essentialExpenses: string;
  discretionaryExpenses: string;
  categories: Array<{
    name: string;
    type: string;
    monthlyAmount: string;
    percentOfTotal: string;
    isFixed: boolean;
    isEssential: boolean;
  }>;
}

/**
 * Debt summary and ratios.
 */
export interface DebtSummary {
  totalDebtBalance: string;
  totalMonthlyDebtPayment: string;
  debtToIncomeRatio: string;
  weightedAverageInterestRate: string;
  debts: Array<{
    name: string;
    type: string;
    balance: string;
    monthlyPayment: string;
    interestRate: string;
  }>;
}

/**
 * Current budget performance metrics.
 */
export interface BudgetMetrics {
  monthlyNetIncome: string; // Income - Expenses
  savingsRate: string; // Percentage of income saved
  housingRatio: string; // Housing costs as % of income
  debtToIncomeRatio: string;
  emergencyFundCoverage: string; // Months of expenses covered
  financialHealthScore: number; // 0-100 score
}

/**
 * Spending analysis by category.
 */
export interface SpendingAnalysis {
  recommendations: string[];
  overspendingCategories: Array<{
    category: string;
    currentAmount: string;
    recommendedAmount: string;
    potentialSavings: string;
    reason: string;
  }>;
}

/**
 * Optimized budget proposal.
 */
export interface OptimizedBudget {
  optimizationGoal: string;
  projectedMonthlySavings: string;
  projectedAnnualSavings: string;
  adjustedCategories: Array<{
    category: string;
    currentAmount: string;
    recommendedAmount: string;
    change: string;
    changePercent: string;
  }>;
  implementation: string[];
}

/**
 * 50/30/20 rule analysis.
 */
export interface BudgetRuleAnalysis {
  needs: {
    current: string;
    currentPercent: string;
    recommended: string;
    recommendedPercent: string;
    variance: string;
  };
  wants: {
    current: string;
    currentPercent: string;
    recommended: string;
    recommendedPercent: string;
    variance: string;
  };
  savings: {
    current: string;
    currentPercent: string;
    recommended: string;
    recommendedPercent: string;
    variance: string;
  };
  analysis: string[];
}

/**
 * Complete result of budget optimizer analysis.
 */
export interface BudgetResult {
  input: {
    totalMonthlyIncome: string;
    totalMonthlyExpenses: string;
    totalDebts: number;
    savingsGoalMonthly: string;
    optimizationGoal: string;
  };
  incomeSummary: IncomeSummary;
  expenseSummary: ExpenseSummary;
  debtSummary: DebtSummary;
  metrics: BudgetMetrics;
  spendingAnalysis: SpendingAnalysis;
  optimizedBudget: OptimizedBudget;
  budgetRuleAnalysis: BudgetRuleAnalysis;
  recommendations: string[];
  metadata: {
    calculatedAt: string;
    version: string;
  };
}
