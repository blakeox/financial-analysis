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
