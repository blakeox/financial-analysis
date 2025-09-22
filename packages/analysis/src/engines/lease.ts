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
    const monthlyRate = annualRate / 12;

    // Standard present value annuity formula for lease payments
    // PV = principal, FV = residualValue
    // PMT = (PV - FV / (1 + r)^n) * r / (1 - (1 + r)^-n)
    // where r = monthlyRate, n = termMonths
    const pv = new Decimal(principal);
    const fv = new Decimal(residualValue);
    const r = new Decimal(monthlyRate);
    const n = new Decimal(termMonths);
    const one = new Decimal(1);
    const denom = one.minus(one.plus(r).pow(n.neg()));
    const discountedFV = fv.div(one.plus(r).pow(n));
    const pmt = pv.minus(discountedFV).times(r).div(denom);
    const monthlyPayment = Number(pmt.toFixed(2));

    const schedule: LeaseAnalysisResult['schedule'] = [];
    let balance = principal;

    for (let month = 1; month <= termMonths; month++) {
      const interest = balance * monthlyRate;
      let principalPayment = monthlyPayment - interest;
      // On last payment, adjust for residual value
      if (month === termMonths) {
        principalPayment = balance - residualValue;
      }
      balance = balance - principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: Number(new Decimal(principalPayment).toFixed(2)),
        interest: Number(new Decimal(interest).toFixed(2)),
        balance: Number(new Decimal(Math.max(0, balance)).toFixed(2)),
      });
    }

    const totalPayments = monthlyPayment * termMonths;
    const totalInterest = totalPayments - (principal - residualValue);

    return {
      monthlyPayment: Number(new Decimal(monthlyPayment).toFixed(2)),
      totalPayments: Number(new Decimal(totalPayments).toFixed(2)),
      totalInterest: Number(new Decimal(totalInterest).toFixed(2)),
      schedule,
    };
  }
}
