/**
 * Debt Capacity Calculator
 * Standalone model for calculating business debt capacity
 */

import { Decimal } from 'decimal.js';

import {
  DEBT_CAPACITY_FORMULA_METADATA,
  type FormulaSemanticMetadata,
} from '../../formula-semantics.js';
import type { DebtCapacityInput } from '../../schemas/debt-capacity.js';

export interface DebtCapacityResult {
  // Optional for compatibility with legacy result fixtures; calculator output always supplies these fields.
  formulaVersion?: string;
  formulaMetadata?: FormulaSemanticMetadata;
  maxLoanAmount: number;
  recommendedLoanAmount: number;
  monthlyPaymentCapacity: number;
  debtCapacityRatio?: number | undefined;
  factors: string[];
  assumptions: {
    targetDSCR: number;
    ebitda: number;
    currentDebtService: number;
    availableForNewDebt: number;
  };
}

export class DebtCapacityCalculator {
  private static getMarketRate(loanType: string): number {
    const rates: Record<string, number> = {
      'term-loan': 0.08,
      'line-of-credit': 0.1,
      sba: 0.065,
      'equipment-financing': 0.09,
      'commercial-mortgage': 0.07,
    };
    return rates[loanType] || 0.08;
  }

  static analyze(input: DebtCapacityInput): DebtCapacityResult {
    const ebitda = input.financials.annualEBITDA + input.financials.expectedEBITDAIncrease;
    const currentDebtService = input.financials.monthlyDebtPayments * 12;

    // Conservative approach: DSCR of 1.5x means can service 1.5x current EBITDA
    // After existing debt service
    const availableForNewDebt = ebitda * 1.5 - currentDebtService;

    // Calculate maximum loan based on interest rate and term
    const interestRate =
      input.loanPreferences.preferredRate || this.getMarketRate(input.loanPreferences.loanType);
    const termMonths = input.loanPreferences.preferredTerm * 12;

    // Use amortization formula to work backwards from payment capacity
    const monthlyPaymentCapacity = availableForNewDebt / 12;
    const monthlyRate = interestRate / 12;
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const onePlusRPowN = onePlusR.pow(termMonths);
    const numerator = onePlusRPowN.minus(1);
    const denominator = new Decimal(monthlyRate).times(onePlusRPowN);
    const maxLoanAmount = new Decimal(monthlyPaymentCapacity)
      .times(numerator)
      .div(denominator)
      .toNumber();

    // Recommended amount is 80% of max for safety
    const recommendedLoanAmount = maxLoanAmount * 0.8;

    const factors: string[] = [];
    if (input.requestedAmount) {
      if (maxLoanAmount >= input.requestedAmount) {
        factors.push('Your business can support the requested loan amount');
      } else {
        factors.push(
          `Maximum loan capacity: $${maxLoanAmount.toFixed(0)} (requested: $${input.requestedAmount.toFixed(0)})`
        );
      }
    }

    return {
      formulaVersion: DEBT_CAPACITY_FORMULA_METADATA.formulaVersion,
      formulaMetadata: DEBT_CAPACITY_FORMULA_METADATA,
      maxLoanAmount,
      recommendedLoanAmount,
      monthlyPaymentCapacity,
      debtCapacityRatio: input.requestedAmount ? maxLoanAmount / input.requestedAmount : undefined,
      factors,
      assumptions: {
        targetDSCR: 1.5,
        ebitda,
        currentDebtService,
        availableForNewDebt,
      },
    };
  }
}
