# GitHub Actions workflows

Overview of CI/CD for the `financial-analysis` monorepo. All install jobs use [setup-monorepo](../actions/setup-monorepo) (pnpm 10, Node 22, frozen lockfile).

## PR / push to `main` or `dev`

| Workflow | When it runs | What it does |
|----------|----------------|--------------|
| [ci.yml](./ci.yml) | Code changes (not doc-only `paths-ignore`) | Duplicates (push only), smoke, typecheck, lint, format, audit, unit tests; Playwright smoke only if web paths changed |
| [pull-request.yml](./pull-request.yml) | Every PR | Duplicate check, dependency review, TruffleHog secret scan |
| [e2e-web.yml](./e2e-web.yml) | PRs touching `apps/web`, `packages/ui`, `packages/analysis`, lockfile, or this workflow | Playwright smoke-matrix (chromium + firefox + webkit + mobile-safari) |
| [dependabot-automerge.yml](./dependabot-automerge.yml) | Dependabot PRs | Auto-approve + squash auto-merge for **patch** and **minor** (majors need manual review) |

**Doc-only PRs** (markdown, `docs/`, templates, legal files): `ci.yml` is skipped via `paths-ignore`; `pull-request.yml` still runs.

## `main` push only

| Workflow | Purpose |
|----------|---------|
| [ci-cd.yml](./ci-cd.yml) | Quality, tests, build artifacts, CodeQL, audit |
| [release.yml](./release.yml) | Changesets version PR / publish |

## Scheduled / manual

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| [e2e-web.yml](./e2e-web.yml) | Mon 12:00 UTC | Weekly web smoke |
| [coverage.yml](./coverage.yml) | Mon 06:00 UTC | Analysis + web coverage → Codecov |
| [mutation.yml](./mutation.yml) | 1st of month 08:00 UTC | Analysis mutation tests |
| [monitor-workers-health.yml](./monitor-workers-health.yml) | Daily | Workers health |
| [monitor-r2-quotas.yml](./monitor-r2-quotas.yml) | Daily | R2 quota checks |

## Deploy

| Workflow | Trigger |
|----------|---------|
| [deploy-preview.yml](./deploy-preview.yml) | PR label `deploy-preview` or manual |
| [deploy-production.yml](./deploy-production.yml) | Manual from `main` (confirmation input) |

## Labels

Create once (repo admin):

```bash
gh label create skip-ci --description "Skip CI workflows (trivial/docs-only PRs)" --color "fef2c0" 2>/dev/null || true
gh label create deploy-preview --description "Deploy Cloudflare preview for this PR" --color "0e8a16" 2>/dev/null || true
```

| Label | Effect |
|-------|--------|
| `skip-ci` | `ci.yml`, `pull-request.yml`, and `e2e-web` jobs exit successfully without running checks (re-run after removing the label) |
| `deploy-preview` | Triggers preview deploy workflow |

## Path behavior

### Web vs workers-only

`ci.yml` skips **Playwright** when the diff has no web-related paths (`apps/web`, `packages/ui`, `packages/analysis`, root lockfile/workspace manifests). Workers-only changes still run API smoke, typecheck, lint, format, audit, and unit tests.

`e2e-web.yml` only triggers on web-related paths (see workflow `paths` filter).

### Doc-only

Both `push` and `pull_request` on `ci.yml` use `paths-ignore` for `**.md`, `docs/**`, issue/PR templates, and legal files.

## Dependabot auto-merge

Requires in **Settings → General**:

- **Allow auto-merge** enabled
- Branch protection with required checks (auto-merge waits for green CI)

Patch and minor Dependabot PRs are approved and queued for squash merge when checks pass. **Major** bumps require manual review.

## Local equivalents

```bash
pnpm run test:ci    # CI without Playwright
pnpm run verify     # Pre-push hook (typecheck, lint, format, unit tests)
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md).
