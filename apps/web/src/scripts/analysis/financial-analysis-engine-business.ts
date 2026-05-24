/**
 * Impact-summary analyzers for business calculators and advanced personal tools.
 */

import type { DetailedAnalysis } from './financial-analysis-engine';
import {
  asRecord,
  formatUsd,
  impactFromThreshold,
  mapStringInsights,
  mapStringRecommendations,
  parseMoney,
} from './analysis-engine-utils';

function unwrapStudentLoanPayload(data: unknown): Record<string, unknown> {
  const record = asRecord(data);
  if (record.result && typeof record.result === 'object') {
    return asRecord(record.result);
  }
  return record;
}

export function analyzeUnitEconomicsFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);
  const benchmarks = asRecord(record.benchmarks);

  const ltvCac = Number(record.ltvToCacRatio) || 0;
  const cac = parseMoney(record.cac);
  const ltv = parseMoney(record.ltv);
  const paybackMonths = Number(record.paybackPeriodMonths) || 0;
  const churn = Number(record.churnRate) || 0;
  const grossMargin = Number(record.grossMarginPercent) || 0;
  const health = String(summary.overallHealth ?? 'needs-improvement');

  const engineInsights = Array.isArray(record.insights)
    ? mapStringInsights(record.insights as string[], 'optimization')
    : [];
  const engineRecs = Array.isArray(record.recommendations)
    ? mapStringRecommendations(record.recommendations as string[])
    : [];

  const insights: DetailedAnalysis['insights'] = [
    {
      category: 'financial',
      title: 'LTV:CAC ratio',
      description: `Your LTV:CAC is ${ltvCac.toFixed(2)}:1 (${formatUsd(ltv)} LTV vs ${formatUsd(cac)} CAC). SaaS targets are often 3:1 or better.`,
      impact: ltvCac >= 3 ? 'low' : ltvCac >= 2 ? 'medium' : 'high',
      actionable: true,
    },
    {
      category: 'optimization',
      title: 'Payback period',
      description: `CAC payback is about ${paybackMonths.toFixed(1)} months. Many growth teams aim for under 12 months.`,
      impact: impactFromThreshold(paybackMonths, 12, 18),
      actionable: true,
    },
    {
      category: 'risk',
      title: 'Retention profile',
      description: `Monthly churn is ${churn.toFixed(1)}% with ${grossMargin.toFixed(1)}% gross margin — both drive how long customers stay profitable.`,
      impact: churn > 5 ? 'high' : churn > 3 ? 'medium' : 'low',
      actionable: true,
    },
    ...engineInsights,
  ];

  const recommendations: DetailedAnalysis['recommendations'] =
    engineRecs.length > 0
      ? engineRecs
      : [
          {
            priority: ltvCac < 3 ? 'high' : 'medium',
            category: 'immediate',
            title: 'Improve LTV:CAC',
            description:
              ltvCac < 3
                ? 'Raise LTV (pricing, retention) or lower CAC (channel efficiency) before scaling spend.'
                : 'Maintain acquisition efficiency while testing incremental channels.',
            effort: 'medium',
          },
          {
            priority: paybackMonths > 12 ? 'medium' : 'low',
            category: 'short-term',
            title: 'Shorten payback',
            description: 'Tighten onboarding and expansion motions to recover CAC faster.',
            effort: 'medium',
          },
        ];

  const ltvCacBench = asRecord(benchmarks.ltvCac);
  const churnBench = asRecord(benchmarks.churn);

  return {
    summary: {
      overallHealth: health,
      ltvToCacRatio: ltvCac,
      cac,
      ltv,
      paybackPeriodMonths: paybackMonths,
      churnRate: churn,
      grossMarginPercent: grossMargin,
    },
    insights,
    recommendations,
    riskAssessment: {
      overallRisk:
        health === 'critical' ? 'high' : health === 'needs-improvement' ? 'medium' : 'low',
      factors: [
        {
          factor: 'LTV:CAC benchmark',
          risk: String(ltvCacBench.status) === 'poor' ? 'high' : 'medium',
          description: `Benchmark status: ${ltvCacBench.status ?? 'n/a'}`,
        },
        {
          factor: 'Churn benchmark',
          risk: String(churnBench.status) === 'poor' ? 'high' : 'low',
          description: `Churn vs target: ${churnBench.status ?? 'n/a'}`,
        },
      ],
    },
    optimizationOpportunities: [
      {
        area: 'Churn reduction',
        currentValue: churn,
        optimizedValue: Math.max(1, churn - 1),
        potentialImprovement: ltv * 0.1,
        description: 'Reducing monthly churn by 1 point',
      },
    ],
  };
}

export function analyzeBusinessValuationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);

  const valuationMid = parseMoney(record.valuationMid);
  const valuationLow = parseMoney(record.valuationLow);
  const valuationHigh = parseMoney(record.valuationHigh);
  const confidence = String(summary.confidenceLevel ?? 'medium');
  const method = String(summary.mostRelevantMethod ?? 'blended');

  const engineInsights = Array.isArray(record.insights)
    ? mapStringInsights(record.insights as string[])
    : [];
  const engineRecs = Array.isArray(record.recommendations)
    ? mapStringRecommendations(record.recommendations as string[])
    : [];

  return {
    summary: {
      valuationMid,
      valuationLow,
      valuationHigh,
      confidenceLevel: confidence,
      mostRelevantMethod: method,
      valuationRange: summary.valuationRange,
    },
    insights: [
      {
        category: 'financial',
        title: 'Estimated value',
        description: `Mid estimate is ${formatUsd(valuationMid)} (${formatUsd(valuationLow)} – ${formatUsd(valuationHigh)}). Primary method: ${method}.`,
        impact: 'high',
        actionable: false,
      },
      {
        category: 'risk',
        title: 'Confidence level',
        description: `Valuation confidence is ${confidence.toUpperCase()} — wider ranges suggest more sensitivity to assumptions.`,
        impact: confidence === 'low' ? 'high' : confidence === 'medium' ? 'medium' : 'low',
        actionable: true,
      },
      ...engineInsights,
    ],
    recommendations:
      engineRecs.length > 0
        ? engineRecs
        : [
            {
              priority: 'medium',
              category: 'short-term',
              title: 'Validate assumptions',
              description:
                'Cross-check revenue, EBITDA, and multiple inputs with recent financials before sharing externally.',
              effort: 'medium',
            },
            {
              priority: 'low',
              category: 'long-term',
              title: 'Prepare for diligence',
              description:
                'Document add-backs, customer concentration, and growth narrative to support the chosen method.',
              effort: 'high',
            },
          ],
    riskAssessment: {
      overallRisk: confidence === 'low' ? 'medium' : 'low',
      factors: [
        {
          factor: 'Range width',
          risk:
            valuationMid > 0 && (valuationHigh - valuationLow) / valuationMid > 0.5
              ? 'medium'
              : 'low',
          description: 'Spread between low and high scenarios',
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeRevenueForecastFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const summary = asRecord(record.summary);

  const totalRevenue = parseMoney(summary.totalForecastRevenue);
  const avgMonthly = parseMoney(summary.averageMonthlyRevenue);
  const totalGrowth = Number(summary.totalGrowth) || 0;
  const cmgr = Number(summary.compoundMonthlyGrowthRate) || 0;
  const months = Array.isArray(record.monthlyForecasts) ? record.monthlyForecasts.length : 0;

  const engineInsights = Array.isArray(record.insights)
    ? mapStringInsights(record.insights as string[], 'opportunity')
    : [];
  const engineRecs = Array.isArray(record.recommendations)
    ? mapStringRecommendations(record.recommendations as string[])
    : [];

  return {
    summary: {
      totalForecastRevenue: totalRevenue,
      averageMonthlyRevenue: avgMonthly,
      totalGrowth,
      compoundMonthlyGrowthRate: cmgr,
      forecastMonths: months,
    },
    insights: [
      {
        category: 'financial',
        title: 'Forecast revenue',
        description: `You project ${formatUsd(totalRevenue)} over ${months || 'the selected'} months (~${formatUsd(avgMonthly)} per month on average).`,
        impact: 'high',
        actionable: false,
      },
      {
        category: 'opportunity',
        title: 'Growth trajectory',
        description: `Total growth is ${totalGrowth.toFixed(1)}% with ${cmgr.toFixed(2)}% compound monthly growth.`,
        impact: totalGrowth > 30 ? 'medium' : 'low',
        actionable: true,
      },
      ...engineInsights,
    ],
    recommendations:
      engineRecs.length > 0
        ? engineRecs
        : [
            {
              priority: 'medium',
              category: 'short-term',
              title: 'Stress-test streams',
              description: 'Model a slower-growth scenario for your largest revenue stream.',
              effort: 'low',
            },
          ],
    riskAssessment: {
      overallRisk: cmgr > 15 ? 'medium' : 'low',
      factors: [
        {
          factor: 'Growth assumption',
          risk: cmgr > 20 ? 'high' : cmgr > 10 ? 'medium' : 'low',
          description: `${cmgr.toFixed(2)}% CMGR`,
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeStudentLoansFromResult(data: unknown): DetailedAnalysis {
  const outer = asRecord(data);
  const record = unwrapStudentLoanPayload(data);
  const summary = asRecord(record.summary);
  const input = asRecord(record.input);
  const forgiveness = asRecord(outer.forgivenessInsights);
  const refinance = asRecord(outer.refinanceInsights);

  const months = Number(summary.totalMonthsToPayoff) || 0;
  const totalInterest = parseMoney(summary.totalInterestPaid);
  const totalBalance = parseMoney(input.totalBalance);
  const strategy = String(input.paymentStrategy ?? summary.strategy ?? 'standard');

  const insights: DetailedAnalysis['insights'] = [
    {
      category: 'financial',
      title: 'Payoff timeline',
      description: `Estimated payoff in ${months} months on ${formatUsd(totalBalance)} of loans using the ${strategy} approach.`,
      impact: impactFromThreshold(months, 120, 180),
      actionable: true,
    },
    {
      category: 'optimization',
      title: 'Interest cost',
      description: `Projected interest paid is about ${formatUsd(totalInterest)} over the repayment period.`,
      impact: impactFromThreshold(totalInterest / Math.max(totalBalance, 1), 0.2, 0.35),
      actionable: true,
    },
  ];

  if (forgiveness.eligible !== undefined) {
    insights.push({
      category: 'opportunity',
      title: 'Forgiveness options',
      description: String(
        forgiveness.summary ?? forgiveness.message ?? 'Review PSLF or IDR forgiveness eligibility.'
      ),
      impact: forgiveness.eligible ? 'medium' : 'low',
      actionable: Boolean(forgiveness.eligible),
    });
  }

  if (refinance.recommended !== undefined) {
    insights.push({
      category: 'optimization',
      title: 'Refinance check',
      description: String(
        refinance.summary ??
          refinance.message ??
          'Compare refinance offers against federal protections.'
      ),
      impact: refinance.recommended ? 'medium' : 'low',
      actionable: true,
    });
  }

  const engineRecs = Array.isArray(record.recommendations)
    ? mapStringRecommendations(record.recommendations as string[])
    : [];

  return {
    summary: {
      totalMonthsToPayoff: months,
      totalInterestPaid: totalInterest,
      totalBalance,
      paymentStrategy: strategy,
    },
    insights,
    recommendations:
      engineRecs.length > 0
        ? engineRecs
        : [
            {
              priority: 'high',
              category: 'immediate',
              title: 'Compare repayment plans',
              description:
                'Evaluate standard, graduated, and income-driven plans against your career and forgiveness goals.',
              effort: 'medium',
            },
          ],
    riskAssessment: {
      overallRisk: months > 120 ? 'medium' : 'low',
      factors: [
        {
          factor: 'Repayment length',
          risk: months > 180 ? 'high' : months > 120 ? 'medium' : 'low',
          description: `${months} months to payoff`,
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeDcfValuationFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);

  const enterpriseValue = parseMoney(record.enterpriseValue);
  const equityValue = parseMoney(record.equityValue);
  const sharePrice = parseMoney(record.sharePrice);
  const terminalValue = parseMoney(record.terminalValue);
  const presentValue = parseMoney(record.presentValue);
  const wacc = Number(record.wacc) || 0;

  return {
    summary: {
      enterpriseValue,
      equityValue,
      sharePrice,
      terminalValue,
      presentValue,
      wacc,
    },
    insights: [
      {
        category: 'financial',
        title: 'Enterprise value',
        description: `DCF enterprise value is ${formatUsd(enterpriseValue)} (${formatUsd(equityValue)} equity value, ${formatUsd(sharePrice)} per share).`,
        impact: 'high',
        actionable: false,
      },
      {
        category: 'risk',
        title: 'Terminal value weight',
        description: `Terminal value is ${formatUsd(terminalValue)} vs ${formatUsd(presentValue)} in explicit-period cash flows — check terminal growth and WACC (${wacc.toFixed(1)}%).`,
        impact: enterpriseValue > 0 && terminalValue / enterpriseValue > 0.6 ? 'medium' : 'low',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: 'medium',
        category: 'short-term',
        title: 'Sensitivity analysis',
        description:
          'Re-run with ±1% WACC and ±0.5% terminal growth to bracket the valuation range.',
        effort: 'medium',
      },
    ],
    riskAssessment: {
      overallRisk: wacc < 6 || wacc > 14 ? 'medium' : 'low',
      factors: [
        {
          factor: 'Discount rate',
          risk: wacc > 12 ? 'medium' : 'low',
          description: `${wacc.toFixed(1)}% discount rate`,
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeRiskManagementFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const varBlock = asRecord(record.valueAtRisk);
  const riskMetrics = asRecord(record.riskMetrics);
  const stress = asRecord(record.stressTest);

  const monthlyVaR = parseMoney(varBlock.monthly);
  const sharpe = Number(riskMetrics.sharpeRatio) || 0;
  const maxDrawdown = Number(riskMetrics.maxDrawdown) || 0;
  const recessionStress = parseMoney(stress.recession);

  return {
    summary: {
      monthlyVaR,
      sharpeRatio: sharpe,
      maxDrawdown,
      recessionStress,
    },
    insights: [
      {
        category: 'risk',
        title: 'Value at risk',
        description: `Estimated monthly VaR is ${formatUsd(monthlyVaR)} at the selected confidence level.`,
        impact: impactFromThreshold(monthlyVaR, 10000, 25000),
        actionable: true,
      },
      {
        category: 'financial',
        title: 'Risk-adjusted return',
        description: `Sharpe ratio is ${sharpe.toFixed(2)} with estimated max drawdown around ${maxDrawdown.toFixed(1)}%.`,
        impact: sharpe < 0.5 ? 'high' : sharpe < 1 ? 'medium' : 'low',
        actionable: true,
      },
      {
        category: 'opportunity',
        title: 'Stress scenarios',
        description: `Recession stress scenario portfolio value about ${formatUsd(recessionStress)}.`,
        impact: 'medium',
        actionable: false,
      },
    ],
    recommendations: [
      {
        priority: sharpe < 1 ? 'high' : 'medium',
        category: 'immediate',
        title: 'Review allocation',
        description: 'Align equity/fixed income mix with risk tolerance and VaR limits.',
        effort: 'medium',
      },
    ],
    riskAssessment: {
      overallRisk: sharpe < 0.5 ? 'high' : sharpe < 1 ? 'medium' : 'low',
      factors: [
        {
          factor: 'Tail risk',
          risk: monthlyVaR > 20000 ? 'high' : monthlyVaR > 10000 ? 'medium' : 'low',
          description: 'Monthly value at risk',
        },
      ],
    },
    optimizationOpportunities: [],
  };
}

export function analyzeMaAnalysisFromResult(data: unknown): DetailedAnalysis {
  const record = asRecord(data);
  const transactionSummary = asRecord(record.transactionSummary);
  const synergyAnalysis = asRecord(record.synergyAnalysis);
  const totalSynergies = asRecord(synergyAnalysis.totalSynergies);
  const accretion = asRecord(record.accretionDilution);
  const accretionSummary = asRecord(accretion.summary);

  const transactionValue = parseMoney(
    record.transactionValue ??
      transactionSummary.purchasePrice ??
      transactionSummary.enterpriseValue
  );
  const premiumPct = Number(record.premiumPercentage ?? transactionSummary.premium) || 0;
  const epsAccretionPct =
    Number(record.epsAccretionPercentage ?? accretionSummary.epsAccretionPercent) || 0;
  const synergies = parseMoney(record.totalSynergies ?? totalSynergies.presentValue);
  const leverage = Number(record.leverageRatio) || 0;

  const accretive = epsAccretionPct >= 0;

  return {
    summary: {
      transactionValue,
      premiumPercentage: premiumPct,
      epsAccretionPercentage: epsAccretionPct,
      totalSynergies: synergies,
      leverageRatio: leverage,
    },
    insights: [
      {
        category: 'financial',
        title: 'Deal size',
        description: `Transaction value is ${formatUsd(transactionValue)} at a ${premiumPct.toFixed(1)}% premium to the target.`,
        impact: 'high',
        actionable: false,
      },
      {
        category: accretive ? 'opportunity' : 'risk',
        title: 'EPS impact',
        description: `Deal is ${accretive ? 'accretive' : 'dilutive'} by about ${Math.abs(epsAccretionPct).toFixed(1)}% to EPS.`,
        impact: Math.abs(epsAccretionPct) > 5 ? 'high' : 'medium',
        actionable: true,
      },
      {
        category: 'optimization',
        title: 'Synergy capture',
        description: `Modeled synergies total ${formatUsd(synergies)} — execution risk determines realized value.`,
        impact: 'medium',
        actionable: true,
      },
    ],
    recommendations: [
      {
        priority: !accretive ? 'high' : 'medium',
        category: 'short-term',
        title: 'Integration planning',
        description:
          'Validate synergy timing, financing costs, and retention of key revenue drivers.',
        effort: 'high',
      },
      {
        priority: leverage > 3 ? 'high' : 'low',
        category: 'immediate',
        title: 'Leverage check',
        description: `Leverage near ${leverage.toFixed(1)}x — confirm covenant headroom and deleveraging path.`,
        effort: 'medium',
      },
    ],
    riskAssessment: {
      overallRisk: !accretive || leverage > 4 ? 'high' : leverage > 3 ? 'medium' : 'low',
      factors: [
        {
          factor: 'EPS accretion',
          risk: epsAccretionPct < 0 ? 'high' : 'low',
          description: `${epsAccretionPct.toFixed(1)}% EPS change`,
        },
        {
          factor: 'Financing risk',
          risk: leverage > 4 ? 'high' : leverage > 3 ? 'medium' : 'low',
          description: `${leverage.toFixed(1)}x leverage`,
        },
      ],
    },
    optimizationOpportunities: [],
  };
}
