import { Decimal } from 'decimal.js';
import { z } from 'zod';

export interface AmortizationResultItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface AmortizationAnalysisResult {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
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

// Local schema specific to amortization; residual value is not used
export const AmortizationInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
});

export class AmortizationAnalyzer {
  static analyze(input: z.infer<typeof AmortizationInputSchema>): AmortizationAnalysisResult {
    const { principal, annualRate, termMonths } = AmortizationInputSchema.parse(input);

    const monthlyRate = annualRate / 12;

    // Payment formula with zero-rate guard
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

    const schedule: AmortizationAnalysisResult['schedule'] = [];
    let balance = new Decimal(principal);

    for (let month = 1; month <= termMonths; month++) {
      const interestDec = balance.times(monthlyRate);
      let principalPaymentDec = new Decimal(monthlyPayment).minus(interestDec);

      // Adjust the final payment to avoid negative rounding residue
      if (month === termMonths) {
        principalPaymentDec = balance;
      }

      balance = balance.minus(principalPaymentDec);

      const payment = new Decimal(monthlyPayment).toDecimalPlaces(2);
      const principalPaid = principalPaymentDec.toDecimalPlaces(2);
      const interestPaid = interestDec.toDecimalPlaces(2);
      const remaining = Decimal.max(new Decimal(0), balance).toDecimalPlaces(2);

      schedule.push({
        month,
        payment: Number(payment),
        principal: Number(principalPaid),
        interest: Number(interestPaid),
        balance: Number(remaining),
      });
    }

    const totalPayments = schedule.reduce((sum, i) => sum + i.payment, 0);
    const totalInterest = schedule.reduce((sum, i) => sum + i.interest, 0);

    return {
      monthlyPayment: Number(new Decimal(monthlyPayment).toDecimalPlaces(2)),
      totalPayments: Number(new Decimal(totalPayments).toDecimalPlaces(2)),
      totalInterest: Number(new Decimal(totalInterest).toDecimalPlaces(2)),
      schedule,
    };
  }
}

export function computeAmortizationInsights(result: AmortizationAnalysisResult): AmortizationInsights {
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
