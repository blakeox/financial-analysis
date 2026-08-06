# Capability Authorization

Provider-neutral authorization for capability invocations lives in `@financial-analysis/capabilities` (`authorizeCapability`).

## Scopes

| Scope | Purpose |
| --- | --- |
| `financial.calculate` | Stateless deterministic analysis |
| `workspace.read` / `workspace.write` | Explicit workspace state |
| `memory.search` / `memory.save` / `memory.forget` | Explicit memory capabilities |

These are not MCP OAuth scopes. Map `analysis:read` ≈ `financial.calculate` in transport adapters.

## Guarantees

- Fail closed on missing, mismatched, or revoked grants.
- External MCP cannot access memory without an explicit grant.
- Resource isolation checks user, workspace, and case bindings.
- Decisions never carry secrets or tokens.
- Approval receipts for writes come only from the host, never from model output.

See GitHub #437. Remaining work: wire Workers/MCP/Agent adapters and persist workspace/case on memory storage.
