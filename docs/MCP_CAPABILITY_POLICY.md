# MCP Capability Policy

The external MCP surface is a stateless financial-analysis interface. Registration in
`packages/tools` does not automatically publish a capability to remote clients.

## Exposure rules

- Reviewed deterministic formula tools are exposed under `analysis:read`.
- New tools are denied by default until they are added to the explicit capability manifest.
- Every manifest entry carries a formula version, policy version, owner, resource
  scope, budget class, read/mutate declaration, approval flag, and kill-switch key.
- Document retrieval and document writes are not exposed through stateless MCP.
- Interactive model state is not exposed through stateless MCP.
- Administrative cleanup tools are not exposed through stateless MCP.
- Agent memory, Durable Objects, D1, R2, KV, and external tool credentials are not passed to MCP tools.

The executable manifest is [capabilities.ts](../packages/tools/src/mcp/capabilities.ts).

The policy test also asserts that every tool returned by `createMCPTools()` has
an explicit manifest entry. Registering a new tool without a reviewed policy
therefore fails the policy CI lane instead of silently becoming an unreviewed
runtime capability.

`MCP_ANALYSIS_ENABLED=false` is the stateless formula kill switch. It denies
both capability discovery and execution while leaving the deterministic kernel
available for local use and leaving unrelated Agent/model controls separate.

## Enforcement points

The policy is applied independently of model selection at both MCP operations:

1. `tools/list` filters out capabilities that the caller cannot use.
2. `tools/call` rechecks authorization before execution.
3. Input and output byte limits are checked for every exposed capability.
4. The HTTP request body is bounded to 512 KiB before JSON parsing; capability
   limits remain 64 KiB input and 256 KiB output by default.
5. Invalid parameters, unauthorized calls, unknown tools, and oversized
   requests use stable JSON-RPC error codes and preserve the request ID when it
   has been safely parsed.
6. Authorization decisions are persisted to `mcp_audit_events` without raw payloads.

Decision records use a typed state (`allow`, `deny`, `consent-required`,
`approval-required`, `budget-exceeded`, `unavailable`, or `degraded`) plus the
policy version. Every decision also carries the capability name, opaque
principal, resolved resource scope, budget lifecycle state, and host-supplied
audit correlation ID. The correlation ID is never taken from model output; a
missing host correlation is surfaced as an explicit sentinel rather than being
silently omitted. The current stateless formula surface uses only `allow` and
`deny`; the other states are reserved for stateful Agent, connector, and Code
Mode boundaries.

The HTTP MCP endpoint is protected before JSON-RPC dispatch. Anonymous callers
receive an empty capability list and cannot execute a tool; protected responses
are marked `Cache-Control: no-store` and vary on every supported credential
header to prevent edge-cache authorization confusion.

Audit records expire after 90 days by default. The retention window is configured
with `MCP_AUDIT_RETENTION_DAYS`, bounded to 1-3,650 days, and purged by the daily
Worker scheduled task.

## Adding a capability

Before exposing a new tool, record its scope, data classes, input/output limits,
audit event, maturity, and kill-switch behavior in the manifest. Add conformance
tests for discovery, execution, denial, and tenant isolation.

## Current limitation

API keys without explicit metadata currently receive `analysis:read` for backwards
compatibility. Explicit `metadata.mcpScopes` values narrow access to recognized
scopes; fine-grained OAuth consent, tenant-specific grants, and capability
administration remain follow-up work.
