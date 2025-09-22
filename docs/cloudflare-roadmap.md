# Cloudflare Integration Roadmap

This roadmap outlines phased improvements to deepen our integration with Cloudflare across reliability, security, scalability, observability, and cost controls.

Status legend: (✅ done) (🔜 next) (🧪 experiment) (📝 docs) (🧩 optional)

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

## Phase 2 — R2 quota monitoring & enforcement (🔜)

Goal: Prevent runaway storage costs and enforce per-env limits.

Deliverables:

- Implement R2 usage aggregation:
  - Reconcile via cron: list objects (prefix/windowed pagination) and sum `size`
  - Cache usage snapshot in KV: `R2_USAGE_SNAPSHOT:{bucket}` { bytes, ts }
- Enforce soft/hard limits:
  - Soft-limit: set a KV flag `R2_UPLOADS_LOCKED=true` and return 429/403 with guidance
  - Hard-limit: reject uploads outright; skip reconciliation until unlocked by admin
- Expose usage endpoint:
  - `GET /v1/storage/usage` → { usedBytes, softLimit, hardLimit, locked }
- Signed URLs for uploads/downloads:
  - Short-lived PUT/GET URLs with strict content-type validation
  - Maximum object size from `MAX_OBJECT_SIZE_BYTES`
  - Include object checksums (e.g., SHA-256) to detect corruption and enable dedupe later (🧩)
- D1 metadata table:
  - `documents(id, key, size, content_type, hash, created_at, user_id?, status)`
- Tests:
  - Unit tests for reconciler, lock/unlock logic, size enforcement
  - API tests for usage and rejection paths (near limits)

Config:

- `R2_SOFT_LIMIT_BYTES`, `R2_HARD_LIMIT_BYTES`, `MAX_OBJECT_SIZE_BYTES` (already present)

Notes:

- Use `head()` before computing checksums; compute client-side hash optionally to dedupe
- Consider lifecycle policy for stale objects (manually documented steps)

### Acceptance criteria (Phase 2)

- Hard-limit rejections return 413/403 with guidance and are logged
- Reconcile job updates KV snapshot within 5 minutes of schedule

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

## Phase 4 — Observability & alerting (🔜)

Goal: Gain visibility and detect regressions early.

Deliverables:

- Workers Analytics Engine or Logpush for structured logs (json lines)
- Tail filters & sampling strategies for high-traffic routes
- Error budgets and alerting (PagerDuty/Webhooks/Email via Workers or third-party) (🧩)

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

## Phase 6 — CI/CD & environments (🔜)

Deliverables:

- Promotion workflow (preview → production) with approvals

### Acceptance criteria (Phase 6)

- PRs automatically deploy to preview; link posted in PR
- Production deploys are gated and recorded; smoke tests pass post-deploy

---

## Phase 7 — Data durability & migrations (🔜)

Goal: Reliable data evolution.

- D1 migrations via `wrangler d1 migrations` (versioned SQL)
- Indexes for frequent queries (lookups by user/session, object key)
- Backup/export procedures & retention policy (docs)

---

## Phase 8 — Security hardening (🔜)

- WAF rules for abusive paths, method allow-lists
- CSP review (docs viewer done; add for web worker output if needed)
- Secrets rotation cadence
- File-type validation (`.pdf`, `.docx`) with content sniffing and size caps
- Optional malware scanning pipeline (🧩)

### Acceptance criteria (Phase 8)

- Basic WAF in place with allow-listing for methods and known routes
- File uploads rejected when content-type sniffing fails

---

## Phase 9 — Cost controls & guardrails (🔜)

Deliverables:

- Per-tenant/session quotas for API calls and storage
- Periodic purge policies for stale cache & documents

### Acceptance criteria

- Alerts trigger when monthly usage exceeds thresholds
- Quota violations block requests and are observable in logs

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

- [ ] Implement `getBucketUsage()` and KV snapshot
- [ ] Cron reconciliation + lock/unlock policy
- [ ] `/v1/storage/usage` route with zod schema
- [ ] Signed PUT/GET URL issuance with content-type and size checks
- [ ] D1 `documents` table and write path for metadata
- [ ] Tests: reconciler, size enforcement, near-limit behavior
- [ ] Docs: runbooks for unlocking, lifecycle policy, and quotas
