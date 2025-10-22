import Decimal from "decimal.js";
import type { SavingsGoalInput } from "../schemas/savings-goal.js";
import type {
  SavingsGoalResult,
  SavingsMonth,
  SavingsGoalSummary,
  AlternativeScenario,
  GoalRecommendations,
} from "../types/savings-goal-result.js";

const MAX_MONTHS = 600; // 50 years safety limit

/**
 * Analyzes a savings goal with compound interest and inflation adjustment.
 */
export function analyze(input: SavingsGoalInput): SavingsGoalResult {
  const goalAmount = new Decimal(input.goalAmount);
  const currentSavings = new Decimal(input.currentSavings);
  const monthlyContribution = new Decimal(input.monthlyContribution ?? 0);
  const annualReturnRate = new Decimal(input.annualReturnRate);
  const inflationRate = new Decimal(input.inflationRate);
  const monthlyReturnRate = annualReturnRate.div(12);
  const monthlyInflationRate = inflationRate.div(12);

  // Calculate time to goal if time horizon not specified
  let monthsToGoal: number;
  if (input.timeHorizonMonths) {
    monthsToGoal = input.timeHorizonMonths;
  } else {
    monthsToGoal = calculateMonthsToGoal(
      currentSavings,
      goalAmount,
      monthlyContribution,
      monthlyReturnRate
    );
  }

  // Generate month-by-month schedule
  const schedule: SavingsMonth[] = [];
  let balance = currentSavings;
  let totalContributions = new Decimal(0);
  let totalInterest = new Decimal(0);

  for (let month = 1; month <= Math.min(monthsToGoal, MAX_MONTHS); month++) {
    // Add monthly contribution
    balance = balance.plus(monthlyContribution);
    totalContributions = totalContributions.plus(monthlyContribution);

    // Calculate interest
    const interest = balance.times(monthlyReturnRate);
    balance = balance.plus(interest);
    totalInterest = totalInterest.plus(interest);

    // Calculate real value (adjusted for inflation)
    const inflationFactor = new Decimal(1).plus(monthlyInflationRate).pow(month);
    const realValue = balance.div(inflationFactor);

    schedule.push({
      month,
      contribution: monthlyContribution.toFixed(2),
      interest: interest.toFixed(2),
      balance: balance.toFixed(2),
      realValue: realValue.toFixed(2),
    });

    // Stop if goal reached
    if (balance.gte(goalAmount)) {
      monthsToGoal = month;
      break;
    }
  }

  const finalBalance = balance;
  const inflationFactor = new Decimal(1).plus(monthlyInflationRate).pow(monthsToGoal);
  const realValueAtGoal = finalBalance.div(inflationFactor);
  const inflationImpact = finalBalance.minus(realValueAtGoal);
  const effectiveReturn = annualReturnRate.minus(inflationRate);

  const summary: SavingsGoalSummary = {
    goalAmount: goalAmount.toFixed(2),
    currentSavings: currentSavings.toFixed(2),
    monthlyContribution: monthlyContribution.toFixed(2),
    monthsToGoal,
    yearsToGoal: new Decimal(monthsToGoal).div(12).toFixed(1),
    totalContributions: totalContributions.plus(currentSavings).toFixed(2),
    totalInterestEarned: totalInterest.toFixed(2),
    finalBalance: finalBalance.toFixed(2),
    realValueAtGoal: realValueAtGoal.toFixed(2),
    inflationImpact: inflationImpact.toFixed(2),
    effectiveAnnualReturn: effectiveReturn.times(100).toFixed(2),
  };

  // Calculate alternative scenarios
  const alternatives = calculateAlternativeScenarios(
    currentSavings,
    goalAmount,
    monthlyContribution,
    monthlyReturnRate,
    monthsToGoal
  );

  // Generate goal-specific recommendations
  const recommendations = generateRecommendations(input, summary);

  return {
    input: {
      goalAmount: goalAmount.toFixed(2),
      currentSavings: currentSavings.toFixed(2),
      monthlyContribution: monthlyContribution.toFixed(2),
      annualReturnRate: annualReturnRate.times(100).toFixed(2),
      inflationRate: inflationRate.times(100).toFixed(2),
      timeHorizonMonths: input.timeHorizonMonths,
      goalType: input.goalType,
    },
    savingsSchedule: schedule,
    summary,
    alternativeScenarios: alternatives,
    recommendations,
    metadata: {
      calculatedAt: new Date().toISOString(),
      version: "1.0.0",
    },
  };
}

function calculateMonthsToGoal(
  currentSavings: Decimal,
  goalAmount: Decimal,
  monthlyContribution: Decimal,
  monthlyReturnRate: Decimal
): number {
  if (currentSavings.gte(goalAmount)) return 0;
  if (monthlyContribution.eq(0) && monthlyReturnRate.eq(0)) return MAX_MONTHS;

  // Use formula: FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
  // Solve for n using iterative approach
  let balance = currentSavings;
  for (let month = 1; month <= MAX_MONTHS; month++) {
    balance = balance.plus(monthlyContribution);
    balance = balance.times(new Decimal(1).plus(monthlyReturnRate));
    if (balance.gte(goalAmount)) return month;
  }
  return MAX_MONTHS;
}

function calculateAlternativeScenarios(
  currentSavings: Decimal,
  goalAmount: Decimal,
  monthlyContribution: Decimal,
  monthlyReturnRate: Decimal,
  currentMonthsToGoal: number
): AlternativeScenario[] {
  const alternatives: AlternativeScenario[] = [];

  // Scenario 1: Reach goal in half the time
  const halfTime = Math.ceil(currentMonthsToGoal / 2);
  const requiredForHalfTime = calculateRequiredContribution(
    currentSavings,
    goalAmount,
    monthlyReturnRate,
    halfTime
  );
  if (requiredForHalfTime && requiredForHalfTime.gt(0)) {
    const totalContrib = requiredForHalfTime.times(halfTime);
    alternatives.push({
      description: `Reach goal in ${new Decimal(halfTime).div(12).toFixed(1)} years (half the time)`,
      requiredMonthlyContribution: requiredForHalfTime.toFixed(2),
      monthsToGoal: halfTime,
      yearsToGoal: new Decimal(halfTime).div(12).toFixed(1),
      totalContributions: totalContrib.toFixed(2),
    });
  }

  // Scenario 2: Double monthly contribution
  const doubledContribution = monthlyContribution.times(2);
  const monthsWithDoubled = calculateMonthsToGoal(
    currentSavings,
    goalAmount,
    doubledContribution,
    monthlyReturnRate
  );
  if (monthsWithDoubled < currentMonthsToGoal) {
    alternatives.push({
      description: "Double your monthly contribution",
      requiredMonthlyContribution: doubledContribution.toFixed(2),
      monthsToGoal: monthsWithDoubled,
      yearsToGoal: new Decimal(monthsWithDoubled).div(12).toFixed(1),
      totalContributions: doubledContribution.times(monthsWithDoubled).toFixed(2),
    });
  }

  // Scenario 3: Minimum to reach in 5 years if possible
  const fiveYears = 60;
  if (fiveYears < currentMonthsToGoal) {
    const requiredForFiveYears = calculateRequiredContribution(
      currentSavings,
      goalAmount,
      monthlyReturnRate,
      fiveYears
    );
    if (requiredForFiveYears && requiredForFiveYears.gt(0)) {
      alternatives.push({
        description: "Reach goal in 5 years",
        requiredMonthlyContribution: requiredForFiveYears.toFixed(2),
        monthsToGoal: fiveYears,
        yearsToGoal: "5.0",
        totalContributions: requiredForFiveYears.times(fiveYears).toFixed(2),
      });
    }
  }

  return alternatives;
}

function calculateRequiredContribution(
  currentSavings: Decimal,
  goalAmount: Decimal,
  monthlyReturnRate: Decimal,
  targetMonths: number
): Decimal | null {
  if (targetMonths <= 0) return null;

  // FV = PV(1+r)^n + PMT * ((1+r)^n - 1) / r
  // Solve for PMT: PMT = (FV - PV(1+r)^n) * r / ((1+r)^n - 1)
  const onePlusR = new Decimal(1).plus(monthlyReturnRate);
  const onePlusRPowN = onePlusR.pow(targetMonths);
  const futureValueOfCurrent = currentSavings.times(onePlusRPowN);
  const remaining = goalAmount.minus(futureValueOfCurrent);

  if (monthlyReturnRate.eq(0)) {
    return remaining.div(targetMonths);
  }

  const denominator = onePlusRPowN.minus(1).div(monthlyReturnRate);
  return remaining.div(denominator);
}

function generateRecommendations(
  input: SavingsGoalInput,
  summary: SavingsGoalSummary
): GoalRecommendations {
  const recommendations: string[] = [];
  const goalType = input.goalType;

  // Goal-specific recommendations
  if (goalType === "emergency_fund") {
    const monthlyExpenses = new Decimal(input.goalAmount).div(6); // Assume 6 months
    recommendations.push(
      `Build an emergency fund covering 3-6 months of expenses (~$${monthlyExpenses.toFixed(0)}/month)`
    );
    recommendations.push("Keep funds in a high-yield savings account for liquidity");
    recommendations.push("Start with $1,000 mini emergency fund, then build to full target");
  } else if (goalType === "home_down_payment") {
    recommendations.push("Consider high-yield savings or short-term bonds for safety");
    recommendations.push("Explore first-time homebuyer programs for down payment assistance");
    recommendations.push("Budget for closing costs (2-5% of home price) in addition to down payment");
  } else if (goalType === "education") {
    recommendations.push("Explore 529 college savings plans for tax advantages");
    recommendations.push("Consider scholarships, grants, and work-study programs");
    recommendations.push("Start early to maximize compound growth");
  } else if (goalType === "retirement") {
    recommendations.push("Maximize employer 401(k) match before other savings");
    recommendations.push("Consider Roth IRA for tax-free growth");
    recommendations.push("Diversify investments based on time horizon and risk tolerance");
  }

  // General recommendations based on analysis
  const effectiveReturn = new Decimal(summary.effectiveAnnualReturn);
  if (effectiveReturn.lt(2)) {
    recommendations.push(
      "Your effective return (after inflation) is low. Consider higher-yield investments if time horizon allows."
    );
  }

  const inflationImpact = new Decimal(summary.inflationImpact);
  const finalBalance = new Decimal(summary.finalBalance);
  if (inflationImpact.div(finalBalance).gt(0.2)) {
    recommendations.push(
      `Inflation will reduce your purchasing power by $${inflationImpact.toFixed(0)}. Consider inflation-protected investments.`
    );
  }

  const yearsToGoal = new Decimal(summary.yearsToGoal);
  if (yearsToGoal.gt(10)) {
    recommendations.push(
      "With a long time horizon, consider more aggressive growth investments (stocks, index funds)."
    );
  } else if (yearsToGoal.lt(3)) {
    recommendations.push(
      "With a short time horizon, prioritize capital preservation (savings accounts, CDs, short-term bonds)."
    );
  }

  return {
    goalType,
    recommendations,
    targetMultiplier: goalType === "emergency_fund" ? "6" : undefined,
  };
}
