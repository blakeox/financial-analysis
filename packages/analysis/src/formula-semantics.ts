import type { AmortizationEngineInput } from './engines/business/amortization.js';
import type { WACCInput } from './engines/business/wacc.js';
import type { BreakEvenInput } from './schemas/break-even.js';
import type { CAPMInput } from './schemas/capm.js';
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
