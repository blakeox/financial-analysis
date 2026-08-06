import { describe, expect, it } from 'vitest';

import { AmortizationAnalyzer } from '../engines/business/amortization.js';
import { BondPricingAnalyzer } from '../engines/business/bond-pricing.js';
import { BreakEvenAnalyzer } from '../engines/business/break-even.js';
import { CAPMCalculator } from '../engines/business/capm.js';
import { DebtCapacityCalculator } from '../engines/business/debt-capacity.js';
import { DSCRCalculator } from '../engines/business/dscr.js';
import { LeaseAnalyzer } from '../engines/business/lease.js';
import { NPVIRRCalculator } from '../engines/business/npv-irr.js';
import { WACCAnalyzer } from '../engines/business/wacc.js';
import {
  AMORTIZATION_CANONICAL_TEST_VECTORS,
  AMORTIZATION_FORMULA_METADATA,
  BOND_PRICING_CANONICAL_TEST_VECTORS,
  BOND_PRICING_FORMULA_METADATA,
  BREAK_EVEN_CANONICAL_TEST_VECTORS,
  BREAK_EVEN_FORMULA_METADATA,
  CAPM_CANONICAL_TEST_VECTORS,
  CAPM_FORMULA_METADATA,
  DEBT_CAPACITY_CANONICAL_TEST_VECTORS,
  DEBT_CAPACITY_FORMULA_METADATA,
  DSCR_CANONICAL_TEST_VECTORS,
  DSCR_FORMULA_METADATA,
  LEASE_CANONICAL_TEST_VECTORS,
  LEASE_FORMULA_METADATA,
  NPV_IRR_CANONICAL_TEST_VECTORS,
  NPV_IRR_FORMULA_METADATA,
  WACC_CANONICAL_TEST_VECTORS,
  WACC_FORMULA_METADATA,
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

describe('CAPM formula semantics', () => {
  it.each(CAPM_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = CAPMCalculator.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.expectedReturn, expected.expectedReturn)).toBe(true);
  });

  it('attaches version and semantic metadata to every calculator result', () => {
    const result = CAPMCalculator.analyze({
      riskFreeRate: 0.03,
      beta: 1.2,
      marketRiskPremium: 0.05,
    });

    expect(result.formulaVersion).toBe(CAPM_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(CAPM_FORMULA_METADATA);
  });
});

describe('WACC formula semantics', () => {
  it.each(WACC_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = WACCAnalyzer.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.wacc, expected.wacc)).toBe(true);
    expect(withinTolerance(result.equityWeight, expected.equityWeight)).toBe(true);
    expect(withinTolerance(result.debtWeight, expected.debtWeight)).toBe(true);
    expect(withinTolerance(result.afterTaxCostOfDebt, expected.afterTaxCostOfDebt)).toBe(true);
  });

  it('attaches version and semantic metadata to every analyzer result', () => {
    const result = WACCAnalyzer.analyze({
      equityValue: 600000,
      debtValue: 400000,
      costOfEquity: 0.1,
      costOfDebt: 0.06,
      taxRate: 0.25,
    });

    expect(result.formulaVersion).toBe(WACC_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(WACC_FORMULA_METADATA);
  });
});

describe('lease formula semantics', () => {
  it.each(LEASE_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = LeaseAnalyzer.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.monthlyPayment, expected.monthlyPayment)).toBe(true);
    expect(withinTolerance(result.totalPayments, expected.totalPayments)).toBe(true);
    expect(withinTolerance(result.totalInterest, expected.totalInterest)).toBe(true);
    expect(result.schedule).toHaveLength(expected.scheduleLength);
    const finalBalance = result.schedule[result.schedule.length - 1]?.balance ?? Number.NaN;
    expect(withinTolerance(finalBalance, expected.finalBalance)).toBe(true);
  });

  it('attaches version and semantic metadata to every analyzer result', () => {
    const result = LeaseAnalyzer.analyze({
      principal: 30000,
      annualRate: 0.06,
      termMonths: 36,
      residualValue: 12000,
    });

    expect(result.formulaVersion).toBe(LEASE_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(LEASE_FORMULA_METADATA);
  });
});

describe('DSCR formula semantics', () => {
  it.each(DSCR_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = DSCRCalculator.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.ratio, expected.ratio)).toBe(true);
    expect(result.status).toBe(expected.status);
    expect(result.targetRatio).toBe(expected.targetRatio);
    expect(withinTolerance(result.margin, expected.margin)).toBe(true);
    expect(result.breakdown.totalDebtService).toBe(expected.totalDebtService);
  });

  it('attaches version and semantic metadata to every calculator result', () => {
    const result = DSCRCalculator.analyze({
      ebitda: 250000,
      annualDebtService: 150000,
      existingDebtService: 150000,
    });

    expect(result.formulaVersion).toBe(DSCR_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(DSCR_FORMULA_METADATA);
  });
});

describe('bond-pricing formula semantics', () => {
  it.each(BOND_PRICING_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = BondPricingAnalyzer.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.metrics.price, expected.price)).toBe(true);
    expect(withinTolerance(result.metrics.currentYield, expected.currentYield)).toBe(true);
    expect(withinTolerance(result.metrics.macaulayDuration, expected.macaulayDuration)).toBe(true);
    expect(withinTolerance(result.metrics.modifiedDuration, expected.modifiedDuration)).toBe(true);
    expect(result.remainingPayments).toBe(expected.remainingPayments);
    expect(withinTolerance(result.yearsToMaturity, expected.yearsToMaturity)).toBe(true);
  });

  it('attaches version and semantic metadata to every analyzer result', () => {
    const result = BondPricingAnalyzer.analyze({
      bondType: 'corporate',
      faceValue: 1000,
      couponRate: 0.05,
      couponFrequency: 'semi-annual',
      issueDate: '2020-01-01',
      maturityDate: '2030-01-01',
      settlementDate: '2025-01-01',
      yieldToMaturity: 0.06,
      dayCountConvention: 'actual-365',
      taxRate: 0,
      stateTaxRate: 0,
      isTaxExempt: false,
    });

    expect(result.formulaVersion).toBe(BOND_PRICING_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(BOND_PRICING_FORMULA_METADATA);
  });
});

describe('debt-capacity formula semantics', () => {
  it.each(DEBT_CAPACITY_CANONICAL_TEST_VECTORS)('matches canonical vector $id', (vector) => {
    const result = DebtCapacityCalculator.analyze(vector.input);
    const expected = vector.expectedOutput;
    const withinTolerance = (actual: number, target: number) =>
      Math.abs(actual - target) <= vector.tolerance;

    expect(withinTolerance(result.maxLoanAmount, expected.maxLoanAmount)).toBe(true);
    expect(withinTolerance(result.recommendedLoanAmount, expected.recommendedLoanAmount)).toBe(
      true
    );
    expect(withinTolerance(result.monthlyPaymentCapacity, expected.monthlyPaymentCapacity)).toBe(
      true
    );
    expect(
      withinTolerance(result.assumptions.availableForNewDebt, expected.availableForNewDebt)
    ).toBe(true);
    expect(result.assumptions.targetDSCR).toBe(expected.targetDSCR);
  });

  it('attaches version and semantic metadata to every calculator result', () => {
    const result = DebtCapacityCalculator.analyze({
      financials: {
        annualEBITDA: 500000,
        monthlyDebtPayments: 10000,
        expectedEBITDAIncrease: 0,
      },
      loanPreferences: {
        preferredTerm: 5,
        preferredRate: 0.08,
        loanType: 'term-loan',
      },
      requestedAmount: 1000000,
    });

    expect(result.formulaVersion).toBe(DEBT_CAPACITY_FORMULA_METADATA.formulaVersion);
    expect(result.formulaMetadata).toEqual(DEBT_CAPACITY_FORMULA_METADATA);
  });
});
