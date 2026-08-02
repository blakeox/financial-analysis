import { describe, expect, it } from 'vitest';

import { AmortizationAnalyzer } from '../engines/business/amortization.js';
import {
  AMORTIZATION_CANONICAL_TEST_VECTORS,
  AMORTIZATION_FORMULA_METADATA,
} from '../formula-semantics.js';

describe('amortization formula semantics', () => {
  it.each(AMORTIZATION_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = AmortizationAnalyzer.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.monthlyPayment, expected.monthlyPayment)).toBe(true);
    expect(withinTolerance(result.totalPayments, expected.totalPayments)).toBe(true);
    expect(withinTolerance(result.totalInterest, expected.totalInterest)).toBe(true);
    expect(result.schedule).toHaveLength(expected.scheduleLength);
  });

  it('attaches version and semantic metadata to every analyzer result', () => {
    const result = AmortizationAnalyzer.analyze({
      principal: 100000,
      annualRate: 0.06,
      termMonths: 12,
    });

    expect(result.formulaVersion).toBe(AMORTIZATION_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(AMORTIZATION_FORMULA_METADATA);
  });
});
