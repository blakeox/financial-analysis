/**
 * Impact-summary analyzers for additional high-traffic calculators.
 */

import type { DetailedAnalysis } from './financial-analysis-engine';
import { FinancialAnalysisEngine } from './financial-analysis-engine';
import {
  asRecord,
  formatUsd,
  impactFromThreshold,
  mapStringInsights,
  mapStringRecommendations,
  parseMoney,
} from './analysis-engine-utils';

export function analyzeSaasMetricsFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const ltvCac = Number(record.ltvCacRatio) || 0;
  const mrr = parseMoney(record.mrr);
  const churn = Number(record.churnRate) || 0;
  const payback = Number(record.paybackPeriod) || 0;
  const ruleOf40 = Number(record.ruleOf40) || 0;
  const health = asRecord(record.health);

  const engineRecs = Array.isArray(record.recommendations)
    ? mapStringRecommendations(record.recommendations as string[])
    : [];

  return {
    summary: {
      mrr,
      arr: parseMoney(record.arr),
      ltvCacRatio: ltvCac,
      churnRate: churn,
      paybackPeriod: payback,
      ruleOf40,
      healthGrade: health.grade,
    },
    insights: [
      {
        category: 'financial',
        title: 'Recurring revenue',
        description: `MRR is ${formatUsd(mrr)} (${formatUsd(parseMoney(record.arr))} ARR). LTV:CAC is ${ltvCac.toFixed(1)}:1.`,
        impact: ltvCac >= 3 ? 'low' : ltvCac >= 2 ? 'medium' : 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Rule of 40',
        description: `Growth plus margin score is ${ruleOf40.toFixed(1)} (target ≥40 for efficient SaaS).`,
        impact: ruleOf40 >= 40 ? 'low' : ruleOf40 >= 25 ? 'medium' : 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Retention',
        description: `Monthly churn is ${churn.toFixed(1)}% with ${payback.toFixed(1)} month CAC payback.`,
        impact: churn > 5 ? 'high' : churn > 2 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations:
      engineRecs.length > 0
        ? engineRecs
        : [
            {
              priority: ltvCac < 3 ? 'high' : 'medium',
              category: 'immediate',
              title: 'Improve unit economics before scaling',
              description:
                'Focus on retention and CAC efficiency before increasing paid acquisition.',
              effort: 'medium',
            },
          ],
    riskAssessment: {
      overallRisk: String(health.status) === 'critical' ? 'high' : 'medium',
      factors: [
        {
          factor: 'LTV:CAC',
          risk: ltvCac < 2 ? 'high' : 'low',
          description: `${ltvCac.toFixed(1)}:1`,
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeRentVsBuyFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const buy = asRecord(record.buy);
  const rent = asRecord(record.rent);
  const comparison = asRecord(record.comparison);

  const difference = parseMoney(comparison.difference);
  const factors = asRecord(comparison.factors);
  const winner = String(factors.costAdvantage ?? comparison.recommendation ?? '');

  return {
    summary: {
      buyNetPosition: parseMoney(buy.netPosition),
      rentNetPosition: parseMoney(rent.netPosition),
      difference,
      breakEvenYear: comparison.breakEvenYear,
      recommendation: comparison.recommendation,
    },
    insights: [
      {
        category: 'financial',
        title: 'Net position comparison',
        description: `Buying ends at ${formatUsd(parseMoney(buy.netPosition))} vs renting at ${formatUsd(parseMoney(rent.netPosition))} over the analysis period.`,
        impact: 'high',
        actionable: false,
      },
      {
        category: 'opportunity',
        title: 'Winner',
        description: `${winner || 'Compare'} is ahead by ${formatUsd(Math.abs(difference))} on a nominal basis.`,
        impact: Math.abs(difference) > 50000 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Break-even timing',
        description: comparison.breakEvenYear
          ? `Buying may catch up around year ${comparison.breakEvenYear}.`
          : 'Buying may not break even within the horizon you modeled.',
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Stress-test assumptions',
        description: 'Re-run with different appreciation, rent growth, and maintenance costs.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: 'medium',
      factors: [
        {
          factor: 'Housing market risk',
          risk: 'medium',
          description: 'Home price and liquidity assumptions drive buy outcomes',
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeCreditCardPayoffFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const current = asRecord(record.currentStrategy);
  const recommendation = asRecord(record.recommendation);
  const utilization = asRecord(record.utilization);

  const savings = parseMoney(recommendation.savings);

  return {
    summary: {
      monthsToPayoff: Number(current.monthsToPayoff) || 0,
      totalInterest: parseMoney(current.totalInterest),
      utilization: Number(utilization.current) || 0,
      bestStrategy: recommendation.bestStrategy,
      savings,
    },
    insights: [
      {
        category: 'financial',
        title: 'Payoff timeline',
        description: `Your plan pays off in ${Number(current.monthsToPayoff) || 0} months with ${formatUsd(parseMoney(current.totalInterest))} in interest.`,
        impact: impactFromThreshold(Number(current.monthsToPayoff) || 0, 24, 48),
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Better strategy available',
        description: `Switching to ${String(recommendation.bestStrategy ?? 'an optimized plan')} could save about ${formatUsd(savings)}.`,
        impact: savings > 500 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Utilization',
        description: `Utilization is ${Number(utilization.current || 0).toFixed(0)}% — high utilization can hurt credit scores.`,
        impact: Number(utilization.current) > 50 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'high',
        category: 'immediate',
        title: 'Avoid minimum-only payments',
        description: 'Pay more than the minimum whenever possible to reduce interest and timeline.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: Number(utilization.current) > 50 ? 'high' : 'low',
      factors: [
        {
          factor: 'Interest cost',
          risk: parseMoney(current.totalInterest) > 2000 ? 'medium' : 'low',
          description: formatUsd(parseMoney(current.totalInterest)),
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeBreakEvenFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const breakEven = asRecord(record.breakEven);
  const marginOfSafety = asRecord(record.marginOfSafety);

  return {
    summary: {
      breakEvenUnits: Number(breakEven.units) || 0,
      breakEvenRevenue: parseMoney(breakEven.revenue),
      contributionMarginRatio: Number(breakEven.contributionMarginRatio) || 0,
      marginOfSafetyPct: Number(marginOfSafety.percentage) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'Break-even volume',
        description: `You need ${Number(breakEven.units || 0).toLocaleString()} units or ${formatUsd(parseMoney(breakEven.revenue))} revenue to cover fixed costs.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Margin of safety',
        description: `Margin of safety is ${Number(marginOfSafety.percentage || 0).toFixed(1)}% above break-even.`,
        impact: Number(marginOfSafety.percentage) < 10 ? 'high' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Reduce fixed costs',
        description: 'Lowering fixed costs shifts break-even down faster than revenue alone.',
        effort: 'medium',
      },
    ],
    riskAssessment: {
      overallRisk: Number(marginOfSafety.percentage) < 10 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeCashFlowForecastFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const warnings = Array.isArray(record.warnings) ? (record.warnings as string[]) : [];

  const endingCash = parseMoney(summary.endingCash);
  const lowest = parseMoney(asRecord(summary.lowestCash).amount);
  const runway = Number(summary.cashRunway);
  const runwayFinite = Number.isFinite(runway);

  return {
    summary: {
      endingCash,
      lowestCash: lowest,
      cashRunway: runwayFinite ? runway : null,
      averageBurnRate: parseMoney(summary.averageBurnRate),
    },
    insights: [
      {
        category: 'financial',
        title: '12-month cash outlook',
        description: `Ending cash is ${formatUsd(endingCash)} with a low point of ${formatUsd(lowest)}.`,
        impact: endingCash < 0 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Runway',
        description: runwayFinite
          ? `Estimated runway is ${runway.toFixed(1)} months at the modeled burn rate.`
          : 'Operations appear cash-flow positive over the forecast.',
        impact: runwayFinite && runway < 6 ? 'high' : 'low',
        actionable: true,
      },
      ...mapStringInsights(warnings, 'risk'),
    ],
    recommendations: [
      {
        priority: lowest < 0 ? 'high' : 'medium',
        category: 'immediate',
        title: 'Bridge low-cash months',
        description: 'Plan financing or expense cuts before months where cash dips negative.',
        effort: 'medium',
      },
    ],
    riskAssessment: {
      overallRisk: endingCash < 0 || (runwayFinite && runway < 6) ? 'high' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeInvestVsPayoffDebtFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const recommendation = asRecord(record.recommendation);
  const factors = asRecord(recommendation.factors);
  const invest = asRecord(record.invest);
  const payOff = asRecord(record.payOffDebt);

  const winner = String(
    recommendation.riskAdjustedWinner ??
      recommendation.mathWinner ??
      recommendation.bestStrategy ??
      ''
  );

  return {
    summary: {
      recommendedStrategy: winner,
      investEndingWealth: parseMoney(invest.endingWealth),
      payOffEndingWealth: parseMoney(payOff.endingWealth),
      reasoning: recommendation.reasoning,
    },
    insights: [
      {
        category: 'financial',
        title: 'Strategy comparison',
        description: `Recommended: ${winner}. Invest path ends at ${formatUsd(parseMoney(invest.endingWealth))} vs pay-off-first at ${formatUsd(parseMoney(payOff.endingWealth))}.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Guaranteed vs market returns',
        description: String(
          factors.guaranteedReturn ??
            'Debt payoff returns are certain; investing carries market risk.'
        ),
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Match strategy to goals',
        description: String(
          recommendation.reasoning ?? 'Align with emergency fund and risk tolerance.'
        ),
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: 'medium',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeMortgageScenarioPlanningFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const scenarios = (Array.isArray(record.scenarios) ? record.scenarios : []) as Array<
    Record<string, unknown>
  >;

  if (scenarios.length === 0) {
    return {
      summary: record,
      insights: [],
      recommendations: [],
      riskAssessment: { overallRisk: 'low', factors: [] },
      optimizationOpportunities: [],
    };
  }

  const baseScenarios = scenarios.filter((s) => !String(s.name ?? '').includes('Refinance'));
  const compared = baseScenarios.length > 0 ? baseScenarios : scenarios;

  const best = compared.reduce((a, b) =>
    parseMoney(a.totalCost) < parseMoney(b.totalCost) ? a : b
  );
  const worst = compared.reduce((a, b) =>
    parseMoney(a.totalCost) > parseMoney(b.totalCost) ? a : b
  );

  const bestCost = parseMoney(best.totalCost);
  const worstCost = parseMoney(worst.totalCost);
  const savings = worstCost - bestCost;

  return {
    summary: {
      scenarioCount: compared.length,
      bestScenario: best.name,
      bestTotalCost: bestCost,
      bestMonthlyPayment: parseMoney(best.monthlyPaymentWithPMI ?? best.monthlyPayment),
      savingsVsHighest: savings,
    },
    insights: [
      {
        category: 'financial',
        title: 'Lowest total cost',
        description: `${String(best.name)} has the lowest lifetime cost at ${formatUsd(bestCost)} (${formatUsd(parseMoney(best.monthlyPaymentWithPMI ?? best.monthlyPayment))}/mo).`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Scenario spread',
        description:
          savings > 0
            ? `The highest-cost scenario costs ${formatUsd(savings)} more over the loan life than the best option.`
            : 'Scenarios are closely matched on total cost — weigh flexibility and PMI timing.',
        impact: savings > 25000 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'PMI exposure',
        description: compared.some((s) => Boolean(s.hasPMI))
          ? 'One or more scenarios include PMI — compare how quickly equity removes it.'
          : 'No PMI in the compared scenarios at current down payments.',
        impact: compared.some((s) => Boolean(s.hasPMI)) ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Stress-test rates and extra payments',
        description:
          'Re-run with higher rates or modest extra principal to see break-even on discount points.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: 'medium',
      factors: [
        {
          factor: 'Rate sensitivity',
          risk: 'medium',
          description: 'Small rate changes shift total cost materially across scenarios',
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeEbitdaForecastFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const keyMetrics = asRecord(record.keyMetrics);
  const scenario = asRecord(record.scenario);

  const totalRevenue = parseMoney(summary.totalRevenue);
  const totalEbitda = parseMoney(summary.totalEbitda);
  const margin = Number(summary.averageEbitdaMargin) || 0;
  const marginPct = margin > 1 ? margin : margin * 100;
  const revenueGrowth = Number(summary.revenueGrowth) || 0;
  const growthPct = revenueGrowth > 1 ? revenueGrowth : revenueGrowth * 100;

  return {
    summary: {
      totalRevenue,
      totalEbitda,
      averageEbitdaMargin: marginPct,
      revenueGrowth: growthPct,
      breakEvenMonth: summary.breakEvenMonth,
      scenarioName: scenario.name,
      revenuePerEmployee: parseMoney(keyMetrics.revenuePerEmployee),
    },
    insights: [
      {
        category: 'financial',
        title: 'EBITDA outlook',
        description: `Projected EBITDA is ${formatUsd(totalEbitda)} on ${formatUsd(totalRevenue)} revenue (${marginPct.toFixed(1)}% margin).`,
        impact: marginPct < 15 ? 'high' : marginPct < 20 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Growth trajectory',
        description: `Revenue growth is modeled at ${growthPct.toFixed(1)}% over the forecast.`,
        impact: growthPct > 10 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Team productivity',
        description: keyMetrics.revenuePerEmployee
          ? `Revenue per employee is about ${formatUsd(parseMoney(keyMetrics.revenuePerEmployee))}.`
          : 'Add employee assumptions to benchmark revenue per headcount.',
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: marginPct < 15 ? 'high' : 'medium',
        category: 'short-term',
        title: 'Protect EBITDA margin',
        description:
          marginPct < 15
            ? 'Margins below 15% are tight for services — review pricing, utilization, and overhead.'
            : 'Track margin monthly and tie hiring to revenue per employee targets.',
        effort: 'medium',
      },
    ],
    riskAssessment: {
      overallRisk: marginPct < 10 ? 'high' : 'medium',
      factors: [
        {
          factor: 'Margin',
          risk: marginPct < 15 ? 'medium' : 'low',
          description: `${marginPct.toFixed(1)}% average EBITDA margin`,
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeBusinessLoanQualifierFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const dscr = Number(record.dscr) || 0;
  const eligibility = asRecord(record.loanEligibility);
  const eligibleCount = Object.values(eligibility).filter(
    (entry) => asRecord(entry).eligible === true
  ).length;

  return {
    summary: {
      dscr,
      bestOption: record.bestOption,
      eligibleLoanTypes: eligibleCount,
      estimatedMonthlyPayment: parseMoney(record.estimatedMonthlyPayment),
    },
    insights: [
      {
        category: 'financial',
        title: 'Debt service coverage',
        description: `DSCR is ${dscr.toFixed(2)} (lenders often want ≥1.25).`,
        impact: dscr < 1.25 ? 'high' : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Financing options',
        description: `${eligibleCount} of 4 loan structures appear eligible; best fit: ${String(record.bestOption ?? 'review inputs')}.`,
        impact: eligibleCount === 0 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: (() => {
      const fromEngine = Array.isArray(record.recommendations)
        ? mapStringRecommendations(record.recommendations as string[])
        : [];
      if (fromEngine.length > 0) return fromEngine;
      return [
        {
          priority: dscr < 1.25 ? ('high' as const) : ('medium' as const),
          category: 'immediate' as const,
          title: 'Improve coverage before applying',
          description: 'Increase NOI or reduce existing debt service to strengthen DSCR.',
          effort: 'medium' as const,
        },
      ];
    })(),
    riskAssessment: {
      overallRisk: dscr < 1.1 ? 'high' : dscr < 1.25 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzePricingStrategyFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const optimal = asRecord(record.optimal);
  const optimalPrice = parseMoney(optimal.price);
  const optimalProfit = parseMoney(optimal.profit);

  return {
    summary: {
      optimalPrice,
      optimalProfit,
      costPlusPrice: parseMoney(asRecord(record.costPlus).price),
      valueBasedPrice: parseMoney(asRecord(record.valueBase).price),
      competitivePrice: parseMoney(asRecord(record.competitive).price),
    },
    insights: [
      {
        category: 'financial',
        title: 'Profit-maximizing price',
        description: `Optimal price is ${formatUsd(optimalPrice)} with about ${formatUsd(optimalProfit)} monthly profit.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Strategy spread',
        description:
          'Compare cost-plus, value-based, and competitive anchors before changing list price.',
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeSideHustleIncomeFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const afterTax = asRecord(record.afterTax);
  const taxes = asRecord(record.taxes);

  const takeHome = parseMoney(afterTax.annualAfterTax);
  const effectiveRate = Number(taxes.effectiveTaxRate) || 0;
  const ratePct = effectiveRate > 1 ? effectiveRate : effectiveRate * 100;

  return {
    summary: {
      annualAfterTax: takeHome,
      hourlyAfterTax: parseMoney(afterTax.hourlyAfterTaxRate),
      quarterlyEstimatedTax: parseMoney(taxes.quarterlyEstimated),
      takeHomePercent: Number(afterTax.takeHomePercent) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'After-tax income',
        description: `You keep about ${formatUsd(takeHome)} per year (${Number(afterTax.takeHomePercent || 0).toFixed(1)}% of revenue).`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Tax reserve',
        description: `Plan for ${formatUsd(parseMoney(taxes.quarterlyEstimated))} quarterly estimated payments (${ratePct.toFixed(1)}% effective rate).`,
        impact: ratePct > 30 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Separate tax savings',
        description:
          'Set aside estimated taxes monthly to avoid cash-flow surprises at quarter-end.',
        effort: 'low',
      },
    ],
    riskAssessment: {
      overallRisk: ratePct > 35 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeRothVsTraditionalIraFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const comparison = asRecord(record.comparison);
  const recommendation = asRecord(record.recommendation);

  const better = String(comparison.betterOption ?? recommendation.recommendedAccount ?? '');
  const rothAfterTax = parseMoney(comparison.rothAfterTaxValue);
  const traditionalAfterTax = parseMoney(comparison.traditionalAfterTaxValue);
  const diff = parseMoney(comparison.taxSavingsDifference);

  return {
    summary: {
      recommendedAccount: better,
      rothAfterTaxValue: rothAfterTax,
      traditionalAfterTaxValue: traditionalAfterTax,
      advantage: diff,
      rationale: recommendation.rationale,
    },
    insights: [
      {
        category: 'financial',
        title: 'After-tax outcome',
        description: `${better === 'roth' ? 'Roth' : 'Traditional'} leads with ${formatUsd(Math.max(rothAfterTax, traditionalAfterTax))} after tax — advantage about ${formatUsd(diff)}.`,
        impact: diff > 10000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Tax bracket timing',
        description: String(
          recommendation.rationale ??
            'Compare current vs retirement marginal rates before locking in contributions.'
        ),
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: `Favor ${better === 'roth' ? 'Roth' : 'Traditional'} contributions`,
        description: String(
          recommendation.rationale ?? 'Align account type with expected tax rates in retirement.'
        ),
        effort: 'low',
      },
    ],
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeEmergencyFundFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);

  const targetFund = parseMoney(summary.targetFund);
  const currentFund = parseMoney(summary.currentFund);
  const shortfall = parseMoney(summary.shortfall);
  const onTrack = Boolean(summary.onTrack);
  const monthsToBuild = Number(summary.monthsToBuild) || 0;

  return {
    summary: { targetFund, currentFund, shortfall, monthsToBuild, onTrack },
    insights: [
      {
        category: 'financial',
        title: 'Emergency reserve target',
        description: `Target fund is ${formatUsd(targetFund)}; you have ${formatUsd(currentFund)} saved (${onTrack ? 'on track' : `${formatUsd(shortfall)} to go`}).`,
        impact: onTrack ? 'low' : 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Build timeline',
        description: monthsToBuild
          ? `At your savings rate, you could reach the target in about ${monthsToBuild} months.`
          : 'Increase monthly savings to shorten the time to your target fund.',
        impact: monthsToBuild > 24 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: onTrack ? 'low' : shortfall > targetFund * 0.5 ? 'high' : 'medium',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeNetWorthFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const current = parseMoney(summary.currentNetWorth);
  const projected = parseMoney(summary.projectedNetWorth);

  return {
    summary: {
      currentNetWorth: current,
      totalAssets: parseMoney(summary.totalAssets),
      totalLiabilities: parseMoney(summary.totalLiabilities),
      projectedNetWorth: projected,
      yearsToTarget: summary.yearsToTarget,
    },
    insights: [
      {
        category: 'financial',
        title: 'Net worth today',
        description: `Current net worth is ${formatUsd(current)} (${formatUsd(parseMoney(summary.totalAssets))} assets minus ${formatUsd(parseMoney(summary.totalLiabilities))} liabilities).`,
        impact: 'high',
        actionable: false,
      },
      {
        category: 'opportunity',
        title: 'Long-term projection',
        description: `Projected net worth in the horizon modeled: ${formatUsd(projected)}.`,
        impact: projected > current ? 'low' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeFireCalculatorFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const fireNumber = parseMoney(summary.fireNumber ?? record.fireNumber);
  const yearsToFire = Number(summary.yearsToFIRE ?? asRecord(record.yearsToFIRE).years) || 0;
  const onTrack = Boolean(summary.onTrack);

  return {
    summary: {
      fireNumber,
      yearsToFIRE: yearsToFire,
      projectedRetirementAge: summary.projectedRetirementAge,
      currentSavings: parseMoney(summary.currentSavings),
      savingsNeeded: parseMoney(summary.savingsNeeded),
      onTrack,
    },
    insights: [
      {
        category: 'financial',
        title: 'FIRE number',
        description: `You need about ${formatUsd(fireNumber)} invested to cover retirement spending at your safe withdrawal rate.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Timeline',
        description: onTrack
          ? `You are on track for FIRE in roughly ${yearsToFire.toFixed(1)} years.`
          : `Closing the gap may require more savings or a later target retirement age.`,
        impact: onTrack ? 'low' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: onTrack ? 'low' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeBusinessLoanScenariosFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const comparison = asRecord(record.comparison);
  const cheapest = asRecord(comparison.cheapest);
  const lowestPayment = asRecord(comparison.lowestPayment);

  return {
    summary: {
      cheapestScenario: cheapest.scenario,
      cheapestTotalCost: parseMoney(cheapest.totalCost),
      lowestPaymentScenario: lowestPayment.scenario,
      lowestMonthlyPayment: parseMoney(lowestPayment.monthlyPayment),
    },
    insights: [
      {
        category: 'financial',
        title: 'Lowest total cost',
        description: `${String(cheapest.scenario ?? 'Scenario')} minimizes lifetime cost at ${formatUsd(parseMoney(cheapest.totalCost))}.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Cash flow vs cost',
        description: `${String(lowestPayment.scenario ?? 'Scenario')} has the lowest payment at ${formatUsd(parseMoney(lowestPayment.monthlyPayment))}/mo.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeInvestmentPortfolioFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary ?? record);
  const actual = asRecord(summary.actualAllocation);
  const currentValue = parseMoney(
    summary.currentValue ?? summary.totalValue ?? asRecord(record.currentPortfolio).totalValue
  );
  const score = Number(summary.portfolioScore) || 0;
  const drift = Number(summary.allocationDrift) || 0;
  const stockPct = Number(actual.stocks) || 0;

  return {
    summary: {
      currentValue,
      portfolioScore: score,
      allocationDrift: drift,
      stockAllocation: stockPct,
    },
    insights: [
      {
        category: 'financial',
        title: 'Portfolio score',
        description: `Allocation fit score is ${score}/100 with ${drift.toFixed(1)}% total drift from targets.`,
        impact: score < 60 || drift > 15 ? 'high' : score < 80 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Equity allocation',
        description: `Stocks are ${stockPct.toFixed(1)}% of the portfolio (${formatUsd(currentValue)} total).`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: drift > 20 ? 'medium' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeEquipmentLeaseFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const equipmentCost = parseMoney(record.equipmentCost ?? record.totalPayment);
  const termMonths = Number(record.leaseTerm ?? record.termMonths) || 0;
  const interestRate = Number(record.interestRate) || 0;
  const rate = interestRate > 1 ? interestRate / 100 : interestRate;
  const residual = parseMoney(record.residualValue);

  return FinancialAnalysisEngine.analyzeLease({
    principal: equipmentCost,
    annualRate: rate,
    termMonths,
    residualValue: residual,
    monthlyPayment: parseMoney(record.monthlyPayment),
    totalCost: parseMoney(record.totalPayment),
  });
}

export function analyzeRefinancingFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const monthlySavings = parseMoney(summary.monthlySavings);
  const netBenefit = parseMoney(summary.netBenefit);
  const breakEvenMonths = Number(summary.breakEvenMonths) || 0;
  const totalInterestSavings = parseMoney(summary.totalInterestSavings);

  return {
    summary: {
      monthlySavings,
      netBenefit,
      breakEvenMonths,
      totalInterestSavings,
      newMonthlyPayment: parseMoney(summary.newMonthlyPayment),
    },
    insights: [
      {
        category: 'financial',
        title: 'Monthly payment change',
        description:
          monthlySavings > 0
            ? `Refinancing could lower your payment by about ${formatUsd(monthlySavings)} per month.`
            : `Your new payment may be ${formatUsd(Math.abs(monthlySavings))} higher per month — weigh term and cash-out goals.`,
        impact: monthlySavings > 200 ? 'high' : monthlySavings > 0 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Break-even on closing costs',
        description: breakEvenMonths
          ? `Closing costs may be recovered in about ${breakEvenMonths} months of savings.`
          : 'Add closing cost details to estimate how long until refinance savings pay back fees.',
        impact: breakEvenMonths > 0 && breakEvenMonths <= 24 ? 'low' : 'medium',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Lifetime interest savings',
        description: `Estimated interest savings over the loan: ${formatUsd(totalInterestSavings)} (net benefit ${formatUsd(netBenefit)}).`,
        impact: netBenefit > 10000 ? 'high' : netBenefit > 0 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: breakEvenMonths > 36 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeHelocFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const availableEquity = parseMoney(summary.availableEquity);
  const monthlyPayment = parseMoney(summary.monthlyPayment);
  const totalCost = parseMoney(summary.totalCost);
  const equityPct = Number(summary.equityPercentage) || 0;

  return {
    summary: {
      availableEquity,
      monthlyPayment,
      totalCost,
      equityPercentage: equityPct,
      helocCreditLimit: parseMoney(summary.helocCreditLimit),
    },
    insights: [
      {
        category: 'financial',
        title: 'Home equity available',
        description: `Estimated borrowable equity is ${formatUsd(availableEquity)} (${equityPct.toFixed(1)}% of home value after mortgage).`,
        impact: availableEquity > 50000 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Repayment burden',
        description: `Amortizing payment is about ${formatUsd(monthlyPayment)}/mo with total cost near ${formatUsd(totalCost)}.`,
        impact: monthlyPayment > 2000 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: equityPct > 80 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeCarLeaseVsBuyFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const betterOption = String(summary.betterOption ?? 'lease');
  const costDifference = parseMoney(summary.costDifference);
  const leaseTotal = parseMoney(summary.leaseTotalCost);
  const purchaseTotal = parseMoney(summary.purchaseTotalCost);

  return {
    summary: {
      betterOption,
      costDifference,
      leaseTotalCost: leaseTotal,
      purchaseTotalCost: purchaseTotal,
    },
    insights: [
      {
        category: 'financial',
        title: 'Lower total cost',
        description: `${betterOption === 'lease' ? 'Leasing' : 'Buying'} looks cheaper by about ${formatUsd(costDifference)} over the analysis period.`,
        impact: costDifference > 5000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Total cost comparison',
        description: `Lease path: ${formatUsd(leaseTotal)} vs purchase path: ${formatUsd(purchaseTotal)}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeStartupFinancialModelFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const runwayMonths = Number(summary.runwayMonths) || 0;
  const monthlyBurn = parseMoney(summary.monthlyBurnRate);
  const fundingNeeded = parseMoney(summary.fundingNeeded);
  const currentCash = parseMoney(summary.currentCash);

  return {
    summary: {
      runwayMonths,
      monthlyBurnRate: monthlyBurn,
      fundingNeeded,
      currentCash,
      ltvCacRatio: Number(summary.ltvCacRatio) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'Cash runway',
        description: runwayMonths
          ? `At current burn, cash may last about ${runwayMonths.toFixed(1)} months (${formatUsd(currentCash)} on hand).`
          : 'Positive cash flow or add runway inputs to estimate months until funding is needed.',
        impact: runwayMonths < 6 ? 'high' : runwayMonths < 12 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Funding gap',
        description: fundingNeeded
          ? `Modeled funding need is about ${formatUsd(fundingNeeded)} before milestones.`
          : 'No additional funding required under current assumptions.',
        impact: fundingNeeded > currentCash ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Burn rate',
        description: `Net monthly burn is about ${formatUsd(monthlyBurn)} — trim fixed costs or grow revenue to extend runway.`,
        impact: monthlyBurn > 50000 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: runwayMonths < 6 ? 'high' : runwayMonths < 12 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeSocialSecurityFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const optimalAge = Number(summary.optimalClaimingAge) || 67;
  const maxLifetime = parseMoney(summary.maximumLifetimeBenefit);
  const pia = parseMoney(summary.primaryInsuranceAmount);
  const breakEvenAge = Number(summary.breakEvenAge) || 0;

  return {
    summary: {
      optimalClaimingAge: optimalAge,
      maximumLifetimeBenefit: maxLifetime,
      primaryInsuranceAmount: pia,
    },
    insights: [
      {
        category: 'financial',
        title: 'Optimal claiming age',
        description: `Claiming at age ${optimalAge} maximizes lifetime benefits near ${formatUsd(maxLifetime)} (monthly PIA about ${formatUsd(pia)}).`,
        impact: optimalAge >= 70 ? 'medium' : 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Break-even vs early claiming',
        description: breakEvenAge
          ? `Delaying benefits may break even versus claiming early around age ${breakEvenAge}.`
          : 'Run break-even analysis with your earnings history for a precise comparison.',
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyze401kMatchFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const matchLeft = parseMoney(summary.matchLeftOnTable);
  const currentMatch = parseMoney(summary.currentMatch);
  const maximumMatch = parseMoney(summary.maximumMatch);
  const optimalPct = Number(summary.optimalContribution) || 0;

  return {
    summary: {
      matchLeftOnTable: matchLeft,
      currentMatch,
      maximumMatch,
      optimalContribution: optimalPct,
    },
    insights: [
      {
        category: 'financial',
        title: 'Employer match left on the table',
        description:
          matchLeft > 0
            ? `You may be leaving about ${formatUsd(matchLeft)} per year in employer match on the table.`
            : 'You appear to be capturing the full employer match — great job.',
        impact: matchLeft > 1000 ? 'high' : matchLeft > 0 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Contribution target',
        description: optimalPct
          ? `Consider contributing at least ${(optimalPct * 100).toFixed(1)}% of salary to maximize match (${formatUsd(maximumMatch)}/yr).`
          : `Current match is ${formatUsd(currentMatch)} vs maximum ${formatUsd(maximumMatch)}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: matchLeft > 2000 ? 'medium' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeHsaOptimizationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const taxSavings = parseMoney(summary.totalTaxSavings);
  const maxContribution = parseMoney(summary.maxContribution);
  const currentContribution = parseMoney(summary.currentContribution);
  const projectedBalance = parseMoney(summary.projectedBalanceAtRetirement);
  const gap = Math.max(0, maxContribution - currentContribution);

  return {
    summary: {
      totalTaxSavings: taxSavings,
      maxContribution,
      projectedBalanceAtRetirement: projectedBalance,
    },
    insights: [
      {
        category: 'financial',
        title: 'Tax savings',
        description: `Estimated annual tax savings from HSA contributions: ${formatUsd(taxSavings)}.`,
        impact: taxSavings > 2000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Contribution headroom',
        description:
          gap > 0
            ? `You could contribute up to ${formatUsd(gap)} more this year to reach the limit (${formatUsd(maxContribution)}).`
            : 'You are at or above the modeled contribution limit.',
        impact: gap > 1000 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Retirement healthcare reserve',
        description: `Projected HSA balance at retirement: ${formatUsd(projectedBalance)}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyze529OptimizerFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const totalCosts = parseMoney(summary.totalEducationCosts);
  const projected = parseMoney(summary.projectedBalance ?? summary.projected529Balance);
  const shortfall = parseMoney(summary.shortfall);
  const optimalState = String(summary.optimalState ?? '');

  return {
    summary: {
      totalEducationCosts: totalCosts,
      projectedBalance: projected,
      shortfall,
      optimalState,
    },
    insights: [
      {
        category: 'financial',
        title: 'Education funding gap',
        description:
          shortfall > 0
            ? `Projected shortfall of ${formatUsd(shortfall)} vs ${formatUsd(totalCosts)} total education costs.`
            : `Projections cover estimated costs of ${formatUsd(totalCosts)}.`,
        impact: shortfall > 25000 ? 'high' : shortfall > 0 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: '529 balance projection',
        description: `Modeled 529 balance at college start: ${formatUsd(projected)}.`,
        impact: 'medium',
        actionable: true,
      },
      ...(optimalState
        ? [
            {
              category: 'optimization' as const,
              title: 'State plan advantage',
              description: `${optimalState} offers the strongest tax benefit under your inputs.`,
              impact: 'low' as const,
              actionable: true,
            },
          ]
        : []),
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: shortfall > 50000 ? 'high' : shortfall > 0 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeHomeBuyingAffordabilityFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const maxPrice = parseMoney(summary.maxAffordablePrice);
  const monthlyPayment = parseMoney(summary.monthlyPayment);
  const dti = Number(summary.debtToIncomeRatio) || 0;
  const score = String(summary.affordabilityScore ?? '');

  return {
    summary: {
      maxAffordablePrice: maxPrice,
      monthlyPayment,
      debtToIncomeRatio: dti,
      affordabilityScore: score,
    },
    insights: [
      {
        category: 'financial',
        title: 'Maximum affordable price',
        description: `Based on income and debts, you may afford up to about ${formatUsd(maxPrice)} (${score || 'see DTI'}).`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Debt-to-income',
        description: `Front-end DTI near ${dti.toFixed(1)}% — lenders often prefer total DTI below 43%.`,
        impact: dti > 43 ? 'high' : dti > 36 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Estimated housing payment',
        description: `Modeled principal, interest, taxes, and insurance near ${formatUsd(monthlyPayment)}/month.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: dti > 43 ? 'high' : dti > 36 ? 'medium' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeDscrFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const ratio = Number(record.ratio) || 0;
  const status = String(record.status ?? 'unknown');
  const margin = Number(record.margin) || 0;
  const targetRatio = Number(record.targetRatio) || 1.25;

  return {
    summary: { ratio, status, margin, targetRatio },
    insights: [
      {
        category: 'financial',
        title: 'Debt service coverage',
        description: `DSCR is ${ratio.toFixed(2)}x (${status.replace(/-/g, ' ')}) — lenders often want at least ${targetRatio}x.`,
        impact: ratio < 1 ? 'high' : ratio < 1.25 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Cushion vs target',
        description:
          margin >= 0
            ? `You are ${margin.toFixed(2)}x above the ${targetRatio}x target.`
            : `You are ${Math.abs(margin).toFixed(2)}x below the ${targetRatio}x target — improve EBITDA or reduce debt service.`,
        impact: margin < 0 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: ratio < 1 ? 'high' : ratio < 1.25 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeDebtCapacityFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const maxLoan = parseMoney(record.maxLoanAmount);
  const recommended = parseMoney(record.recommendedLoanAmount);
  const monthlyCapacity = parseMoney(record.monthlyPaymentCapacity);
  const assumptions = asRecord(record.assumptions);
  const targetDscr = Number(assumptions.targetDSCR) || 1.5;

  return {
    summary: {
      maxLoanAmount: maxLoan,
      recommendedLoanAmount: recommended,
      monthlyPaymentCapacity: monthlyCapacity,
    },
    insights: [
      {
        category: 'financial',
        title: 'Maximum loan capacity',
        description: `At a ${targetDscr}x DSCR target, estimated max loan is ${formatUsd(maxLoan)} (recommended ${formatUsd(recommended)}).`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Payment capacity',
        description: `Available for new debt service is about ${formatUsd(monthlyCapacity)}/month.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.factors) ? (record.factors as string[]) : []
    ),
    riskAssessment: { overallRisk: maxLoan <= 0 ? 'high' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeRealEstateInvestmentFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const capRate = Number(summary.capRate) || 0;
  const cashOnCash = Number(summary.cashOnCashReturn) || 0;
  const monthlyCashFlow = parseMoney(summary.monthlyCashFlow);
  const irr = Number(summary.irr) || 0;

  return {
    summary: { capRate, cashOnCashReturn: cashOnCash, monthlyCashFlow, irr },
    insights: [
      {
        category: 'financial',
        title: 'Cap rate',
        description: `Cap rate is ${(capRate * 100).toFixed(2)}% — compare to market yields for similar assets.`,
        impact: capRate < 0.04 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Cash-on-cash return',
        description: `Cash-on-cash return is ${(cashOnCash * 100).toFixed(2)}% with ${formatUsd(monthlyCashFlow)}/mo cash flow.`,
        impact: cashOnCash < 0.06 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'IRR',
        description: irr
          ? `Modeled IRR is ${(irr * 100).toFixed(1)}% over the hold period.`
          : 'Add hold period inputs for IRR.',
        impact: irr > 0.12 ? 'low' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: monthlyCashFlow < 0 ? 'high' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCollegeSavingsFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const totalCost = parseMoney(summary.totalProjectedCost);
  const gap = parseMoney(summary.savingsGap);
  const monthlyNeeded = parseMoney(summary.requiredMonthlyContribution);
  const successPct = Number(summary.successProbability) || 0;

  return {
    summary: { totalProjectedCost: totalCost, savingsGap: gap, successProbability: successPct },
    insights: [
      {
        category: 'financial',
        title: 'Projected college costs',
        description: `Total projected cost is ${formatUsd(totalCost)} across your plan.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Funding gap',
        description:
          gap > 0
            ? `Estimated gap of ${formatUsd(gap)} — consider saving ${formatUsd(monthlyNeeded)}/mo.`
            : 'Current savings trajectory covers projected costs.',
        impact: gap > 50000 ? 'high' : gap > 0 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Plan success probability',
        description: `Modeled probability of meeting goals: ${successPct.toFixed(0)}%.`,
        impact: successPct < 70 ? 'high' : successPct < 85 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: successPct < 70 ? 'high' : successPct < 85 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeRetirementPlanningFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const readiness = Number(summary.retirementReadinessScore) || 0;
  const projected = parseMoney(summary.projectedRetirementBalance);
  const yearsToRetirement = Number(summary.yearsToRetirement) || 0;
  const incomeNeeds = parseMoney(summary.retirementIncomeNeeds);

  return {
    summary: {
      retirementReadinessScore: readiness,
      projectedRetirementBalance: projected,
      yearsToRetirement,
    },
    insights: [
      {
        category: 'financial',
        title: 'Retirement readiness',
        description: `Readiness score is ${readiness}/100 with ${yearsToRetirement} years until retirement.`,
        impact: readiness < 60 ? 'high' : readiness < 80 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Projected balance',
        description: `Projected retirement balance: ${formatUsd(projected)} vs income need ${formatUsd(incomeNeeds)}/yr.`,
        impact: projected < incomeNeeds * 25 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: readiness < 60 ? 'high' : readiness < 80 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeCreditScoreImpactFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const current = Number(summary.currentScore) || 0;
  const projected = Number(summary.projectedScore) || current;
  const scoreChange = Number(summary.scoreChange) || projected - current;
  const health = String(summary.creditHealth ?? '');

  return {
    summary: {
      currentScore: current,
      projectedScore: projected,
      scoreChange,
      creditHealth: health,
    },
    insights: [
      {
        category: 'financial',
        title: 'Score trajectory',
        description:
          scoreChange > 0
            ? `Actions modeled could raise your score by about ${scoreChange} points (to ~${projected}).`
            : scoreChange < 0
              ? `Watch for a potential ${Math.abs(scoreChange)} point decline under current trends.`
              : `Score may stay near ${current} without material changes.`,
        impact: Math.abs(scoreChange) >= 30 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Credit health',
        description: `Current profile: ${health || 'see utilization and payment history'}.`,
        impact: health === 'poor' || health === 'fair' ? 'high' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: current < 580 ? 'high' : current < 670 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeEstatePlanningFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const estateValue = parseMoney(summary.projectedEstateValue ?? summary.currentEstateValue);
  const estateTax = parseMoney(summary.estimatedEstateTax);
  const netInheritance = parseMoney(summary.netInheritance);
  const taxSavings = parseMoney(summary.taxSavings);

  return {
    summary: {
      projectedEstateValue: estateValue,
      estimatedEstateTax: estateTax,
      netInheritance,
      taxSavings,
    },
    insights: [
      {
        category: 'financial',
        title: 'Projected estate value',
        description: `Projected estate value is ${formatUsd(estateValue)} with estimated tax ${formatUsd(estateTax)}.`,
        impact: estateTax > 0 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Net to heirs',
        description: `Net inheritance after taxes: ${formatUsd(netInheritance)} (planning may save ${formatUsd(taxSavings)}).`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: estateTax > 1_000_000 ? 'high' : estateTax > 0 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeLongTermCareFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const lifetimeCost = parseMoney(summary.estimatedLifetimeCost ?? summary.totalLifetimeCost);
  const shortfall = parseMoney(summary.selfFundingShortfall);
  const coverage = parseMoney(summary.insuranceCoverage);
  const strategy = String(summary.recommendedStrategy ?? '');

  return {
    summary: {
      lifetimeCost,
      selfFundingShortfall: shortfall,
      insuranceCoverage: coverage,
      recommendedStrategy: strategy,
    },
    insights: [
      {
        category: 'financial',
        title: 'Lifetime care costs',
        description: `Estimated lifetime long-term care cost: ${formatUsd(lifetimeCost)}.`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Funding gap',
        description:
          shortfall > 0
            ? `Self-funding may fall short by ${formatUsd(shortfall)} — consider LTC insurance or hybrid planning.`
            : `Assets and insurance may cover projected costs (coverage ${formatUsd(coverage)}).`,
        impact: shortfall > 100000 ? 'high' : shortfall > 0 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: shortfall > 200000 ? 'high' : shortfall > 0 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeProjectFinanceFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const npv = parseMoney(summary.npv);
  const irr = Number(summary.irr) || 0;
  const payback = Number(summary.paybackPeriod) || 0;
  const viability = String(summary.projectViability ?? '');

  const irrPct = irr > 1 ? irr : irr * 100;

  return {
    summary: { npv, irr: irrPct, paybackPeriod: payback, projectViability: viability },
    insights: [
      {
        category: 'financial',
        title: 'Net present value',
        description: `NPV is ${formatUsd(npv)} — ${npv > 0 ? 'project adds value' : 'project destroys value'} at the discount rate.`,
        impact: npv < 0 ? 'high' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'IRR and payback',
        description: `IRR ~${irrPct.toFixed(1)}% with simple payback near ${payback.toFixed(1)} years (${viability || 'see assumptions'}).`,
        impact: irrPct < 10 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: npv < 0 ? 'high' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeLboFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const irr = Number(summary.irr) || 0;
  const moic = Number(summary.moic) || 0;
  const leverage = Number(summary.leverage) || 0;
  const exitValue = parseMoney(summary.exitValue);

  const irrPct = irr > 1 ? irr : irr * 100;

  return {
    summary: { irr: irrPct, moic, leverage, exitValue },
    insights: [
      {
        category: 'financial',
        title: 'Equity returns',
        description: `Modeled IRR is ${irrPct.toFixed(1)}% with ${moic.toFixed(2)}x MOIC over the hold period.`,
        impact: irrPct < 15 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Leverage',
        description: `Entry leverage ~${leverage.toFixed(1)}x debt/EBITDA; exit equity value ${formatUsd(exitValue)}.`,
        impact: leverage > 6 ? 'high' : leverage > 4 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: leverage > 6 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCharitableGivingFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const taxSavings = parseMoney(record.totalTaxSavings);
  const strategy = String(record.optimalGivingStrategy ?? '');
  const impact = asRecord(record.projectedImpact);
  const immediate = parseMoney(impact.immediateTaxBenefit);

  return {
    summary: {
      totalTaxSavings: taxSavings,
      optimalGivingStrategy: strategy,
      immediateTaxBenefit: immediate,
    },
    insights: [
      {
        category: 'financial',
        title: 'Estimated tax savings',
        description: `Charitable giving may save about ${formatUsd(taxSavings)} in taxes this year.`,
        impact: taxSavings > 5000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Giving strategy',
        description:
          strategy ||
          'Compare cash, appreciated securities, DAF, and QCD options for your bracket.',
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeTaxOptimizationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const taxSummary = asRecord(record.taxSummary);
  const currentSavings = parseMoney(taxSummary.currentYearTaxSavings);
  const longTerm = parseMoney(taxSummary.projectedLongTermSavings);
  const score = Number(taxSummary.optimizationScore) || 0;
  const capGains = asRecord(record.capitalGainsOptimization);
  const totalCapSavings = parseMoney(capGains.totalTaxSavings);

  return {
    summary: {
      currentYearTaxSavings: currentSavings,
      projectedLongTermSavings: longTerm,
      optimizationScore: score,
    },
    insights: [
      {
        category: 'financial',
        title: 'Near-term tax savings',
        description: `Modeled current-year savings: ${formatUsd(currentSavings)} (optimization score ${score}/100).`,
        impact: currentSavings > 10000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Long-term planning',
        description: `Projected long-term savings ${formatUsd(longTerm)}; capital gains strategies add ~${formatUsd(totalCapSavings)}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk:
        asRecord(record.riskAssessment).auditRisk === 'high'
          ? 'high'
          : asRecord(record.riskAssessment).auditRisk === 'medium'
            ? 'medium'
            : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeWorkingCapitalFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const netWc = parseMoney(summary.workingCapital);
  const currentRatio = Number(summary.currentRatio) || 0;
  const quickRatio = Number(summary.quickRatio) || 0;
  const ccc = Number(summary.cashConversionCycle) || 0;

  return {
    summary: { workingCapital: netWc, currentRatio, quickRatio, cashConversionCycle: ccc },
    insights: [
      {
        category: 'financial',
        title: 'Net working capital',
        description: `Net working capital is ${formatUsd(netWc)} with current ratio ${currentRatio.toFixed(2)}x.`,
        impact: currentRatio < 1 ? 'high' : currentRatio < 1.5 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Cash conversion cycle',
        description: ccc
          ? `Cash conversion cycle is ${ccc.toFixed(0)} days — shorten DSO or extend DPO to free cash.`
          : 'Add operating metrics to model the full cash conversion cycle.',
        impact: ccc > 60 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: currentRatio < 1 ? 'high' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeFranchiseRoiFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const roi = Number(summary.roi ?? summary.totalROI) || 0;
  const roiPct = roi > 1 ? roi : roi * 100;
  const payback = Number(summary.paybackPeriod) || 0;
  const npv = parseMoney(summary.npv);
  const irr = Number(summary.irr) || 0;
  const irrPct = irr > 1 ? irr : irr * 100;

  return {
    summary: { roi: roiPct, paybackPeriod: payback, npv, irr: irrPct },
    insights: [
      {
        category: 'financial',
        title: 'Return on investment',
        description: `Modeled ROI is ${roiPct.toFixed(1)}% with payback near ${payback.toFixed(1)} years.`,
        impact: roiPct < 15 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'NPV and IRR',
        description: `NPV ${formatUsd(npv)} and IRR ${irrPct.toFixed(1)}% over the projection horizon.`,
        impact: npv < 0 ? 'high' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: npv < 0 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeFinancialRatioAnalyzerFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const currentRatio = Number(summary.currentRatio) || 0;
  const roe = Number(summary.roe) || 0;
  const roePct = roe > 1 ? roe : roe * 100;
  const debtToEquity = Number(summary.debtToEquity) || 0;

  return {
    summary: {
      currentRatio,
      roe: roePct,
      debtToEquity,
      quickRatio: Number(summary.quickRatio) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'Liquidity',
        description: `Current ratio ${currentRatio.toFixed(2)}x — ${currentRatio >= 1.5 ? 'healthy short-term coverage' : 'monitor near-term obligations'}.`,
        impact: currentRatio < 1 ? 'high' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Profitability & leverage',
        description: `ROE ${roePct.toFixed(1)}% with debt-to-equity ${debtToEquity.toFixed(2)}x.`,
        impact: debtToEquity > 2 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: currentRatio < 1 ? 'high' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeInsuranceNeedsFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.insuranceSummary);
  const gap = parseMoney(summary.totalCoverageGap);
  const recommended = parseMoney(summary.totalRecommendedCoverage);
  const score = Number(summary.insuranceHealthScore) || 0;

  return {
    summary: {
      totalCoverageGap: gap,
      totalRecommendedCoverage: recommended,
      insuranceHealthScore: score,
    },
    insights: [
      {
        category: 'financial',
        title: 'Coverage gap',
        description:
          gap > 0
            ? `Total recommended coverage exceeds current policies by about ${formatUsd(gap)}.`
            : 'Current coverage aligns with modeled needs across life, disability, and LTC.',
        impact: gap > 250000 ? 'high' : gap > 0 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Insurance health score',
        description: `Overall insurance health score is ${score}/100.`,
        impact: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: score < 50 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeDisabilityInsuranceFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const recommended = parseMoney(record.recommendedCoverage ?? record.benefitAmount);
  const monthlyPremium = parseMoney(record.monthlyPremium);
  const benefitAmount = parseMoney(record.benefitAmount);

  return {
    summary: { recommendedCoverage: recommended, monthlyPremium, benefitAmount },
    insights: [
      {
        category: 'financial',
        title: 'Income replacement',
        description: `Recommended disability benefit is about ${formatUsd(recommended)} per year (${formatUsd(monthlyPremium)}/mo premium).`,
        impact: 'high',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Policy cost',
        description: `Annual premium near ${formatUsd(monthlyPremium * 12)} with elimination period ${Number(record.eliminationPeriod) || 90} days.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeTaxLossHarvestingFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const totalLoss = parseMoney(record.totalTaxLoss);
  const savings = parseMoney(record.projectedTaxSavings);
  const harvestCount = Array.isArray(record.harvestableLosses)
    ? record.harvestableLosses.length
    : 0;

  return {
    summary: {
      totalTaxLoss: totalLoss,
      projectedTaxSavings: savings,
      harvestablePositions: harvestCount,
    },
    insights: [
      {
        category: 'financial',
        title: 'Harvestable losses',
        description: `Identified about ${formatUsd(totalLoss)} in harvestable losses across ${harvestCount} positions.`,
        impact: totalLoss > 10000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Tax savings',
        description: `Estimated tax savings near ${formatUsd(savings)} at your capital gains rates (watch wash-sale rules).`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeDepreciationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const totalDep = parseMoney(summary.totalDepreciation);
  const taxSavings = parseMoney(summary.totalTaxSavings);
  const bookValue = parseMoney(summary.bookValue);

  return {
    summary: { totalDepreciation: totalDep, totalTaxSavings: taxSavings, bookValue },
    insights: [
      {
        category: 'financial',
        title: 'Depreciation deduction',
        description: `Total depreciation is ${formatUsd(totalDep)} with estimated tax savings ${formatUsd(taxSavings)}.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Remaining book value',
        description: `Book value after depreciation: ${formatUsd(bookValue)}.`,
        impact: 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCapitalStructureFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const currentWacc = Number(summary.currentWACC) || 0;
  const optimalWacc = Number(summary.optimalWACC) || currentWacc;
  const waccPct = currentWacc > 1 ? currentWacc : currentWacc * 100;
  const optimalPct = optimalWacc > 1 ? optimalWacc : optimalWacc * 100;
  const debtCapacity = parseMoney(summary.debtCapacity);

  return {
    summary: {
      currentWACC: waccPct,
      optimalWACC: optimalPct,
      currentDebtToEquity: Number(summary.currentDebtToEquity) || 0,
      debtCapacity,
    },
    insights: [
      {
        category: 'financial',
        title: 'Cost of capital',
        description: `Current WACC is ${waccPct.toFixed(2)}% vs optimal ${optimalPct.toFixed(2)}%.`,
        impact: Math.abs(waccPct - optimalPct) > 1 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Debt capacity',
        description: `Additional debt capacity modeled near ${formatUsd(debtCapacity)} before rating pressure.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeLifeInsuranceReassessmentFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const gap = parseMoney(summary.coverageGap);
  const needed = parseMoney(summary.totalNeeded);
  const current = parseMoney(summary.currentCoverage);

  return {
    summary: { totalNeeded: needed, currentCoverage: current, coverageGap: gap },
    insights: [
      {
        category: 'financial',
        title: 'Coverage gap',
        description:
          gap > 0
            ? `Modeled life insurance need exceeds current policies by about ${formatUsd(gap)}.`
            : 'Current life insurance coverage meets or exceeds modeled needs.',
        impact: gap > 250000 ? 'high' : gap > 0 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Policy direction',
        description: `Recommendation: ${String(summary.recommendation ?? 'maintain')} coverage (${formatUsd(needed)} target).`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: gap > 500000 ? 'high' : gap > 0 ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeInternationalTaxPlanningFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const taxLiability = asRecord(record.taxLiability);
  const netTax = parseMoney(taxLiability.netTaxOwed);
  const ftc = parseMoney(taxLiability.foreignTaxCredit);
  const savings = parseMoney(record.projectedSavings);

  return {
    summary: { netTaxOwed: netTax, foreignTaxCredit: ftc, projectedSavings: savings },
    insights: [
      {
        category: 'financial',
        title: 'Net U.S. tax',
        description: `Estimated net U.S. tax after foreign tax credit: ${formatUsd(netTax)}.`,
        impact: netTax > 50000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Cross-border savings',
        description: `Projected planning savings near ${formatUsd(savings)} with FTC of ${formatUsd(ftc)}.`,
        impact: savings > 5000 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeSupplyChainFinanceFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const improvement = parseMoney(summary.cashFlowImprovement);
  const savings = parseMoney(summary.totalSavings);
  const cycle = Number(summary.optimizedCycle) || Number(summary.currentCashConversionCycle) || 0;

  return {
    summary: {
      cashFlowImprovement: improvement,
      totalSavings: savings,
      cashConversionCycle: cycle,
    },
    insights: [
      {
        category: 'financial',
        title: 'Working capital',
        description: `Cash conversion cycle near ${cycle.toFixed(0)} days with ${formatUsd(improvement)} cash flow uplift.`,
        impact: improvement > 100000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Financing program',
        description: `Best option: ${String(summary.recommendedFinancing ?? 'dynamic discounting')} — total savings ${formatUsd(savings)}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeBondPricingFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const metrics = asRecord(record.metrics);
  const price = parseMoney(metrics.price ?? metrics.dirtyPrice);
  const ytm = Number(metrics.yieldToMaturity) || 0;
  const ytmPct = ytm > 1 ? ytm : ytm * 100;
  const duration = Number(metrics.modifiedDuration) || 0;

  return {
    summary: { price, yieldToMaturity: ytmPct, modifiedDuration: duration },
    insights: [
      {
        category: 'financial',
        title: 'Fair value',
        description: `Clean price ${formatUsd(price)} at YTM ${ytmPct.toFixed(2)}%.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Rate sensitivity',
        description: `Modified duration ${duration.toFixed(2)} — about ${formatUsd(Number(metrics.dv01) || 0)} per 1bp move.`,
        impact: duration > 7 ? 'high' : duration > 4 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      record.recommendation ? [`Rating: ${String(record.recommendation)}`] : []
    ),
    riskAssessment: {
      overallRisk: duration > 8 ? 'high' : 'medium',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyze1031ExchangeFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const deferred = parseMoney(summary.taxDeferred);
  const savings = parseMoney(summary.netTaxSavings);
  const bootTax = parseMoney(summary.taxOnBoot);

  return {
    summary: { taxDeferred: deferred, netTaxSavings: savings, taxOnBoot: bootTax },
    insights: [
      {
        category: 'financial',
        title: 'Tax deferral',
        description: `Deferred tax on exchange: ${formatUsd(deferred)} (boot tax ${formatUsd(bootTax)}).`,
        impact: deferred > 50000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'vs taxable sale',
        description: `Net tax savings vs selling outright: ${formatUsd(savings)}.`,
        impact: savings > 0 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: bootTax > 0 ? 'medium' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzePortfolioOptimizationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const improvement = Number(summary.improvement) || 0;
  const currentReturn = Number(summary.currentReturn) || 0;
  const optimalReturn = Number(summary.optimalReturn) || 0;
  const currentPct = currentReturn > 1 ? currentReturn : currentReturn * 100;
  const optimalPct = optimalReturn > 1 ? optimalReturn : optimalReturn * 100;
  const improvePct = improvement > 1 ? improvement : improvement * 100;

  return {
    summary: { currentReturn: currentPct, optimalReturn: optimalPct, improvement: improvePct },
    insights: [
      {
        category: 'financial',
        title: 'Return uplift',
        description: `Optimal allocation targets ${optimalPct.toFixed(1)}% return vs ${currentPct.toFixed(1)}% today (+${improvePct.toFixed(1)} pts).`,
        impact: improvePct > 1 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Risk profile',
        description: `Portfolio risk moves from ${((Number(summary.currentRisk) || 0) * 100).toFixed(1)}% to ${((Number(summary.optimalRisk) || 0) * 100).toFixed(1)}% volatility.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCreditRiskFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const pd = Number(summary.pd) || 0;
  const pdPct = pd > 1 ? pd : pd * 100;
  const el = parseMoney(summary.expectedLoss);

  return {
    summary: {
      pd: pdPct,
      lgd: Number(summary.lgd) || 0,
      expectedLoss: el,
      creditRating: String(summary.creditRating ?? '—'),
    },
    insights: [
      {
        category: 'risk',
        title: 'Probability of default',
        description: `Modeled PD is ${pdPct.toFixed(2)}% with rating ${String(summary.creditRating ?? 'N/A')}.`,
        impact: pdPct > 5 ? 'high' : pdPct > 2 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'financial',
        title: 'Expected loss',
        description: `Expected loss on exposure: ${formatUsd(el)} (${String(summary.riskLevel ?? 'moderate')} risk).`,
        impact: el > 100000 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: String(summary.riskLevel) === 'high' ? 'high' : 'medium',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeOptionsPricingFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const pricing = asRecord(record.pricing);
  const greeks = asRecord(record.greeks);
  const theoretical = parseMoney(pricing.theoreticalValue);

  return {
    summary: {
      theoreticalValue: theoretical,
      delta: Number(greeks.delta) || 0,
      daysToExpiration: Number(record.daysToExpiration) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'Fair value',
        description: `Theoretical option value ${formatUsd(theoretical)} (${String(pricing.moneyness ?? 'ATM')}, ${String(record.optionType ?? 'call')}).`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Greeks',
        description: `Delta ${(Number(greeks.delta) || 0).toFixed(3)}, theta ${(Number(greeks.theta) || 0).toFixed(3)} per day.`,
        impact: Math.abs(Number(greeks.delta) || 0) > 0.7 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      record.recommendation ? [`Action: ${String(record.recommendation)}`] : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCryptocurrencyTaxFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const totalTax = parseMoney(summary.totalTaxLiability);
  const netGains = parseMoney(summary.netCapitalGains);

  return {
    summary: { totalTaxLiability: totalTax, netCapitalGains: netGains },
    insights: [
      {
        category: 'financial',
        title: 'Tax liability',
        description: `Estimated crypto tax liability: ${formatUsd(totalTax)} on ${formatUsd(netGains)} net gains.`,
        impact: totalTax > 10000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Realized P/L',
        description: `Realized gains ${formatUsd(Number(summary.totalRealizedGains) || 0)} vs losses ${formatUsd(Number(summary.totalRealizedLosses) || 0)}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeBusinessExpansionLoanFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const dscr = Number(summary.dscr) || 0;
  const score = Number(summary.financialHealthScore) || 0;
  const recommended = parseMoney(summary.recommendedLoanAmount);

  return {
    summary: {
      financialHealthScore: score,
      recommendedLoanAmount: recommended,
      dscr,
      successProbability: Number(summary.successProbability) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'Loan capacity',
        description: `Recommended loan amount ${formatUsd(recommended)} with DSCR ${dscr.toFixed(2)}x.`,
        impact: dscr < 1.25 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Approval outlook',
        description: `Financial health ${score}/100 — success probability ${Number(summary.successProbability) || 0}%.`,
        impact: score < 60 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk: String(summary.riskLevel) === 'high' ? 'high' : 'medium',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeBusinessFinancialHealthFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const metrics = asRecord(record.metrics);
  const score = Number(record.score) || 0;
  const debtToEBITDA = Number(metrics.debtToEBITDA) || 0;

  return {
    summary: { score, debtToEBITDA, currentRatio: Number(metrics.currentRatio) || 0 },
    insights: [
      {
        category: 'financial',
        title: 'Health score',
        description: `Overall financial health score is ${score}/100.`,
        impact: score < 50 ? 'high' : score < 70 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Leverage & liquidity',
        description: `Debt/EBITDA ${debtToEBITDA.toFixed(1)}x with current ratio ${(Number(metrics.currentRatio) || 0).toFixed(2)}x.`,
        impact: debtToEBITDA > 5 || Number(metrics.currentRatio) < 1 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      [
        ...(Array.isArray(record.strengths) ? (record.strengths as string[]) : []),
        ...(Array.isArray(record.weaknesses) ? (record.weaknesses as string[]) : []),
      ].slice(0, 4)
    ),
    riskAssessment: { overallRisk: score < 50 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeVarFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const varAmount = parseMoney(summary.var);
  const varPct = Number(summary.varPercent) || 0;

  return {
    summary: {
      var: varAmount,
      varPercent: varPct,
      confidenceLevel: Number(summary.confidenceLevel) || 0.95,
    },
    insights: [
      {
        category: 'risk',
        title: 'Value at Risk',
        description: `${formatUsd(varAmount)} at risk (${varPct.toFixed(2)}% of portfolio) over ${Number(summary.timeHorizon) || 1} day(s).`,
        impact: varPct > 5 ? 'high' : varPct > 2 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Method',
        description: `Calculated using ${String(summary.method ?? 'historical')} simulation at ${((Number(summary.confidenceLevel) || 0.95) * 100).toFixed(0)}% confidence.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: varPct > 5 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeRevenueRecognitionFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const deferred = parseMoney(summary.totalDeferredRevenue);
  const recognized = parseMoney(summary.totalRevenueRecognized);

  return {
    summary: {
      totalContractValue: parseMoney(summary.totalContractValue),
      totalRevenueRecognized: recognized,
      totalDeferredRevenue: deferred,
    },
    insights: [
      {
        category: 'financial',
        title: 'Revenue recognized',
        description: `${formatUsd(recognized)} recognized vs ${formatUsd(deferred)} deferred under ASC 606.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Compliance',
        description: `Compliance status: ${String(summary.complianceStatus ?? 'review')}.`,
        impact: summary.complianceStatus === 'non-compliant' ? 'high' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeEquipmentLeaseVsBuyFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const better = String(summary.betterOption ?? 'lease');
  const savings = parseMoney(summary.costDifference);

  return {
    summary: {
      betterOption: better,
      costDifference: savings,
      npvDifference: parseMoney(summary.npvDifference),
    },
    insights: [
      {
        category: 'financial',
        title: 'Lower total cost',
        description: `${better === 'lease' ? 'Leasing' : 'Buying'} is cheaper by about ${formatUsd(savings)} over the analysis period.`,
        impact: savings > 10000 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'NPV comparison',
        description: `NPV difference (lease vs buy): ${formatUsd(parseMoney(summary.npvDifference))}.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCcaValuationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const valuation = asRecord(record.valuation);
  const equity = asRecord(valuation.equityValue);
  const perShare = asRecord(valuation.valuePerShare);
  const upside = Number(valuation.upsideDownside) || 0;

  return {
    summary: {
      equityValueMedian: parseMoney(equity.median),
      valuePerShare: parseMoney(perShare.median),
      upsideDownside: upside,
    },
    insights: [
      {
        category: 'financial',
        title: 'Implied equity value',
        description: `Median peer-implied equity value near ${formatUsd(parseMoney(equity.median))}.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Upside / downside',
        description: `Implied ${upside >= 0 ? 'upside' : 'downside'} of ${Math.abs(upside).toFixed(1)}% vs current price.`,
        impact: Math.abs(upside) > 25 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeCashFlowFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const metrics = asRecord(record.metrics);
  const liquidity = asRecord(record.liquidityAnalysis);
  const freeCashFlow = parseMoney(metrics.freeCashFlow);
  const runway = Number(metrics.runway) || 0;
  const health = String(record.overallHealth ?? 'Fair');

  return {
    summary: {
      freeCashFlow,
      runwayMonths: runway,
      overallHealth: health,
      liquidity: String(liquidity.currentLiquidity ?? ''),
    },
    insights: [
      {
        category: 'financial',
        title: 'Free cash flow',
        description: `Projected free cash flow of ${formatUsd(freeCashFlow)} over the analysis period.`,
        impact: freeCashFlow < 0 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Liquidity runway',
        description:
          runway > 0
            ? `Cash runway about ${runway.toFixed(1)} months at current burn.`
            : `Operating cash flow is positive — no depletion runway flagged.`,
        impact: runway > 0 && runway < 6 ? 'high' : runway > 0 && runway < 12 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: {
      overallRisk:
        health === 'Critical' || health === 'Poor' ? 'high' : health === 'Fair' ? 'medium' : 'low',
      factors: [],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeEmployeeStockOptionsFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const intrinsic = parseMoney(summary.totalIntrinsicValue);
  const bsValue = parseMoney(summary.totalBlackScholesValue);
  const tax = parseMoney(summary.estimatedTaxOnExercise);

  return {
    summary: {
      totalOptions: Number(summary.totalOptions) || 0,
      totalIntrinsicValue: intrinsic,
      totalBlackScholesValue: bsValue,
      estimatedTaxOnExercise: tax,
    },
    insights: [
      {
        category: 'financial',
        title: 'Option value',
        description: `Intrinsic value ${formatUsd(intrinsic)}; Black-Scholes estimate ${formatUsd(bsValue)}.`,
        impact: bsValue > 100_000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'financial',
        title: 'Exercise tax',
        description: `Estimated tax on exercise near ${formatUsd(tax)}.`,
        impact: tax > 50_000 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: tax > intrinsic * 0.4 ? 'medium' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeAccountsPayableOptimizationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const savings = parseMoney(summary.potentialDiscountSavings);
  const cashImpact = parseMoney(summary.cashFlowImpact);

  return {
    summary: {
      totalPayables: parseMoney(summary.totalPayables),
      potentialDiscountSavings: savings,
      cashFlowImpact: cashImpact,
      optimalPaymentDays: Number(summary.optimalPaymentDays) || 0,
    },
    insights: [
      {
        category: 'optimization',
        title: 'Early-pay discounts',
        description: `Potential discount savings of ${formatUsd(savings)} by optimizing payment timing.`,
        impact: savings > 5000 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'financial',
        title: 'Cash flow impact',
        description: `Net cash flow impact from payment strategy: ${formatUsd(cashImpact)}.`,
        impact: Math.abs(cashImpact) > 25000 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeAccountsReceivableAgingFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const dso = Number(summary.daysSalesOutstanding) || 0;
  const overdue = parseMoney(summary.overdueAmount);
  const badDebt = parseMoney(summary.estimatedBadDebt);

  return {
    summary: {
      totalReceivables: parseMoney(summary.totalReceivables),
      daysSalesOutstanding: dso,
      overdueAmount: overdue,
      estimatedBadDebt: badDebt,
    },
    insights: [
      {
        category: 'financial',
        title: 'Days sales outstanding',
        description: `DSO is ${dso.toFixed(0)} days — ${dso > 45 ? 'slower than typical Net-30' : 'within a reasonable collection window'}.`,
        impact: dso > 60 ? 'high' : dso > 45 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Overdue & bad debt',
        description: `${formatUsd(overdue)} overdue; estimated bad debt ${formatUsd(badDebt)}.`,
        impact: overdue > 0 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: overdue > badDebt * 2 ? 'medium' : 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeInventoryOptimizationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const eoq = Number(summary.optimalOrderQuantity) || 0;
  const savings = parseMoney(summary.totalCostSavings);

  return {
    summary: {
      totalInventoryValue: parseMoney(summary.totalInventoryValue),
      optimalOrderQuantity: eoq,
      totalSafetyStock: Number(summary.totalSafetyStock) || 0,
      totalCostSavings: savings,
    },
    insights: [
      {
        category: 'optimization',
        title: 'Order quantity',
        description: `Average economic order quantity near ${eoq.toFixed(0)} units across SKUs.`,
        impact: 'medium',
        actionable: true,
      },
      {
        category: 'financial',
        title: 'Cost savings',
        description: `Potential inventory cost savings of ${formatUsd(savings)}.`,
        impact: savings > 10000 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'low', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeBusinessSuccessionPlanningFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const businessValue = parseMoney(summary.businessValue);
  const estateTax = parseMoney(summary.estateTax);
  const transferTax = parseMoney(summary.transferTax);

  return {
    summary: {
      businessValue,
      estateTax,
      transferTax,
      recommendedStrategy: String(summary.recommendedStrategy ?? ''),
      yearsUntilTransfer: Number(summary.yearsUntilTransfer) || 0,
    },
    insights: [
      {
        category: 'financial',
        title: 'Business value',
        description: `Estimated business value ${formatUsd(businessValue)} for succession planning.`,
        impact: businessValue > 5_000_000 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'risk',
        title: 'Transfer taxes',
        description: `Estate tax ${formatUsd(estateTax)}; transfer tax ${formatUsd(transferTax)}.`,
        impact: estateTax + transferTax > 500_000 ? 'high' : 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.recommendations) ? (record.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: estateTax > 1_000_000 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeFinancialJourneyFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const overview = asRecord(record.journeyOverview);
  const health = Number(overview.overallFinancialHealth) || 0;
  const progress = Number(overview.progressPercentage) || 0;

  return {
    summary: {
      overallFinancialHealth: health,
      currentStage: String(overview.currentStage ?? ''),
      nextStage: String(overview.nextStage ?? ''),
      progressPercentage: progress,
    },
    insights: [
      {
        category: 'financial',
        title: 'Financial health',
        description: `Overall financial health score is ${health}/100.`,
        impact: health < 50 ? 'high' : health < 70 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Journey progress',
        description: `Stage ${String(overview.currentStage ?? '')} — ${progress.toFixed(0)}% through current phase; next: ${String(overview.nextStage ?? '')}.`,
        impact: progress < 40 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(record.insights) ? (record.insights as string[]).slice(0, 4) : []
    ),
    riskAssessment: { overallRisk: health < 50 ? 'high' : 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}

export function analyzeMultiModelScenarioFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const scenario = asRecord(record.scenario);
  const progress = asRecord(scenario.progress);
  const analysis = asRecord(record.analysis);
  const pct = Number(progress.percentage) || 0;
  const completed = Number(progress.completed) || 0;
  const total = Number(progress.total) || 0;

  return {
    summary: {
      scenarioName: String(scenario.name ?? scenario.id ?? ''),
      progressPercentage: pct,
      modelsCompleted: completed,
      modelsTotal: total,
    },
    insights: [
      {
        category: 'financial',
        title: 'Scenario progress',
        description: `${completed} of ${total} models complete (${pct}% progress).`,
        impact: pct < 30 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Guidance',
        description: String(analysis.summary ?? 'Review next steps to advance this scenario.'),
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: mapStringRecommendations(
      Array.isArray(analysis.recommendations) ? (analysis.recommendations as string[]) : []
    ),
    riskAssessment: { overallRisk: 'medium', factors: [] },
    optimizationOpportunities: [],
  };
}
