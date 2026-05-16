import { Decimal } from 'decimal.js';

import type { P2PLendingInput } from '../schemas/p2p-lending.js';

export interface P2PLendingResult {
  expectedEndingValue: number;
  expectedTotalReturn: number;
  expectedAnnualizedReturn: number | null;
  expectedLoss: number;
  expectedInterest: number;
  assumptions: P2PLendingInput;
}

export class P2PLendingAnalyzer {
  static analyze(input: P2PLendingInput): P2PLendingResult {
    const expectedLoss = new Decimal(input.principal)
      .times(input.defaultProbability)
      .times(new Decimal(1).minus(input.recoveryRate))
      .toNumber();

    const expectedInterest = new Decimal(input.principal)
      .times(input.annualInterestRate)
      .times(input.termYears)
      .times(new Decimal(1).minus(input.defaultProbability))
      .toNumber();

    const netInterest = new Decimal(expectedInterest)
      .times(new Decimal(1).minus(input.feeRate))
      .toNumber();
    const expectedEndingValue = new Decimal(input.principal)
      .plus(netInterest)
      .minus(expectedLoss)
      .toNumber();
    const expectedTotalReturn = new Decimal(expectedEndingValue)
      .div(input.principal)
      .minus(1)
      .toNumber();

    const expectedAnnualizedReturn =
      input.termYears > 0 ? Math.pow(1 + expectedTotalReturn, 1 / input.termYears) - 1 : null;

    return {
      expectedEndingValue,
      expectedTotalReturn,
      expectedAnnualizedReturn,
      expectedLoss,
      expectedInterest,
      assumptions: input,
    };
  }
}
