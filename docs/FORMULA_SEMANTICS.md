# Formula Semantics and Certification

Formula metadata makes units, rate conventions, rounding, valid ranges, exclusions, and warnings part of the deterministic analysis contract. Canonical vectors are executable regression receipts: the same formula version and input must produce the same bounded output.

## Certified slice: amortization

The amortization engine is currently published with formula ID `analysis.amortization` and formula version `1.0.0`.

Its metadata records:

- principal, rate, term, payment, and balance units;
- nominal annual-rate conversion by payment frequency;
- half-up currency rounding to two decimal places;
- valid input ranges and explicit exclusions; and
- the current currency limitation and APR approximation warning.

Two canonical vectors are checked in and executed in `packages/analysis/src/__tests__/formula-semantics.test.ts`: a 30-year, six-percent monthly schedule and a zero-rate five-year schedule. `AmortizationAnalyzer.analyze()` attaches the formula version and metadata to every result it creates.

## Certified slice: NPV/IRR

The NPV/IRR engine is also published with formula ID `analysis.npv-irr` and formula version `1.0.0`. Its contract makes the periodic rate convention, equally spaced periods, bounded IRR search, multiple-root limitation, and separate presentation rounding explicit. Two canonical vectors cover a negative-NPV investment and an unrecovered all-negative cash-flow sequence; `NPVIRRCalculator.analyze()` attaches the same metadata shape to each result.

## Certified slice: break-even

The break-even engine is published with formula ID `analysis.break-even` and formula version `1.0.0`. Its contract records contribution-margin units, the static cost-volume relationship, valid non-negative cost ranges, and the impossible-margin failure mode. Two canonical vectors cover a standard positive-margin case and a negative-margin impossibility; `BreakEvenAnalyzer.analyze()` attaches the same metadata shape to each result.

## Certified slice: CAPM

The CAPM engine is published with formula ID `analysis.capm` and formula version `1.0.0`. Its contract makes the shared period basis for risk-free rate, market risk premium, and expected return explicit, and records that multi-factor and estimation concerns are out of scope. Two canonical vectors cover a levered equity case and a zero-beta collapse to the risk-free rate; `CAPMCalculator.analyze()` attaches the same metadata shape to each result.

## Certified slice: WACC

The WACC engine is published with formula ID `analysis.wacc` and formula version `1.0.0`. Its contract records market-value capital weights, the after-tax debt cost convention, and exclusions for hybrid capital. Two canonical vectors cover a sixty-forty structure and equal weights; `WACCAnalyzer.analyze()` attaches the same metadata shape to each result.

## Remaining certification work

This slice does not claim #449 complete. The remaining work is to apply the same contract to every published formula, add boundary and invalid-input vectors where missing, cross-check high-risk formulas against independent reviewed oracles, and prevent unreviewed formulas from stable publication.
