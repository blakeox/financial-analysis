# Cloudflare Integration Roadmap

This roadmap outlines phased improvements to deepen our integration with Cloudflare across reliability, security, scalability, observability, and cost controls.

Status legend: (✅ done) (🔜 next) (🧪 experiment) (📝 docs) (🧩 optional)

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

---

## Phase 3 — Secure session & auth (🔜)

Goal: Safeguard endpoints and add light user/session boundaries.

Options:

- Cloudflare Turnstile for unauthenticated rate-limited flows (🧪)
- Cloudflare Access or JWT-backed sessions for admin APIs (🧩)
- KV-backed sessions with rotating session IDs, secure cookies, `SameSite=Lax`, `HttpOnly`, `Secure`

Deliverables:

- Session middleware (KV)
- Opt-in auth for management routes (`/v1/admin/*`)
- Tests for session expiry & cookie flags

---

## Phase 4 — Observability & SLOs (🔜)

Goal: Gain visibility and detect regressions early.

Deliverables:

- Workers Analytics Engine or Logpush for structured logs (json lines)
- Tail filters & sampling strategies for high-traffic routes
- SLOs & synthetic checks:
  - 99th percentile latency for `/v1/api/analysis/*`
  - Uptime check for `/health`
- Error budgets and alerting (PagerDuty/Webhooks/Email via Workers or third-party) (🧩)

---

## Phase 5 — Caching & performance (🔜)

Goal: Reduce cost and improve latency for deterministic results.

Deliverables:

- Cache API for idempotent analysis responses using stable cache keys
- ETag/If-None-Match for docs/openapi.json & static API responses
- CDN/static caching headers for the web worker (immutable assets)
- Pre-computed or compiled image service for Astro at build time

---

## Phase 6 — CI/CD & environments (🔜)

Goal: Safe, repeatable deployments.

Deliverables:

- GitHub Actions: preview deploys on PRs, production on main
- `wrangler deploy --dry-run` + smoke tests
- Secrets management via `wrangler secret` and repo environments
- Promotion workflow (preview → production) with approvals

---

## Phase 7 — Data durability & migrations (🔜)

Goal: Reliable data evolution.

Deliverables:

- D1 migrations via `wrangler d1 migrations` (versioned SQL)
- Indexes for frequent queries (lookups by user/session, object key)
- Backup/export procedures & retention policy (docs)

---

## Phase 8 — Security hardening (🔜)

Goal: Defense in depth.

Deliverables:

- WAF rules for abusive paths, method allow-lists
- CSP review (docs viewer done; add for web worker output if needed)
- Secrets rotation cadence
- File-type validation (`.pdf`, `.docx`) with content sniffing and size caps
- Optional malware scanning pipeline (🧩)

---

## Phase 9 — Cost controls & guardrails (🔜)

Goal: Keep predictable spend.

Deliverables:

- Budget alerts on R2/KV/Workers usage (manual + scriptable via API) (🧩)
- Per-tenant/session quotas for API calls and storage
- Periodic purge policies for stale cache & documents

---

## Phase 10 — Developer experience (🔜)

Goal: Make local iteration smooth.

Deliverables:

- `wrangler dev` multitarget helper script (API + Web)
- Local proxy for API base URL used by Astro during tests
- Makefile targets refined for single-step dev, test, deploy

---

## Acceptance criteria by milestone

- Phase 2: R2 usage endpoint returns accurate usage; uploads are blocked beyond soft-limit; tests pass
- Phase 3: Session cookie set with secure flags; admin routes guarded; tests pass
- Phase 4: Logs visible in Analytics Engine/Logpush; latency dashboards live
- Phase 5: Cache yields >70% hit ratio for repeated analysis payloads in staging tests
- Phase 6: Preview deployments triggered on PR; production gated and traceable

---

## Tracking & tasks (initial shortlist)

- [ ] Implement `getBucketUsage()` and KV snapshot
- [ ] Cron reconciliation + lock/unlock policy
- [ ] `/v1/storage/usage` route with zod schema
- [ ] Signed PUT/GET URL issuance with content-type and size checks
- [ ] D1 `documents` table and write path for metadata
- [ ] Tests: reconciler, size enforcement, near-limit behavior
- [ ] Docs: runbooks for unlocking, lifecycle policy, and quotas
