# Architecture Overview

This document summarizes the high-level system design for the Financial Analysis monorepo.

## Goals

- Deterministic, testable financial calculations (pure functions)
- Fast edge delivery (Cloudflare Workers) with minimal cold start
- Reusable component and analysis packages with strict typing
- Clean separation: UI (Astro) / API (Workers) / Engines (packages)

## Top-Level Structure

```text
apps/web             # Astro + React front-end
workers/api          # Legacy mixed API (REST + MCP + Agent + indexer seams)
workers/mcp          # Target: stateless public MCP edge (scaffold)
workers/agent        # Target: first-party Agent + memory (scaffold)
workers/indexer      # Target: async retrieval/indexing (scaffold)
workers/web          # Static asset / potential edge SSR worker
packages/analysis    # Financial calculation engines
packages/capabilities# Contracts, registry, authorization
packages/tools       # Shared tool + MCP integration
packages/ui          # Shared UI component library
scripts              # Dev orchestration, smoke tests, utilities
docs                 # Documentation (API, Architecture, etc.)
```

Target topology and cutover inventory: [RUNTIME_TOPOLOGY.md](./RUNTIME_TOPOLOGY.md), [LEGACY_DELETION_TARGETS.md](./LEGACY_DELETION_TARGETS.md).

## Request Flow

1. User loads web UI (Astro build served via web worker / static hosting)
2. UI issues fetch to API worker endpoints (`/v1/api/analysis/...`)
3. API validates input with shared Zod schemas (from `@financial-analysis/analysis`)
4. Pure engine functions compute results; response JSON returned with security + CORS headers
5. Logs emitted (structured JSON) and rate limiting applied via KV

## Deterministic Engines

- All numeric routines live in `packages/analysis/src/engines`.
- No side effects: functions accept plain data, return computed objects.
- Golden tests + numeric drift tolerance defend against regression.

## Testing workflows

- Smoke suite: `pnpm run test:smoke` runs a fast API subset covering health/version handlers plus OpenAPI generation, contract, and snapshot checks.
- Flaky suite: tag tests with "@flaky" and run `pnpm run test:flaky`.
- OpenAPI snapshot: `node scripts/generate-openapi-snapshot.mjs` updates the approved snapshot.
- Mutation testing (analysis): `pnpm --filter @financial-analysis/analysis run test:mutation`.
- Coverage: nightly workflow uploads analysis coverage.

## OpenAPI & Contracts

- OpenAPI spec generated in the API worker (`getOpenApiDocument`).
- Future: extract shared contract to `@financial-analysis/contracts` for UI reuse.

## Observability (Planned Enhancements)

- Correlation / Request ID already included in responses.
- Add route-level duration metrics & caching hit ratio.

## Worker configuration contract

The target Workers keep their runtime configuration in Wrangler and their
TypeScript binding contract in the generated `worker-configuration.d.ts` file
for each worker. Run the worker package's `types:generate` command after
changing `wrangler.toml`; CI runs `pnpm run check:worker-types` so a binding or
environment drift cannot silently reach deployment. The generated files are
deliberately checked in because they are part of the compile-time contract.

Compatibility dates are upgraded only with a pinned Wrangler/workerd
compatibility receipt. The MCP worker remains at the currently verified
`2026-07-02` ceiling until the compatibility spike updates the client receipt,
runtime tests, and rollback evidence together.

## Performance Considerations

- Keep engine code small (avoid large deps, stays in single bundle chunk).
- Potential future: WASM hot path if benchmark justifies.

## Uploads: MIME allowlist

- The API upload endpoint enforces an optional MIME allowlist via the `ALLOWED_UPLOAD_MIME_PREFIXES` env var (set in `workers/api/wrangler.toml`).
- Value is a comma-separated list of MIME type prefixes. Example (enabled by default):
  - `application/pdf,application/vnd.openxmlformats`
  - This allows PDFs and modern Office formats (docx/xlsx/pptx).
- Tighten or relax per environment under `[vars]`, `[env.preview.vars]`, and `[env.production.vars]`.
- If set and an upload's `Content-Type` does not start with any allowed prefix, the API returns `415 Unsupported Media Type`.

## Future Work

- Contracts package for schemas
- Caching layer (KV deterministic key) for repeat calculations
- Mutation testing for financial engines
- Bench harness & perf budget enforcement

## API internals: modules (reference)

The API worker (`workers/api`) organizes cross-cutting concerns into small modules under `src/lib` and `src/routes`:

- `src/types.ts` — shared `Env` type for Workers bindings and env vars.
- `src/lib/headers.ts` — `getCorsHeaders`, `getSecurityHeaders`, `buildDefaultHeaders` used by all responses.
- `src/lib/crypto.ts` — `sha256Hex` for ETag/cache keys.
- `src/lib/json.ts` — `stableStringify` for deterministic cache keys.
- `src/lib/cache.ts` — `getDefaultCache` helper for Workers Cache API.
- `src/lib/config.ts` — readers for env-driven config like `ANALYSIS_CACHE_TTL_SECONDS`, `ANALYSIS_MAX_JSON_BYTES`, and R2 thresholds.
- `src/lib/rate-limit.ts` — `checkRateLimit` and `attachRateLimitHeaders` (KV-backed, applied to API/MCP/chat routes).
- `src/lib/quota.ts` — R2 quota accounting helpers and reconciliation over KV/R2.
- `src/routes/health.ts` — `/health` registration with consistent headers.

Notable behaviors validated by tests:

- Deterministic ETag handling for `/`, `/openapi.json`, `/docs` with proper 304 on `If-None-Match`.
- Optional deterministic Cache API for analysis endpoints with `X-Cache: HIT/MISS/BYPASS`.
- OPTIONS preflight routes set `Allow` and CORS headers for `/mcp`, `/api/*`, `/v1/*`, `/openapi.json`, `/docs`.
