# Fanalyx trust-boundary and data-lifecycle register

This register is the repository-scoped security contract for the financial
analysis workbench. It maps attacker-controlled inputs, privileged operations,
data classes, owners, and evidence. A boundary is not considered protected
because a caller supplied an ID or because a model selected a tool.

## Boundary register

| Boundary | Untrusted input | Protected assets | Required control | Evidence / owner |
| --- | --- | --- | --- | --- |
| Browser → web Worker | URL, forms, local storage, scripts | UI state, credentials, drafts | CSP, no sensitive identity from local storage, safe cache headers, accessibility/error states | web CI + frontend |
| Web Worker → API Worker | browser request, forwarded headers | API keys, analysis inputs, user data | internal secret header or public API key, origin checks, request IDs, rate limits | API auth tests + operations |
| External MCP client → MCP edge | JSON-RPC, tool name, arguments, protocol headers | formula capabilities, tenant scope, audit records | auth, PKCE/OAuth or API key, schema validation, capability policy, size limits, budget ledger | MCP/OAuth tests + MCP/platform |
| OAuth consent → resource owner | redirect parameters, OIDC claims, consent choice | grant scope and owner identity | issuer/audience/JWKS/nonce validation, CSRF state, explicit consent, opaque owner ID | OAuth tests + identity/platform |
| Agent → workspace/memory | model request, session label, tool result | memory, cases, documents, user state | authenticated owner, resource scope, server policy, independent write kill switch | Agent tests + API/security |
| Agent → retrieval/indexing | query, document text, web content | evidence, embeddings, indexes | source/trust envelope, deletion propagation, prompt-injection isolation, owner scope | retrieval receipts + knowledge/platform |
| Model → capability execution | model-selected tool call, generated arguments | deterministic kernel, connectors, state | server-side reauthorization, schema validation, budgets, approval state, audit | capability policy tests + MCP/platform |
| Code Mode → sandbox/connectors | generated code, URLs, artifacts | secrets, network, CPU, files, downstream systems | sandbox, deny-by-default network, destination allowlist, output bounds, cancellation, connector kill switch | adversarial suite + platform/security |
| Developer console → control plane | API requests, customer/workspace selectors | keys, billing metadata, policy and deployment controls | authenticated admin role, resource ownership, no caller-selected tenant, audit | API/admin tests + operations |
| CI → artifact/deployment | source, dependencies, workflow inputs | release integrity, Cloudflare bindings, secrets | least privilege, pinned actions, secret scanning, provenance, protected environments, receipts | GitHub Actions + release/security |

## Data classes and storage rules

| Data class | Examples | Allowed storage | Retention / deletion rule |
| --- | --- | --- | --- |
| Public | formula metadata, public docs | web assets, AI Search | version with deployment; purge by release policy |
| User input | calculator values, prompts | request scope, explicitly saved analysis | do not log raw values; delete saved artifacts and derivatives |
| Workspace/case | documents, scenarios, memory | owner-scoped D1/R2/KV/Agent state | owner deletion must propagate to caches and indexes |
| Sensitive | credentials, tokens, private financial documents | Worker secret bindings or owner-scoped encrypted storage | never place in prompts, logs, Git, Analytics Engine, or client storage |
| External | fetched pages, connector responses | bounded evidence/cache with source metadata | invalidate on source deletion, TTL, or trust failure |
| Telemetry | IDs, outcomes, sizes, latency, policy versions | bounded D1/Analytics Engine/Workers Logs | pseudonymous, redacted, independently retained from content |

## Invariants

- Deterministic formulas are the canonical source of numeric results; model
  prose is interpretation and cannot authorize a capability or memory write.
- OAuth/API-key principals are derived from verified authentication, never from
  `customerId`, workspace labels, email strings, prompts, or model output.
- Protected responses are `no-store`; credentials are never included in cache
  keys or telemetry.
- Unknown capability, stale policy, missing owner scope, invalid evidence, or
  unavailable stateful control store fails closed. Deterministic formulas may
  use only an explicitly documented degraded mode.
- Each privileged event carries request/run correlation, principal/client
  metadata, capability, resolved resource scope, policy/version, outcome, and
  budget decision without raw prompts, documents, bearer tokens, or API keys.
  MCP audit rows persist this receipt through the additive `0008` migration;
  missing correlation is explicit rather than silently omitted.
- Worker structured logs pass through the shared telemetry redaction boundary
  in `workers/api/src/lib/request-context.ts`; sensitive field names, bearer
  tokens, private-key blocks, oversized strings, and circular metadata are
  removed or bounded before serialization.
- Analytics Engine indexes use a secret-salted pseudonymous fingerprint and an
  IP-presence category; raw client IPs, session/visitor IDs, metadata values,
  and unredacted authentication-failure reasons are not written to Analytics
  Engine. If the analytics salt is absent, client identity points are not
  written rather than collapsing into a shared placeholder.
- Agent Durable Object routes require a verified OIDC/Cloudflare Access owner
  or an authenticated API key in production. The server scopes the client
  thread name with an opaque owner hash before routing, so browser local
  storage is only a resume hint and never an identity or memory boundary. The
  web-to-API proxy credential alone cannot authorize Agent memory. The GUI's
  cross-origin WebSocket is restricted to the configured frontend Origin and
  uses the short-lived API-hosted OIDC session cookie.

## Failure modes and kill switches

- Most likely: a caller changes a resource identifier to another tenant. Mitigate
  by resolving owner scope server-side and testing cross-tenant reads/writes.
- Most expensive: generated code or a connector reaches a private service or
  exfiltrates a credential. Mitigate with sandbox deny-by-default networking,
  destination validation, output DLP, and a connector-wide kill switch.
- Silent: stale retrieval or cached analysis is presented as current. Mitigate
  with content hashes, formula/index versions, freshness envelopes, and cache
  invalidation receipts.

Independent kill switches are `OAUTH_ENABLED`, `AI_EGRESS_ENABLED`,
`MCP_ANALYSIS_ENABLED`, `BUDGET_ENFORCEMENT_ENABLED`, and the future Agent
write, memory retrieval, Code Mode, and connector flags. Disabling an AI or
stateful surface must leave deterministic formula access available where the
request remains stateless and authorized.
