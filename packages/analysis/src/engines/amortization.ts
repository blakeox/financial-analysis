import { Decimal } from 'decimal.js';
import { z } from 'zod';

export interface AmortizationResultItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  date?: string;
  pmi?: number;
  extraPayment?: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationAnalysisResult {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  totalPMI?: number | undefined;
  interestSaved?: number | undefined;
  timeReduced?: number | undefined;
  payoffDate?: string | undefined;
  pmiDropoffMonth?: number | undefined;
  schedule: AmortizationResultItem[];
  // PITI fields
  monthlyPropertyTax?: number | undefined;
  monthlyInsurance?: number | undefined;
  monthlyHOA?: number | undefined;
  totalMonthlyPayment?: number | undefined; // P+I+T+I+HOA
  // APR and Total Cost Summary
  apr?: number | undefined;
  totalCostSummary?:
    | {
        downPayment: number;
        loanAmount: number;
        totalPrincipal: number;
        totalInterest: number;
        totalPMI: number;
        totalTaxes: number;
        totalInsurance: number;
        totalHOA: number;
        closingCosts: number;
        totalCost: number;
        totalPaid: number;
      }
    | undefined;
}

export type AmortizationMilestoneId =
  'highest-interest-share' | 'principal-takeover' | 'halfway-balance' | 'final-payment';

export interface AmortizationMilestone {
  id: AmortizationMilestoneId;
  month: number;
  label: string;
  description: string;
}

export interface AmortizationInsights {
  periods: number;
  totalInterestShare: number;
  highestInterestMonth: { month: number; interestShare: number };
  principalTakeoverMonth: number | null;
  halfBalanceMonth: number | null;
  milestones: AmortizationMilestone[];
}

export interface AmortizationComprehensiveSummary {
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

export interface AmortizationNarrativeInsight {
  category: 'financial' | 'risk' | 'opportunity' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
}

export interface AmortizationNarrativeRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: 'immediate' | 'short-term' | 'long-term';
  title: string;
  description: string;
  potentialSavings?: number;
  effort: 'low' | 'medium' | 'high';
}

export interface AmortizationRiskFactor {
  factor: string;
  risk: 'low' | 'medium' | 'high';
  description: string;
}

export interface AmortizationOptimizationOpportunity {
  area: string;
  currentValue: number;
  optimizedValue: number;
  potentialImprovement: number;
  description: string;
}

export interface AmortizationComprehensiveAnalysis {
  summary: AmortizationComprehensiveSummary;
  timeline: {
    principalTakeoverMonth: number | null;
    halfBalanceMonth: number | null;
    milestones: AmortizationMilestone[];
  };
  insights: AmortizationNarrativeInsight[];
  recommendations: AmortizationNarrativeRecommendation[];
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: AmortizationRiskFactor[];
  };
  optimizationOpportunities: AmortizationOptimizationOpportunity[];
  chatHighlights: string[];
  chatSummary: string;
  context: {
    totals: AmortizationComprehensiveSummary;
    timeline: {
      principalTakeoverMonth: number | null;
      halfBalanceMonth: number | null;
      milestones: AmortizationMilestone[];
    };
  };
}

export type PaymentFrequency = 'monthly' | 'biweekly' | 'weekly';

export interface OneTimePayment {
  month: number;
  amount: number;
}

export const AmortizationInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  startDate: z.string().optional(),
  extraMonthlyPayment: z.number().min(0).optional().default(0),
  oneTimePayments: z
    .array(
      z.object({
        month: z.number().positive().int(),
        amount: z.number().positive(),
      })
    )
    .optional()
    .default([]),
  paymentFrequency: z.enum(['monthly', 'biweekly', 'weekly']).optional().default('monthly'),
  interestOnlyMonths: z.number().min(0).int().optional().default(0),
  balloonPayment: z.number().min(0).optional().default(0),
  origination_fee: z.number().min(0).optional().default(0),
  points: z.number().min(0).optional().default(0),
  pmi: z
    .object({
      enabled: z.boolean().default(false),
      rate: z.number().min(0).max(1).optional().default(0),
      dropOffLTV: z.number().min(0).max(1).optional().default(0.8),
      homeValue: z.number().positive().optional(),
    })
    .optional()
    .default({ enabled: false, rate: 0, dropOffLTV: 0.8 }),
  // PITI fields (Tax & Insurance)
  propertyTaxAnnual: z.number().min(0).optional().default(0),
  homeInsuranceAnnual: z.number().min(0).optional().default(0),
  hoaMonthly: z.number().min(0).optional().default(0),
  // APR calculation inputs
  downPayment: z.number().min(0).optional().default(0),
  closingCosts: z.number().min(0).optional().default(0),
});

/**
 * Calculate APR using Newton-Raphson method (XIRR approximation)
 * APR accounts for all upfront costs and compares to the actual loan amount received
 */
function calculateAPR(
  loanAmount: number,
  monthlyPayment: number,
  termMonths: number,
  upfrontCosts: number
): number {
  // Net amount received by borrower (loan - upfront costs)
  const netProceeds = loanAmount - upfrontCosts;

  if (netProceeds <= 0 || monthlyPayment <= 0 || termMonths <= 0) {
    return 0;
  }

  // Use Newton-Raphson to solve for monthly rate where NPV = 0
  let rate = 0.005; // Initial guess (6% annual = 0.5% monthly)
  const maxIterations = 100;
  const tolerance = 0.0001;

  for (let i = 0; i < maxIterations; i++) {
    // NPV = -netProceeds + sum of discounted payments
    let npv = -netProceeds;
    let derivative = 0;

    for (let month = 1; month <= termMonths; month++) {
      const discount = Math.pow(1 + rate, -month);
      npv += monthlyPayment * discount;
      derivative -= (month * monthlyPayment * discount) / (1 + rate);
    }

    const newRate = rate - npv / derivative;

    if (Math.abs(newRate - rate) < tolerance) {
      rate = newRate;
      break;
    }

    rate = newRate;
  }

  // Convert monthly rate to annual APR
  return rate * 12;
}

export class AmortizationAnalyzer {
  static analyze(input: z.infer<typeof AmortizationInputSchema>): AmortizationAnalysisResult {
    const parsed = AmortizationInputSchema.parse(input);
    const {
      principal,
      annualRate,
      termMonths,
      startDate,
      extraMonthlyPayment = 0,
      oneTimePayments = [],
      paymentFrequency = 'monthly',
      interestOnlyMonths = 0,
      balloonPayment = 0,
      origination_fee = 0,
      points = 0,
      pmi = { enabled: false, rate: 0, dropOffLTV: 0.8 },
    } = parsed;

    const adjustedPrincipal = principal + origination_fee + (principal * points) / 100;

    const paymentsPerYear =
      paymentFrequency === 'weekly' ? 52 : paymentFrequency === 'biweekly' ? 26 : 12;
    const periodRate = annualRate / paymentsPerYear;

    const amortizingMonths = Math.max(0, termMonths - interestOnlyMonths);
    let basePayment: number;

    if (periodRate === 0) {
      basePayment = adjustedPrincipal / (amortizingMonths * (12 / paymentsPerYear));
    } else {
      const r = new Decimal(periodRate);
      const onePlusR = new Decimal(1).plus(r);
      const amortizingPeriods = Math.ceil(amortizingMonths * (12 / paymentsPerYear));
      const numerator = new Decimal(adjustedPrincipal).times(r);
      const denominator = new Decimal(1).minus(onePlusR.pow(-amortizingPeriods));
      basePayment = numerator.div(denominator).toNumber();
    }

    const schedule: AmortizationResultItem[] = [];
    let balance = new Decimal(adjustedPrincipal);
    let cumulativeInterest = new Decimal(0);
    let cumulativePrincipal = new Decimal(0);
    let totalPMI = new Decimal(0);
    let pmiDropoffMonth: number | null = null;

    const oneTimePaymentMap = new Map<number, number>();
    oneTimePayments.forEach((payment) => {
      const existing = oneTimePaymentMap.get(payment.month) || 0;
      oneTimePaymentMap.set(payment.month, existing + payment.amount);
    });

    const homeValue = pmi.homeValue || principal;

    for (let month = 1; month <= termMonths; month++) {
      let monthlyPayment = basePayment;
      let interestPayment = balance.times(periodRate * (12 / paymentsPerYear));
      let principalPayment = new Decimal(0);
      let pmiPayment = new Decimal(0);
      let extraPayment = new Decimal(extraMonthlyPayment);

      const oneTimeExtra = oneTimePaymentMap.get(month) || 0;
      extraPayment = extraPayment.plus(oneTimeExtra);

      if (month <= interestOnlyMonths) {
        monthlyPayment = interestPayment.toNumber();
        principalPayment = new Decimal(0);
      } else {
        principalPayment = new Decimal(monthlyPayment).minus(interestPayment);
        principalPayment = principalPayment.plus(extraPayment);
      }

      if (pmi.enabled && !pmiDropoffMonth) {
        const currentLTV = balance.div(homeValue).toNumber();
        if (currentLTV > pmi.dropOffLTV) {
          pmiPayment = new Decimal(principal).times(pmi.rate / 12);
        } else if (!pmiDropoffMonth) {
          pmiDropoffMonth = month;
        }
      }

      if (
        balance.lessThanOrEqualTo(principalPayment) &&
        !(month === termMonths && balloonPayment > 0)
      ) {
        principalPayment = balance;
      } else if (month === termMonths) {
        if (balloonPayment > 0) {
          principalPayment = new Decimal(balloonPayment);
          balance = new Decimal(0);
        } else {
          principalPayment = balance;
        }
      }

      const totalPayment = interestPayment.plus(principalPayment).plus(pmiPayment);
      balance = balance.minus(principalPayment);
      if (month === termMonths && balloonPayment > 0) {
        balance = new Decimal(0);
      }

      cumulativeInterest = cumulativeInterest.plus(interestPayment);
      cumulativePrincipal = cumulativePrincipal.plus(principalPayment);
      totalPMI = totalPMI.plus(pmiPayment);

      let paymentDate: string | undefined;
      if (startDate) {
        const date = new Date(startDate);
        if (paymentFrequency === 'weekly') {
          date.setDate(date.getDate() + (month - 1) * 7);
        } else if (paymentFrequency === 'biweekly') {
          date.setDate(date.getDate() + (month - 1) * 14);
        } else {
          // Default to standard monthly cadence for both explicit monthly
          // schedules and any unexpected frequency values.
          date.setMonth(date.getMonth() + month - 1);
        }
        paymentDate = date.toISOString().split('T')[0];
      }

      const scheduleItem: AmortizationResultItem = {
        month,
        payment: Number(totalPayment.toDecimalPlaces(2)),
        principal: Number(principalPayment.toDecimalPlaces(2)),
        interest: Number(interestPayment.toDecimalPlaces(2)),
        balance: Number(balance.toDecimalPlaces(2)),
        cumulativeInterest: Number(cumulativeInterest.toDecimalPlaces(2)),
        cumulativePrincipal: Number(cumulativePrincipal.toDecimalPlaces(2)),
      };

      if (paymentDate) scheduleItem.date = paymentDate;
      if (pmi.enabled) scheduleItem.pmi = Number(pmiPayment.toDecimalPlaces(2));
      if (extraPayment.greaterThan(0))
        scheduleItem.extraPayment = Number(extraPayment.toDecimalPlaces(2));

      schedule.push(scheduleItem);

      if (balance.lessThanOrEqualTo(0) && !(balloonPayment > 0 && month < termMonths)) {
        break;
      }
    }

    const actualPayments = schedule.reduce((sum, item) => sum + item.payment, 0);
    const totalInterestPaid = Number(cumulativeInterest.toDecimalPlaces(2));

    const standardResult = this.calculateStandardAmortization(
      adjustedPrincipal,
      annualRate,
      termMonths
    );
    const interestSaved = Math.max(0, standardResult.totalInterest - totalInterestPaid);
    const timeReduced = Math.max(0, termMonths - schedule.length);

    let payoffDate: string | undefined;
    if (startDate && schedule.length > 0) {
      const lastPayment = schedule[schedule.length - 1];
      if (lastPayment && lastPayment.date) {
        payoffDate = lastPayment.date;
      }
    }

    // Calculate PITI components
    const monthlyPropertyTax = parsed.propertyTaxAnnual / 12;
    const monthlyInsurance = parsed.homeInsuranceAnnual / 12;
    const monthlyHOA = parsed.hoaMonthly;
    const totalMonthlyPayment = basePayment + monthlyPropertyTax + monthlyInsurance + monthlyHOA;

    // Calculate APR (includes all upfront costs)
    const upfrontCosts = origination_fee + (principal * points) / 100 + parsed.closingCosts;
    const apr = calculateAPR(principal, basePayment, schedule.length, upfrontCosts);

    // Calculate Total Cost Summary
    const totalTaxes = monthlyPropertyTax * schedule.length;
    const totalInsurance = monthlyInsurance * schedule.length;
    const totalHOA = monthlyHOA * schedule.length;
    const totalPMINum = Number(totalPMI.toDecimalPlaces(2));

    const totalCostSummary = {
      downPayment: parsed.downPayment,
      loanAmount: principal,
      totalPrincipal: Number(cumulativePrincipal.toDecimalPlaces(2)),
      totalInterest: totalInterestPaid,
      totalPMI: totalPMINum,
      totalTaxes: Number(new Decimal(totalTaxes).toDecimalPlaces(2)),
      totalInsurance: Number(new Decimal(totalInsurance).toDecimalPlaces(2)),
      totalHOA: Number(new Decimal(totalHOA).toDecimalPlaces(2)),
      closingCosts: upfrontCosts,
      totalCost: Number(
        new Decimal(
          parsed.downPayment +
            upfrontCosts +
            actualPayments +
            totalTaxes +
            totalInsurance +
            totalHOA
        ).toDecimalPlaces(2)
      ),
      totalPaid: Number(
        new Decimal(actualPayments + totalTaxes + totalInsurance + totalHOA).toDecimalPlaces(2)
      ),
    };

    return {
      monthlyPayment: Number(new Decimal(basePayment).toDecimalPlaces(2)),
      totalPayments: Number(new Decimal(actualPayments).toDecimalPlaces(2)),
      totalInterest: totalInterestPaid,
      totalPMI: pmi.enabled ? totalPMINum : undefined,
      interestSaved: interestSaved > 0 ? interestSaved : undefined,
      timeReduced: timeReduced > 0 ? timeReduced : undefined,
      payoffDate,
      pmiDropoffMonth: pmiDropoffMonth || undefined,
      schedule,
      // PITI fields
      monthlyPropertyTax:
        monthlyPropertyTax > 0
          ? Number(new Decimal(monthlyPropertyTax).toDecimalPlaces(2))
          : undefined,
      monthlyInsurance:
        monthlyInsurance > 0 ? Number(new Decimal(monthlyInsurance).toDecimalPlaces(2)) : undefined,
      monthlyHOA: monthlyHOA > 0 ? Number(new Decimal(monthlyHOA).toDecimalPlaces(2)) : undefined,
      totalMonthlyPayment:
        monthlyPropertyTax > 0 || monthlyInsurance > 0 || monthlyHOA > 0
          ? Number(new Decimal(totalMonthlyPayment).toDecimalPlaces(2))
          : undefined,
      // APR and Total Cost Summary
      apr: upfrontCosts > 0 ? Number(new Decimal(apr).toDecimalPlaces(6)) : undefined,
      totalCostSummary:
        parsed.downPayment > 0 ||
        upfrontCosts > 0 ||
        totalTaxes > 0 ||
        totalInsurance > 0 ||
        totalHOA > 0
          ? totalCostSummary
          : undefined,
    };
  }

  private static calculateStandardAmortization(
    principal: number,
    annualRate: number,
    termMonths: number
  ) {
    const monthlyRate = annualRate / 12;
    let monthlyPayment: number;

    if (monthlyRate === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      const r = new Decimal(monthlyRate);
      const onePlusR = new Decimal(1).plus(r);
      const numerator = new Decimal(principal).times(r);
      const denominator = new Decimal(1).minus(onePlusR.pow(-termMonths));
      monthlyPayment = numerator.div(denominator).toNumber();
    }

    let balance = new Decimal(principal);
    let totalInterest = new Decimal(0);

    for (let month = 1; month <= termMonths; month++) {
      const interestPayment = balance.times(monthlyRate);
      let principalPayment = new Decimal(monthlyPayment).minus(interestPayment);

      if (month === termMonths) {
        principalPayment = balance;
      }

      balance = balance.minus(principalPayment);
      totalInterest = totalInterest.plus(interestPayment);
    }

    return {
      monthlyPayment: Number(new Decimal(monthlyPayment).toDecimalPlaces(2)),
      totalInterest: Number(totalInterest.toDecimalPlaces(2)),
    };
  }
}

export function computeAmortizationInsights(
  result: AmortizationAnalysisResult
): AmortizationInsights {
  const periods = result.schedule.length;
  if (periods === 0) {
    return {
      periods: 0,
      totalInterestShare: 0,
      highestInterestMonth: { month: 0, interestShare: 0 },
      principalTakeoverMonth: null,
      halfBalanceMonth: null,
      milestones: [],
    };
  }

  const first = result.schedule[0]!;

  const totalPaymentsDec = new Decimal(result.totalPayments);
  const totalInterestDec = new Decimal(result.totalInterest);
  const totalInterestShare = totalPaymentsDec.equals(0)
    ? 0
    : totalInterestDec.div(totalPaymentsDec).toNumber();

  let highestInterestMonth = {
    month: first.month,
    interestShare: 0,
  };
  let principalTakeoverMonth: number | null = null;

  const startingBalance = new Decimal(first.balance).plus(first.principal);
  let halfBalanceMonth: number | null = null;

  result.schedule.forEach((item) => {
    const paymentDec = new Decimal(item.payment);
    const interestDec = new Decimal(item.interest);
    const principalDec = new Decimal(item.principal);

    const interestShare = paymentDec.equals(0) ? 0 : interestDec.div(paymentDec).toNumber();
    if (interestShare > highestInterestMonth.interestShare) {
      highestInterestMonth = { month: item.month, interestShare };
    }

    if (principalTakeoverMonth === null && principalDec.greaterThanOrEqualTo(interestDec)) {
      principalTakeoverMonth = item.month;
    }

    if (
      halfBalanceMonth === null &&
      startingBalance.greaterThan(0) &&
      new Decimal(item.balance).lessThanOrEqualTo(startingBalance.div(2))
    ) {
      halfBalanceMonth = item.month;
    }
  });

  const milestones: AmortizationMilestone[] = [];
  milestones.push({
    id: 'highest-interest-share',
    month: highestInterestMonth.month,
    label: 'Interest-leaning payment',
    description: `Interest consumes ${(highestInterestMonth.interestShare * 100).toFixed(1)}% of the payment`,
  });

  if (principalTakeoverMonth !== null) {
    milestones.push({
      id: 'principal-takeover',
      month: principalTakeoverMonth,
      label: 'Principal overtakes interest',
      description: 'Principal outpaces interest for the first time',
    });
  }

  if (halfBalanceMonth !== null) {
    milestones.push({
      id: 'halfway-balance',
      month: halfBalanceMonth,
      label: 'Half of principal repaid',
      description: 'Remaining balance drops below half of the original loan',
    });
  }

  const finalMonth = result.schedule[periods - 1]?.month ?? periods;
  milestones.push({
    id: 'final-payment',
    month: finalMonth,
    label: 'Loan payoff',
    description: 'Balance reaches zero with the final payment',
  });

  const uniqueMilestones = milestones.reduce<AmortizationMilestone[]>((acc, milestone) => {
    const existingIndex = acc.findIndex((item) => item.id === milestone.id);
    if (existingIndex === -1) {
      acc.push(milestone);
    } else {
      acc[existingIndex] = milestone;
    }
    return acc;
  }, []);

  uniqueMilestones.sort((a, b) => a.month - b.month);

  return {
    periods,
    totalInterestShare,
    highestInterestMonth,
    principalTakeoverMonth,
    halfBalanceMonth,
    milestones: uniqueMilestones,
  };
}

type NarrativeOptions = {
  assumedMonthlyIncome?: number;
};

const clampNumber = (value: number, fallback = 0): number =>
  Number.isFinite(value) ? value : fallback;

const safeRound = (value: number, digits = 2): number => clampNumber(Number(value.toFixed(digits)));

const amortizationPrincipalFromSchedule = (schedule: AmortizationResultItem[]): number => {
  if (!schedule.length) return 0;
  const first = schedule[0];
  if (!first) return 0;
  const extra = clampNumber(first.extraPayment ?? 0);
  return clampNumber(first.balance + first.principal + extra);
};

const sumBy = <T>(items: T[], selector: (item: T) => number): number =>
  items.reduce((sum, item) => sum + clampNumber(selector(item)), 0);

const calculatePaymentToIncomeRatio = (
  monthlyPayment: number,
  assumedMonthlyIncome: number
): number => {
  if (!assumedMonthlyIncome || assumedMonthlyIncome <= 0) return 0;
  return monthlyPayment / assumedMonthlyIncome;
};

const calcExtraPaymentSavings = (
  principal: number,
  annualRate: number,
  termMonths: number,
  monthlyPayment: number,
  extra: number
): { savings: number; monthsSaved: number } => {
  if (!principal || !annualRate || !termMonths || extra <= 0) {
    return { savings: 0, monthsSaved: 0 };
  }

  const monthlyRate = annualRate / 12;
  const newPayment = monthlyPayment + extra;
  if (newPayment <= 0) {
    return { savings: 0, monthsSaved: 0 };
  }

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

  return { savings: safeRound(savings), monthsSaved: Math.round(monthsSaved) };
};

const calcRateReductionSavings = (
  principal: number,
  annualRate: number,
  termMonths: number,
  reductionFraction: number
): number => {
  if (!principal || !annualRate || !termMonths || reductionFraction <= 0) return 0;
  const originalMonthly = calculateMonthlyPayment(principal, annualRate, termMonths);
  const reducedRate = Math.max(annualRate - reductionFraction, 0);
  const reducedMonthly = calculateMonthlyPayment(principal, reducedRate, termMonths);
  const originalTotal = originalMonthly * termMonths;
  const reducedTotal = reducedMonthly * termMonths;
  return safeRound(Math.max(0, originalTotal - reducedTotal));
};

const calculateMonthlyPayment = (principal: number, annualRate: number, termMonths: number) => {
  if (principal <= 0 || termMonths <= 0) return 0;
  const monthlyRate = annualRate / 12;
  if (monthlyRate === 0) return principal / termMonths;
  const factor = Math.pow(1 + monthlyRate, termMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
};

export function buildAmortizationComprehensiveAnalysis(
  result: AmortizationAnalysisResult,
  options: NarrativeOptions = {}
): AmortizationComprehensiveAnalysis {
  const schedule = result.schedule ?? [];
  const assumedMonthlyIncome = options.assumedMonthlyIncome ?? 5000;
  const principal = clampNumber(amortizationPrincipalFromSchedule(schedule));
  const monthlyPayment = clampNumber(result.monthlyPayment);
  const totalInterest = clampNumber(result.totalInterest);
  const totalPayments = clampNumber(result.totalPayments);
  const effectiveTermMonths =
    schedule.length ||
    clampNumber(monthlyPayment > 0 ? Math.round(totalPayments / monthlyPayment) : 0);
  const years = effectiveTermMonths / 12;
  const annualRate = clampNumber(schedule.length ? estimateAnnualRate(schedule, principal) : 0);
  const totalPMI =
    clampNumber(result.totalPMI ?? 0) ||
    safeRound(sumBy(schedule, (item) => clampNumber(item.pmi ?? 0)));
  const totalExtraPayments = safeRound(
    sumBy(schedule, (item) => clampNumber(item.extraPayment ?? 0))
  );
  const paymentToIncomeRatio = calculatePaymentToIncomeRatio(monthlyPayment, assumedMonthlyIncome);

  const firstYearInterest = safeRound(
    sumBy(schedule.slice(0, 12), (item) => clampNumber(item.interest))
  );
  const lastYearInterest = safeRound(
    sumBy(schedule.slice(-12), (item) => clampNumber(item.interest))
  );

  const insights = computeAmortizationInsights(result);

  const summary: AmortizationComprehensiveSummary = {
    principal,
    monthlyPayment,
    totalInterest,
    totalPayments,
    termMonths: effectiveTermMonths,
    years,
    annualRate,
    interestShare: totalPayments > 0 ? totalInterest / totalPayments : 0,
    totalPMI,
    totalExtraPayments,
    assumedMonthlyIncome,
    paymentToIncomeRatio,
    firstYearInterest,
    lastYearInterest,
    interestSaved: clampNumber(result.interestSaved ?? 0),
    timeReduced: clampNumber(result.timeReduced ?? 0),
  };
  if (result.payoffDate) {
    summary.payoffDate = result.payoffDate;
  }

  const narrativeInsights: AmortizationNarrativeInsight[] = [
    {
      category: 'financial',
      title: 'Interest Cost Share',
      description: totalPayments
        ? `Interest totals ${safeRound(summary.interestShare * 100, 1)}% of the ${formatCurrency(
            totalPayments
          )} paid over the term.`
        : 'Interest share unavailable because total payments were not provided.',
      impact:
        summary.interestShare > 0.5 ? 'high' : summary.interestShare > 0.35 ? 'medium' : 'low',
      actionable: true,
    },
    {
      category: 'optimization',
      title: 'Payment-to-Income Check',
      description: assumedMonthlyIncome
        ? `Monthly payment of ${formatCurrency(
            monthlyPayment
          )} equals ${safeRound(paymentToIncomeRatio * 100, 1)}% of a ${formatCurrency(
            assumedMonthlyIncome
          )} income (28% benchmark).`
        : 'Unable to evaluate payment-to-income ratio without an income assumption.',
      impact: paymentToIncomeRatio > 0.3 ? 'high' : paymentToIncomeRatio > 0.2 ? 'medium' : 'low',
      actionable: true,
    },
    {
      category: 'opportunity',
      title: 'Principal Momentum',
      description:
        insights.principalTakeoverMonth != null
          ? `Principal overtakes interest in month ${insights.principalTakeoverMonth}, building equity faster thereafter.`
          : 'Principal never overtakes interest within this schedule.',
      impact: 'medium',
      actionable: true,
    },
    {
      category: 'financial',
      title: 'Balance Halfway Point',
      description:
        insights.halfBalanceMonth != null
          ? `Balance falls below half of the original loan in month ${insights.halfBalanceMonth}.`
          : 'Halfway balance milestone not reached within the modeled term.',
      impact: 'low',
      actionable: false,
    },
    ...(totalExtraPayments > 0
      ? [
          {
            category: 'optimization' as const,
            title: 'Extra Payment Impact',
            description: `Scheduled extra payments total ${formatCurrency(
              totalExtraPayments
            )} and accelerate payoff.`,
            impact: 'medium' as const,
            actionable: true,
          },
        ]
      : []),
  ];

  const { savings: savings100, monthsSaved: savings100Months } = calcExtraPaymentSavings(
    principal,
    annualRate,
    effectiveTermMonths,
    monthlyPayment,
    100
  );
  const { savings: savings250 } = calcExtraPaymentSavings(
    principal,
    annualRate,
    effectiveTermMonths,
    monthlyPayment,
    250
  );
  const refinanceSavings = calcRateReductionSavings(
    principal,
    annualRate,
    effectiveTermMonths,
    0.005
  );

  const narrativeRecommendations: AmortizationNarrativeRecommendation[] = [
    {
      priority: paymentToIncomeRatio > 0.3 ? 'high' : 'medium',
      category: 'immediate',
      title: 'Validate Affordability',
      description: `Aim to keep housing costs below 28% of income; current ratio is ${safeRound(
        paymentToIncomeRatio * 100,
        1
      )}%.`,
      effort: 'low',
    },
    {
      priority: savings100 > 0 ? 'high' : 'medium',
      category: 'short-term',
      title: 'Automate $100 Extra Payments',
      description:
        savings100 > 0
          ? `Adding $100 per month could save ${formatCurrency(
              savings100
            )} and trim about ${Math.round(savings100Months / 12)} years.`
          : 'Extra payments accelerate payoff; confirm savings with your lender.',
      potentialSavings: savings100,
      effort: 'medium',
    },
    {
      priority: savings250 > savings100 ? 'medium' : 'low',
      category: 'short-term',
      title: 'Explore $250 Extra Scenario',
      description:
        savings250 > savings100
          ? `A $250 monthly boost improves savings to ${formatCurrency(savings250)}.`
          : 'Larger extra payments yield compounding interest reductions.',
      potentialSavings: savings250,
      effort: 'high',
    },
    {
      priority: 'medium',
      category: 'short-term',
      title: 'Consider Bi-weekly Payments',
      description:
        'Twenty-six half-payments per year generate an extra payment that reduces interest and term.',
      potentialSavings: safeRound(monthlyPayment * 0.5 * 12 * 0.1),
      effort: 'low',
    },
    {
      priority: refinanceSavings > 0 ? 'medium' : 'low',
      category: 'long-term',
      title: 'Monitor Refinance Opportunities',
      description:
        refinanceSavings > 0
          ? `Dropping the rate by 0.5% could save ${formatCurrency(refinanceSavings)}.`
          : 'Track market rates; refinancing can lower payments and interest.',
      potentialSavings: refinanceSavings,
      effort: 'medium',
    },
    ...(totalPMI > 0 && result.pmiDropoffMonth
      ? [
          {
            priority: 'medium' as const,
            category: 'short-term' as const,
            title: 'Plan for PMI Removal',
            description: `PMI adds ${formatCurrency(
              totalPMI
            )}. Verify loan-to-value near month ${result.pmiDropoffMonth} to request removal.`,
            effort: 'low' as const,
          },
        ]
      : []),
  ];

  const riskFactors: AmortizationRiskFactor[] = [
    {
      factor: 'Payment Burden',
      risk: paymentToIncomeRatio > 0.3 ? 'high' : paymentToIncomeRatio > 0.2 ? 'medium' : 'low',
      description: `Payment represents ${safeRound(paymentToIncomeRatio * 100, 1)}% of assumed income.`,
    },
    {
      factor: 'Interest Rate Level',
      risk: summary.annualRate > 0.07 ? 'high' : summary.annualRate > 0.05 ? 'medium' : 'low',
      description: `Current rate of ${safeRound(summary.annualRate * 100, 2)}%.`,
    },
    {
      factor: 'Interest Cost Exposure',
      risk: summary.interestShare > 0.5 ? 'high' : summary.interestShare > 0.35 ? 'medium' : 'low',
      description: `Interest equals ${safeRound(summary.interestShare * 100, 1)}% of loan cost.`,
    },
    {
      factor: 'Term Length',
      risk: summary.termMonths > 360 ? 'high' : summary.termMonths > 240 ? 'medium' : 'low',
      description: `${safeRound(summary.termMonths / 12, 1)}-year commitment.`,
    },
  ];

  const riskAssessment = {
    overallRisk: ((): 'low' | 'medium' | 'high' => {
      const hasHigh = riskFactors.some((factor) => factor.risk === 'high');
      if (hasHigh) return 'high';
      const hasMedium = riskFactors.some((factor) => factor.risk === 'medium');
      if (hasMedium) return 'medium';
      return 'low';
    })(),
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
      currentValue: summary.annualRate,
      optimizedValue: Math.max(summary.annualRate - 0.005, 0),
      potentialImprovement: refinanceSavings,
      description: 'Track rate dips of 0.5% or more to refinance efficiently.',
    },
  ];

  const chatHighlights = [
    `Monthly payment ${formatCurrency(monthlyPayment)}; interest equals ${safeRound(
      summary.interestShare * 100,
      1
    )}% of total cost.`,
    insights.principalTakeoverMonth
      ? `Principal overtakes interest in month ${insights.principalTakeoverMonth}.`
      : 'Interest remains higher than principal for the full term.',
    insights.halfBalanceMonth
      ? `Balance reaches half of the starting amount by month ${insights.halfBalanceMonth}.`
      : 'Loan never reaches half balance under current schedule.',
    totalExtraPayments > 0
      ? `Extra payments sum to ${formatCurrency(totalExtraPayments)} so far.`
      : 'No extra payments scheduled yet—adding them cuts interest significantly.',
  ];

  const chatSummary = [
    `Total payments: ${formatCurrency(totalPayments)} with ${formatCurrency(
      totalInterest
    )} in interest (${safeRound(summary.interestShare * 100, 1)}%).`,
    insights.principalTakeoverMonth
      ? `Principal outweighs interest after month ${insights.principalTakeoverMonth}.`
      : 'Interest never drops below the principal portion in this schedule.',
    paymentToIncomeRatio
      ? `Payment-to-income ratio stands at ${safeRound(
          paymentToIncomeRatio * 100,
          1
        )}% versus the 28% affordability guideline.`
      : '',
    totalExtraPayments > 0
      ? `Scheduled extra payments total ${formatCurrency(
          totalExtraPayments
        )}; keeping them up accelerates payoff.`
      : 'Consider bi-weekly or extra payments to shorten the term and save interest.',
  ]
    .filter(Boolean)
    .join(' ');

  return {
    summary,
    timeline: {
      principalTakeoverMonth: insights.principalTakeoverMonth,
      halfBalanceMonth: insights.halfBalanceMonth,
      milestones: insights.milestones,
    },
    insights: narrativeInsights,
    recommendations: narrativeRecommendations,
    riskAssessment,
    optimizationOpportunities,
    chatHighlights,
    chatSummary,
    context: {
      totals: summary,
      timeline: {
        principalTakeoverMonth: insights.principalTakeoverMonth,
        halfBalanceMonth: insights.halfBalanceMonth,
        milestones: insights.milestones,
      },
    },
  };
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(clampNumber(value));

const estimateAnnualRate = (schedule: AmortizationResultItem[], principal: number): number => {
  if (!schedule.length || principal <= 0) return 0;
  const first = schedule[0];
  if (!first) return 0;
  const interestPortion = clampNumber(first.interest);
  const balanceStart = principal;
  if (balanceStart <= 0) return 0;
  const monthlyRate = interestPortion / balanceStart;
  if (!Number.isFinite(monthlyRate) || monthlyRate <= 0) return 0;
  return monthlyRate * 12;
};
