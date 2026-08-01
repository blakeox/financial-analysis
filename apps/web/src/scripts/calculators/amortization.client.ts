import type {
  AmortizationAnalysisResult,
  AmortizationInput,
  AmortizationResultItem,
} from '@financial-analysis/analysis';
import { clearCalculatorFormErrors, handleCalculatorFormError } from '../_shared/form-field-errors';
import { renderTheAnswer } from '../_shared/answer-html';
import { bindAssumptionChipClicks } from '../_shared/assumption-chip-html';
import { renderMetricCard } from '../_shared/metric-card-html';
import {
  renderDataTableCell,
  renderLegendItem,
  renderSectionHeading,
  spineCopyClasses,
} from '../_shared/spine-html';
import {
  coerceNumber,
  formatCurrency,
  hideError,
  isFiniteNumber,
  parseNumberWithFallback as parseNumber,
} from '../../utils/calculator-utilities';
import { AnalysisRequestError, postAnalysisRequest } from '../analysis/analysis-api';
import { dispatchAnalysisResultUpdated } from '../analysis/analysis-event-contract';
import { storeAnalysisResult } from '../analysis/analysis-results';
import { publishChatContext } from '../chat/chat-context';

type AmortizationResultExtras = Partial<{
  totalPayments: number;
  totalAmount: number;
  totalInterest: number;
  interestPaid: number;
  interestSaved: number;
  timeReduced: number;
}>;

type AmortizationResultExtended = AmortizationAnalysisResult & AmortizationResultExtras;

// Helper to safely extract total paid amount from API result
const getTotalPaid = (result: AmortizationResultExtended): number => {
  if (isFiniteNumber(result.totalPayments)) return Number(result.totalPayments);
  if (isFiniteNumber(result.totalAmount)) return Number(result.totalAmount);
  return 0;
};

// Helper to safely extract total interest from API result
const getTotalInterest = (result: AmortizationResultExtended): number => {
  if (isFiniteNumber(result.totalInterest)) return Number(result.totalInterest);
  if (isFiniteNumber(result.interestPaid)) return Number(result.interestPaid);
  return 0;
};

// Brand chart palette (#412) — align with --fa-chart-* tokens
const CHART_COLORS = {
  balance: '#6d4aff', // --fa-chart-1 / brand
  principal: '#16a34a', // --fa-chart-2 / success
  interest: '#f59e0b', // --fa-chart-3 / warning
  grid: '#e7e4f2',
  gridDark: '#374151',
  text: '#1f2937',
  textLight: '#475569',
  textDark: '#e5e7eb',
  background: '#ffffff',
  backgroundDark: '#1f2937',
  accent: '#4328bb', // --fa-chart-4
} as const;

const toCurrency = (value: unknown): string => {
  const numeric = coerceNumber(value, Number.NaN);
  return Number.isFinite(numeric) ? formatCurrency(numeric) : '';
};

type RiskLevel = 'low' | 'medium' | 'high';

type AmortizationMilestone = {
  id: string;
  month: number;
  label: string;
  description: string;
};

type AmortizationRiskFactor = {
  factor: string;
  risk: RiskLevel;
  description: string;
};

interface AmortizationSummary {
  principal: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayments: number;
  termMonths: number;
  years: number;
  annualRate: number;
  interestShare: number;
  payoffDate?: string;
  totalPMI: number;
  totalExtraPayments: number;
  assumedMonthlyIncome: number;
  paymentToIncomeRatio: number;
  firstYearInterest: number;
  lastYearInterest: number;
  interestSaved?: number;
  timeReduced?: number;
}

interface AmortizationTimeline {
  principalTakeoverMonth: number | null;
  halfBalanceMonth: number | null;
  milestones: Array<{
    id: string;
    month: number;
    label: string;
    description: string;
  }>;
}

interface AmortizationInsight {
  category: 'financial' | 'risk' | 'opportunity' | 'optimization';
  title: string;
  description: string;
  impact: RiskLevel;
  actionable: boolean;
}

interface AmortizationRecommendation {
  priority: RiskLevel;
  category: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  potentialSavings?: number;
  effort: RiskLevel;
}

interface AmortizationRiskAssessment {
  overallRisk: RiskLevel;
  factors: Array<{
    factor: string;
    risk: RiskLevel;
    description: string;
  }>;
}

interface AmortizationOptimizationOpportunity {
  area: string;
  currentValue: number;
  optimizedValue: number;
  potentialImprovement: number;
  description: string;
}

export interface AmortizationComprehensiveAnalysis {
  summary: AmortizationSummary;
  timeline: AmortizationTimeline;
  insights: AmortizationInsight[];
  recommendations: AmortizationRecommendation[];
  riskAssessment: AmortizationRiskAssessment;
  optimizationOpportunities: AmortizationOptimizationOpportunity[];
  chatHighlights: string[];
  chatSummary: string;
  context: {
    totals: AmortizationSummary;
    timeline: AmortizationTimeline;
  };
}

const ASSUMED_MONTHLY_INCOME = 5000;

declare global {
  interface Window {
    amortizationAnalysisData?: AmortizationComprehensiveAnalysis;
    populateAnalysisData?: (data: AmortizationComprehensiveAnalysis) => void;
  }
}

const clampNumber = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const safeRound = (value: number, digits = 2): number => clampNumber(Number(value.toFixed(digits)));

const sumBy = <T>(items: T[], selector: (item: T) => number): number =>
  items.reduce((sum, item) => sum + selector(item), 0);

const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number) => {
  if (principal <= 0 || termMonths <= 0) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const calcExtraPaymentSavings = (
  principal: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment: number,
  extra: number
) => {
  if (!principal || !annualRate || !termMonths || extra <= 0) {
    return { savings: 0, monthsSaved: 0 };
  }

  const monthlyRate = annualRate / 12;
  const newPayment = monthlyPayment + extra;
  const numerator = newPayment;
  const denominator = newPayment - principal * monthlyRate;

  if (denominator <= 0) {
    return { savings: 0, monthsSaved: 0 };
  }

  const newTerm = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  if (!Number.isFinite(newTerm)) {
    return { savings: 0, monthsSaved: 0 };
  }

  const originalTotal = monthlyPayment * termMonths;
  const newTotal = newPayment * newTerm;
  const savings = Math.max(0, originalTotal - newTotal);
  const monthsSaved = Math.max(0, termMonths - newTerm);

  return {
    savings: safeRound(savings),
    monthsSaved: Math.round(monthsSaved),
  };
};

const calcRateReductionSavings = (
  principal: number,
  annualRate: number,
  termMonths: number,
  reductionFraction: number
) => {
  if (!principal || !annualRate || !termMonths || reductionFraction <= 0) return 0;
  const originalMonthly = calculateMonthlyPayment(principal, annualRate, termMonths);
  const reducedRate = Math.max(annualRate - reductionFraction, 0);
  const reducedMonthly = calculateMonthlyPayment(principal, reducedRate, termMonths);
  const originalTotal = originalMonthly * termMonths;
  const reducedTotal = reducedMonthly * termMonths;
  return safeRound(Math.max(0, originalTotal - reducedTotal));
};

const buildClientComprehensiveAnalysis = (
  result: AmortizationAnalysisResult,
  input: {
    principal: number;
    annualRate: number;
    termMonths: number;
    extraMonthlyPayment?: number;
  }
): AmortizationComprehensiveAnalysis => {
  const schedule = result.schedule ?? [];
  const firstItem = schedule[0];

  const startingBalance =
    firstItem != null
      ? clampNumber(firstItem.balance + firstItem.principal + (firstItem.extraPayment ?? 0))
      : input.principal;

  const principal = startingBalance || input.principal;
  const monthlyPayment = clampNumber(result.monthlyPayment);
  const totalInterest = getTotalInterest(result);
  const totalPayments = getTotalPaid(result);
  const termMonths =
    schedule.length || clampNumber(input.termMonths) || clampNumber(result.schedule.length);
  const years = termMonths / 12;
  const annualRate = clampNumber(input.annualRate);
  const totalPMI = safeRound(
    sumBy(schedule, (item: AmortizationResultItem) => clampNumber(item.pmi ?? 0))
  );
  const totalExtraPayments = safeRound(
    sumBy(schedule, (item: AmortizationResultItem) => clampNumber(item.extraPayment ?? 0))
  );
  const paymentToIncomeRatio =
    ASSUMED_MONTHLY_INCOME > 0 ? monthlyPayment / ASSUMED_MONTHLY_INCOME : 0;
  const firstYearInterest = safeRound(
    sumBy(schedule.slice(0, 12), (item: AmortizationResultItem) => item.interest || 0)
  );
  const lastYearInterest = safeRound(
    sumBy(schedule.slice(-12), (item: AmortizationResultItem) => item.interest || 0)
  );

  let highestInterestShare = 0;
  let highestInterestMonth = schedule[0]?.month ?? 1;
  let principalTakeoverMonth: number | null = null;

  const halfBalanceTarget = startingBalance / 2;
  let halfBalanceMonth: number | null = null;

  for (const item of schedule) {
    const interestShare = item.payment > 0 ? clampNumber(item.interest / item.payment) : 0;
    if (interestShare > highestInterestShare) {
      highestInterestShare = interestShare;
      highestInterestMonth = item.month;
    }
    if (principalTakeoverMonth == null && item.principal >= item.interest) {
      principalTakeoverMonth = item.month;
    }
    if (halfBalanceMonth == null && item.balance <= halfBalanceTarget) {
      halfBalanceMonth = item.month;
    }
  }

  const finalMonth = schedule[schedule.length - 1]?.month ?? termMonths;

  const summary: AmortizationSummary = {
    principal,
    monthlyPayment,
    totalInterest,
    totalPayments,
    termMonths,
    years,
    annualRate,
    interestShare: totalPayments > 0 ? totalInterest / totalPayments : 0,
    payoffDate: result.payoffDate,
    totalPMI,
    totalExtraPayments,
    assumedMonthlyIncome: ASSUMED_MONTHLY_INCOME,
    paymentToIncomeRatio,
    firstYearInterest,
    lastYearInterest,
    interestSaved: clampNumber(result.interestSaved ?? 0),
    timeReduced: clampNumber(result.timeReduced ?? 0),
  };

  const milestones: AmortizationMilestone[] = [
    {
      id: 'highest-interest-share',
      month: highestInterestMonth,
      label: 'Interest-leaning payment',
      description: `Interest consumes ${(highestInterestShare * 100).toFixed(1)}% of the payment`,
    },
  ];

  if (principalTakeoverMonth != null) {
    milestones.push({
      id: 'principal-takeover',
      month: principalTakeoverMonth,
      label: 'Principal overtakes interest',
      description: 'Principal outpaces interest for the first time',
    });
  }

  if (halfBalanceMonth != null) {
    milestones.push({
      id: 'halfway-balance',
      month: halfBalanceMonth,
      label: 'Half of principal repaid',
      description: 'Remaining balance drops below half of the original loan',
    });
  }

  milestones.push({
    id: 'final-payment',
    month: finalMonth,
    label: 'Loan payoff',
    description: 'Balance reaches zero with the final payment',
  });

  const insights: AmortizationInsight[] = [
    {
      category: 'financial',
      title: 'Interest Cost Share',
      description: `Interest totals ${(summary.interestShare * 100).toFixed(1)}% of the ${toCurrency(
        totalPayments
      )} paid over the term.`,
      impact:
        summary.interestShare > 0.5 ? 'high' : summary.interestShare > 0.35 ? 'medium' : 'low',
      actionable: true,
    },
    {
      category: 'optimization',
      title: 'Payment-to-Income Check',
      description: `Monthly payment of ${toCurrency(
        monthlyPayment
      )} equals ${(paymentToIncomeRatio * 100).toFixed(1)}% of a ${toCurrency(
        ASSUMED_MONTHLY_INCOME
      )} income (28% benchmark).`,
      impact: paymentToIncomeRatio > 0.3 ? 'high' : paymentToIncomeRatio > 0.2 ? 'medium' : 'low',
      actionable: true,
    },
    {
      category: 'opportunity',
      title: 'Equity Momentum',
      description:
        principalTakeoverMonth != null
          ? `Principal overtakes interest in month ${principalTakeoverMonth}, accelerating equity build.`
          : 'Interest remains larger than principal for the full term.',
      impact: 'medium',
      actionable: true,
    },
  ];

  const { savings: savings100, monthsSaved: monthsSaved100 } = calcExtraPaymentSavings(
    principal,
    annualRate,
    termMonths,
    monthlyPayment,
    100
  );
  // Unused: savings250 kept for potential future use
  // const { savings: savings250 } = calcExtraPaymentSavings(
  //   principal,
  //   annualRate,
  //   termMonths,
  //   monthlyPayment,
  //   250
  // );
  const refinanceSavings = calcRateReductionSavings(principal, annualRate, termMonths, 0.005);

  const recommendations: AmortizationRecommendation[] = [
    {
      priority: paymentToIncomeRatio > 0.3 ? 'high' : 'medium',
      category: 'immediate',
      title: 'Verify Affordability',
      description: `Aim to keep housing costs below 28% of income; current ratio is ${(
        paymentToIncomeRatio * 100
      ).toFixed(1)}%.`,
      effort: 'low',
    },
    {
      priority: savings100 > 0 ? 'high' : 'medium',
      category: 'short-term',
      title: 'Automate $100 Extra Payments',
      description:
        savings100 > 0
          ? `Adding $100 per month could save ${toCurrency(
              savings100
            )} and trim about ${Math.round(monthsSaved100 / 12)} years.`
          : 'Extra payments accelerate payoff; confirm savings with your lender.',
      potentialSavings: savings100,
      effort: 'medium',
    },
    {
      priority: 'medium',
      category: 'short-term',
      title: 'Consider Bi-weekly Payments',
      description:
        'Switching to 26 half-payments per year adds one extra payment, trimming interest and term.',
      potentialSavings: safeRound(monthlyPayment * 0.5 * 12 * 0.1),
      effort: 'low',
    },
    {
      priority: refinanceSavings > 0 ? 'medium' : 'low',
      category: 'long-term',
      title: 'Monitor Refinance Opportunities',
      description:
        refinanceSavings > 0
          ? `Dropping the rate by 0.5% could save ${toCurrency(refinanceSavings)}.`
          : 'Track market rates; refinancing can lower payments and interest.',
      potentialSavings: refinanceSavings,
      effort: 'medium',
    },
  ];

  const riskFactors: AmortizationRiskFactor[] = [
    {
      factor: 'Payment Burden',
      risk: paymentToIncomeRatio > 0.3 ? 'high' : paymentToIncomeRatio > 0.2 ? 'medium' : 'low',
      description: `Payment consumes ${(paymentToIncomeRatio * 100).toFixed(1)}% of assumed income.`,
    },
    {
      factor: 'Interest Rate Level',
      risk: annualRate > 0.07 ? 'high' : annualRate > 0.05 ? 'medium' : 'low',
      description: `Current rate ${(annualRate * 100).toFixed(2)}% compared with market averages.`,
    },
    {
      factor: 'Interest Cost Exposure',
      risk: summary.interestShare > 0.5 ? 'high' : summary.interestShare > 0.35 ? 'medium' : 'low',
      description: `Interest equals ${(summary.interestShare * 100).toFixed(1)}% of loan cost.`,
    },
    {
      factor: 'Term Length',
      risk: termMonths > 360 ? 'high' : termMonths > 240 ? 'medium' : 'low',
      description: `${(termMonths / 12).toFixed(1)}-year commitment.`,
    },
  ];

  const riskAssessment: AmortizationRiskAssessment = {
    overallRisk: riskFactors.some((factor) => factor.risk === 'high')
      ? 'high'
      : riskFactors.some((factor) => factor.risk === 'medium')
        ? 'medium'
        : 'low',
    factors: riskFactors,
  };

  const optimizationOpportunities: AmortizationOptimizationOpportunity[] = [
    {
      area: 'Extra Payments',
      currentValue: totalExtraPayments,
      optimizedValue: totalExtraPayments + 100,
      potentialImprovement: savings100,
      description: 'Adding $100 per month accelerates payoff and trims interest.',
    },
    {
      area: 'Bi-weekly Strategy',
      currentValue: monthlyPayment,
      optimizedValue: safeRound(monthlyPayment / 2),
      potentialImprovement: safeRound(monthlyPayment * 0.5 * 12 * 0.1),
      description: 'Switch to 26 half-payments each year (13 full payments).',
    },
    {
      area: 'Rate Reduction',
      currentValue: annualRate,
      optimizedValue: Math.max(annualRate - 0.005, 0),
      potentialImprovement: refinanceSavings,
      description: 'Track rate dips of 0.5% or more to refinance efficiently.',
    },
  ];

  const chatHighlights = [
    `Monthly payment ${toCurrency(monthlyPayment)}; interest equals ${(
      summary.interestShare * 100
    ).toFixed(1)}% of total cost.`,
    principalTakeoverMonth
      ? `Principal overtakes interest in month ${principalTakeoverMonth}.`
      : 'Interest never drops below principal in this schedule.',
    halfBalanceMonth
      ? `Balance reaches half of the starting amount by month ${halfBalanceMonth}.`
      : 'Loan does not reach half balance within the modeled term.',
    totalExtraPayments > 0
      ? `Extra payments sum to ${toCurrency(totalExtraPayments)} so far.`
      : 'No extra payments scheduled yet—adding them cuts interest significantly.',
  ];

  const chatSummary = [
    `Total cost ${toCurrency(totalPayments)} with ${toCurrency(
      totalInterest
    )} in interest (${(summary.interestShare * 100).toFixed(1)}%).`,
    principalTakeoverMonth
      ? `Principal outweighs interest after month ${principalTakeoverMonth}.`
      : 'Interest remains larger than principal through the current payoff horizon.',
    `Payment-to-income ratio is ${(paymentToIncomeRatio * 100).toFixed(
      1
    )}%, compared with the 28% guideline.`,
    totalExtraPayments > 0
      ? `Scheduled extra payments total ${toCurrency(
          totalExtraPayments
        )}; continuing them accelerates payoff.`
      : 'Consider bi-weekly or extra payments to shorten the term and save interest.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    summary,
    timeline: {
      principalTakeoverMonth,
      halfBalanceMonth,
      milestones,
    },
    insights,
    recommendations,
    riskAssessment,
    optimizationOpportunities,
    chatHighlights,
    chatSummary,
    context: {
      totals: summary,
      timeline: {
        principalTakeoverMonth,
        halfBalanceMonth,
        milestones,
      },
    },
  };
};

type AmortizationAnalysisBroadcast = AmortizationComprehensiveAnalysis & {
  principal: number;
  annualRate: number;
  termMonths: number;
  extraPayment: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayments: number;
  rawResult: AmortizationAnalysisResult;
};

export const renderSummaryCards = (
  result: AmortizationAnalysisResult,
  termMonths: number,
  target: HTMLElement | null = document.getElementById('summary-cards'),
  assumptionContext?: { annualRate?: number; principal?: number }
): void => {
  if (!target) return;

  const monthlyPayment = coerceNumber(result.monthlyPayment, 0);
  const totalInterest = getTotalInterest(result);
  const totalPayments = getTotalPaid(result);
  const interestShare =
    totalPayments > 0 ? ((totalInterest / totalPayments) * 100).toFixed(1) : '0.0';
  const termYears = Math.max(1, Math.round(termMonths / 12));
  const rateFraction = assumptionContext?.annualRate;
  const rateLabel =
    typeof rateFraction === 'number' && Number.isFinite(rateFraction)
      ? `${(rateFraction * 100).toFixed(2).replace(/\.?0+$/, '')}%`
      : undefined;

  const answerHtml = renderTheAnswer({
    label: 'Monthly payment',
    value: toCurrency(monthlyPayment) || '—',
    meaning: `You pay this each month over ${termMonths} months (${interestShare}% of total goes to interest).`,
    assumptions: [
      { label: `${termYears}y`, fieldName: 'termMonths', title: 'Loan term' },
      ...(rateLabel
        ? [{ label: rateLabel, fieldName: 'annualRate', title: 'Annual interest rate' }]
        : []),
      ...(assumptionContext?.principal
        ? [
            {
              label: toCurrency(assumptionContext.principal) || 'Principal',
              fieldName: 'principal',
              title: 'Loan amount',
            },
          ]
        : []),
    ],
    cta: {
      label: 'View amortization schedule',
      attrs: 'data-action="scroll-amortization-schedule"',
    },
  });

  const secondaryHtml = [
    renderMetricCard({
      title: 'Total Interest',
      value: toCurrency(totalInterest),
      meta: `${interestShare}% of total payments`,
      tone: 'surface',
      valueClassName: 'fa-metric-card-value-emerald',
    }),
    renderMetricCard({
      title: 'Total Paid',
      value: toCurrency(totalPayments),
      meta: `Over ${termMonths} months`,
      tone: 'surface',
      valueClassName: 'fa-metric-card-value-violet',
    }),
  ].join('\n');

  target.innerHTML = `${answerHtml}
    <div class="mt-4 grid gap-4 sm:grid-cols-2">${secondaryHtml}</div>`;
  bindAssumptionChipClicks(target);

  const cta = target.querySelector<HTMLElement>('[data-action="scroll-amortization-schedule"]');
  cta?.addEventListener('click', () => {
    document.getElementById('amortization-chart')?.scrollIntoView({ behavior: 'smooth' });
  });
};

export const renderChart = (
  schedule: AmortizationResultItem[] | undefined,
  target: HTMLElement | null = document.getElementById('amortization-chart')
): void => {
  if (!target) return;
  if (!Array.isArray(schedule) || schedule.length === 0) {
    target.innerHTML = '<p class="fa-script-copy-subtle">No chart data available.</p>';
    return;
  }

  // Create a simple chart using CSS and HTML since we don't have React components available in this context
  const initialMaxPayment = Math.max(...schedule.map((item) => item.payment));
  const initialMaxBalance = Math.max(...schedule.map((item) => item.balance + item.principal));

  // Determine how many bars to show based on the loan term
  // For longer loans, we'll sample the data to keep the chart readable
  const totalMonths = schedule.length;
  let displayData = schedule;
  let sampleRate = 1;

  if (totalMonths > 120) {
    // For loans longer than 10 years, sample every 3rd month
    sampleRate = 3;
    displayData = schedule.filter(
      (_, index) => index % sampleRate === 0 || index === schedule.length - 1
    );
  } else if (totalMonths > 60) {
    // For loans longer than 5 years, sample every 2nd month
    sampleRate = 2;
    displayData = schedule.filter(
      (_, index) => index % sampleRate === 0 || index === schedule.length - 1
    );
  }

  // Calculate responsive bar width and gap
  const maxBars = Math.min(displayData.length, 100); // Cap at 100 bars for readability
  const barWidth = Math.max(3, Math.floor(100 / maxBars)); // Minimum 3px width for visibility
  const gapSize = Math.max(1, barWidth * 0.1); // 10% gap, minimum 1px

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Chart Debug:', {
      totalMonths,
      displayDataLength: displayData.length,
      sampleRate,
      maxBars,
      barWidth,
      gapSize,
      maxPayment: initialMaxPayment,
      maxBalance: initialMaxBalance,
      firstEntry: displayData[0],
      lastEntry: displayData[displayData.length - 1],
    });
  }

  // Create responsive dual-axis line chart using SVG with modern design
  const chartWidth = Math.max(900, displayData.length * 5); // Wider for better readability
  const chartHeight = 450; // Taller for better proportions
  const padding = { top: 50, right: 130, bottom: 70, left: 130 }; // Extra generous padding for axis titles and labels
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Separate scaling for balance vs payment components
  const maxBalance = Math.max(1, Math.max(...displayData.map((entry) => entry.balance)));
  const maxPayment = Math.max(1, Math.max(...displayData.map((entry) => entry.payment)));

  // Generate line paths with dual Y-axis scaling
  const generateLinePath = (data: number[], maxValue: number, _isLeftAxis: boolean = true) => {
    const points = data.map((value, index) => {
      const denom = data.length > 1 ? data.length - 1 : 1;
      const x = padding.left + (index / denom) * plotWidth;
      const y = padding.top + plotHeight - (value / maxValue) * plotHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Prepare data for lines
  // Payments on LEFT axis, Balance on RIGHT axis
  const balanceData = displayData.map((entry) => entry.balance);
  const principalData = displayData.map((entry) => entry.principal);
  const interestData = displayData.map((entry) => entry.interest);

  // Generate SVG paths with proper scaling
  // Balance uses right axis (isLeftAxis = false)
  // Payments use left axis (isLeftAxis = true)
  const balancePath = generateLinePath(balanceData, maxBalance, false);
  const principalPath = generateLinePath(principalData, maxPayment, true);
  const interestPath = generateLinePath(interestData, maxPayment, true);

  // Generate Y-axis labels with better formatting
  // LEFT axis: Payments, RIGHT axis: Balance
  const generateYAxisLabels = (maxValue: number, isLeftAxis: boolean = true) => {
    const steps = 6;
    const stepValue = maxValue / steps;
    const labels = [];

    for (let i = 0; i <= steps; i++) {
      const value = stepValue * i;
      const y = padding.top + plotHeight - (value / maxValue) * plotHeight;
      // Position labels closer to the axis line to avoid overlap with rotated titles
      const x = isLeftAxis ? padding.left - 15 : chartWidth - padding.right + 15;
      const textAnchor = isLeftAxis ? 'end' : 'start';
      const fontSize = '13px';
      const fontWeight = '600';
      const color = CHART_COLORS.text;

      labels.push(
        `<text x="${x}" y="${y + 5}" text-anchor="${textAnchor}" font-size="${fontSize}" font-weight="${fontWeight}" fill="${color}" class="dark:fill-gray-300">${toCurrency(value)}</text>`
      );
    }
    return labels.join('');
  };

  // Generate x-axis labels with better formatting
  const xAxisLabels = displayData
    .filter(
      (entry, _index) =>
        entry.month === 1 ||
        entry.month % 12 === 0 ||
        entry.month === totalMonths ||
        (totalMonths > 60 && entry.month % 24 === 0)
    )
    .map((entry) => {
      const denom = totalMonths > 1 ? totalMonths - 1 : 1;
      const x = padding.left + ((entry.month - 1) / denom) * plotWidth;
      const year = Math.ceil(entry.month / 12);
      const label = totalMonths > 24 ? `Year ${year}` : `Month ${entry.month}`;
      return `<text x="${x}" y="${chartHeight - 20}" text-anchor="middle" font-size="11px" font-weight="500" fill="${CHART_COLORS.textLight}">${label}</text>`;
    })
    .join('');

  // Generate grid lines with better styling - using payment scale (left axis)
  const generateGridLines = (maxValue: number) => {
    const steps = 6;
    const stepValue = maxValue / steps;
    const lines = [];

    for (let i = 0; i <= steps; i++) {
      const value = stepValue * i;
      const y = padding.top + plotHeight - (value / maxValue) * plotHeight;
      const x1 = padding.left;
      const x2 = chartWidth - padding.right;
      const opacity = i === 0 || i === steps ? 0.15 : 0.25;
      const strokeColor = CHART_COLORS.grid;

      lines.push(
        `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${strokeColor}" stroke-width="1" opacity="${opacity}" class="dark:stroke-gray-600"/>`
      );
    }
    return lines.join('');
  };

  target.innerHTML = `
    <div class="space-y-5">
      <!-- Enhanced Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 fa-panel-divider">
        <div>
          ${renderSectionHeading('Amortization Schedule Visualization', 'mb-1')}
          <p class="fa-script-copy-muted">Track payment breakdown and remaining balance over time</p>
        </div>
        
        <!-- Enhanced Legend -->
        <div class="fa-subcard flex flex-wrap items-center gap-5 text-sm px-4 py-3">
          ${renderLegendItem('Principal', { swatchStyle: `background-color: ${CHART_COLORS.principal}` })}
          ${renderLegendItem('Interest', { swatchStyle: `background-color: ${CHART_COLORS.interest}` })}
          ${renderLegendItem('Balance', { swatchStyle: `background-color: ${CHART_COLORS.balance}` })}
        </div>
      </div>
      
      <!-- Enhanced Chart Container -->
      <div class="bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-x-auto">
        <div class="min-w-full">
          <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-full h-auto" style="filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.05));">
            <!-- Subtle background gradient -->
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(59, 130, 246, 0.05);stop-opacity:1" />
                <stop offset="100%" style="stop-color:rgba(59, 130, 246, 0.0);stop-opacity:1" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <!-- Background -->
            <rect width="100%" height="100%" fill="url(#chartGradient)" />
            
            <!-- Grid lines using payment scale (left axis) -->
            ${generateGridLines(maxPayment)}
            
            <!-- Chart lines with enhanced styling and glow effect -->
            <g filter="url(#glow)">
              <path d="${principalPath}" fill="none" stroke="${CHART_COLORS.principal}" stroke-width="3.5" opacity="0.95" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="${interestPath}" fill="none" stroke="${CHART_COLORS.interest}" stroke-width="3.5" opacity="0.95" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="${balancePath}" fill="none" stroke="${CHART_COLORS.balance}" stroke-width="3.5" opacity="0.95" stroke-linecap="round" stroke-linejoin="round"/>
            </g>
            
            <!-- X-axis labels with better styling -->
            ${xAxisLabels}
            
            <!-- Y-axis labels: LEFT = Payments, RIGHT = Balance -->
            ${generateYAxisLabels(maxPayment, true)}
            ${generateYAxisLabels(maxBalance, false)}
            
            <!-- Enhanced axis lines -->
            <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${chartHeight - padding.bottom}" stroke="${CHART_COLORS.text}" stroke-width="2.5" opacity="0.8" class="dark:stroke-gray-400"/>
            <line x1="${chartWidth - padding.right}" y1="${padding.top}" x2="${chartWidth - padding.right}" y2="${chartHeight - padding.bottom}" stroke="${CHART_COLORS.text}" stroke-width="2.5" opacity="0.8" class="dark:stroke-gray-400"/>
            <line x1="${padding.left}" y1="${chartHeight - padding.bottom}" x2="${chartWidth - padding.right}" y2="${chartHeight - padding.bottom}" stroke="${CHART_COLORS.text}" stroke-width="2.5" opacity="0.8" class="dark:stroke-gray-400"/>
            
            <!-- Axis titles with color coding - positioned far from axis to avoid overlap -->
            <text x="${padding.left - 95}" y="${chartHeight / 2}" text-anchor="middle" transform="rotate(-90, ${padding.left - 95}, ${chartHeight / 2})" font-size="15px" font-weight="700" fill="${CHART_COLORS.text}" class="dark:fill-gray-200">Monthly Payment ($)</text>
            <text x="${chartWidth - padding.right + 95}" y="${chartHeight / 2}" text-anchor="middle" transform="rotate(90, ${chartWidth - padding.right + 95}, ${chartHeight / 2})" font-size="15px" font-weight="700" fill="${CHART_COLORS.balance}">Remaining Balance ($)</text>
          </svg>
        </div>
      </div>
      
      <!-- Enhanced Chart Footer -->
      <div class="text-center pt-2">
        <p class="fa-script-copy-muted">
          <span class="${spineCopyClasses.listCopyStrong}">${totalMonths} months</span> complete schedule • 
          <span class="font-medium text-emerald-600 dark:text-emerald-400">Left:</span> Payment components (Principal & Interest) • 
          <span class="font-medium text-violet-600 dark:text-violet-400">Right:</span> Remaining loan balance
        </p>
      </div>
    </div>
  `;
};

export const renderSchedule = (
  schedule: AmortizationResultItem[] | undefined,
  target: HTMLElement | null = document.getElementById('table-body')
): void => {
  if (!target) return;
  if (!Array.isArray(schedule) || schedule.length === 0) {
    target.innerHTML = '';
    return;
  }

  target.innerHTML = schedule
    .map((entry) => {
      const month = coerceNumber(entry.month, 0);
      const payment = toCurrency(entry.payment);
      const principal = toCurrency(entry.principal);
      const interest = toCurrency(entry.interest);
      const balance = toCurrency(entry.balance);
      const cumulativeInterest = toCurrency(entry.cumulativeInterest);
      const highlightClass = month % 12 === 0 ? 'fa-table-row-highlight' : '';

      return `
        <tr class="${highlightClass}">
          ${renderDataTableCell(String(month))}
          ${renderDataTableCell(payment, 'right')}
          <td class="${spineCopyClasses.dataTableCell} text-right text-emerald-600 dark:text-emerald-400">${principal}</td>
          <td class="${spineCopyClasses.dataTableCell} text-right text-orange-600 dark:text-orange-400">${interest}</td>
          ${renderDataTableCell(`<span class="font-medium">${balance}</span>`, 'right')}
          <td class="${spineCopyClasses.dataTableCell} text-right fa-help-copy">${cumulativeInterest}</td>
        </tr>
      `;
    })
    .join('');
};

export const parseAmortizationInput = (formData: FormData): AmortizationInput => {
  const principal = parseNumber(formData.get('principal'));
  const annualRatePercent = parseNumber(formData.get('annualRate'));
  const termMonths = parseNumber(formData.get('termMonths'));
  const extraMonthlyPayment = parseNumber(formData.get('extraMonthlyPayment'), 0);

  if (!isFiniteNumber(principal) || principal <= 0) {
    throw new Error('Please enter a valid loan amount');
  }

  if (!isFiniteNumber(annualRatePercent) || annualRatePercent < 0 || annualRatePercent > 100) {
    throw new Error('Annual rate must be between 0 and 100');
  }

  if (!isFiniteNumber(termMonths) || termMonths < 1) {
    throw new Error('Please enter a valid loan term (months)');
  }

  const propertyTaxAnnual = parseNumber(formData.get('propertyTaxAnnual'), 0);
  const homeInsuranceAnnual = parseNumber(formData.get('homeInsuranceAnnual'), 0);
  const hoaMonthly = parseNumber(formData.get('hoaMonthly'), 0);
  const downPayment = parseNumber(formData.get('downPayment'), 0);
  const closingCosts = parseNumber(formData.get('closingCosts'), 0);

  return {
    principal,
    annualRate: annualRatePercent / 100,
    termMonths: Math.trunc(termMonths),
    extraMonthlyPayment: Number.isFinite(extraMonthlyPayment) ? extraMonthlyPayment : 0,
    propertyTaxAnnual: Number.isFinite(propertyTaxAnnual) ? propertyTaxAnnual : 0,
    homeInsuranceAnnual: Number.isFinite(homeInsuranceAnnual) ? homeInsuranceAnnual : 0,
    hoaMonthly: Number.isFinite(hoaMonthly) ? hoaMonthly : 0,
    downPayment: Number.isFinite(downPayment) ? downPayment : 0,
    closingCosts: Number.isFinite(closingCosts) ? closingCosts : 0,
    oneTimePayments: [],
    paymentFrequency: 'monthly',
    interestOnlyMonths: 0,
    balloonPayment: 0,
    origination_fee: 0,
    points: 0,
    pmi: { enabled: false, rate: 0, dropOffLTV: 0.8 },
  };
};

export const handleSuccess = (
  result: AmortizationAnalysisResult,
  inputs: {
    principal: number;
    annualRate: number;
    termMonths: number;
    extraMonthlyPayment?: number;
  },
  options: {
    resultsContainer?: HTMLElement | null;
    summaryCards?: HTMLElement | null;
    tableBody?: HTMLElement | null;
  } = {}
): void => {
  const targetResults = options.resultsContainer ?? document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');
  const targetSummary = options.summaryCards ?? document.getElementById('summary-cards');
  const targetTableBody = options.tableBody ?? document.getElementById('table-body');

  storeAnalysisResult('analyze_amortization', result);
  renderSummaryCards(result, inputs.termMonths, targetSummary, {
    annualRate: inputs.annualRate,
    principal: inputs.principal,
  });
  renderChart(result.schedule, document.getElementById('amortization-chart'));
  renderSchedule(result.schedule, targetTableBody);

  // Update enhanced analysis component
  updateEnhancedAnalysis(result, inputs);

  // Dispatch calculator completion event for journey integration
  window.dispatchEvent(
    new CustomEvent('calculator-completed', {
      detail: {
        calculatorId: 'amortization',
        result: result,
        formData: inputs,
      },
    })
  );

  targetResults?.classList.remove('hidden');
  resultsSection?.classList.remove('hidden');
  resultsSection?.removeAttribute('hidden');
  resultsSection?.setAttribute('data-rendered', 'true');

  // Show the amortization chart, table, and comprehensive analysis if they exist
  const chartContainer = document.getElementById('amortization-chart-container');
  const tableContainer = document.getElementById('amortization-table-container');
  const analysisContainer = document.getElementById('comprehensive-analysis-container');
  chartContainer?.classList.remove('hidden');
  tableContainer?.classList.remove('hidden');
  analysisContainer?.classList.remove('hidden');
};

const updateEnhancedAnalysis = (
  result: AmortizationAnalysisResult,
  inputs: {
    principal: number;
    annualRate: number;
    termMonths: number;
    extraMonthlyPayment?: number;
  }
): void => {
  console.log('updateEnhancedAnalysis: Starting with result:', result);
  console.log('updateEnhancedAnalysis: Starting with inputs:', inputs);

  const comprehensive = buildClientComprehensiveAnalysis(result, {
    principal: inputs.principal,
    annualRate: inputs.annualRate,
    termMonths: inputs.termMonths,
    extraMonthlyPayment: inputs.extraMonthlyPayment,
  });

  const analysisData: AmortizationAnalysisBroadcast = {
    ...comprehensive,
    principal: comprehensive.summary.principal || inputs.principal,
    annualRate: comprehensive.summary.annualRate || inputs.annualRate,
    termMonths: comprehensive.summary.termMonths || inputs.termMonths,
    extraPayment: inputs.extraMonthlyPayment || 0,
    monthlyPayment: comprehensive.summary.monthlyPayment || result.monthlyPayment,
    totalInterest: comprehensive.summary.totalInterest || getTotalInterest(result),
    totalPayments: comprehensive.summary.totalPayments || getTotalPaid(result),
    rawResult: result,
  };

  console.log('updateEnhancedAnalysis: Comprehensive analysis prepared:', analysisData);

  const fireAnalysisEvents = () => {
    const detail = {
      modelType: 'amortization',
      result: analysisData,
      toolName: 'analyze_amortization',
    };

    dispatchAnalysisResultUpdated(detail);
    window.dispatchEvent(new CustomEvent('amortization-analysis-ready', { detail: analysisData }));

    publishChatContext('amortization', 'Amortization analysis', {
      summary: analysisData.summary,
      chatSummary: analysisData.chatSummary,
      highlights: analysisData.chatHighlights,
      timeline: analysisData.timeline,
    });
  };

  // Store data globally first
  window.amortizationAnalysisData = analysisData;

  // Function to attempt population with retry logic
  const attemptPopulation = (retryCount = 0) => {
    const maxRetries = 5;
    const retryDelay = 200;

    console.log(
      `updateEnhancedAnalysis: Attempting to populate (attempt ${retryCount + 1}/${maxRetries})`
    );
    console.log('updateEnhancedAnalysis: Analysis data structure:', {
      hasSummary: !!analysisData.summary,
      hasInsights: Array.isArray(analysisData.insights),
      insightsCount: analysisData.insights?.length ?? 0,
      hasRecommendations: Array.isArray(analysisData.recommendations),
      recommendationsCount: analysisData.recommendations?.length ?? 0,
      hasRiskAssessment: !!analysisData.riskAssessment,
      hasOptimizationOpportunities: Array.isArray(analysisData.optimizationOpportunities),
    });

    if (typeof window.populateAnalysisData === 'function') {
      console.log('updateEnhancedAnalysis: populateAnalysisData function found, calling...');
      try {
        window.populateAnalysisData(analysisData);
        console.log('updateEnhancedAnalysis: populateAnalysisData called successfully');
        fireAnalysisEvents();
        return; // Success, no need to retry
      } catch (error) {
        console.error('updateEnhancedAnalysis: Error calling populateAnalysisData:', error);
        // Still fire events even if direct call failed
        fireAnalysisEvents();
        return;
      }
    } else {
      console.warn(
        `updateEnhancedAnalysis: populateAnalysisData function not found (attempt ${retryCount + 1}/${maxRetries})`
      );

      if (retryCount < maxRetries - 1) {
        // Retry after a delay
        setTimeout(() => attemptPopulation(retryCount + 1), retryDelay);
      } else {
        // Max retries reached, fire events as fallback
        console.warn('updateEnhancedAnalysis: Max retries reached, using event fallback only');
        fireAnalysisEvents();
      }
    }
  };

  // Initial attempt after DOM ready delay
  setTimeout(() => attemptPopulation(), 100);
};

const showLoading = (): void => {
  const loadingState = document.getElementById('loading-state');
  loadingState?.classList.remove('hidden');
};

const hideLoading = (): void => {
  const loadingState = document.getElementById('loading-state');
  loadingState?.classList.add('hidden');
};

const showAmortizationError = (message: string, form: HTMLFormElement): void => {
  hideLoading();
  document.getElementById('results-container')?.classList.add('hidden');
  document.getElementById('results-section')?.classList.add('hidden');
  handleCalculatorFormError(form, new Error(message));
};

// Initialize amortization calculator
function initializeAmortization() {
  const form = document.getElementById('calculator-form');
  const analyzeBtn = document.getElementById('calculate-btn');

  const setAnalyzing = (isAnalyzing: boolean): void => {
    if (analyzeBtn instanceof HTMLButtonElement) {
      analyzeBtn.disabled = isAnalyzing;
      analyzeBtn.dataset.loading = isAnalyzing ? 'true' : 'false';
      analyzeBtn.classList.toggle('opacity-75', isAnalyzing);
    }
  };

  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearCalculatorFormErrors(form);
      hideError();
      showLoading();
      setAnalyzing(true);

      try {
        const payload = parseAmortizationInput(new FormData(form));
        const data = await postAnalysisRequest<AmortizationAnalysisResult>(
          '/v1/api/analysis/amortization',
          payload
        );

        handleSuccess(data, payload);
        hideError();
      } catch (error) {
        console.error('Amortization calculation error:', error);
        const message =
          error instanceof AnalysisRequestError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Failed to calculate amortization';
        showAmortizationError(message, form);
      } finally {
        hideLoading();
        setAnalyzing(false);
      }
    });
  } else {
    console.error('Amortization form not found');
    return;
  }

  const resetBtn = document.getElementById('reset-btn');

  if (resetBtn instanceof HTMLButtonElement && form instanceof HTMLFormElement) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearCalculatorFormErrors(form);
      hideError();
      const resultsContainer = document.getElementById('results-container');
      const resultsSection = document.getElementById('results-section');
      const chartContainer = document.getElementById('amortization-chart-container');
      const tableContainer = document.getElementById('amortization-table-container');
      const analysisContainer = document.getElementById('comprehensive-analysis-container');
      resultsContainer?.classList.add('hidden');
      resultsSection?.classList.add('hidden');
      chartContainer?.classList.add('hidden');
      tableContainer?.classList.add('hidden');
      analysisContainer?.classList.add('hidden');
      hideError();
      hideLoading();
      const btn = document.getElementById('calculate-btn');
      if (btn instanceof HTMLButtonElement) {
        btn.disabled = false;
        btn.dataset.loading = 'false';
        btn.classList.remove('opacity-75');
      }
    });
  }

  const testAnalysisBtn = document.getElementById('test-analysis-btn');
  const debugLog = document.getElementById('debug-log');

  if (testAnalysisBtn && debugLog) {
    testAnalysisBtn.addEventListener('click', () => {
      debugLog.innerHTML = 'Testing comprehensive analysis...<br>';

      const summary: AmortizationSummary = {
        principal: 300000,
        monthlyPayment: 1520.06,
        totalInterest: 247221.6,
        totalPayments: 547221.6,
        termMonths: 360,
        years: 30,
        annualRate: 0.045,
        interestShare: 247221.6 / 547221.6,
        payoffDate: '2054-01-01',
        totalPMI: 0,
        totalExtraPayments: 0,
        assumedMonthlyIncome: ASSUMED_MONTHLY_INCOME,
        paymentToIncomeRatio: 1520.06 / ASSUMED_MONTHLY_INCOME,
        firstYearInterest: 13450,
        lastYearInterest: 1200,
        interestSaved: 0,
        timeReduced: 0,
      };

      const timeline: AmortizationTimeline = {
        principalTakeoverMonth: 62,
        halfBalanceMonth: 178,
        milestones: [
          {
            id: 'highest-interest-share',
            month: 1,
            label: 'Interest-leaning payment',
            description: 'Interest consumes 71.0% of the payment',
          },
          {
            id: 'principal-takeover',
            month: 62,
            label: 'Principal overtakes interest',
            description: 'Principal outpaces interest for the first time',
          },
          {
            id: 'halfway-balance',
            month: 178,
            label: 'Half of principal repaid',
            description: 'Remaining balance drops below half of the original loan',
          },
          {
            id: 'final-payment',
            month: 360,
            label: 'Loan payoff',
            description: 'Balance reaches zero with the final payment',
          },
        ],
      };

      const mockAnalysis: AmortizationAnalysisBroadcast = {
        summary,
        timeline,
        insights: [
          {
            category: 'financial',
            title: 'Interest Cost Share',
            description: 'Interest totals 45.2% of the overall loan cost.',
            impact: 'medium',
            actionable: true,
          },
          {
            category: 'optimization',
            title: 'Payment-to-Income Check',
            description: 'Monthly payment equals 30.4% of a typical $5,000 income.',
            impact: 'medium',
            actionable: true,
          },
          {
            category: 'opportunity',
            title: 'Equity Momentum',
            description: 'Principal overtakes interest in year 6, boosting equity growth.',
            impact: 'medium',
            actionable: true,
          },
        ],
        recommendations: [
          {
            priority: 'medium',
            category: 'immediate',
            title: 'Validate Affordability',
            description: 'Confirm total housing costs remain under 28% of income.',
            effort: 'low',
          },
          {
            priority: 'medium',
            category: 'short-term',
            title: 'Automate $100 Extra Payments',
            description: 'Extra payments can trim roughly 3 years and save over $35,000.',
            potentialSavings: 35000,
            effort: 'medium',
          },
        ],
        riskAssessment: {
          overallRisk: 'medium',
          factors: [
            {
              factor: 'Payment Burden',
              risk: 'medium',
              description: 'Payment consumes 30.4% of assumed income.',
            },
            {
              factor: 'Interest Cost Exposure',
              risk: 'medium',
              description: 'Interest equals 45.2% of loan cost.',
            },
          ],
        },
        optimizationOpportunities: [
          {
            area: 'Extra Payments',
            currentValue: 0,
            optimizedValue: 100,
            potentialImprovement: 35000,
            description: 'Adding $100 per month accelerates payoff and trims interest.',
          },
          {
            area: 'Bi-weekly Strategy',
            currentValue: 1520.06,
            optimizedValue: 760.03,
            potentialImprovement: 12000,
            description: 'Switch to 26 half-payments each year.',
          },
        ],
        chatHighlights: [
          'Monthly payment $1,520; interest represents 45.2% of total cost.',
          'Principal overtakes interest in month 62.',
          'Balance reaches half of the starting amount by month 178.',
        ],
        chatSummary:
          'Total cost $547,222 with $247,222 in interest (45.2%). Principal outweighs interest after year 5. Payment-to-income ratio sits at 30.4%.',
        context: { totals: summary, timeline },
        principal: summary.principal,
        annualRate: summary.annualRate,
        termMonths: summary.termMonths,
        extraPayment: 0,
        monthlyPayment: summary.monthlyPayment,
        totalInterest: summary.totalInterest,
        totalPayments: summary.totalPayments,
        rawResult: {} as AmortizationAnalysisResult,
      };

      window.populateAnalysisData?.(mockAnalysis);
      window.amortizationAnalysisData = mockAnalysis;

      debugLog.innerHTML += 'Mock analysis populated.<br>';
    });
  }
}

// Call initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAmortization);
} else {
  initializeAmortization();
}

export {};
