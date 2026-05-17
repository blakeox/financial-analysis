# AGENTS.md

Guidance for AI coding assistants working in this repository.

**Primary reference:** [AGENT.md](./AGENT.md) (coding standards, structure, security).

**Contributor workflow:** [CONTRIBUTING.md](./CONTRIBUTING.md) (setup, hooks, PR process).

## Quick commands

```bash
pnpm run setup:local   # clean install + Playwright chromium (first time / broken node_modules)
pnpm run verify        # CI gate: duplicates, typecheck, lint, format, tests
pnpm run build:libs    # build @financial-analysis/analysis + ui (runs before typecheck via pretypecheck)
pnpm run dev           # Astro build + web worker (8788) + API (8787)
```

## Layout

| Path | Purpose |
|------|---------|
| `apps/web` | Astro frontend; Playwright tests under `tests/{chat,nav,site,...}/` |
| `workers/api` | Cloudflare API, MCP, chat, OpenAPI |
| `workers/web` | Static asset worker for built Astro site |
| `packages/analysis` | Deterministic financial engines (build before consumers typecheck) |
| `packages/ui` | Shared React components |
| `packages/tools` | MCP tool handlers |

## CI (do not duplicate locally)

- **PR / `dev` push:** `ci.yml`, `pull-request.yml`, `e2e-web` (web paths)
- **`main` push only:** `ci-cd.yml` (artifacts, CodeQL)
- **Never commit:** Finder duplicates (`file 2`), flat Playwright specs, or `tests/utils/nav.ts` (use `tests/_shared/`)

## Before opening a PR

1. `pnpm run verify`
2. No secrets in diff
3. Engines: pure functions + Vitest tests in `packages/analysis`
