# AGENTS.md

Guidance for AI coding assistants working in this repository.

**Primary reference:** [AGENT.md](./AGENT.md) (coding standards, structure, security).

**Contributor workflow:** [CONTRIBUTING.md](./CONTRIBUTING.md) (setup, hooks, PR process).

## Quick commands

```bash
pnpm run setup:local   # clean install + Playwright chromium (first time / broken node_modules)
pnpm run test:ci       # CI job without Playwright (~5 min): duplicates, smoke, typecheck, lint, format, audit, tests
pnpm run test:ci:full  # test:ci + Playwright smoke (when web paths would run e2e in CI)
pnpm run verify        # Full gate: duplicates, typecheck, lint, format, unit tests (hooks / pre-push)
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

- Workflows use `.github/actions/setup-monorepo` for pnpm + Node 22 + install
- **PR / `dev` push:** `ci.yml`, `pull-request.yml`, `e2e-web` (web paths only)
- **Doc-only PRs:** `ci.yml` runs but skips install/tests; `pull-request.yml` skips duplicate/dependency review
- **Workers-only PRs:** full `ci.yml` minus Playwright; no `e2e-web`
- **Labels:** `skip-ci` (skip all PR checks), `deploy-preview` (preview deploy)
- **Dependabot:** patch/minor auto-merge via `dependabot-automerge.yml` (majors manual)
- **Workflow map:** [.github/workflows/README.md](.github/workflows/README.md)
- **Maintainer setup:** [.github/MAINTAINER_SETUP.md](.github/MAINTAINER_SETUP.md) (Codecov, Dependabot workflows, branch protection sync)
- **`main` push only:** `ci-cd.yml` (artifacts, CodeQL)
- **Security:** OpenSSF Scorecard in `scorecard.yml` (weekly + Security tab SARIF)
- **Never commit:** Finder duplicates (`file 2`), flat Playwright specs, or `tests/utils/nav.ts` (use `tests/_shared/`)

## Before opening a PR

1. `pnpm run verify`
2. No secrets in diff
3. Engines: pure functions + Vitest tests in `packages/analysis`
