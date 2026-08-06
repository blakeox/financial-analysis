# Financial Analysis Product Boundary

This repository provides deterministic financial analysis, scenarios, evidence, and explanations. It is not a financial system of record.

## Explicit non-goals

The product does not own or execute banking, custody, payments, money movement, authoritative transaction ledgers, or account balances. A calculation result is an analysis artifact, not a transaction instruction or regulated financial advice.

## Contract boundary

The provider-neutral contracts in `@financial-analysis/capabilities` are the interchange boundary for the deterministic kernel and future REST, MCP, Agent, and Code Mode adapters.

Every `AnalysisResult` carries:

- the contract, capability, and formula versions;
- canonical inputs, assumptions, precision, and currency when applicable;
- deterministic outputs and validation warnings;
- evidence references and an analysis-run identifier; and
- the scenario that produced the result.

`Answer` is explanatory content linked to an analysis run. `Answer.isCanonicalResult` is always `false`, so prose cannot replace or silently mutate the deterministic result.

## Data classifications

| Classification | Meaning | Default external-client access |
| --- | --- | --- |
| `public` | Public reference or published model data | Allowed when the capability permits it |
| `user` | Input or preference belonging to one user | Explicit request scope only |
| `workspace` | Shared state owned by a workspace | Denied to stateless calls |
| `case` | Scoped analysis or document context | Denied to stateless calls |
| `sensitive` | Data requiring additional protection or approval | Denied by default |
| `external` | Data supplied by an external system | Capability-specific and provenance-bound |

Adapters must not infer authorization from a data classification. Authorization is a separate server-side control-plane concern implemented by `authorizeCapability()` in `@financial-analysis/capabilities`.

## Authorization

Product scopes are dotted identifiers (`financial.calculate`, `workspace.read`, `workspace.write`, `memory.search`, `memory.save`, `memory.forget`). They are distinct from MCP OAuth scopes such as `analysis:read`; transport adapters own that mapping.

`authorizeCapability()` is fail-closed:

- decisions require a server-resolved grant snapshot (no ambient Agent memory);
- memory scopes are denied to `external-mcp` clients unless an explicit active grant binds the same user/workspace/case resource;
- cross-workspace and revoked grants deny;
- write and external-action paths may return `approval-required` until the host supplies an approval receipt;
- decision payloads never include secrets or tokens.

## Execution state

Capabilities declare one execution scope:

- `stateless`: inputs are self-contained and no Agent, workspace, or case state is carried;
- `user`: the request is bound to an authenticated principal;
- `workspace`: the request can use explicitly authorized workspace state; or
- `case`: the request can use explicitly authorized case state.

The schema rejects state on stateless requests and rejects scoped requests without a principal. This prevents the first adapter from accidentally making Agent memory ambient.

## Lifecycle and reversibility

Capabilities are `preview`, `stable`, or `deprecated`. Formula and capability versions use `MAJOR.MINOR.PATCH` values. Deprecation must preserve prior result interpretation; removing or changing a version is a migration decision, not an incidental refactor.

The contract package is reversible: adapters can adopt it behind compatibility shims while the existing API remains in place. Changing a published contract or formula version is hard to reverse and requires compatibility vectors, migration notes, and an explicit rollback path before exposure expands.
