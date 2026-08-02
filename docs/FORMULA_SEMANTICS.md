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

## Remaining certification work

This slice does not claim #449 complete. The remaining work is to apply the same contract to every published formula, add boundary and invalid-input vectors where missing, cross-check high-risk formulas against independent reviewed oracles, and prevent unreviewed formulas from stable publication.
