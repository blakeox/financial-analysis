import { describe, expect, it } from 'vitest';

import { AmortizationAnalyzer } from '../engines/business/amortization.js';
import { BreakEvenAnalyzer } from '../engines/business/break-even.js';
import { NPVIRRCalculator } from '../engines/business/npv-irr.js';
import {
  AMORTIZATION_CANONICAL_TEST_VECTORS,
  AMORTIZATION_FORMULA_METADATA,
  BREAK_EVEN_CANONICAL_TEST_VECTORS,
  BREAK_EVEN_FORMULA_METADATA,
  NPV_IRR_CANONICAL_TEST_VECTORS,
  NPV_IRR_FORMULA_METADATA,
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

describe('NPV/IRR formula semantics', () => {
  it.each(NPV_IRR_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = NPVIRRCalculator.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.npv, expected.npv)).toBe(true);
    if (expected.irr === null) {
      expect(result.irr).toBeNull();
    } else {
      expect(result.irr).not.toBeNull();
      expect(withinTolerance(result.irr ?? Number.NaN, expected.irr)).toBe(true);
    }
    expect(result.paybackPeriod).toBe(expected.paybackPeriod);
  });

  it('attaches version and semantic metadata to every calculator result', () => {
    const result = NPVIRRCalculator.analyze({
      cashFlows: [-1000, 400, 400, 400],
      discountRate: 0.1,
    });

    expect(result.formulaVersion).toBe(NPV_IRR_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(NPV_IRR_FORMULA_METADATA);
  });
});

describe('break-even formula semantics', () => {
  it.each(BREAK_EVEN_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = BreakEvenAnalyzer.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(result.breakEvenPossible).toBe(expected.breakEvenPossible);
    expect(
      withinTolerance(result.contributionMarginPerUnit, expected.contributionMarginPerUnit)
    ).toBe(true);
    expect(withinTolerance(result.contributionMarginRatio, expected.contributionMarginRatio)).toBe(
      true
    );
    if (expected.breakEvenUnits === null) {
      expect(result.breakEvenUnits).toBeNull();
    } else {
      expect(result.breakEvenUnits).not.toBeNull();
      expect(withinTolerance(result.breakEvenUnits ?? Number.NaN, expected.breakEvenUnits)).toBe(
        true
      );
    }
    if (expected.breakEvenRevenue === null) {
      expect(result.breakEvenRevenue).toBeNull();
    } else {
      expect(result.breakEvenRevenue).not.toBeNull();
      expect(
        withinTolerance(result.breakEvenRevenue ?? Number.NaN, expected.breakEvenRevenue)
      ).toBe(true);
    }
  });

  it('attaches version and semantic metadata to every analyzer result', () => {
    const result = BreakEvenAnalyzer.analyze({
      fixedCosts: 10000,
      variableCostPerUnit: 20,
      pricePerUnit: 50,
      targetProfit: 0,
    });

    expect(result.formulaVersion).toBe(BREAK_EVEN_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(BREAK_EVEN_FORMULA_METADATA);
  });
});
