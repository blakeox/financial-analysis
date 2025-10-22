import Decimal from "decimal.js";
import type { BudgetInput } from "../schemas/budget.js";
import type {
  BudgetResult,
  IncomeSummary,
  ExpenseSummary,
  DebtSummary,
  BudgetMetrics,
  SpendingAnalysis,
  OptimizedBudget,
  BudgetRuleAnalysis,
} from "../types/budget-result.js";

/**
 * Analyzes budget and provides optimization recommendations.
 */
export function analyze(input: BudgetInput): BudgetResult {
  // Calculate income summary
  const incomeSummary = analyzeIncome(input);

  // Calculate expense summary
  const expenseSummary = analyzeExpenses(input);

  // Calculate debt summary
  const debtSummary = analyzeDebts(input);

  // Calculate budget metrics
  const metrics = calculateMetrics(incomeSummary, expenseSummary, debtSummary);

  // Analyze spending patterns
  const spendingAnalysis = analyzeSpending(input, incomeSummary, expenseSummary);

  // Generate optimized budget
  const optimizedBudget = generateOptimizedBudget(
    input,
    incomeSummary,
    expenseSummary,
    metrics
  );

  // Analyze 50/30/20 rule
  const budgetRuleAnalysis = analyze503020Rule(incomeSummary, expenseSummary);

  // Generate recommendations
  const recommendations = generateRecommendations(
    input,
    metrics,
    spendingAnalysis,
    optimizedBudget,
    budgetRuleAnalysis
  );

  const totalIncome = new Decimal(incomeSummary.totalMonthlyIncome);
  const totalExpenses = new Decimal(expenseSummary.totalMonthlyExpenses);

  return {
    input: {
      totalMonthlyIncome: totalIncome.toFixed(2),
      totalMonthlyExpenses: totalExpenses.toFixed(2),
      totalDebts: input.debts.length,
      savingsGoalMonthly: new Decimal(input.savingsGoalMonthly).toFixed(2),
      optimizationGoal: input.optimizationGoal,
    },
    incomeSummary,
    expenseSummary,
    debtSummary,
    metrics,
    spendingAnalysis,
    optimizedBudget,
    budgetRuleAnalysis,
    recommendations,
    metadata: {
      calculatedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

function analyzeIncome(input: BudgetInput): IncomeSummary {
  const totalMonthly = input.income.reduce((sum, source) => sum + source.monthlyAmount, 0);
  const totalAnnual = totalMonthly * 12;

  const sources = input.income.map((source) => {
    const percent = new Decimal(source.monthlyAmount).div(totalMonthly).times(100);
    return {
      name: source.name,
      type: source.type,
      monthlyAmount: new Decimal(source.monthlyAmount).toFixed(2),
      percentOfTotal: percent.toFixed(1),
    };
  });

  return {
    totalMonthlyIncome: new Decimal(totalMonthly).toFixed(2),
    totalAnnualIncome: new Decimal(totalAnnual).toFixed(2),
    sources,
  };
}

function analyzeExpenses(input: BudgetInput): ExpenseSummary {
  const totalMonthly = input.expenses.reduce((sum, expense) => sum + expense.monthlyAmount, 0);
  const totalAnnual = totalMonthly * 12;

  const fixedExpenses = input.expenses
    .filter((e) => e.isFixed)
    .reduce((sum, expense) => sum + expense.monthlyAmount, 0);

  const variableExpenses = totalMonthly - fixedExpenses;

  const essentialExpenses = input.expenses
    .filter((e) => e.isEssential)
    .reduce((sum, expense) => sum + expense.monthlyAmount, 0);

  const discretionaryExpenses = totalMonthly - essentialExpenses;

  const categories = input.expenses.map((expense) => {
    const percent = new Decimal(expense.monthlyAmount).div(totalMonthly).times(100);
    return {
      name: expense.name,
      type: expense.type,
      monthlyAmount: new Decimal(expense.monthlyAmount).toFixed(2),
      percentOfTotal: percent.toFixed(1),
      isFixed: expense.isFixed,
      isEssential: expense.isEssential,
    };
  });

  return {
    totalMonthlyExpenses: new Decimal(totalMonthly).toFixed(2),
    totalAnnualExpenses: new Decimal(totalAnnual).toFixed(2),
    fixedExpenses: new Decimal(fixedExpenses).toFixed(2),
    variableExpenses: new Decimal(variableExpenses).toFixed(2),
    essentialExpenses: new Decimal(essentialExpenses).toFixed(2),
    discretionaryExpenses: new Decimal(discretionaryExpenses).toFixed(2),
    categories,
  };
}

function analyzeDebts(input: BudgetInput): DebtSummary {
  if (input.debts.length === 0) {
    return {
      totalDebtBalance: "0.00",
      totalMonthlyDebtPayment: "0.00",
      debtToIncomeRatio: "0.0",
      weightedAverageInterestRate: "0.0",
      debts: [],
    };
  }

  const totalBalance = input.debts.reduce((sum, debt) => sum + debt.totalBalance, 0);
  const totalPayment = input.debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0);
  const totalIncome = input.income.reduce((sum, source) => sum + source.monthlyAmount, 0);

  const weightedRate =
    input.debts.reduce((sum, debt) => sum + debt.totalBalance * debt.interestRate, 0) / totalBalance;

  const dti = new Decimal(totalPayment).div(totalIncome).times(100);

  const debts = input.debts.map((debt) => ({
    name: debt.name,
    type: debt.type,
    balance: new Decimal(debt.totalBalance).toFixed(2),
    monthlyPayment: new Decimal(debt.monthlyPayment).toFixed(2),
    interestRate: new Decimal(debt.interestRate).times(100).toFixed(2),
  }));

  return {
    totalDebtBalance: new Decimal(totalBalance).toFixed(2),
    totalMonthlyDebtPayment: new Decimal(totalPayment).toFixed(2),
    debtToIncomeRatio: dti.toFixed(1),
    weightedAverageInterestRate: new Decimal(weightedRate).times(100).toFixed(2),
    debts,
  };
}

function calculateMetrics(
  incomeSummary: IncomeSummary,
  expenseSummary: ExpenseSummary,
  debtSummary: DebtSummary
): BudgetMetrics {
  const income = new Decimal(incomeSummary.totalMonthlyIncome);
  const expenses = new Decimal(expenseSummary.totalMonthlyExpenses);
  const netIncome = income.minus(expenses);

  const savingsRate = income.gt(0) ? netIncome.div(income).times(100) : new Decimal(0);

  // Calculate housing ratio (housing expenses as % of income)
  const housingExpenses = new Decimal(
    expenseSummary.categories
      .filter((c) => c.type === "housing")
      .reduce((sum, c) => sum + parseFloat(c.monthlyAmount), 0)
  );
  const housingRatio = income.gt(0) ? housingExpenses.div(income).times(100) : new Decimal(0);

  const debtToIncomeRatio = new Decimal(debtSummary.debtToIncomeRatio);

  // Estimate emergency fund coverage (assume 6 months is ideal)
  // Without actual savings data, we'll use a placeholder
  const emergencyFundCoverage = "0.0"; // Would need current savings input

  // Calculate financial health score (0-100)
  let healthScore = 0;

  // Positive net income (30 points)
  if (netIncome.gt(0)) healthScore += 30;

  // Savings rate >= 20% (20 points)
  if (savingsRate.gte(20)) healthScore += 20;
  else if (savingsRate.gte(10)) healthScore += 10;

  // Housing ratio <= 30% (20 points)
  if (housingRatio.lte(30)) healthScore += 20;
  else if (housingRatio.lte(40)) healthScore += 10;

  // Debt-to-income <= 36% (20 points)
  if (debtToIncomeRatio.lte(36)) healthScore += 20;
  else if (debtToIncomeRatio.lte(43)) healthScore += 10;

  // Emergency fund >= 3 months (10 points) - placeholder
  healthScore += 0; // Would need actual savings data

  return {
    monthlyNetIncome: netIncome.toFixed(2),
    savingsRate: savingsRate.toFixed(1),
    housingRatio: housingRatio.toFixed(1),
    debtToIncomeRatio: debtToIncomeRatio.toFixed(1),
    emergencyFundCoverage,
    financialHealthScore: healthScore,
  };
}

function analyzeSpending(
  _input: BudgetInput,
  incomeSummary: IncomeSummary,
  expenseSummary: ExpenseSummary
): SpendingAnalysis {
  const recommendations: string[] = [];
  const overspendingCategories: Array<{
    category: string;
    currentAmount: string;
    recommendedAmount: string;
    potentialSavings: string;
    reason: string;
  }> = [];

  const income = new Decimal(incomeSummary.totalMonthlyIncome);

  // Check each expense category against typical guidelines
  const guidelines = [
    { type: "housing", max: 0.3, name: "Housing" },
    { type: "transportation", max: 0.15, name: "Transportation" },
    { type: "food", max: 0.15, name: "Food" },
    { type: "entertainment", max: 0.1, name: "Entertainment" },
  ];

  for (const guideline of guidelines) {
    const categoryExpenses = expenseSummary.categories
      .filter((c) => c.type === guideline.type)
      .reduce((sum, c) => sum + parseFloat(c.monthlyAmount), 0);

    const current = new Decimal(categoryExpenses);
    const maxRecommended = income.times(guideline.max);

    if (current.gt(maxRecommended)) {
      const savings = current.minus(maxRecommended);
      overspendingCategories.push({
        category: guideline.name,
        currentAmount: current.toFixed(2),
        recommendedAmount: maxRecommended.toFixed(2),
        potentialSavings: savings.toFixed(2),
        reason: `${guideline.name} should be no more than ${(guideline.max * 100).toFixed(0)}% of income`,
      });
    }
  }

  if (overspendingCategories.length > 0) {
    recommendations.push(
      `Found ${overspendingCategories.length} categories where you may be overspending`
    );
  } else {
    recommendations.push("Your spending appears balanced across major categories");
  }

  // Check discretionary spending
  const discretionary = new Decimal(expenseSummary.discretionaryExpenses);
  const discretionaryPercent = discretionary.div(income).times(100);

  if (discretionaryPercent.gt(30)) {
    recommendations.push(
      `Discretionary spending is ${discretionaryPercent.toFixed(0)}% of income. Consider reducing to 20-30% to increase savings.`
    );
  }

  return {
    recommendations,
    overspendingCategories,
  };
}

function generateOptimizedBudget(
  input: BudgetInput,
  incomeSummary: IncomeSummary,
  expenseSummary: ExpenseSummary,
  _metrics: BudgetMetrics
): OptimizedBudget {
  const goal = input.optimizationGoal;
  const income = new Decimal(incomeSummary.totalMonthlyIncome);
  const currentExpenses = new Decimal(expenseSummary.totalMonthlyExpenses);

  const adjustedCategories: Array<{
    category: string;
    currentAmount: string;
    recommendedAmount: string;
    change: string;
    changePercent: string;
  }> = [];

  let totalReduction = new Decimal(0);

  if (goal === "maximize_savings") {
    // Target 20% savings rate
    const targetSavings = income.times(0.2);
    const currentSavings = income.minus(currentExpenses);
    const additionalNeeded = targetSavings.minus(currentSavings);

    if (additionalNeeded.gt(0)) {
      // Reduce discretionary expenses
      const discretionaryExpenses = expenseSummary.categories.filter((c) => !c.isEssential);
      const totalDiscretionary = discretionaryExpenses.reduce(
        (sum, c) => sum + parseFloat(c.monthlyAmount),
        0
      );

      if (totalDiscretionary > 0) {
        const reductionPercent = additionalNeeded.div(totalDiscretionary);

        for (const expense of discretionaryExpenses) {
          const current = new Decimal(expense.monthlyAmount);
          const reduction = current.times(Decimal.min(reductionPercent, 0.3)); // Max 30% reduction
          const recommended = current.minus(reduction);
          totalReduction = totalReduction.plus(reduction);

          adjustedCategories.push({
            category: expense.name,
            currentAmount: current.toFixed(2),
            recommendedAmount: recommended.toFixed(2),
            change: reduction.neg().toFixed(2),
            changePercent: reduction.div(current).times(-100).toFixed(1),
          });
        }
      }
    }
  } else if (goal === "reduce_debt") {
    // Redirect discretionary spending to debt payment (20% reduction to free up cash)
    const discretionaryExpenses = expenseSummary.categories.filter((c) => !c.isEssential);

    for (const expense of discretionaryExpenses) {
      const current = new Decimal(expense.monthlyAmount);
      const reduction = current.times(0.2); // 20% reduction
      const recommended = current.minus(reduction);
      totalReduction = totalReduction.plus(reduction);

      adjustedCategories.push({
        category: expense.name,
        currentAmount: current.toFixed(2),
        recommendedAmount: recommended.toFixed(2),
        change: reduction.neg().toFixed(2),
        changePercent: reduction.div(current).times(-100).toFixed(1),
      });
    }
  } else if (goal === "reduce_discretionary") {
    // Cut discretionary by 20%
    const discretionaryExpenses = expenseSummary.categories.filter((c) => !c.isEssential);

    for (const expense of discretionaryExpenses) {
      const current = new Decimal(expense.monthlyAmount);
      const reduction = current.times(0.2);
      const recommended = current.minus(reduction);
      totalReduction = totalReduction.plus(reduction);

      adjustedCategories.push({
        category: expense.name,
        currentAmount: current.toFixed(2),
        recommendedAmount: recommended.toFixed(2),
        change: reduction.neg().toFixed(2),
        changePercent: "-20.0",
      });
    }
  } else {
    // balance - Apply 50/30/20 rule recommendations
    const wants = new Decimal(expenseSummary.discretionaryExpenses);
    const targetWants = income.times(0.3);

    if (wants.gt(targetWants)) {
      const reduction = wants.minus(targetWants);
      const discretionaryExpenses = expenseSummary.categories.filter((c) => !c.isEssential);
      const totalDiscretionary = discretionaryExpenses.reduce(
        (sum, c) => sum + parseFloat(c.monthlyAmount),
        0
      );

      if (totalDiscretionary > 0) {
        const reductionPercent = reduction.div(totalDiscretionary);

        for (const expense of discretionaryExpenses) {
          const current = new Decimal(expense.monthlyAmount);
          const categoryReduction = current.times(reductionPercent);
          const recommended = current.minus(categoryReduction);
          totalReduction = totalReduction.plus(categoryReduction);

          adjustedCategories.push({
            category: expense.name,
            currentAmount: current.toFixed(2),
            recommendedAmount: recommended.toFixed(2),
            change: categoryReduction.neg().toFixed(2),
            changePercent: reductionPercent.times(-100).toFixed(1),
          });
        }
      }
    }
  }

  const implementation: string[] = [
    "Review and adjust discretionary spending categories",
    "Set up automatic transfers for increased savings",
    "Track spending weekly to stay on target",
    "Use budgeting apps or spreadsheets for accountability",
  ];

  return {
    optimizationGoal: goal,
    projectedMonthlySavings: totalReduction.toFixed(2),
    projectedAnnualSavings: totalReduction.times(12).toFixed(2),
    adjustedCategories,
    implementation,
  };
}

function analyze503020Rule(
  incomeSummary: IncomeSummary,
  expenseSummary: ExpenseSummary
): BudgetRuleAnalysis {
  const income = new Decimal(incomeSummary.totalMonthlyIncome);
  const needs = new Decimal(expenseSummary.essentialExpenses);
  const wants = new Decimal(expenseSummary.discretionaryExpenses);
  const currentSavings = income.minus(needs).minus(wants);

  const needsPercent = needs.div(income).times(100);
  const wantsPercent = wants.div(income).times(100);
  const savingsPercent = currentSavings.div(income).times(100);

  const targetNeeds = income.times(0.5);
  const targetWants = income.times(0.3);
  const targetSavings = income.times(0.2);

  const needsVariance = needs.minus(targetNeeds);
  const wantsVariance = wants.minus(targetWants);
  const savingsVariance = currentSavings.minus(targetSavings);

  const analysis: string[] = [];

  if (needsPercent.gt(50)) {
    analysis.push(
      `Essential expenses are ${needsPercent.toFixed(0)}% of income (target: 50%). Look for ways to reduce fixed costs.`
    );
  } else {
    analysis.push(`Essential expenses are within target at ${needsPercent.toFixed(0)}%`);
  }

  if (wantsPercent.gt(30)) {
    analysis.push(
      `Discretionary spending is ${wantsPercent.toFixed(0)}% of income (target: 30%). Consider cutting back.`
    );
  } else {
    analysis.push(`Discretionary spending is within target at ${wantsPercent.toFixed(0)}%`);
  }

  if (savingsPercent.lt(20)) {
    analysis.push(
      `Savings rate is ${savingsPercent.toFixed(0)}% of income (target: 20%). Increase savings or reduce expenses.`
    );
  } else {
    analysis.push(`Excellent! You're meeting or exceeding the 20% savings target.`);
  }

  return {
    needs: {
      current: needs.toFixed(2),
      currentPercent: needsPercent.toFixed(1),
      recommended: targetNeeds.toFixed(2),
      recommendedPercent: "50.0",
      variance: needsVariance.toFixed(2),
    },
    wants: {
      current: wants.toFixed(2),
      currentPercent: wantsPercent.toFixed(1),
      recommended: targetWants.toFixed(2),
      recommendedPercent: "30.0",
      variance: wantsVariance.toFixed(2),
    },
    savings: {
      current: currentSavings.toFixed(2),
      currentPercent: savingsPercent.toFixed(1),
      recommended: targetSavings.toFixed(2),
      recommendedPercent: "20.0",
      variance: savingsVariance.toFixed(2),
    },
    analysis,
  };
}

function generateRecommendations(
  _input: BudgetInput,
  metrics: BudgetMetrics,
  spendingAnalysis: SpendingAnalysis,
  optimizedBudget: OptimizedBudget,
  budgetRuleAnalysis: BudgetRuleAnalysis
): string[] {
  const recommendations: string[] = [];

  // Financial health score
  const healthScore = metrics.financialHealthScore;
  if (healthScore >= 80) {
    recommendations.push("Excellent financial health! Keep up the great work.");
  } else if (healthScore >= 60) {
    recommendations.push("Good financial health with room for improvement.");
  } else {
    recommendations.push("Your financial health needs attention. Focus on the recommendations below.");
  }

  // Spending analysis
  spendingAnalysis.recommendations.forEach((rec) => recommendations.push(rec));

  // Budget rule analysis
  budgetRuleAnalysis.analysis.forEach((rec) => recommendations.push(rec));

  // Savings rate
  const savingsRate = new Decimal(metrics.savingsRate);
  if (savingsRate.lt(10)) {
    recommendations.push(
      "Your savings rate is below 10%. Aim for at least 10-20% of income for long-term security."
    );
  }

  // Housing ratio
  const housingRatio = new Decimal(metrics.housingRatio);
  if (housingRatio.gt(30)) {
    recommendations.push(
      `Housing costs are ${housingRatio.toFixed(0)}% of income (ideal: 25-30%). Consider ways to reduce housing expenses.`
    );
  }

  // Debt-to-income
  const dti = new Decimal(metrics.debtToIncomeRatio);
  if (dti.gt(43)) {
    recommendations.push(
      "Debt-to-income ratio is high (>43%). Prioritize debt payoff to improve financial flexibility."
    );
  } else if (dti.gt(36)) {
    recommendations.push(
      "Debt-to-income ratio is manageable but could be improved. Consider debt reduction strategies."
    );
  }

  // Emergency fund
  recommendations.push(
    "Build an emergency fund covering 3-6 months of expenses for financial security"
  );

  // Optimization
  if (new Decimal(optimizedBudget.projectedMonthlySavings).gt(0)) {
    recommendations.push(
      `Implementing the optimized budget could save you $${optimizedBudget.projectedMonthlySavings}/month ($${optimizedBudget.projectedAnnualSavings}/year)`
    );
  }

  return recommendations;
}
