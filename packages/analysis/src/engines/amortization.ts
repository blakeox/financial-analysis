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
}

export type AmortizationMilestoneId =
  | 'highest-interest-share'
  | 'principal-takeover'
  | 'halfway-balance'
  | 'final-payment';

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
});

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
        if (paymentFrequency === 'monthly') {
          date.setMonth(date.getMonth() + month - 1);
        } else if (paymentFrequency === 'biweekly') {
          date.setDate(date.getDate() + (month - 1) * 14);
        } else if (paymentFrequency === 'weekly') {
          date.setDate(date.getDate() + (month - 1) * 7);
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

    return {
      monthlyPayment: Number(new Decimal(basePayment).toDecimalPlaces(2)),
      totalPayments: Number(new Decimal(actualPayments).toDecimalPlaces(2)),
      totalInterest: totalInterestPaid,
      totalPMI: pmi.enabled ? Number(totalPMI.toDecimalPlaces(2)) : undefined,
      interestSaved: interestSaved > 0 ? interestSaved : undefined,
      timeReduced: timeReduced > 0 ? timeReduced : undefined,
      payoffDate,
      pmiDropoffMonth: pmiDropoffMonth || undefined,
      schedule,
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
