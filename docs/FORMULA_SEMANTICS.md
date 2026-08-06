# Formula Semantics and Certification

Formula metadata makes units, rate conventions, rounding, valid ranges, exclusions, warnings, and publication status part of the deterministic analysis contract. Canonical vectors are executable regression receipts: the same formula version and input must produce the same bounded output.

Publication status is explicit on every certified entry:

- `stable` — semantic metadata and canonical vectors exist; eligible for stable MCP/Agent publication
- `preview` — reviewed enough for limited exposure, not yet stable
- `deprecated` — retained for reproducibility of prior results; must not silently replace a stable formula

`CERTIFIED_FORMULA_CATALOG`, `isStableFormulaPublication()`, and `assertStableFormulaPublication()` gate stable publication. Unreviewed formulas are absent from the catalog and fail closed.

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

## Certified slice: lease

The lease engine is published with formula ID `analysis.lease` and formula version `1.0.0`. Its contract records residual-value present-value annuity payments, monthly nominal-rate conversion, half-up currency rounding, and the final-payment residual adjustment. Two canonical vectors cover a residual lease and a zero-rate full amortization; `LeaseAnalyzer.analyze()` attaches the same metadata shape to each result.

## Certified slice: DSCR

The DSCR engine is published with formula ID `analysis.dscr` and formula version `1.0.0`. Its contract makes the EBITDA / total-debt-service ratio, fixed status thresholds, zero-debt-service sentinel, and the existingDebtService breakdown-only behavior explicit. Two canonical vectors cover excellent and poor coverage; `DSCRCalculator.analyze()` attaches the same metadata shape to each result.

## Certified slice: bond pricing

The bond-pricing engine is published with formula ID `analysis.bond-pricing` and formula version `1.0.0`. Its contract records annual nominal coupon/YTM conventions, day-count maturity fractions, UTC coupon-schedule arithmetic for timezone-reproducible pinned settlements, and the simplified zero accrued-interest limitation. Two canonical vectors cover discount and par semi-annual corporates; `BondPricingAnalyzer.analyze()` attaches the same metadata shape to each result.

## Certified slice: debt capacity

The debt-capacity engine is published with formula ID `analysis.debt-capacity` and formula version `1.0.0`. Its contract records the fixed 1.5 DSCR capacity rule, monthly amortization inversion, eighty-percent recommendation haircut, and optional internal market-rate table. Two canonical vectors cover an explicit-rate term loan and a mortgage with EBITDA growth; `DebtCapacityCalculator.analyze()` attaches the same metadata shape to each result.

## Certified slice: unit economics

The unit-economics engine is published with formula ID `analysis.unit-economics` and formula version `1.0.0`. Its contract records CAC, discounted LTV, contribution-margin payback, churn-based lifespan, and the zero-churn lifespan fallback. Two canonical vectors cover a standard SaaS cohort and a zero-churn lifespan fallback; `UnitEconomicsEngine.analyze()` attaches the same metadata shape to each result.

## Certified slice: financial ratios

The financial-ratio engine is published with formula ID `analysis.financial-ratio` and formula version `1.0.0`. Its contract records the certified summary ratios (current, quick, ROE, ROA, debt-to-equity), percent-scaled ROE/ROA, and optional analysis-flag blocks outside the core numeric contract. Two canonical vectors cover healthy and tight-liquidity statements; `FinancialRatioAnalyzer.analyze()` attaches the same metadata shape to each result.

## Remaining certification work

This slice does not claim #449 complete. Eleven formulas are certified and gated as `stable` in `CERTIFIED_FORMULA_CATALOG`. The remaining work is to apply the same contract to every other published formula, add boundary and invalid-input vectors where missing, cross-check high-risk formulas against independent reviewed oracles, and wire MCP/Agent adapters to `assertStableFormulaPublication()` before expanding the stable catalog.
