import type { AmortizationEngineInput } from './engines/business/amortization.js';
import type { LeaseEngineInput } from './engines/business/lease.js';
import type { WACCInput } from './engines/business/wacc.js';
import type { BondPricingInput } from './schemas/bond-pricing.js';
import type { BreakEvenInput } from './schemas/break-even.js';
import type { CAPMInput } from './schemas/capm.js';
import type { DebtCapacityInput } from './schemas/debt-capacity.js';
import type { DSCRInput } from './schemas/dscr.js';
import type { NPVIRRInput } from './schemas/npv-irr.js';

export interface FormulaSemanticMetadata {
  formulaId: string;
  formulaVersion: string;
  description: string;
  units: Readonly<Record<string, string>>;
  currency: string;
  rateConvention: string;
  dateBasis: string;
  rounding: Readonly<{
    mode: 'none' | 'half-up' | 'half-even' | 'floor' | 'ceil' | 'truncate';
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

export interface NPVIRRCanonicalOutput {
  npv: number;
  irr: number | null;
  paybackPeriod: number | null;
}

export interface BreakEvenCanonicalOutput {
  breakEvenPossible: boolean;
  contributionMarginPerUnit: number;
  contributionMarginRatio: number;
  breakEvenUnits: number | null;
  breakEvenRevenue: number | null;
}

export interface CAPMCanonicalOutput {
  expectedReturn: number;
}

export interface WACCCanonicalOutput {
  wacc: number;
  equityWeight: number;
  debtWeight: number;
  afterTaxCostOfDebt: number;
}

export interface LeaseCanonicalOutput {
  monthlyPayment: number;
  totalPayments: number;
  totalInterest: number;
  scheduleLength: number;
  finalBalance: number;
}

export interface DSCRCanonicalOutput {
  ratio: number;
  status: 'excellent' | 'good' | 'marginal' | 'poor';
  targetRatio: number;
  margin: number;
  totalDebtService: number;
}

export interface BondPricingCanonicalOutput {
  price: number;
  currentYield: number;
  macaulayDuration: number;
  modifiedDuration: number;
  remainingPayments: number;
  yearsToMaturity: number;
}

export interface DebtCapacityCanonicalOutput {
  maxLoanAmount: number;
  recommendedLoanAmount: number;
  monthlyPaymentCapacity: number;
  availableForNewDebt: number;
  targetDSCR: number;
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

export const NPV_IRR_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.npv-irr',
  formulaVersion: '1.0.0',
  description: 'Calculates net present value, internal rate of return, and simple payback period.',
  units: {
    cashFlows: 'currency units by period',
    discountRate: 'decimal fraction per period',
    npv: 'currency units',
    irr: 'decimal fraction per period',
    paybackPeriod: 'periods',
  },
  currency: 'unspecified by the current input contract',
  rateConvention: 'discount rate and IRR are periodic; no annualization is applied',
  dateBasis: 'equally spaced periods with period zero undiscounted',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    cashFlows: 'at least two finite values',
    discountRate: 'finite and greater than negative one for a finite NPV',
    sensitivityDiscountRates: 'optional finite rates using the same periodic convention',
  },
  exclusions: [
    'Irregular dates and XIRR are not modeled.',
    'Multiple sign changes may produce multiple IRRs; the first detected root is returned.',
    'Currency conversion and foreign-exchange effects are not modeled.',
  ],
  warnings: [
    'NPV and IRR retain calculation precision; presentation-layer rounding is separate.',
    'IRR is null when no root is found in the bounded search interval.',
  ],
};

export const NPV_IRR_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  NPVIRRInput,
  NPVIRRCanonicalOutput
>[] = [
  {
    id: 'npv-irr.three-period-investment',
    formulaId: NPV_IRR_FORMULA_METADATA.formulaId,
    formulaVersion: NPV_IRR_FORMULA_METADATA.formulaVersion,
    description: 'Three-period investment with a negative NPV at a ten-percent discount rate.',
    input: {
      cashFlows: [-1000, 400, 400, 400],
      discountRate: 0.1,
    },
    expectedOutput: {
      npv: -5.259203606311044,
      irr: 0.09701025740327293,
      paybackPeriod: 2.5,
    },
    tolerance: 1e-10,
  },
  {
    id: 'npv-irr.no-recovery',
    formulaId: NPV_IRR_FORMULA_METADATA.formulaId,
    formulaVersion: NPV_IRR_FORMULA_METADATA.formulaVersion,
    description: 'All-negative cash flows have no IRR and no payback period.',
    input: {
      cashFlows: [-1000, -200, -100, -50],
      discountRate: 0.05,
    },
    expectedOutput: {
      npv: -1324.3710182485693,
      irr: null,
      paybackPeriod: null,
    },
    tolerance: 1e-10,
  },
];

export const BREAK_EVEN_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.break-even',
  formulaVersion: '1.0.0',
  description:
    'Calculates contribution margin and the unit and revenue volume required to cover fixed costs and target profit.',
  units: {
    fixedCosts: 'currency units',
    variableCostPerUnit: 'currency units per unit',
    pricePerUnit: 'currency units per unit',
    targetProfit: 'currency units',
    contributionMarginPerUnit: 'currency units per unit',
    contributionMarginRatio: 'decimal fraction of price',
    breakEvenUnits: 'units',
    breakEvenRevenue: 'currency units',
  },
  currency: 'unspecified by the current input contract',
  rateConvention: 'not applicable; break-even is a static cost-volume relationship',
  dateBasis: 'not applicable; results are independent of calendar timing',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    fixedCosts: 'greater than or equal to zero',
    variableCostPerUnit: 'greater than or equal to zero',
    pricePerUnit: 'strictly positive',
    targetProfit: 'greater than or equal to zero',
  },
  exclusions: [
    'Taxes, discounts, inventory, capacity constraints, and multi-product mix are not modeled.',
    'Currency conversion and foreign-exchange effects are not modeled.',
    'Time-varying prices or costs are not modeled.',
  ],
  warnings: [
    'Break-even is impossible when price per unit does not exceed variable cost per unit.',
    'Contribution margin and break-even quantities retain calculation precision; presentation-layer rounding is separate.',
  ],
};

export const BREAK_EVEN_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  BreakEvenInput,
  BreakEvenCanonicalOutput
>[] = [
  {
    id: 'break-even.standard-contribution',
    formulaId: BREAK_EVEN_FORMULA_METADATA.formulaId,
    formulaVersion: BREAK_EVEN_FORMULA_METADATA.formulaVersion,
    description: 'Positive contribution margin covers fixed costs with fractional unit volume.',
    input: {
      fixedCosts: 10000,
      variableCostPerUnit: 20,
      pricePerUnit: 50,
      targetProfit: 0,
    },
    expectedOutput: {
      breakEvenPossible: true,
      contributionMarginPerUnit: 30,
      contributionMarginRatio: 0.6,
      breakEvenUnits: 333.3333333333333,
      breakEvenRevenue: 16666.666666666664,
    },
    tolerance: 1e-10,
  },
  {
    id: 'break-even.impossible-negative-margin',
    formulaId: BREAK_EVEN_FORMULA_METADATA.formulaId,
    formulaVersion: BREAK_EVEN_FORMULA_METADATA.formulaVersion,
    description: 'Price below variable cost makes break-even impossible.',
    input: {
      fixedCosts: 10000,
      variableCostPerUnit: 50,
      pricePerUnit: 40,
      targetProfit: 0,
    },
    expectedOutput: {
      breakEvenPossible: false,
      contributionMarginPerUnit: -10,
      contributionMarginRatio: -0.25,
      breakEvenUnits: null,
      breakEvenRevenue: null,
    },
    tolerance: 1e-10,
  },
];

export const CAPM_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.capm',
  formulaVersion: '1.0.0',
  description:
    'Calculates the Capital Asset Pricing Model expected return from risk-free rate, beta, and market risk premium.',
  units: {
    riskFreeRate: 'decimal fraction per period',
    beta: 'unitless market sensitivity',
    marketRiskPremium: 'decimal fraction per period',
    expectedReturn: 'decimal fraction per period',
  },
  currency: 'not applicable; CAPM returns a rate, not a currency amount',
  rateConvention:
    'risk-free rate, market risk premium, and expected return share the same period basis',
  dateBasis: 'not applicable; CAPM is a single-period rate identity',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    riskFreeRate: 'finite number',
    beta: 'finite number',
    marketRiskPremium: 'finite number',
  },
  exclusions: [
    'Multi-factor models, liquidity premia, and country-risk adjustments are not modeled.',
    'Historical estimation of beta or market premium is outside this calculator.',
  ],
  warnings: [
    'Expected return retains calculation precision; presentation-layer rounding is separate.',
    'Negative beta or risk premium inputs are accepted when finite and produce a deterministic rate.',
  ],
};

export const CAPM_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  CAPMInput,
  CAPMCanonicalOutput
>[] = [
  {
    id: 'capm.standard-levered-equity',
    formulaId: CAPM_FORMULA_METADATA.formulaId,
    formulaVersion: CAPM_FORMULA_METADATA.formulaVersion,
    description: 'Expected return for beta 1.2 with a five-percent market risk premium.',
    input: {
      riskFreeRate: 0.03,
      beta: 1.2,
      marketRiskPremium: 0.05,
    },
    expectedOutput: {
      expectedReturn: 0.09,
    },
    tolerance: 1e-12,
  },
  {
    id: 'capm.zero-beta',
    formulaId: CAPM_FORMULA_METADATA.formulaId,
    formulaVersion: CAPM_FORMULA_METADATA.formulaVersion,
    description: 'Zero beta collapses expected return to the risk-free rate.',
    input: {
      riskFreeRate: 0.04,
      beta: 0,
      marketRiskPremium: 0.06,
    },
    expectedOutput: {
      expectedReturn: 0.04,
    },
    tolerance: 1e-12,
  },
];

export const WACC_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.wacc',
  formulaVersion: '1.0.0',
  description:
    'Calculates the weighted average cost of capital from equity and debt market values, costs, and tax rate.',
  units: {
    equityValue: 'currency units',
    debtValue: 'currency units',
    costOfEquity: 'decimal fraction per period',
    costOfDebt: 'decimal fraction per period',
    taxRate: 'decimal fraction',
    equityWeight: 'decimal fraction of total capital',
    debtWeight: 'decimal fraction of total capital',
    afterTaxCostOfDebt: 'decimal fraction per period',
    wacc: 'decimal fraction per period',
  },
  currency: 'unspecified by the current input contract; equity and debt values share one currency',
  rateConvention:
    'cost of equity, cost of debt, and WACC share the same period basis; tax shield is applied to debt only',
  dateBasis: 'not applicable; WACC is a single-period capital-structure rate',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    equityValue: 'strictly positive',
    debtValue: 'strictly positive',
    costOfEquity: 'zero through one inclusive',
    costOfDebt: 'zero through one inclusive',
    taxRate: 'zero through one inclusive',
  },
  exclusions: [
    'Preferred equity, leases, pensions, and other hybrid capital are not modeled.',
    'Target versus actual capital structure differences are not modeled.',
    'Currency conversion and foreign-exchange effects are not modeled.',
  ],
  warnings: [
    'WACC retains calculation precision; presentation-layer rounding is separate.',
    'Market values are assumed; book values are not adjusted inside this calculator.',
  ],
};

export const WACC_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  WACCInput,
  WACCCanonicalOutput
>[] = [
  {
    id: 'wacc.sixty-forty-capital',
    formulaId: WACC_FORMULA_METADATA.formulaId,
    formulaVersion: WACC_FORMULA_METADATA.formulaVersion,
    description: 'Sixty-forty capital structure with a twenty-five-percent tax shield on debt.',
    input: {
      equityValue: 600000,
      debtValue: 400000,
      costOfEquity: 0.1,
      costOfDebt: 0.06,
      taxRate: 0.25,
    },
    expectedOutput: {
      wacc: 0.078,
      equityWeight: 0.6,
      debtWeight: 0.4,
      afterTaxCostOfDebt: 0.045,
    },
    tolerance: 1e-12,
  },
  {
    id: 'wacc.equal-weights',
    formulaId: WACC_FORMULA_METADATA.formulaId,
    formulaVersion: WACC_FORMULA_METADATA.formulaVersion,
    description: 'Equal equity and debt weights with a twenty-one-percent tax rate.',
    input: {
      equityValue: 500000,
      debtValue: 500000,
      costOfEquity: 0.12,
      costOfDebt: 0.08,
      taxRate: 0.21,
    },
    expectedOutput: {
      wacc: 0.0916,
      equityWeight: 0.5,
      debtWeight: 0.5,
      afterTaxCostOfDebt: 0.0632,
    },
    tolerance: 1e-12,
  },
];

export const LEASE_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.lease',
  formulaVersion: '1.0.0',
  description:
    'Builds a deterministic lease amortization schedule with optional residual value using a present-value annuity payment.',
  units: {
    principal: 'currency units',
    annualRate: 'decimal fraction per year',
    termMonths: 'months',
    residualValue: 'currency units',
    payment: 'currency units per month',
    balance: 'currency units',
  },
  currency: 'unspecified by the current input contract',
  rateConvention: 'nominal annual rate divided by twelve monthly periods',
  dateBasis: 'monthly payment periods; calendar dates are not modeled',
  rounding: {
    mode: 'half-up',
    decimalPlaces: 2,
  },
  validRanges: {
    principal: 'greater than zero',
    annualRate: 'zero through one inclusive',
    termMonths: 'positive integer',
    residualValue: 'greater than or equal to zero',
  },
  exclusions: [
    'Taxes, fees, insurance, mileage caps, and early-termination penalties are not modeled.',
    'Currency conversion and foreign-exchange effects are not modeled.',
    'Payment frequency other than monthly is not modeled.',
  ],
  warnings: [
    'The final payment is adjusted so ending balance equals residual value and may differ from the stated monthly payment.',
    'The current input contract does not identify a currency code.',
  ],
};

export const LEASE_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  LeaseEngineInput,
  LeaseCanonicalOutput
>[] = [
  {
    id: 'lease.residual-36-month-6-percent',
    formulaId: LEASE_FORMULA_METADATA.formulaId,
    formulaVersion: LEASE_FORMULA_METADATA.formulaVersion,
    description: 'Thirty-six-month lease at six percent with a twelve-thousand residual.',
    input: {
      principal: 30000,
      annualRate: 0.06,
      termMonths: 36,
      residualValue: 12000,
    },
    expectedOutput: {
      monthlyPayment: 607.59,
      totalPayments: 21873.43,
      totalInterest: 3873.43,
      scheduleLength: 36,
      finalBalance: 12000,
    },
    tolerance: 0.01,
  },
  {
    id: 'lease.zero-rate-full-amortization',
    formulaId: LEASE_FORMULA_METADATA.formulaId,
    formulaVersion: LEASE_FORMULA_METADATA.formulaVersion,
    description: 'Zero-interest lease with no residual amortizes principal evenly.',
    input: {
      principal: 24000,
      annualRate: 0,
      termMonths: 24,
      residualValue: 0,
    },
    expectedOutput: {
      monthlyPayment: 1000,
      totalPayments: 24000,
      totalInterest: 0,
      scheduleLength: 24,
      finalBalance: 0,
    },
    tolerance: 0.01,
  },
];

export const DSCR_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.dscr',
  formulaVersion: '1.0.0',
  description:
    'Calculates debt service coverage ratio from EBITDA and annual debt service, with fixed interpretive thresholds.',
  units: {
    ebitda: 'currency units per year',
    annualDebtService: 'currency units per year',
    existingDebtService: 'currency units per year (reported in breakdown only)',
    newLoanPayment: 'currency units per month',
    ratio: 'unitless coverage multiple',
    margin: 'unitless distance from the 1.25 target',
    totalDebtService: 'currency units per year',
  },
  currency: 'unspecified by the current input contract; EBITDA and debt service share one currency',
  rateConvention: 'not applicable; DSCR is a coverage ratio, not an interest rate',
  dateBasis:
    'annual cash-flow period; monthly new-loan payments are annualized by multiplying by twelve',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    ebitda: 'finite number',
    annualDebtService: 'greater than or equal to zero',
    existingDebtService: 'greater than or equal to zero',
    newLoanPayment: 'optional; greater than or equal to zero when provided',
  },
  exclusions: [
    'Interest-only, balloon, and irregular amortization schedules are not reconstructed from cash flows.',
    'Lender-specific covenant definitions beyond EBITDA / total debt service are not modeled.',
    'Currency conversion and foreign-exchange effects are not modeled.',
  ],
  warnings: [
    'Ratio uses annualDebtService plus annualized newLoanPayment; existingDebtService is reported in the breakdown only.',
    'When total debt service is zero, the ratio is reported as 999 rather than infinity.',
    'Status labels use fixed thresholds at 1.5, 1.25, and 1.0 and are not jurisdiction-specific.',
  ],
};

export const DSCR_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  DSCRInput,
  DSCRCanonicalOutput
>[] = [
  {
    id: 'dscr.excellent-coverage',
    formulaId: DSCR_FORMULA_METADATA.formulaId,
    formulaVersion: DSCR_FORMULA_METADATA.formulaVersion,
    description: 'EBITDA of 250000 against 150000 debt service yields excellent coverage.',
    input: {
      ebitda: 250000,
      annualDebtService: 150000,
      existingDebtService: 150000,
    },
    expectedOutput: {
      ratio: 1.6666666666666667,
      status: 'excellent',
      targetRatio: 1.25,
      margin: 0.41666666666666674,
      totalDebtService: 150000,
    },
    tolerance: 1e-12,
  },
  {
    id: 'dscr.poor-coverage',
    formulaId: DSCR_FORMULA_METADATA.formulaId,
    formulaVersion: DSCR_FORMULA_METADATA.formulaVersion,
    description: 'EBITDA below debt service yields poor coverage below the 1.0 threshold.',
    input: {
      ebitda: 80000,
      annualDebtService: 120000,
      existingDebtService: 120000,
    },
    expectedOutput: {
      ratio: 0.6666666666666666,
      status: 'poor',
      targetRatio: 1.25,
      margin: -0.5833333333333334,
      totalDebtService: 120000,
    },
    tolerance: 1e-12,
  },
];

export const BOND_PRICING_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.bond-pricing',
  formulaVersion: '1.0.0',
  description:
    'Prices a fixed-coupon bond from yield to maturity using present-value cash flows, duration, and convexity.',
  units: {
    faceValue: 'currency units',
    couponRate: 'decimal fraction per year',
    yieldToMaturity: 'decimal fraction per year',
    price: 'currency units (clean price)',
    currentYield: 'decimal fraction per year',
    macaulayDuration: 'years',
    modifiedDuration: 'years',
    yearsToMaturity: 'years',
    remainingPayments: 'coupon periods',
  },
  currency: 'unspecified by the current input contract',
  rateConvention:
    'coupon rate and yield to maturity are annual nominal rates converted by coupon frequency',
  dateBasis:
    'day-count convention selects year-fraction for maturity; coupon schedule uses calendar increments by frequency',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    faceValue: 'strictly positive',
    couponRate: 'zero through one inclusive',
    yieldToMaturity: 'zero through one inclusive',
    issueDate: 'ISO date string',
    maturityDate: 'ISO date string after issue and settlement',
    settlementDate: 'optional ISO date; defaults to the wall-clock settlement instant when omitted',
  },
  exclusions: [
    'Accrued interest is currently simplified to zero in clean/dirty price calculations.',
    'Callable, putable, floating-rate, and inflation-linked option adjustments are not fully modeled in the core price.',
    'Currency conversion and foreign-exchange effects are not modeled.',
  ],
  warnings: [
    'Canonical vectors must pin settlementDate; omitting it makes years-to-maturity and schedules non-reproducible.',
    'calculationDate is wall-clock metadata and is not part of the certified numeric contract.',
    'Price, duration, and yield retain calculation precision; presentation-layer rounding is separate.',
  ],
};

export const BOND_PRICING_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  BondPricingInput,
  BondPricingCanonicalOutput
>[] = [
  {
    id: 'bond-pricing.discount-semi-annual',
    formulaId: BOND_PRICING_FORMULA_METADATA.formulaId,
    formulaVersion: BOND_PRICING_FORMULA_METADATA.formulaVersion,
    description: 'Five-percent coupon priced at a six-percent YTM trades at a discount.',
    input: {
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
    },
    expectedOutput: {
      price: 961.0694553906042,
      currentYield: 0.05202537623014839,
      macaulayDuration: 4.074992644493586,
      modifiedDuration: 3.956303538343287,
      remainingPayments: 10,
      yearsToMaturity: 5.002739726027397,
    },
    tolerance: 1e-9,
  },
  {
    id: 'bond-pricing.par-semi-annual',
    formulaId: BOND_PRICING_FORMULA_METADATA.formulaId,
    formulaVersion: BOND_PRICING_FORMULA_METADATA.formulaVersion,
    description: 'Coupon equal to YTM prices at par for the pinned settlement window.',
    input: {
      bondType: 'corporate',
      faceValue: 1000,
      couponRate: 0.05,
      couponFrequency: 'semi-annual',
      issueDate: '2020-01-01',
      maturityDate: '2030-01-01',
      settlementDate: '2025-01-01',
      yieldToMaturity: 0.05,
      dayCountConvention: 'actual-365',
      taxRate: 0,
      stateTaxRate: 0,
      isTaxExempt: false,
    },
    expectedOutput: {
      price: 1000,
      currentYield: 0.05,
      macaulayDuration: 4.0850685837381695,
      modifiedDuration: 3.9854327646226047,
      remainingPayments: 10,
      yearsToMaturity: 5.002739726027397,
    },
    tolerance: 1e-9,
  },
];

export const DEBT_CAPACITY_FORMULA_METADATA: FormulaSemanticMetadata = {
  formulaId: 'analysis.debt-capacity',
  formulaVersion: '1.0.0',
  description:
    'Estimates maximum and recommended new loan capacity from EBITDA, existing debt service, target DSCR, rate, and term.',
  units: {
    annualEBITDA: 'currency units per year',
    monthlyDebtPayments: 'currency units per month',
    expectedEBITDAIncrease: 'currency units per year',
    preferredRate: 'decimal fraction per year',
    preferredTerm: 'years',
    maxLoanAmount: 'currency units',
    recommendedLoanAmount: 'currency units',
    monthlyPaymentCapacity: 'currency units per month',
    availableForNewDebt: 'currency units per year',
  },
  currency: 'unspecified by the current input contract',
  rateConvention: 'preferred or market annual nominal rate divided by twelve monthly periods',
  dateBasis: 'loan term in whole years converted to monthly amortization periods',
  rounding: {
    mode: 'none',
    decimalPlaces: 15,
  },
  validRanges: {
    annualEBITDA: 'finite number',
    monthlyDebtPayments: 'greater than or equal to zero',
    expectedEBITDAIncrease: 'finite number; defaults to zero',
    preferredTerm: 'one through thirty years',
    preferredRate: 'optional; zero through 0.2 inclusive when provided',
  },
  exclusions: [
    'Collateral, personal guarantees, covenants beyond the fixed 1.5 DSCR target, and credit-score overlays are not modeled.',
    'Taxes, fees, and origination costs are not deducted from capacity.',
    'Currency conversion and foreign-exchange effects are not modeled.',
  ],
  warnings: [
    'When preferredRate is omitted, a fixed internal market-rate table by loan type is used.',
    'Recommended loan amount is always eighty percent of calculated maximum capacity.',
    'Available-for-new-debt can be negative when existing debt service exceeds 1.5x EBITDA.',
  ],
};

export const DEBT_CAPACITY_CANONICAL_TEST_VECTORS: readonly CanonicalTestVector<
  DebtCapacityInput,
  DebtCapacityCanonicalOutput
>[] = [
  {
    id: 'debt-capacity.term-loan-requested',
    formulaId: DEBT_CAPACITY_FORMULA_METADATA.formulaId,
    formulaVersion: DEBT_CAPACITY_FORMULA_METADATA.formulaVersion,
    description: 'Five-year term loan capacity with an explicit eight-percent preferred rate.',
    input: {
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
    },
    expectedOutput: {
      maxLoanAmount: 2589217.75012037,
      recommendedLoanAmount: 2071374.2000962961,
      monthlyPaymentCapacity: 52500,
      availableForNewDebt: 630000,
      targetDSCR: 1.5,
    },
    tolerance: 1e-9,
  },
  {
    id: 'debt-capacity.mortgage-with-ebitda-growth',
    formulaId: DEBT_CAPACITY_FORMULA_METADATA.formulaId,
    formulaVersion: DEBT_CAPACITY_FORMULA_METADATA.formulaVersion,
    description: 'Ten-year commercial mortgage capacity including expected EBITDA growth.',
    input: {
      financials: {
        annualEBITDA: 200000,
        monthlyDebtPayments: 5000,
        expectedEBITDAIncrease: 50000,
      },
      loanPreferences: {
        preferredTerm: 10,
        preferredRate: 0.07,
        loanType: 'commercial-mortgage',
      },
    },
    expectedOutput: {
      maxLoanAmount: 2260816.7962111626,
      recommendedLoanAmount: 1808653.43696893,
      monthlyPaymentCapacity: 26250,
      availableForNewDebt: 315000,
      targetDSCR: 1.5,
    },
    tolerance: 1e-9,
  },
];
