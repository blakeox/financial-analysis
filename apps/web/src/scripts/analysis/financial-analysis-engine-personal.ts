/**
 * Impact-summary analyzers for high-traffic personal calculators.
 */

import type { DetailedAnalysis } from './financial-analysis-engine';
import {
  asRecord,
  formatUsd,
  impactFromThreshold,
  parseMoney,
  parsePercent,
} from './analysis-engine-utils';

export function analyzeDebtPayoffFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const input = asRecord(record.input);

  const months = Number(summary.totalMonthsToPayoff) || 0;
  const totalInterest = parseMoney(summary.totalInterestPaid);
  const totalDebt = parseMoney(input.totalDebtBalance);
  const comparisonSavings = parseMoney(record.comparisonSavings);
  const strategy = String(summary.strategy ?? input.strategy ?? 'avalanche');
  const monthlyPayment = parseMoney(summary.monthlyPayment);
  const interestRatio = totalDebt > 0 ? totalInterest / totalDebt : 0;
  const years = months / 12;

  const insights: DetailedAnalysis['insights'] = [
    {
      category: 'financial',
      title: 'Debt-free timeline',
      description: `At your current plan, you could be debt-free in ${months} months (${years.toFixed(1)} years) using the ${strategy} method.`,
      impact: impactFromThreshold(months, 36, 60),
      actionable: true,
    },
    {
      category: 'optimization',
      title: 'Interest cost',
      description: `You would pay about ${formatUsd(totalInterest)} in interest on ${formatUsd(totalDebt)} of debt (${(interestRatio * 100).toFixed(0)}% of balances).`,
      impact: impactFromThreshold(interestRatio, 0.25, 0.45),
      actionable: true,
    },
  ];

  if (comparisonSavings > 0) {
    insights.push({
      category: 'opportunity',
      title: 'Strategy advantage',
      description: `Your chosen strategy saves about ${formatUsd(comparisonSavings)} versus the alternative payoff order.`,
      impact: comparisonSavings > 1000 ? 'high' : 'medium',
      actionable: false,
    });
  }

  const recommendations: DetailedAnalysis['recommendations'] = [
    {
      priority: months > 48 ? 'high' : 'medium',
      category: 'immediate',
      title: 'Protect minimum payments',
      description:
        'Pay all minimums on time to avoid fees and credit damage while you apply extra payments to priority debts.',
      effort: 'low',
    },
    {
      priority: 'medium',
      category: 'short-term',
      title: 'Increase extra payments',
      description:
        'Even a modest increase to your monthly extra payment can shorten the payoff timeline and reduce total interest.',
      potentialSavings: Math.min(totalInterest * 0.15, comparisonSavings || totalInterest * 0.1),
      effort: 'low',
    },
    {
      priority: 'low',
      category: 'long-term',
      title: 'Avoid new high-interest debt',
      description:
        'Pause new revolving balances while you are in payoff mode so progress is not offset by fresh interest.',
      effort: 'medium',
    },
  ];

  return {
    summary: {
      strategy,
      totalMonthsToPayoff: months,
      totalInterestPaid: totalInterest,
      totalDebtBalance: totalDebt,
      monthlyPayment,
      comparisonSavings,
    },
    insights,
    recommendations,
    riskAssessment: {
      overallRisk: impactFromThreshold(months / 12, 3, 5),
      factors: [
        {
          factor: 'Payoff duration',
          risk: impactFromThreshold(months, 36, 60),
          description: `${months} months until debt-free`,
        },
        {
          factor: 'Interest burden',
          risk: impactFromThreshold(interestRatio, 0.25, 0.45),
          description: `Interest equals ${(interestRatio * 100).toFixed(0)}% of starting debt`,
        },
      ],
    },
    optimizationOpportunities: [
      {
        area: 'Extra monthly payment',
        currentValue: parseMoney(input.extraMonthlyPayment),
        optimizedValue: parseMoney(input.extraMonthlyPayment) + 100,
        potentialImprovement: Math.min(totalInterest * 0.12, 5000),
        description: 'Adding $100/month to extra payments',
      },
    ],
  };
}

export function analyzeAutoLoanFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const meta = asRecord(record.metadata);

  const monthlyPayment = parseMoney(summary.monthlyPayment);
  const totalInterest = parseMoney(summary.totalInterest);
  const totalCost = parseMoney(summary.totalCost);
  const amountFinanced = parseMoney(asRecord(record.costBreakdown).amountFinanced);
  const termMonths = Number(meta.loanTermMonths) || 0;
  const interestRate = Number(meta.interestRate) || 0;
  const interestShare = amountFinanced > 0 ? totalInterest / amountFinanced : 0;

  return {
    summary: {
      monthlyPayment,
      totalInterest,
      totalCost,
      amountFinanced,
      loanTermMonths: termMonths,
      interestRate,
    },
    insights: [
      {
        category: 'financial',
        title: 'Monthly payment load',
        description: `Your estimated payment is ${formatUsd(monthlyPayment)} per month for ${termMonths || 'the selected'} months.`,
        impact: impactFromThreshold(monthlyPayment, 500, 900),
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Total borrowing cost',
        description: `Financing adds ${formatUsd(totalInterest)} in interest (${(interestShare * 100).toFixed(0)}% of amount financed) for a total cost of ${formatUsd(totalCost)}.`,
        impact: impactFromThreshold(interestShare, 0.12, 0.22),
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Rate sensitivity',
        description:
          interestRate > 0.08
            ? `Your ${(interestRate * 100).toFixed(2)}% rate is on the higher side — shop lenders or improve credit before signing.`
            : `Your ${(interestRate * 100).toFixed(2)}% rate is moderate — compare offers to confirm you have competitive terms.`,
        impact: interestRate > 0.08 ? 'high' : interestRate > 0.05 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'high',
        category: 'immediate',
        title: 'Compare total cost, not just payment',
        description:
          'Use the monthly payment together with total interest and fees to compare loans, not the payment alone.',
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Consider a larger down payment',
        description:
          'A higher down payment lowers financed principal and can reduce both payment and interest.',
        potentialSavings: totalInterest * 0.08,
        effort: 'medium',
      },
      {
        priority: 'low',
        category: 'long-term',
        title: 'Plan for ownership costs',
        description: 'Budget for insurance, maintenance, and fuel in addition to the loan payment.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: impactFromThreshold(interestShare, 0.15, 0.25),
      factors: [
        {
          factor: 'Interest rate',
          risk: interestRate > 0.08 ? 'high' : interestRate > 0.05 ? 'medium' : 'low',
          description: `${(interestRate * 100).toFixed(2)}% APR`,
        },
        {
          factor: 'Loan term',
          risk: termMonths > 72 ? 'high' : termMonths > 60 ? 'medium' : 'low',
          description: `${termMonths} month term`,
        },
      ],
    },
    optimizationOpportunities: [
      {
        area: 'Shorter term',
        currentValue: termMonths,
        optimizedValue: Math.max(36, Math.round(termMonths * 0.85)),
        potentialImprovement: totalInterest * 0.1,
        description: 'Shortening the loan by ~15%',
      },
    ],
  };
}

export function analyzeBudgetFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const metrics = asRecord(record.metrics);
  const incomeSummary = asRecord(record.incomeSummary);
  const expenseSummary = asRecord(record.expenseSummary);
  const ruleAnalysis = asRecord(record.budgetRuleAnalysis);

  const monthlyIncome = parseMoney(incomeSummary.totalMonthlyIncome);
  const monthlyExpenses = parseMoney(expenseSummary.totalMonthlyExpenses);
  const netIncome = parseMoney(metrics.monthlyNetIncome);
  const savingsRate = parsePercent(metrics.savingsRate);
  const needsPct = parsePercent(ruleAnalysis.needsPercentage);
  const wantsPct = parsePercent(ruleAnalysis.wantsPercentage);

  return {
    summary: {
      monthlyIncome,
      monthlyExpenses,
      monthlyNetIncome: netIncome,
      savingsRate,
      needsPercentage: needsPct,
      wantsPercentage: wantsPct,
    },
    insights: [
      {
        category: 'financial',
        title: 'Cash flow snapshot',
        description: `You have ${formatUsd(monthlyIncome)} income against ${formatUsd(monthlyExpenses)} expenses, leaving ${formatUsd(netIncome)} per month.`,
        impact: netIncome < 0 ? 'high' : netIncome < monthlyIncome * 0.1 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Savings rate',
        description: `Your savings rate is ${(savingsRate * 100).toFixed(1)}%. Many planners target 15–20% for long-term goals.`,
        impact: impactFromThreshold(0.2 - savingsRate, 0.05, 0.12),
        actionable: true,
      },
      {
        category: 'opportunity',
        title: '50/30/20 alignment',
        description: `Needs are ${(needsPct * 100).toFixed(0)}% and wants ${(wantsPct * 100).toFixed(0)}% of income — compare to the 50/30/20 guideline.`,
        impact: needsPct > 0.55 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: netIncome < 0 ? 'high' : 'medium',
        category: 'immediate',
        title: 'Trim discretionary spending',
        description:
          'Review wants-category expenses first when you need to close a gap or raise your savings rate.',
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Automate savings',
        description:
          'Move savings on payday so the target rate is met before discretionary spending.',
        effort: 'low',
      },
      {
        priority: 'low',
        category: 'long-term',
        title: 'Revisit quarterly',
        description:
          'Re-run the budget after income changes or large expenses to keep categories aligned.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: netIncome < 0 ? 'high' : savingsRate < 0.1 ? 'medium' : 'low',
      factors: [
        {
          factor: 'Negative cash flow',
          risk: netIncome < 0 ? 'high' : 'low',
          description: netIncome < 0 ? 'Expenses exceed income' : 'Income covers expenses',
        },
        {
          factor: 'Low savings rate',
          risk: savingsRate < 0.1 ? 'high' : savingsRate < 0.15 ? 'medium' : 'low',
          description: `${(savingsRate * 100).toFixed(1)}% saved monthly`,
        },
      ],
    },
    optimizationOpportunities: [
      {
        area: 'Savings rate',
        currentValue: savingsRate,
        optimizedValue: Math.min(0.2, savingsRate + 0.05),
        potentialImprovement: monthlyIncome * 0.05 * 12,
        description: 'Increasing savings rate by 5 points',
      },
    ],
  };
}

export function analyzeRetirementFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);

  const yearsToRetirement = Number(record.yearsToRetirement) || 0;
  const projectedBalance = parseMoney(record.projectedBalanceAtRetirement);
  const inflationAdjusted = parseMoney(record.inflationAdjustedBalance);
  const monthlyIncome = parseMoney(record.monthlyRetirementIncome);
  const replacementRatio = parsePercent(record.replacementRatio);
  const savingsRate = parsePercent(record.savingsRate);

  const onTrack = replacementRatio >= 0.7;

  return {
    summary: {
      yearsToRetirement,
      projectedBalanceAtRetirement: projectedBalance,
      inflationAdjustedBalance: inflationAdjusted,
      monthlyRetirementIncome: monthlyIncome,
      replacementRatio,
      savingsRate,
    },
    insights: [
      {
        category: 'financial',
        title: 'Projected nest egg',
        description: `You are on track to about ${formatUsd(projectedBalance)} at retirement (${formatUsd(inflationAdjusted)} in today's dollars).`,
        impact: projectedBalance > 0 ? 'high' : 'medium',
        actionable: false,
      },
      {
        category: 'optimization',
        title: 'Income replacement',
        description: `Your plan replaces ${(replacementRatio * 100).toFixed(0)}% of current income in retirement (many targets use 70–80%).`,
        impact: onTrack ? 'low' : replacementRatio < 0.5 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Contribution leverage',
        description: `With ${yearsToRetirement} years until retirement, small increases to monthly savings now compound meaningfully.`,
        impact: yearsToRetirement > 15 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: onTrack ? 'medium' : 'high',
        category: 'immediate',
        title: onTrack ? 'Maintain contribution rate' : 'Increase savings rate',
        description: onTrack
          ? 'Keep current contributions and revisit annually after raises or life events.'
          : 'Raise monthly contributions or employer match capture to close the replacement gap.',
        effort: onTrack ? 'low' : 'medium',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Tax diversification',
        description:
          'Balance Traditional and Roth buckets if your plan supports both account types.',
        effort: 'medium',
      },
      {
        priority: 'low',
        category: 'long-term',
        title: 'Inflation planning',
        description:
          'Use inflation-adjusted figures when judging whether retirement income meets future spending.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: onTrack ? 'low' : replacementRatio < 0.5 ? 'high' : 'medium',
      factors: [
        {
          factor: 'Replacement ratio',
          risk: onTrack ? 'low' : replacementRatio < 0.5 ? 'high' : 'medium',
          description: `${(replacementRatio * 100).toFixed(0)}% income replacement`,
        },
        {
          factor: 'Time horizon',
          risk: yearsToRetirement < 10 ? 'medium' : 'low',
          description: `${yearsToRetirement} years to retirement`,
        },
      ],
    },
    optimizationOpportunities: [
      {
        area: 'Monthly contribution',
        currentValue: parseMoney(record.annualContribution) / 12,
        optimizedValue: (parseMoney(record.annualContribution) / 12) * 1.1,
        potentialImprovement: projectedBalance * 0.08,
        description: 'Increasing annual savings by 10%',
      },
    ],
  };
}

export function analyzeSavingsGoalFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary ?? record);

  const goalAmount = parseMoney(summary.goalAmount ?? record.goalAmount);
  const monthsToGoal =
    Number(summary.monthsToGoal ?? record.monthsToGoal ?? record.monthsToReachGoal) || 0;
  const monthlyRequired = parseMoney(summary.monthlyRequired ?? record.monthlyRequired);
  const projectedBalance = parseMoney(
    summary.projectedBalance ?? record.projectedBalance ?? record.finalBalance
  );
  const onTrack = Boolean(
    summary.onTrack ??
    record.onTrack ??
    record.goalAchieved ??
    (goalAmount > 0 ? projectedBalance >= goalAmount : projectedBalance > 0)
  );
  const yearsToGoal = Number(record.yearsToGoal) || (monthsToGoal > 0 ? monthsToGoal / 12 : 0);

  return {
    summary: {
      goalAmount,
      monthsToGoal,
      yearsToGoal: yearsToGoal || undefined,
      monthlyRequired,
      projectedBalance,
      progressPercent: Number(record.progressPercent) || undefined,
      onTrack,
    },
    insights: [
      {
        category: 'financial',
        title: 'Goal progress',
        description:
          yearsToGoal > 0 && !goalAmount
            ? `Projected balance ${formatUsd(projectedBalance)} in about ${yearsToGoal.toFixed(1)} years (${monthsToGoal} months).`
            : onTrack
              ? `Your plan reaches ${formatUsd(goalAmount)} in about ${monthsToGoal} months.`
              : `You may fall short of ${formatUsd(goalAmount)} — about ${formatUsd(monthlyRequired)} per month is needed.`,
        impact: onTrack ? 'low' : 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Monthly commitment',
        description: `Saving ${formatUsd(monthlyRequired)} per month keeps the target on schedule.`,
        impact: impactFromThreshold(monthlyRequired, 300, 800),
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: onTrack ? 'low' : 'high',
        category: 'immediate',
        title: onTrack ? 'Automate transfers' : 'Close the savings gap',
        description: onTrack
          ? 'Automate the monthly transfer on payday to stay on pace.'
          : 'Increase monthly savings or extend the target date to match realistic cash flow.',
        effort: 'low',
      },
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Use a dedicated account',
        description:
          'Hold goal funds in a separate high-yield savings account to reduce spending drift.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: onTrack ? 'low' : 'medium',
      factors: [
        {
          factor: 'Funding shortfall',
          risk: onTrack ? 'low' : 'high',
          description: onTrack ? 'Plan meets target' : 'Projected balance below goal',
        },
      ],
    },
    optimizationOpportunities: [],
  };
}
