# Capability Registry

The canonical deterministic capability registry publishes only formulas that have completed semantic certification in `@financial-analysis/analysis`.

- `CAPABILITY_REGISTRY` is built from `CERTIFIED_FORMULA_CATALOG`.
- Lifecycle mirrors formula `publicationStatus` (`preview` | `stable` | `deprecated`).
- Stable publication is fail-closed via `assertStableCapabilityPublication()`, which also calls `assertStableFormulaPublication()`.
- This slice covers the 11 certified analysis formulas as `stateless` / `sideEffects: none` capabilities.

Remaining #436 work: inventory non-formula tools, adapter wiring for REST/MCP/Agent/Code Mode, and maturity/sensitivity allowlists beyond the certified kernel.
