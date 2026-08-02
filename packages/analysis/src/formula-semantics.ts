import type { AmortizationEngineInput } from './engines/business/amortization.js';

export interface FormulaSemanticMetadata {
  formulaId: string;
  formulaVersion: string;
  description: string;
  units: Readonly<Record<string, string>>;
  currency: string;
  rateConvention: string;
  dateBasis: string;
  rounding: Readonly<{
    mode: 'half-up' | 'half-even' | 'floor' | 'ceil' | 'truncate';
    decimalPlaces: number;
  }>;
  validRanges: Readonly<Record<string, string>>;
  exclusions: readonly string[];
  warnings: readonly string[];
}

export interface CanonicalTestVector<TInput, TExpectedOutput> {
  id: string;
  formulaId: string;
  formulaVersion: string;
  description: string;
  input: TInput;
  expectedOutput: TExpectedOutput;
  tolerance: number;
}

export interface AmortizationCanonicalOutput {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  scheduleLength: number;
}

export const AMORTIZATION_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.amortization',
  formulaVersion: '1.0.0',
  description:
    'Builds a deterministic loan amortization schedule with optional payment adjustments.',
  units: {
    principal: 'currency units',
    annualRate: 'decimal fraction per year',
    termMonths: 'months',
    payment: 'currency units per payment period',
    balance: 'currency units',
  },
  currency: 'unspecified by the current input contract',
  rateConvention: 'nominal annual rate divided by payments per year',
  dateBasis: 'payment periods; calendar dates are optional and use calendar increments',
  rounding: {
    mode: 'half-up',
    decimalPlaces: 2,
  },
  validRanges: {
    principal: 'greater than zero',
    annualRate: 'zero through one inclusive',
    termMonths: 'positive integer',
  },
  exclusions: [
    'Currency conversion and foreign-exchange effects are not modeled.',
    'Taxes, insurance, HOA, fees, and PMI are separate optional inputs, not part of principal and interest.',
  ],
  warnings: [
    'The current input contract does not identify a currency code.',
    'APR is an approximation calculated separately from the amortization schedule.',
  ],
};

export const AMORTIZATION_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  AmortizationEngineInput,
  AmortizationCanonicalOutput
>[] = [
  {
    id: 'amortization.standard-30-year-6-percent',
    formulaId: AMORTIZATION_FORMULA_METADATA.formulaId,
    formulaVersion: AMORTIZATION_FORMULA_METADATA.formulaVersion,
    description: 'Standard monthly amortization for a 30-year loan at six percent.',
    input: {
      principal: 100000,
      annualRate: 0.06,
      termMonths: 360,
    },
    expectedOutput: {
      monthlyPayment: 599.55,
      totalPayments: 215838,
      totalInterest: 115838.19,
      scheduleLength: 360,
    },
    tolerance: 0.01,
  },
  {
    id: 'amortization.zero-rate-five-year',
    formulaId: AMORTIZATION_FORMULA_METADATA.formulaId,
    formulaVersion: AMORTIZATION_FORMULA_METADATA.formulaVersion,
    description: 'Zero-interest amortization preserves principal and rounds each payment to cents.',
    input: {
      principal: 50000,
      annualRate: 0,
      termMonths: 60,
    },
    expectedOutput: {
      monthlyPayment: 833.33,
      totalPayments: 49999.8,
      totalInterest: 0,
      scheduleLength: 60,
    },
    tolerance: 0.01,
  },
];
