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

    // Calculate monthly payment using lease formula
    const depreciation = (principal - residualValue) / termMonths;
    const financeCharge = (principal + residualValue) * monthlyRate;
    const monthlyPayment = depreciation + financeCharge;

  const schedule: LeaseAnalysisResult['schedule'] = [];
    let balance = principal;

    for (let month = 1; month <= termMonths; month++) {
      const interest = balance * monthlyRate;
      const principalPayment = monthlyPayment - interest;
      balance = balance - principalPayment;

      schedule.push({
        month,
        payment: Number(new Decimal(monthlyPayment).toFixed(2)),
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
