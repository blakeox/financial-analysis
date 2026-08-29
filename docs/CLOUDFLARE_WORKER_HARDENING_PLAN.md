# Cloudflare Worker hardening plan

This is the execution plan for the long-term Fanalyx rebuild. Fanalyx is a
financial analysis platform: deterministic formulas are the source of truth,
AI explains and composes approved capabilities, and MCP makes those
capabilities interoperable with ChatGPT, Codex, Claude, local LLMs, and other
MCP clients. It is not a financial-account or custody system.

## Decision

Keep GitHub as the change-control plane, Cloudflare as the runtime and edge
control plane, and the NUC as an optional certified runner for repository-local
or controlled integration checks. Do not make the NUC a production dependency.

Keep the architecture split into four independently deployable boundaries:

1. `packages/analysis` — pure, deterministic financial engines.
2. `workers/mcp` — stateless, read-only, OAuth-protected public MCP.
3. `workers/agent` — first-party agent sessions, workspace state, and memory.
4. `workers/indexer` — asynchronous retrieval/indexing and evidence preparation.

`workers/api` remains the rollback implementation until all legacy deletion
gates are evidenced. No new boundary may gain production traffic merely
because its health endpoint works.

## Execution order

### 1. Foundation

- Keep Wrangler configuration authoritative and generate
  `worker-configuration.d.ts` for each target Worker.
- Run `pnpm run check:worker-types` in CI on every code-bearing change.
- Upgrade compatibility dates only as a tested, pinned compatibility spike.
- Keep preview and production as separate Cloudflare environments, bindings,
  secrets, OAuth metadata, and rollback targets.
- Keep Cloudflare deployment tokens environment-scoped and least-privileged.
  The preview environment secret, not a same-named repository secret, is the
  credential used by `deploy-preview.yml`.
- Treat a missing, stale, or unauthorized credential as a blocked release,
  never as a skipped deployment.

### 2. Core interoperability

- Publish one canonical capability registry from certified formula contracts.
- Map MCP, Agent, Code Mode, and the web API to that registry rather than
  maintaining independent tool catalogs.
- Keep MCP transport state, Agent memory, and indexer evidence separate.
- Require OAuth 2.1 authorization-code flow with S256 PKCE for remote clients.
- Keep Clerk behind the provider-neutral OIDC adapter; Cloudflare OAuth owns
  MCP consent, audience, token lifecycle, revocation, and the MCP kill switch.
- Maintain a documented client matrix and run real acceptance pilots for
  ChatGPT, Codex, Claude, and a local MCP client. Protocol conformance is not
  vendor acceptance.

### 3. AI and Code Mode stabilization

- Route all model calls through the single model-provider seam and optional
  AI Gateway policy; no Worker or formula engine may call a model directly.
- Make AI output advisory: validate numeric claims against deterministic
  results, expose provenance and freshness, and allow abstention when inputs
  are incomplete or contradictory.
- Keep Code Mode disabled by default until an isolated executor has bounded
  CPU, memory, wall-clock, output, cancellation, network, and tool-call
  limits.
- Give generated code only host-provided capability functions. Never expose
  Worker bindings, credentials, unrestricted fetch, raw D1/R2/KV, or Agent
  memory.
- Charge usage against the same reservation ledger used by MCP and Agent
  calls. Any future Cloudflare monetization or x402 path is a payment plane,
  not an authorization or identity plane.

### 4. Hardening and evidence

- Enforce input/output size limits, rate limits, origin policy, and
  non-cacheable protected responses at the edge.
- Emit structured, correlation-bound audit events without prompts, tokens,
  cookies, or raw financial inputs.
- Add adversarial tests for prompt injection, tool confusion, cross-tenant
  access, SSRF/rebinding, output inflation, infinite loops, budget bypass,
  replay, and stale-result presentation.
- Require the release chain: same-SHA CI → preview deploy → boundary receipt
  → OAuth lifecycle receipt → human client acceptance where applicable →
  protected production promotion → live smoke → rollback evidence.
- Keep the old API route available until shadow/dual-run evidence shows
  equivalent behavior and the cutover checklist is approved.

### 5. Optimization

- Add service bindings for internal Worker-to-Worker calls once the contracts
  are stable; do not add public HTTP hops between internal boundaries.
- Move long-running indexing and document work to Queues or Workflows.
- Use D1 for transactional owner/workspace metadata, R2 for documents and
  receipts, Vectorize/AI Search only for optional retrieval, and Durable
  Objects only where ordered state or live session coordination is required.
- Measure capability latency, formula correctness, evidence freshness,
  model cost, blocked requests, and successful client calls before tuning.

## Kill switches

| Surface | Safe disable action | Expected fallback |
| --- | --- | --- |
| Remote MCP | `OAUTH_ENABLED=false` or MCP capability switch | Formula web/API paths remain available; clients receive a truthful denial |
| Model egress | `AI_EGRESS_ENABLED=false` | Deterministic formulas remain available; AI abstains |
| Code Mode | `CODE_MODE_ENABLED=false` | Direct approved capabilities remain available |
| Indexing | Disable queue consumer / indexer route | Existing deterministic analysis remains available; retrieval is marked unavailable |
| New-worker cutover | Remove route/service-binding promotion | Legacy API serves the rollback surface |

Every kill-switch event must emit a bounded audit record, notify the owning
operator, and appear in the `/version`/release receipt without exposing
secrets or user content.

## Failure modes to design against

- Most likely: environment-specific secret or binding drift. Mitigation:
  generated types, environment-scoped secrets, token verification before
  build, and a hard deployment failure.
- Most expensive: an authorized MCP or Code Mode caller reaches another
  owner’s state. Mitigation: issuer/subject-to-internal-owner mapping,
  capability/resource authorization at execution time, opaque namespaces,
  cross-tenant tests, and no raw storage bindings on MCP.
- Silent: the model returns a plausible number that differs from the formula
  engine or uses stale retrieval. Mitigation: result verification, formula
  version, evidence freshness, explicit warnings, and provenance in every
  analysis envelope.

## Success measures

- Leading: generated-type checks, conformance receipts, blocked unauthorized
  calls, budget-denial tests, and fresh client acceptance runs.
- Lagging: formula regression rate, cross-tenant finding rate, MCP successful
  calls by client class, p95 capability latency, AI cost per completed run,
  and rollback time.
- Owner: repository maintainer owns release evidence; capability owners own
  formula correctness; platform owner owns Cloudflare controls; client
  integrators own vendor acceptance.

## Current gate

The repository-side generated Worker type and observability hardening is now
implemented. Preview deployment remains blocked until the GitHub `preview`
environment secret is updated with the existing Cloudflare token by the
authenticated maintainer. After that handoff, run the preview release and
hosted OAuth lifecycle receipt before attempting any production promotion.

## Verification receipt — 2026-08-29

- Candidate `feature/worker-contract-hardening` at SHA
  `1531c4909fcb5b18adbf1eb82d67f56c81e2e1ab` passed the manual NUC `verify`
  lane in [run 33261702492](https://github.com/blakeox/financial-analysis/actions/runs/33261702492).
- NUC runner smoke and availability heartbeat passed. The protected NUC
  certification job was intentionally skipped because this was not the
  dedicated `feature/promote-nuc-*` promotion lane.
- This receipt validates the candidate repository state only. It does not
  prove preview deployment, OAuth lifecycle, external MCP client acceptance,
  or production promotion.
