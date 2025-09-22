# Copilot instructions for this repo

Goal: help agents ship correct, typed TS across Astro UI and Cloudflare Workers with deterministic financial math.

Architecture (big picture)
- UI: `apps/web` (Astro + React islands + Tailwind) builds to static assets. Served locally via `workers/web` worker.
- API: `workers/api` (Cloudflare Worker) exposes JSON endpoints, OpenAPI (`/openapi.json`), docs (`/docs`), MCP (`/mcp`), chat (`/v1/chat`).
- Engines: `packages/analysis` houses pure, deterministic functions (Zod schemas exported) used by API and UI.
- Tools: `packages/tools` provides MCP tool handlers consumed by the API’s `/mcp` route.
- Shared UI: `packages/ui` design system (built before web app builds).

Daily workflows (use pnpm)
- Dev all (recommended): `pnpm dev` runs `scripts/dev-all.mjs` → builds `apps/web`, starts `@financial-analysis/web-worker` on 8788, then API on 8787.
- Individual dev: `pnpm --filter @financial-analysis/api dev` and `pnpm --filter @financial-analysis/web-worker dev` (ensure `apps/web` built first).
- Typecheck/lint/test (monorepo): `pnpm typecheck && pnpm lint && pnpm test`.
- Web app prebuild: `apps/web/package.json` runs `prebuild` to rebuild `@financial-analysis/ui` and clear `node_modules/.vite` to avoid stale chunks.
- Playwright e2e (web): from `apps/web` run `pnpm test:e2e`; HMR stability: `pnpm test:e2e:hmr` (uses `playwright.dev.config.ts`).

API and contracts (concrete patterns)
- Validation: Use Zod from `@financial-analysis/analysis` schemas (e.g., `FinancialInputSchema`, `AmortizationInputSchema`).
- Endpoints in `workers/api/src/index.ts`:
	- POST `/v1/api/analysis/lease` and `/v1/api/analysis/amortization` → call analyzers then `JSON.stringify(result)`.
	- `/openapi.json` from `getOpenApiDocument()` and `/docs` (RapiDoc HTML) with strict CSP.
	- MCP at `/mcp` via `handleMCPRequest`; extend tools in `packages/tools` (stateless, schema-driven).
	- Chat at `/v1/chat` uses Workers AI if `env.AI` is bound or returns deterministic text fallback.
- Responses include CORS + security headers via helpers; attach `X-Request-ID` and rate limit headers where relevant.

Storage quotas (R2 guardrails)
- R2 bound as `DOCUMENTS`; quotas configured in `workers/api/wrangler.toml` (`R2_SOFT_LIMIT_BYTES`, `R2_HARD_LIMIT_BYTES`, `MAX_OBJECT_SIZE_BYTES`).
- Approximate usage tracked in KV (`SESSIONS`) keys `quota:bytes` and lock flag `quota:locked`.
- Required for uploads: `Content-Length` (or `X-Content-Length`). Uploads that exceed thresholds return 403/413 and may set lock; hourly cron reconciles usage.

Conventions (project-specific)
- TypeScript everywhere with strict types. Deterministic math only—no side effects in engines; add Vitest unit tests alongside new functions.
- Input validation with shared Zod types; avoid duplicating schemas in UI—import from packages when possible.
- Worker routing via `itty-router`; wrap routes with `withErrorHandler` and reuse `buildDefaultHeaders(env)`.
- Logging is structured JSON with `X-Request-ID`; keep additions minimal and edge-compatible (no Node-only APIs in Workers runtime).

When adding features
- Engine first: implement pure function in `packages/analysis`, export types, add Vitest tests.
- API route: validate with existing Zod schemas, return typed JSON, include headers and rate limit behavior.
- MCP tool (optional): add tool in `packages/tools` and wire via `/mcp` handler.
- UI: add an Astro page or island that calls the API; ensure `apps/web` builds clean with prebuild step.

Key files to reference
- `workers/api/src/index.ts`, `workers/api/wrangler.toml`, `apps/web/package.json` (prebuild), `scripts/dev-all.mjs`, `docs/ARCHITECTURE.md`, `AGENT.md`.
