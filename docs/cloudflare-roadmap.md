# Cloudflare Integration Roadmap

This roadmap outlines phased improvements to deepen our integration with Cloudflare across reliability, security, scalability, observability, and cost controls.

Status legend: (✅ done) (🟡 in progress) (🔜 next) (🧪 experiment) (📝 docs) (🧩 optional)

## AI, MCP, and public identity foundation (🟡 in progress)

The long-term architecture is a Cloudflare-native financial analysis platform:

- Deterministic formula engines remain the source of truth.
- The public MCP surface is stateless, read-only, and capability allowlisted.
- Agent memory remains an internal product feature and is never implicitly
  exposed through MCP.
- (🟡) First-party Agent routes now require a verified owner/API-key principal
  in production and scope Durable Object names with an opaque owner hash;
  browser local storage remains only a thread-resume hint. GUI/API login
  plumbing is implemented; hosted sign-in and Agent conformance remain open
  until the Clerk/OIDC gate is completed.
- (✅) OIDC and Cloudflare Access owner adapters derive stable issuer-bound
  SHA-256 fingerprints; provider subjects, email claims, and issuer hosts are
  not copied into Agent namespaces, OAuth grant props, or audit receipts.
- Cloudflare's maintained OAuth provider owns MCP authorization, token storage,
  consent, revocation, and the kill switch.
- Clerk is the recommended public OIDC identity provider for resource-owner
  sign-in; the adapter remains provider-neutral for open-source deployments.
- Cloudflare Workers AI, AI Gateway, Vectorize/AI Search, R2, D1, Queues, and
  Durable Objects remain separate bounded services with explicit data flows.
- Cloudflare Monetization Gateway/x402 is a future payment plane, not an
  identity or authorization replacement.

Current gates:

- (✅) OAuth provider, PKCE-only authorization, grant lifecycle, and bounded
  consent/audit surfaces implemented.
- (✅) All current Workers AI entry points route through the configured AI
  Gateway when `AI_GATEWAY_ID` is present: legacy LLM calls pass gateway policy
  as the Workers AI options argument, tool selection/function calling use the
  compatibility facade, document embeddings and lease extraction use the
  provider port, and the Project Think provider is created with the same
  gateway ID.
- (✅) Raw Workers AI access is isolated to `model-provider.ts` and the
  Cloudflare helper compatibility facade.
- (✅) Project Think/Agent model construction now uses the same provider seam;
  `pnpm run check:ai-provider-boundary` prevents a second direct provider path.
- (✅) `AI_EGRESS_ENABLED=false` fails closed at the shared model adapter and
  Project Think boundary while leaving deterministic MCP/formula capabilities
  available.
- (✅) Dedicated preview and production `OAUTH_KV` namespaces provisioned and
  bound.
- (🟡) Existing MCP/OAuth audit migrations and additive migrations
  `0007_mcp_audit_run_id.sql` and `0008_mcp_audit_policy_receipt.sql` are now
  applied to remote preview D1. Production migration application remains
  gated by the protected production deployment workflow.
- (🟡) Local authoritative CI gate passes: duplicate guard, smoke, typecheck,
  lint, format, audit, and full workspace tests. The duplicate guard still
  reports 541 nonblocking macOS Finder duplicates under `node_modules`.
- (🟡) Preview and production `/health` checks return 200, but their current
  `/version` receipts still report `commit: "unknown"` and the older control
  schema. Publication of this validated source and a SHA-bound hosted receipt
  remain open.
- (✅) Protected MCP responses are explicitly non-cacheable and vary on all
  supported credentials (`Authorization`, `X-API-Key`, and
  `X-Internal-API-Token`); anonymous `tools/list` is empty and anonymous
  `tools/call` is rejected before tool execution.
- (✅) The MCP policy manifest now has typed decision states, owner, formula
  version, policy version, resource scope, budget class, approval flag, and
  kill-switch metadata; `MCP_ANALYSIS_ENABLED=false` is enforced at discovery
  and execution boundaries.
- (🟡) `/version` now publishes the MCP protocol/server/policy identifiers and
  independent OAuth/model-egress/budget-enforcement/connector-egress control state for
  deployment receipts; the boundary smoke test now fails closed when the
  expected fail-closed canary states are absent or enabled unexpectedly.
- (✅) Preview deployment verifies the API `/health` and `/version` receipt,
  checks the preview web title, uploads a SHA-bound boundary receipt, and
  passed independently after propagation on the published Worker. The preview
  environment allows only explicitly registered preview branches; production
  remains protected.
- (✅) OAuth remains fail-closed in live environments: `OAUTH_ENABLED=false`
  yields no public discovery or authorization endpoints until the identity
  provider gate is complete.
- (✅) Credential-free hosted boundary smoke checks run hourly for both
  environments: health/version receipt, unauthenticated MCP/storage rejection,
  method allow-listing, and OAuth discovery fail-closed behavior.
- (✅) The hosted boundary smoke is a reusable machine-readable receipt harness
  covering MCP cache variance, storage denial, Agent authentication/origin
  isolation, method controls, and OAuth kill-switch behavior; deployment jobs
  upload the receipt as an artifact and fail before publication evidence is
  accepted when a boundary regresses.
- (🟡) Configure a real Clerk OAuth application and Worker secrets.
- (✅) The Clerk reconciler now validates the returned public/PKCE-required
  application, exact per-environment callback, required profile/email scopes,
  and complete HTTPS discovery metadata before emitting Worker configuration.
- (🟡) Deploy the canary with `OAUTH_ENABLED=false`, then run preview conformance.
- (🔜) Enable preview OAuth, validate ChatGPT/Codex/local-client discovery and
  revocation, then promote the same configuration pattern to production.
- (✅) Add the shared D1 usage-budget reservation contract for model tokens,
  estimated cost, tool calls, bytes, queue work, retention, and concurrency;
  identities are pseudonymous and retries are idempotent.
- (✅) Propagate a UUID-validated `X-Analysis-Run-ID` across request context,
  response headers, CORS, and MCP budget reservations; derive it from
  `X-Correlation-ID` or `X-Request-ID` when callers do not supply one.
- (🟡) MCP `tools/call` now has a canary-gated reservation/commit/release adapter;
  the gate remains disabled in all environments until hosted conformance passes.
- (🟡) Enhanced REST chat and streaming chat now have canary-gated reservation,
  measured commit, and failure-release paths for request bytes and model-token
  ceilings; OAuth, Agent, Code Mode, connectors, documents, and queues remain
  to be migrated before enabling paid or stateful execution. Streaming
  completion/error hooks are covered by focused tests; hosted enforcement is
  still disabled until the SHA-bound deployment receipt is verified.
- (✅) Stateful Project Think Agent turns now use the same reservation ledger
  lifecycle when budget enforcement is enabled: server-derived owner props
  provide the principal, each turn reserves model/tool/concurrency capacity,
  step hooks record usage, and completion/error hooks commit or release it.
- (🟡) Future Code Mode/connector egress now has a provider-neutral,
  deny-by-default destination policy with HTTPS-only validation, private/local/
  metadata blocking, exact or subdomain allowlists, manual redirect
  revalidation, bounded redirects, strict environment parsing, and an
  independent connector kill switch. Redirects are hard-capped at five even
  if a future caller supplies a looser policy.
  This is a foundation only: Cloudflare Workers do not provide portable DNS
  resolution, so enabling production egress still requires a controlled
  resolver/proxy and endpoint-specific adapter with post-resolution IP and
  rebinding controls.
- (🟡) Added `code-mode-policy.ts` as the provider-neutral Code Mode host
  contract. Cloudflare's `@cloudflare/codemode`/`@cloudflare/shell` runtime is
  not exposed yet; generated code has no filesystem or ambient-credential
  authority, capabilities must be explicitly allowlisted, writes/memory need a
  trusted approval receipt, and the independent `CODE_MODE_ENABLED` switch is
  false in every environment. See `docs/CODE_MODE_BOUNDARY.md`.
- (🟡) Shared MCP authorization decisions now carry the capability, opaque
  principal, resolved resource scope, budget lifecycle state, policy version,
  and host audit correlation ID. Function calling and the future Code Mode
  adapter delegate to the same manifest before execution; full Agent/GUI/REST
  convergence and hosted receipts remain open under #483.
- (✅) The shared capabilities package now validates evidence envelopes with
  artifact/owner/hash/retrieval/freshness/trust/parser/index metadata and a
  data-only instruction authority marker.
- (🟡) AutoRAG invalidation now has a tombstone-first cache contract: R2, KV,
  and Vectorize derivatives are removed, stale AI Search chunks are filtered
  while its index job catches up, and `/v1/admin/knowledge/invalidate` queues
  the operation with retry-visible completion semantics.
- (🟡) The shared capabilities package now carries a provider-neutral response
  verification receipt and pure numeric reconciliation seam. Matching claims
  are verified, contradictory claims are rejected, and unavailable outputs are
  marked partially verified; Agent emission, GUI display, and hosted evaluation
  receipts remain open.
- (🟡) Shared Worker structured logs now redact sensitive metadata, bearer
  tokens, private-key blocks, oversized strings, and circular values before
  serialization; route/event coverage and hosted dashboards remain open.
- (✅) Security-session decisions and MCP requests now emit a bounded shared
  Analytics Engine envelope containing request/run/correlation IDs, opaque
  principal/source metadata, scope/capability/policy/resource fields, outcome,
  status, and duration. MCP parse, validation, policy, budget, tool, and
  unexpected-error paths are recorded without request arguments or provider
  credentials; email-shaped identifiers are redacted and telemetry cardinality
  is bounded. Local privacy and persistence tests cover the contract.
- (🟡) Analytics Engine now records only secret-salted pseudonymous
  fingerprints, IP-presence categories, bounded endpoints/actions, and
  metric-only metadata summaries; raw client IP indexes, client IDs, metadata
  values, and unredacted authentication-failure reasons are excluded. The
  client analytics routes reject oversized nested payloads and fail closed
  without `ANALYTICS_HASH_SALT`; the preview and production secret bindings
  are provisioned, while hosted runtime inspection and deletion/export receipts
  remain open.
- (🟡) Attach evidence envelopes to retrieval, document cache, Agent context,
  and deletion/reindex receipts.
- (🔜) Add metered capability accounting and x402 payment challenges only after
  free read-only usage and audit metrics are stable.

AI Gateway invariant:

- Model inputs contain only model parameters (`prompt`, generation controls,
  messages, and stream settings). Gateway controls belong in the Cloudflare
  Workers AI options/provider configuration. This is tested in
  `workers/api/src/services/__tests__/model-provider.test.ts` and the LLM
  boundary tests so a future model adapter cannot silently bypass caching,
  logging, or cost controls.

Trust-boundary register:

- (✅) Repository-scoped browser/API/MCP/OAuth/Agent/retrieval/model/Code Mode/
  CI boundaries, data classes, owners, failure modes, and independent kill
  switches are documented in `docs/TRUST_BOUNDARIES.md`.
- (🟡) Security/platform/operations review and implementation receipts for
  deletion propagation, full Code Mode sandboxing, controlled connector
  egress, and stateful Agent boundaries remain required before privileged
  exposure.

---

## Immediate quick wins (safe, high impact)

- (✅) Add ETag/If-None-Match for `/openapi.json` and `/docs` HTML responses (improves perf and bandwidth)
- (✅) Add `X-Cache` response header on analysis routes to indicate cache hit/miss (observability)
- (✅) Enforce JSON body size caps for analysis endpoints (64KB default, env-configurable) and return 413 on exceed
- (✅) Add explicit `OPTIONS` handler for CORS preflight with `Access-Control-Allow-*` headers
- (✅) Add ETag/If-None-Match for root `/` JSON response with short Cache-Control
- (✅) Harden MIME allowlist value in wrangler (e.g., `application/pdf,application/vnd.openxmlformats`) via `ALLOWED_UPLOAD_MIME_PREFIXES`
- Document R2 lifecycle policy examples (cold data retention) and checksum verification steps (📝)
- Rotate `ADMIN_API_TOKEN` procedure with `wrangler secret` and repo environment docs (📝)

---

## Phase 1 — Core foundations (✅)

Completed:

- Workers API deployed with strict headers, CORS, OpenAPI, and `/docs` viewer
- Structured logging and request IDs
- Rate limiting (basic per-IP) and global error handling
- R2, D1, and KV bindings wired and verified
- Web worker serving static Astro build from `apps/web/dist`
- Hourly cron trigger scaffolded for R2 usage reconciliation

Artifacts:

- `workers/api/wrangler.toml` + `workers/web/wrangler.toml`
- `workers/api/src/index.ts` (routes, CSP, rate-limit)
- `workers/api/src/openapi.ts` + `/docs`
- `.env.*.example` files

---

## Phase 2 — R2 quota monitoring & enforcement (🟡 in progress)

Goal: Prevent runaway storage costs and enforce per-env limits.

Deliverables:

- (✅) Implement conservative R2 usage aggregation:
  - Reconcile via cron: list objects (prefix/windowed pagination) and sum `size`
  - Cache the approximate snapshot in the environment-scoped `SESSIONS` KV
    namespace under `quota:bytes` and `quota:locked`
- (✅) Enforce soft/hard limits:
  - Soft-limit: set the KV lock and return 403 with guidance
  - Hard-limit: reject uploads outright; reconciliation applies the same lock
    with hysteresis so it cannot flap at the threshold
- (✅) Expose usage endpoint:
  - `GET /v1/storage/usage` → { usedBytes, softLimit, hardLimit, locked }
- (✅) Signed R2 access is split into two gates:
  - (✅) Owner-checked, short-lived GET URL issuance at `POST /v1/storage/presign`
    using AWS SigV4/R2 S3 endpoint signing and a 15-minute maximum lifetime
  - (✅) Session-bound PUT URLs reserve customer quota in D1 and require
    `POST /v1/storage/finalize` to verify exact size/content type/SHA-256 before
    promotion into `documents`
  - (✅) Hourly scheduled cleanup removes expired pending sessions and abandoned R2 objects
  - (✅) Stored document metadata returns the SHA-256 needed for client integrity checks
- (✅) D1 metadata table and write path:
  - `documents(id, key, size, content_type, hash, created_at, user_id?, status)`
- (✅) Tests:
  - Unit tests for reconciler, lock/unlock logic, size enforcement
  - API tests for usage and rejection paths (near limits)

Config:

- `R2_SOFT_LIMIT_BYTES`, `R2_HARD_LIMIT_BYTES`, `MAX_OBJECT_SIZE_BYTES` (already present)

Notes:

- Use `head()` before computing checksums; compute client-side hash optionally to dedupe
- Consider lifecycle policy for stale objects (manually documented steps)

### Acceptance criteria (Phase 2)

- Hard-limit rejections return 413/403 with guidance and are logged
- Reconcile job updates the KV snapshot on the configured hourly schedule

---

## Phase 3 — Secure session & auth (🔜)

Goal: Safeguard endpoints and add light user/session boundaries.

Options:

- Cloudflare Turnstile for unauthenticated rate-limited flows (🧪)
- KV-backed sessions with rotating session IDs, secure cookies, `SameSite=Lax`, `HttpOnly`, `Secure`

Deliverables:

- Opt-in auth for management routes (`/v1/admin/*`)
- Tests for session expiry & cookie flags
- Admin routes return 401 without valid bearer or session

### Acceptance criteria (Phase 3)

- Session cookie set with secure flags (HttpOnly, Secure, SameSite)
- Admin routes protected and tested for 401 without auth

---

## Phase 4 — Observability & alerting (🟡 in progress)

Goal: Gain visibility and detect regressions early.

Deliverables:

- Workers Analytics Engine or Logpush for structured logs (json lines)
- Tail filters & sampling strategies for high-traffic routes
- Error budgets and alerting (PagerDuty/Webhooks/Email via Workers or third-party) (🧩)

Current production state:

- Workers Logs are enabled and persisted for the production API and web Workers through their Wrangler configurations.
- Invocation logs are enabled at 100% sampling while traffic remains low; traces and external log exports remain disabled.
- Alerting and log-retention review are still outstanding.
- (🟡) Shared run and budget identifiers are now available as the foundation
  for privacy-preserving reconstruction; route-level event emission and
  dashboards remain open.

### Implementation notes

- Use env `ENVIRONMENT` to separate metrics by env
- Alert fires on error budget burn or uptime failure
- Tail filters allow quick slice by `CF-RAY` and `requestId`

### Acceptance criteria (Phase 4)

- Logs visible in Analytics Engine/Logpush; latency dashboards live
- Alerting wired to on-call channel with sample incident

---

## Phase 5 — Caching & performance (🔜)

Goal: Reduce cost and improve latency for deterministic results.

Deliverables:

- (✅) Cache API for idempotent analysis responses using stable cache keys
  - Implemented for `/v1/api/analysis/{lease,amortization}` with TTL controlled by `ANALYSIS_CACHE_TTL_SECONDS` (0 disables; default 0 in all envs)
- CDN/static caching headers for the web worker (immutable assets) (🔜)
- Pre-computed or compiled image service for Astro at build time (🧩)

### Acceptance criteria (Phase 5)

- > 50% cache hit rate for repeated analysis payloads in staging

---

## Phase 6 — CI/CD & environments (🟡 in progress)

Deliverables:

- (🟡) Preview deployment is explicitly label/manual gated, injects the commit
  SHA, verifies API/web/boundary receipts after deployment, uploads a
  machine-readable boundary artifact, and records the result on the pull
  request.
- (✅) Production deployment requires a main commit, an explicit confirmation,
  a protected production environment, and post-deploy API/web receipt checks.
- (✅) Production promotion now requires a successful matching preview run,
  an explicit approval reference, a main-reachable rollback SHA, and uploads a
  machine-readable promotion receipt alongside the boundary receipt.

### Acceptance criteria (Phase 6)

- PRs automatically deploy to preview; link posted in PR
- Production deploys are gated and recorded; smoke tests pass post-deploy

---

## Phase 7 — Data durability & migrations (🟡 in progress)

Goal: Reliable data evolution.

- (✅) D1 migrations use versioned SQL and are applied by the preview and
  production deployment workflows before the API Worker is published; a
  migration failure stops the release.
- Indexes for frequent queries (lookups by user/session, object key)
- (🟡) Backup/export procedure and retention policy are documented in
  `docs/D1_BACKUP_OPERATIONS.md`; `scripts/export-d1-backup.mjs` requires an
  explicit production confirmation, refuses overwrite, and emits a checksum.
- (🟡) First preview-only isolated restore drill passed: 17 restored tables were
  read back and the temporary database/dump were cleaned up; formula-vector
  replay and production-authorized recovery remain open.

---

## Phase 8 — Security hardening (🟡 in progress)

- (✅) Worker-level HTTP method allow-list rejects unsupported methods with
  `405 METHOD_NOT_ALLOWED`; Cloudflare WAF rules for abusive paths remain
  separately gated.
- (🟡) Added a read-only WAF entrypoint audit and rollout/rollback runbook;
  live WAF configuration remains blocked until a narrowly scoped WAF read-only
  token is provisioned for inspection and any separate write authority is
  explicitly approved.
- CSP review (docs viewer done; add for web worker output if needed)
- Secrets rotation cadence
- (✅) File-type validation for PDF, DOCX, and UTF-8 text now performs byte-level
  content sniffing in addition to the client MIME declaration and size caps.
- (✅) Configured R2 write failures return `503 STORAGE_UNAVAILABLE` rather than
  reporting a successful upload; the quota counter is updated only after the
  object write succeeds.
- (🟡) Added the first Code Mode/connector egress control boundary in
  `workers/api/src/lib/outbound-destination.ts`; it remains disabled in all
  environments and is not a substitute for a sandbox, resolver/proxy, output
  limits, cancellation, or endpoint-specific authorization.
- Optional malware scanning pipeline (🧩)

### Acceptance criteria (Phase 8)

- (🔜) Basic WAF in place with allow-listing for methods and known routes;
  application-level method and route controls are already active while the
  Cloudflare ruleset gate is open.
- (✅) File uploads rejected when content-type sniffing fails

---

## Phase 9 — Cost controls & guardrails (🔜)

Deliverables:

- (✅) Shared D1 reservation ledger contract for per-principal/client/workspace
  budgets, model tokens, estimated cost, tool calls, bytes, queues, retention,
  and concurrency; see `docs/USAGE_BUDGET_OPERATIONS.md`
- (🟡) Wire the contract into REST, MCP, OAuth, Agent, Code Mode, connectors,
  document processing, and queue consumers with common run IDs
- Per-tenant/session quotas for API calls and storage
- Periodic purge policies for stale cache & documents

### Acceptance criteria

- Alerts trigger when monthly usage exceeds thresholds
- Quota violations block requests and are observable in logs
- Expensive operations fail closed when budget state is unavailable; formulas
  have an explicit deterministic degraded path

---

## Phase 10 — Developer experience (🔜)

Goal: Make local iteration smooth.

- `wrangler dev` multitarget helper script (API + Web)

---

## Acceptance criteria by milestone

- Phase 2: R2 usage endpoint returns accurate usage; uploads are blocked beyond soft-limit; tests pass
- Phase 3: Session cookie set with secure flags; admin routes guarded; tests pass
- Phase 4: Logs visible in Analytics Engine/Logpush; latency dashboards live
- Phase 5: Cache yields >70% hit ratio for repeated analysis payloads in staging tests
- Phase 6: Preview deployments triggered on PR; production gated and traceable

---

## Backlog (optional/advanced)

- Durable Object-backed global rate limiter with sliding window and IP/user keys
- Cache Reserve for long-lived asset caching (cost optimization)
- Tiered Cache for origin fetch reduction (web worker static assets)
- Automated chaos/load tests (k6/Artillery) in CI for SLO validation

---

## Tracking & tasks (initial shortlist)

- [x] Implement `getBucketUsage()` and KV snapshot
- [x] Cron reconciliation + lock/unlock policy
- [x] `/v1/storage/usage` route with authenticated threshold and lock output
- [x] Owner-checked signed GET URL issuance with a bounded TTL and R2 secret gate
- [x] Signed PUT upload sessions with finalize-time size/content-type/SHA-256 verification
- [x] Expired upload-session cleanup and abandoned-object deletion code
- [x] Abandoned-object lifecycle and operator recovery runbook (`docs/R2_OPERATIONS.md`)
- [x] D1 `documents` table and write path for metadata
- [x] Tests: reconciler, size enforcement, near-limit behavior
- [x] Docs: runbooks for unlocking, lifecycle policy, quotas, and D1 backup/export
