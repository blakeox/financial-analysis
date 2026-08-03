# GitHub Actions workflows

Overview of CI/CD for the `financial-analysis` monorepo. All install jobs use [setup-monorepo](../actions/setup-monorepo) (pnpm 10, Node 22, frozen lockfile).

## PR / push to `main` or `dev`

| Workflow                                                   | When it runs                                                                    | What it does                                                                                                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [ci.yml](./ci.yml)                                         | Every PR; push when not doc-only `paths-ignore`                                 | Duplicates (push only), smoke, typecheck, lint, format, audit, unit tests; Playwright when web paths change; doc-only PRs skip heavy steps                        |
| [pull-request.yml](./pull-request.yml)                     | Every PR                                                                        | Duplicate check, dependency review, TruffleHog secret scan                                                                                                        |
| [e2e-web.yml](./e2e-web.yml)                               | Every PR (Playwright when web paths change)                                     | **E2E smoke** — smoke-matrix on web PRs; fast pass otherwise                                                                                                      |
| [codeql.yml](./codeql.yml)                                 | Every PR + push to `main`/`dev`                                                 | **CodeQL** — analysis when code changes; fast pass on doc-only PRs                                                                                                |
| [mcp-policy.yml](./mcp-policy.yml)                         | Every PR + push to `main`/`dev`                                                 | **MCP policy** — focused OAuth, OIDC, capability, tenant-isolation, lifecycle, and interoperability checks; auth scripts/workflows are included in path detection |
| [dependabot-automerge.yml](./dependabot-automerge.yml)     | Dependabot PRs                                                                  | Auto-approve + squash auto-merge for **patch** and **minor** (majors need manual review)                                                                          |
| [pr-labeler.yml](./pr-labeler.yml)                         | Every PR                                                                        | Path-based labels (`frontend`, `backend`, `analysis`, `tools`, `github-actions`)                                                                                  |
| [sync-labels.yml](./sync-labels.yml)                       | Push to `main` when [labels.yml](../labels.yml) changes                         | Keeps GitHub labels in sync                                                                                                                                       |
| [sync-branch-protection.yml](./sync-branch-protection.yml) | Push to `main` when [branch-protection.json](../branch-protection.json) changes | Applies branch rules via API                                                                                                                                      |
| [stale.yml](./stale.yml)                                   | Mon 14:00 UTC                                                                   | Marks inactive issues/PRs stale (30d) and closes after 14d more                                                                                                   |
| [scorecard.yml](./scorecard.yml)                           | Mon 08:00 UTC                                                                   | OpenSSF Scorecard supply-chain analysis (SARIF → Security tab)                                                                                                    |

**Doc-only PRs** (markdown, `docs/`, templates, legal files): `ci.yml` and `pull-request.yml` still run; **Build and test** and **PR gate** succeed quickly without install. Duplicate check and dependency review are skipped.

## `main` push only

| Workflow                     | Purpose                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| [ci-cd.yml](./ci-cd.yml)     | Quality, tests, build artifacts, CodeQL, audit                      |
| [release.yml](./release.yml) | Changesets version PR when `.changeset/*.md` exist (no npm publish) |

## Scheduled / manual

| Workflow                                                               | Schedule               | Purpose                                                                                   |
| ---------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------- |
| [e2e-web.yml](./e2e-web.yml)                                           | Mon 12:00 UTC          | Weekly web smoke                                                                          |
| [coverage.yml](./coverage.yml)                                         | Mon 06:00 UTC          | Analysis + web coverage (Codecov when `CODECOV_TOKEN` is set)                             |
| [mutation.yml](./mutation.yml)                                         | 1st of month 08:00 UTC | Analysis mutation tests                                                                   |
| [monitor-workers-health.yml](./monitor-workers-health.yml)             | Daily                  | Workers health with bounded JSON receipt                                                  |
| [cloudflare-boundary-smoke.yml](./cloudflare-boundary-smoke.yml)       | Hourly                 | Machine-readable health, version, MCP, storage, Agent, method, and OAuth boundary receipt |
| [cloudflare-oauth-conformance.yml](./cloudflare-oauth-conformance.yml) | Manual                 | Credential-free OAuth discovery, resource metadata, and dynamic registration conformance  |
| [cloudflare-waf-audit.yml](./cloudflare-waf-audit.yml)                 | Manual                 | Read-only Cloudflare WAF phase-entrypoint audit                                           |
| [provision-clerk-oauth.yml](./provision-clerk-oauth.yml)               | Manual                 | Dry-run or explicitly applied Clerk OIDC/OAuth application reconciliation per environment |
| [link-clerk-user-email.yml](./link-clerk-user-email.yml)               | Manual                 | Dry-run or confirmed same-user email association; never verifies or creates users         |
| [monitor-r2-quotas.yml](./monitor-r2-quotas.yml)                       | Daily                  | R2 quota checks                                                                           |

## Deploy

| Workflow                                         | Trigger                                                                                       |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| [deploy-preview.yml](./deploy-preview.yml)       | PR label `deploy-preview` or manual                                                           |
| [deploy-production.yml](./deploy-production.yml) | Manual from `main` (confirmation, matching preview run, approval reference, and rollback SHA) |

## Labels

Canonical definitions live in [.github/labels.yml](../labels.yml). After merging label changes to `main`, run **Sync GitHub labels** (`sync-labels.yml`) or push to `main` to apply.

| Label                                         | Effect                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `skip-ci`                                     | `ci.yml`, `pull-request.yml`, and `e2e-web` jobs exit successfully without running checks (re-run after removing the label) |
| `deploy-preview`                              | Triggers preview deploy workflow                                                                                            |
| `frontend` / `backend` / `analysis` / `tools` | Applied automatically by [pr-labeler.yml](./pr-labeler.yml) from changed paths                                              |

## Path behavior

### Web vs workers-only

`ci.yml` skips **Playwright** when the diff has no web-related paths (`apps/web`, `packages/ui`, `packages/analysis`, root lockfile/workspace manifests). Workers-only changes still run API smoke, typecheck, lint, format, audit, and unit tests.

`e2e-web.yml` runs on every PR; Playwright runs only when web-related paths change.

### Doc-only

`push` on `ci.yml` uses `paths-ignore` for doc-only paths. `pull_request` always triggers `ci.yml` (doc-only jobs skip heavy steps).

## Dependabot auto-merge

Requires in **Settings → General**:

- **Allow auto-merge** enabled
- Branch protection with required checks (auto-merge waits for green CI)

Patch and minor Dependabot PRs are queued for squash auto-merge when **CI** passes (`dependabot-automerge.yml` runs on PR open and again after the CI workflow completes). No bot approval — branch protection has 0 required reviews. **Major** bumps require manual review.

Dependabot uses a **single root** `npm` entry so `pnpm-lock.yaml` stays in sync; path labels come from `pr-labeler.yml`.

Optional: enable **Settings → Actions → General → Allow GitHub Actions to create and approve pull requests** if you later require PR approvals for auto-merge.

**Dependabot PRs and CI:** Enable **Settings → Actions → General → Run workflows from Dependabot pull requests** so `ci.yml` runs on dependency PRs (auto-merge waits for those checks). Without this, only `pull_request_target` workflows (e.g. auto-merge) run until a maintainer approves workflow execution.

## Repository settings checklist (maintainers)

Full steps: [.github/MAINTAINER_SETUP.md](../MAINTAINER_SETUP.md).

1. **General → Allow auto-merge** — required for Dependabot auto-merge
2. **Actions → Run workflows from Dependabot pull requests** — full CI on dependency PRs
3. **Branch protection** — auto-synced from [.github/branch-protection.json](../branch-protection.json) (`PR gate`, `Secret scan`, `CI gate`, `Build and test`, `E2E smoke`, `CodeQL`, `MCP policy`)
4. **Secrets** — Cloudflare deploy tokens, protected production `CLOUDFLARE_WAF_READ_TOKEN`, optional `CODECOV_TOKEN`; Slack for monitors
5. **Environments** — `preview` / `production` with protection rules if using deploy workflows
6. **Clerk OAuth** — add `CLERK_SECRET_KEY` only to the selected protected GitHub environment before running [provision-clerk-oauth.yml](./provision-clerk-oauth.yml); use dry-run first and require production confirmation for apply

## Local equivalents

```bash
pnpm run test:ci       # CI without Playwright
pnpm run test:ci:full  # test:ci + Playwright smoke (matches CI when web paths change)
pnpm run verify        # Pre-push hook (typecheck, lint, format, unit tests)
```

See [CONTRIBUTING.md](../../CONTRIBUTING.md) and [AGENTS.md](../../AGENTS.md).
