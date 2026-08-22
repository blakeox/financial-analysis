# Capability Authorization

Provider-neutral authorization for capability invocations lives in `@financial-analysis/capabilities` (`authorizeCapability`).

## Scopes

| Scope                                             | Purpose                          |
| ------------------------------------------------- | -------------------------------- |
| `financial.calculate`                             | Stateless deterministic analysis |
| `workspace.read` / `workspace.write`              | Explicit workspace state         |
| `memory.search` / `memory.save` / `memory.forget` | Explicit memory capabilities     |

These are not MCP OAuth scopes. Map `analysis:read` ≈ `financial.calculate` in transport adapters.

## Capability manifest contract

Every published capability carries policy metadata in `CapabilitySchema`, not
only formula and schema references:

- `requiredScope` and `resourceScope` define the authorization target;
- `budgetClass` and `approvalRequired` define execution controls;
- `auditEvent` and `killSwitch` define operational accountability; and
- `owner`, lifecycle, input/output limits, and side effects define review and
  runtime boundaries.

The canonical formula registry populates these fields for certified
stateless calculations. Transport-specific manifests may add client metadata,
but they must not weaken or omit the shared contract.

## Guarantees

- Fail closed on missing, mismatched, or revoked grants.
- External MCP cannot access memory without an explicit grant.
- Resource isolation checks user, workspace, and case bindings.
- Decisions never carry secrets or tokens.
- Approval receipts for writes come only from the host, never from model output.

See GitHub #437. Remaining work: Agent/Workers memory persistence with workspace/case columns, and secret-redaction enforcement at model boundaries.

## Transport adapters

MCP OAuth / API-key scope `analysis:read` maps to product scope `financial.calculate` in `packages/tools` (`buildProductGrantsFromMCPScopes` / `authorizeMCPCapability`). Manifest exposure, kill switches, and byte limits remain MCP-local; both gates must allow.

All verified credentials now converge on the strict provider-neutral
`CapabilityAuthorizationContext` in `@financial-analysis/capabilities` before
`authorizeCapability()` runs. The context contains only an opaque principal,
server-resolved grants, client surface, authentication provenance, and an
optional host correlation ID. It deliberately rejects unknown fields so raw
OAuth tokens, API keys, provider claims, and caller-supplied resource identity
cannot cross the policy boundary. API key, generic OIDC/OAuth, and Cloudflare
Access are therefore interchangeable authentication adapters; they do not
change the product authorization contract.

Resource binding is explicit in the policy request. A provider identity never
implicitly grants workspace, case, or memory access.
