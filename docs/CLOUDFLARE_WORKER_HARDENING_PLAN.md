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

### Deployment authority

Use Cloudflare Workers Builds as the long-term deployment authority for each
Worker connected to this GitHub repository. GitHub Actions remains the change,
test, NUC-verification, and evidence plane; it should not require a long-lived
Cloudflare API token merely to deploy a preview. This removes the current
environment-secret precedence failure and keeps deployment authorization in
Cloudflare's Git integration.

For this monorepo, configure one Workers Builds project per deployable Worker
with an explicit root directory, build command, deploy command, compatibility
configuration, bindings, and environment mapping. Use `wrangler versions
upload` for preview where the Worker supports version previews and
`wrangler deploy` only for the approved production path. Durable Object-backed
Workers require an explicit preview strategy because Cloudflare does not
provide the same preview-URL behavior for those Workers.

Migration is gated: prove a Cloudflare-managed preview build, matching commit
receipt, binding/environment isolation, rollback, and GitHub status reporting
before removing `deploy-preview.yml` or its token. Until that evidence exists,
the existing workflow remains the rollback path. Its deployment secret is no
longer the steady-state preview dependency, but must remain valid for an
intentional rollback deployment.

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
- Prefer Workers Builds Git integration for the steady-state deployment path;
  keep GitHub Actions deployment only as a temporary migration fallback.
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
implemented. Cloudflare Workers Builds is connected for the two active preview
surfaces:

- `fanalyx-api-preview` → `blakeox/financial-analysis`, root `/workers/api`.
- `fanalyx-web-preview` → `blakeox/financial-analysis`, root `/workers/web`.

Both connections use `main` as the production branch, enable non-production
preview builds, and pass `${WORKERS_CI_COMMIT_SHA}` into preview deploy/version
commands. The existing `fanalyx build token` selection was not rotated. The
Cloudflare UI reports that the token is missing unrelated permissions; that
warning is recorded and must be resolved before relying on managed builds if a
build fails because of it.

The next gate is a legitimate repository push that produces a Cloudflare
managed build for both preview surfaces. Capture the exact SHA, build result,
binding/environment isolation, hosted boundary smoke, OAuth lifecycle receipt,
and rollback evidence before removing `deploy-preview.yml` or its token. No
production promotion is authorized by this connection alone.

## Managed preview build receipt — 2026-08-29

- Candidate SHA `acf6523f9b2acaae04408e96bd1e636f12754521` produced a passing
  Cloudflare managed build for `fanalyx-api-preview`:
  `78bc9707-6d4f-4cf4-84ed-3c0a52f81b18`.
- The same SHA produced a passing managed build for `fanalyx-web-preview`:
  `0f700599-35e1-4fff-8ec8-73e10df66c0c`.
- The web receipt confirms that the ordered workspace build now includes
  `analysis → capabilities → ui` before the Astro bundle consumes `tools`.
- These receipts prove preview build/deploy execution only. They do not prove
  hosted OAuth, external MCP client acceptance, production bindings, or
  rollback execution.

## NUC verification receipt — 2026-08-29

- Exact SHA `8cf60028f5fa07713be43f65840c6517d7a91fd5` passed the manual NUC
  smoke/verification run [33279218472](https://github.com/blakeox/financial-analysis/actions/runs/33279218472).
- The certified runner was `automation-nuc-financial-analysis`; checkout,
  runner identity/capacity, repository validation, and bounded `test:ci`
  completed successfully.
- The hosted NUC availability heartbeat passed for the same run.
- `NUC / certified` remains a separate promotion-branch gate and was not
  claimed by this feature-branch verification.

## Verification receipt — 2026-08-29

- Candidate `feature/worker-contract-hardening` at SHA
  `3328df1d34fb012de84bd154876e90f100a1d387` passed the manual NUC `verify`
  lane in [run 33265242821](https://github.com/blakeox/financial-analysis/actions/runs/33265242821).
- NUC runner smoke and availability heartbeat passed. The protected NUC
  certification job was intentionally skipped because this was not the
  dedicated `feature/promote-nuc-*` promotion lane.
- This receipt validates the candidate repository state only. It does not
  prove preview deployment, OAuth lifecycle, external MCP client acceptance,
  or production promotion.
