import { Decimal } from 'decimal.js';
import { z } from 'zod';

export interface LeaseAnalysisResult {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  schedule: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

const LeaseInputSchema = z.object({
  principal: z.number().positive(),
  annualRate: z.number().min(0).max(1),
  termMonths: z.number().positive().int(),
  residualValue: z.number().min(0).default(0),
});

export class LeaseAnalyzer {
  static analyze(input: z.infer<typeof LeaseInputSchema>): LeaseAnalysisResult {
    const validated = LeaseInputSchema.parse(input);
    const { principal, annualRate, termMonths, residualValue } = validated;
    const monthlyRate = new Decimal(annualRate).div(12);

    let monthlyPayment: number;

    if (monthlyRate.eq(0)) {
      // Zero interest rate: simple division
      monthlyPayment = Number(new Decimal(principal - residualValue).div(termMonths).toFixed(2));
    } else {
      // Standard present value annuity formula for lease payments
      // PV = principal, FV = residualValue
      // PMT = (PV - FV / (1 + r)^n) * r / (1 - (1 + r)^-n)
      // where r = monthlyRate, n = termMonths
      const pv = new Decimal(principal);
      const fv = new Decimal(residualValue);
      const r = monthlyRate;
      const n = new Decimal(termMonths);
      const one = new Decimal(1);
      const denom = one.minus(one.plus(r).pow(n.neg()));
      const discountedFV = fv.div(one.plus(r).pow(n));
      const pmt = pv.minus(discountedFV).times(r).div(denom);
      monthlyPayment = Number(pmt.toFixed(2));
    }

    const schedule: LeaseAnalysisResult['schedule'] = [];
    let balance = new Decimal(principal);
    const residual = new Decimal(residualValue);
    const monthlyPaymentDecimal = new Decimal(monthlyPayment);
    let totalPayments = new Decimal(0);
    let totalInterest = new Decimal(0);

    for (let month = 1; month <= termMonths; month++) {
      const interest = balance.times(monthlyRate);
      let principalPayment = monthlyPaymentDecimal.minus(interest);
      let payment = monthlyPaymentDecimal;

      // On last payment, adjust to land exactly on residual.
      // This can make the last payment differ slightly due to rounding.
      if (month === termMonths) {
        principalPayment = balance.minus(residual);
        payment = interest.plus(principalPayment);
      }

      balance = balance.minus(principalPayment);

      const paymentRounded = new Decimal(payment.toFixed(2));
      const interestRounded = new Decimal(interest.toFixed(2));
      const principalRounded = new Decimal(principalPayment.toFixed(2));

      totalPayments = totalPayments.plus(paymentRounded);
      totalInterest = totalInterest.plus(interestRounded);

      schedule.push({
        month,
        payment: Number(paymentRounded.toFixed(2)),
        principal: Number(principalRounded.toFixed(2)),
        interest: Number(interestRounded.toFixed(2)),
        balance: Number(Decimal.max(residual, balance).toFixed(2)),
      });
    }

    return {
      monthlyPayment: Number(new Decimal(monthlyPayment).toFixed(2)),
      totalPayments: Number(totalPayments.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      schedule,
    };
  }
}
