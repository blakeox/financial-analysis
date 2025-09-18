# Architecture Overview

This document summarizes the high-level system design for the Financial Analysis monorepo.

## Goals

- Deterministic, testable financial calculations (pure functions)
- Fast edge delivery (Cloudflare Workers) with minimal cold start
- Reusable component and analysis packages with strict typing
- Clean separation: UI (Astro) / API (Workers) / Engines (packages)

## Top-Level Structure

```text
apps/web          # Astro + React front-end
workers/api       # Cloudflare Worker API (JSON + OpenAPI + MCP)
workers/web       # Static asset / potential edge SSR worker
packages/analysis # Financial calculation engines
packages/tools    # Shared tool + MCP integration
packages/ui       # Shared UI component library
scripts           # Dev orchestration, smoke tests, utilities
docs              # Documentation (API, Architecture, etc.)
```

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

## OpenAPI & Contracts

- OpenAPI spec generated in the API worker (`getOpenApiDocument`).
- Future: extract shared contract to `@financial-analysis/contracts` for UI reuse.

## Observability (Planned Enhancements)

- Correlation / Request ID already included in responses.
- Add route-level duration metrics & caching hit ratio.

## Performance Considerations

- Keep engine code small (avoid large deps, stays in single bundle chunk).
- Potential future: WASM hot path if benchmark justifies.

## Future Work

- Contracts package for schemas
- Caching layer (KV deterministic key) for repeat calculations
- Mutation testing for financial engines
- Bench harness & perf budget enforcement
