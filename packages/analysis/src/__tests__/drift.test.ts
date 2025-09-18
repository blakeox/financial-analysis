import { AmortizationAnalyzer, LeaseAnalyzer } from '@financial-analysis/analysis';
import { describe, expect, it } from 'vitest';
import amortFixture from './fixtures/amortization.basic.json';
import leaseFixture from './fixtures/lease.basic.json';

interface LeaseInput {
  principal: number;
  annualRate: number;
  termMonths: number;
  residualValue: number;
}
interface LeaseExpected {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
}
interface AmortInput {
  principal: number;
  annualRate: number;
  termMonths: number;
}
interface AmortExpected {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
}
interface Fixture<TInput, TExpected> {
  input: TInput;
  expected: TExpected;
}

// Relative or absolute epsilon comparator
function close(actual: number, expected: number, epsilon = 1e-2) {
  return Math.abs(actual - expected) <= epsilon;
}

describe('deterministic drift guard', () => {
  it('lease basic fixture stable', () => {
    const { input, expected } = leaseFixture as Fixture<LeaseInput, LeaseExpected>;
    const result = LeaseAnalyzer.analyze(input);
    expect(close(result.monthlyPayment, expected.monthlyPayment, 0.5)).toBe(true);
    expect(close(result.totalPayments, expected.totalPayments, 0.5)).toBe(true);
    expect(close(result.totalInterest, expected.totalInterest, 0.5)).toBe(true);
  });

  it('amortization basic fixture stable', () => {
    const { input, expected } = amortFixture as Fixture<AmortInput, AmortExpected>;
    const result = AmortizationAnalyzer.analyze(input);
    expect(close(result.monthlyPayment, expected.monthlyPayment, 0.05)).toBe(true);
    expect(close(result.totalPayments, expected.totalPayments, 0.5)).toBe(true);
    expect(close(result.totalInterest, expected.totalInterest, 0.5)).toBe(true);
  });
});
