# GitHub Actions workflows

Overview of CI/CD for the `financial-analysis` monorepo. All install jobs use [setup-monorepo](../actions/setup-monorepo) (pnpm 10, Node 22, frozen lockfile).

## PR / push to `main` or `dev`

| Workflow | When it runs | What it does |
|----------|----------------|--------------|
| [ci.yml](./ci.yml) | Code changes (not doc-only `paths-ignore`) | Duplicates (push only), smoke, typecheck, lint, format, audit, unit tests; Playwright smoke only if web paths changed |
| [pull-request.yml](./pull-request.yml) | Every PR | Duplicate check, dependency review, TruffleHog secret scan |
| [e2e-web.yml](./e2e-web.yml) | PRs touching `apps/web`, `packages/ui`, `packages/analysis`, lockfile, or this workflow | Playwright smoke-matrix (chromium + firefox + webkit + mobile-safari) |
| [dependabot-automerge.yml](./dependabot-automerge.yml) | Dependabot PRs | Auto-approve + squash auto-merge for **patch** and **minor** (majors need manual review) |
| [pr-labeler.yml](./pr-labeler.yml) | Every PR | Path-based labels (`frontend`, `backend`, `analysis`, `tools`, `github-actions`) |
| [sync-labels.yml](./sync-labels.yml) | Push to `main` when [labels.yml](../labels.yml) changes | Keeps GitHub labels in sync |
| [stale.yml](./stale.yml) | Mon 14:00 UTC | Marks inactive issues/PRs stale (30d) and closes after 14d more |

**Doc-only PRs** (markdown, `docs/`, templates, legal files): `ci.yml` is skipped via `paths-ignore`; `pull-request.yml` runs secret scan only (no duplicate check or dependency review).

## `main` push only

| Workflow | Purpose |
|----------|---------|
| [ci-cd.yml](./ci-cd.yml) | Quality, tests, build artifacts, CodeQL, audit |
| [release.yml](./release.yml) | Changesets version PR when `.changeset/*.md` exist (no npm publish) |

## Scheduled / manual

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| [e2e-web.yml](./e2e-web.yml) | Mon 12:00 UTC | Weekly web smoke |
| [coverage.yml](./coverage.yml) | Mon 06:00 UTC | Analysis + web coverage (Codecov when `CODECOV_TOKEN` is set) |
| [mutation.yml](./mutation.yml) | 1st of month 08:00 UTC | Analysis mutation tests |
| [monitor-workers-health.yml](./monitor-workers-health.yml) | Daily | Workers health |
| [monitor-r2-quotas.yml](./monitor-r2-quotas.yml) | Daily | R2 quota checks |

## Deploy

| Workflow | Trigger |
|----------|---------|
| [deploy-preview.yml](./deploy-preview.yml) | PR label `deploy-preview` or manual |
| [deploy-production.yml](./deploy-production.yml) | Manual from `main` (confirmation input) |

## Labels

Canonical definitions live in [.github/labels.yml](../labels.yml). After merging label changes to `main`, run **Sync GitHub labels** (`sync-labels.yml`) or push to `main` to apply.

| Label | Effect |
|-------|--------|
| `skip-ci` | `ci.yml`, `pull-request.yml`, and `e2e-web` jobs exit successfully without running checks (re-run after removing the label) |
| `deploy-preview` | Triggers preview deploy workflow |
| `frontend` / `backend` / `analysis` / `tools` | Applied automatically by [pr-labeler.yml](./pr-labeler.yml) from changed paths |

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

Patch and minor Dependabot PRs are queued for squash auto-merge when **CI** passes (`dependabot-automerge.yml` runs on PR open and again after the CI workflow completes). No bot approval — branch protection has 0 required reviews. **Major** bumps require manual review.

Dependabot uses a **single root** `npm` entry so `pnpm-lock.yaml` stays in sync; path labels come from `pr-labeler.yml`.

Optional: enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** if you later require PR approvals for auto-merge.

**Dependabot PRs and CI:** Enable **Settings → Actions → General → Run workflows from Dependabot pull requests** so `ci.yml` runs on dependency PRs (auto-merge waits for those checks). Without this, only `pull_request_target` workflows (e.g. auto-merge) run until a maintainer approves workflow execution.

## Repository settings checklist (maintainers)

1. **General → Allow auto-merge** — required for Dependabot auto-merge
2. **Branches → `main` / `dev` protection** — require `build-and-test` (or job name from `ci.yml`), PR reviews, up-to-date branch
3. **Secrets** — Cloudflare tokens for deploy workflows; optional `CODECOV_TOKEN`, Slack webhooks for monitors
4. **Environments** — `preview` / `production` with protection rules if using deploy workflows

## Local equivalents

```bash
pnpm run test:ci       # CI without Playwright
pnpm run test:ci:full  # test:ci + Playwright smoke (matches CI when web paths change)
pnpm run verify        # Pre-push hook (typecheck, lint, format, unit tests)
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md).
