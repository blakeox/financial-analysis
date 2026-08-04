# Shared AI/MCP usage budget ledger

The API now contains a provider-neutral D1 reservation contract for expensive
and stateful work. It is designed to be used by REST, MCP, OAuth, Agent, Code
Mode, connector, document, and queue adapters without trusting a caller's
transport or display identity.

## Control contract

1. Derive `principalId`, `clientId`, and optional `workspaceId` from verified
   authentication context. Never derive them from request JSON, a prompt, or a
   caller-controlled header.
2. Reserve the worst-case request before model/tool/connector execution.
3. Reuse the same idempotency key when retrying the same run.
4. Commit actual usage or release the reservation in a `finally` path.
5. Let the hourly scheduled cleanup expire abandoned reservations.

The ledger tracks request bytes, model tokens, estimated cost in integer
micro-dollars, tool calls, connector bytes, document bytes, queue units,
retention bytes, and concurrency. Identities are stored as SHA-256 hashes;
prompts, documents, bearer tokens, API keys, and email addresses are not
stored in the ledger.

Callers may propagate a UUID in `X-Analysis-Run-ID`; otherwise the API derives
the run from `X-Correlation-ID` or the request ID and returns it in the
`X-Analysis-Run-ID` response header. This keeps retries and REST, MCP, Agent,
and connector adapters attributable to one analysis without storing payloads.

## Failure policy

- Model, connector, Code Mode, queue, and other expensive/stateful operations
  must fail closed when D1 is unavailable or a reservation exceeds its limit.
- Deterministic formula execution may use the explicit `deterministic` degraded
  mode, which returns an auditable no-ledger reservation and does not authorize
  model egress.
- An expired reservation is not reusable. A repeated idempotency key returns
  the existing reservation state rather than spending twice.
- `AI_EGRESS_ENABLED=false`, `MCP_ANALYSIS_ENABLED=false`, and future
  connector/Code Mode switches remain independent kill switches.

## Configuration

`workers/api/wrangler.toml` defines bounded per-window defaults for request
bytes, model tokens, estimated cost, tool calls, and reservation TTL. These
values are policy inputs for adapters. `BUDGET_ENFORCEMENT_ENABLED=false` is
the default canary gate; MCP `tools/call`, REST chat/streaming, and Project
Think Agent turn adapters now share the reservation contract, and each must be
explicitly enabled only after its hosted conformance receipt is reviewed.
Preview is the first enabled canary and is checked by the protected
`cloudflare-budget-conformance.yml` workflow. Development and production remain
disabled until promotion evidence is approved.
Adding the ledger tables alone does not silently change existing endpoint
behavior. Each adapter must be migrated and tested before it is marked active.

## Validation and operations

- Migration: `0006_usage_budget_ledger.sql`.
- Contract tests: `workers/api/src/__tests__/usage-budget.test.ts`.
- Hosted contract: `scripts/cloudflare-budget-conformance.mjs` executes one
  deterministic MCP formula call through the deployed reservation and
  commit/release lifecycle without retaining result data.
- The scheduled handler purges expired reservations hourly.
- Operators should monitor reservation denial, degraded deterministic runs,
  model egress, tool failures, and cost burn by run ID and deployment version.
- Rollback: disable the adapter feature flag, keep deterministic formulas
  available where safe, and leave the ledger append-only state intact for
  reconciliation. Do not delete budget rows to recover from a live incident.
