# Analysis deep-link query parameters

This app supports deep-linking to the analysis (amortization) page using URL query parameters. These allow prefilling the form and optionally auto-running the calculation.

- Route: `/analysis` (also aliased at `/amortization`)
- Params:
  - `principal`: number. Loan amount in dollars. Example: `350000`
  - `annualRate`: number. Annual interest rate as percent. Example: `6.25`
  - `termMonths`: integer. Total months. Example: `360`
  - `auto`: `1` or `true` to automatically submit on load; otherwise omit or set `0`/`false`.

Examples

- Prefill only:
  /analysis?principal=350000&annualRate=6.25&termMonths=360

- Prefill and auto-run:
  /analysis?principal=350000&annualRate=6.25&termMonths=360&auto=1

Notes

- The page normalizes inputs and renders `AmortizationResults` via a client-only React island.
- During end-to-end tests, the amortization API endpoint is intercepted and mocked to ensure deterministic results even if the API worker isn’t running.
- The chart exposes a Yearly view and performance/a11y improvements; the Yearly toggle is enabled by default.
