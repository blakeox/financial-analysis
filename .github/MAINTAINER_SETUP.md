# Maintainer setup

One-time (or occasional) repository configuration for CI, Dependabot, coverage, and security scanning.

## 1. Dependabot PR workflows

So patch/minor Dependabot PRs run **CI** before auto-merge:

1. Open **Settings → Actions → General**
2. Under **Workflow permissions**, ensure **Read and write permissions** or **Read repository contents and packages permissions** as needed for your workflows
3. Enable **Run workflows from Dependabot pull requests**

Without step 3, only `pull_request_target` workflows (e.g. auto-merge) run until a maintainer approves workflow execution on each Dependabot PR.

## 2. Codecov (optional)

Coverage artifacts are always uploaded from [coverage.yml](../workflows/coverage.yml). To also push to [Codecov](https://about.codecov.io/):

1. Sign in at [codecov.io](https://codecov.io) and add the `blakeox/financial-analysis` repository
2. Copy the repository upload token
3. **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `CODECOV_TOKEN`
   - Value: token from Codecov
4. Re-run **Coverage** (`workflow_dispatch`) or wait for the weekly schedule

## 3. Branch protection

Desired rules live in [branch-protection.json](./branch-protection.json). On push to `main`, [sync-branch-protection.yml](./workflows/sync-branch-protection.yml) applies them when **`REPO_ADMIN_TOKEN`** is set.

**Set or rotate the secret** (repo admin; token needs permission to update branch protection):

```bash
# Classic gh CLI token with repo scope (repo owner/admin):
gh secret set REPO_ADMIN_TOKEN --repo blakeox/financial-analysis --body "$(gh auth token)"

# Or use a fine-grained PAT with Administration: read and write on this repository.
```

Without the secret, apply locally:

```bash
pnpm run sync:branch-protection
# preview payload only:
node scripts/sync-branch-protection.mjs --dry-run
```

Shared doc/code path rules for CI live in [path-filters.yml](./path-filters.yml).

Default required checks: **PR gate**, **Secret scan**, **CI gate**, **Build and test**, **E2E smoke**, **CodeQL** (all run on every PR; doc-only/workers-only PRs skip heavy steps but still report success).

## 4. Auto-merge and Dependabot

- **Settings → General → Allow auto-merge** — enabled
- Dependabot config: [.github/dependabot.yml](./dependabot.yml)
- Auto-merge workflow: [dependabot-automerge.yml](./workflows/dependabot-automerge.yml)

## 5. OpenSSF Scorecard

[scorecard.yml](./workflows/scorecard.yml) runs weekly and on relevant pushes to `main`. Results publish to the repo **Security** tab (Code scanning / SARIF) when the workflow has `security-events: write`.

Optional: add the repo to the [OpenSSF Scorecard dashboard](https://scorecard.dev/) for public score tracking.

**Hygiene log:** [docs/SECURITY_HYGIENE.md](../docs/SECURITY_HYGIENE.md) — remediation PR history, remaining policy alerts, and re-run commands.

**Best Practices badge:** `pnpm run check:openssf-badge` — enrollment guide [docs/OPENSSF_BEST_PRACTICES.md](../docs/OPENSSF_BEST_PRACTICES.md) ([issue #318](https://github.com/blakeox/financial-analysis/issues/318)).

## 6. Deploy and monitors

| Secret / setting                                 | Used by                                                  |
| ------------------------------------------------ | -------------------------------------------------------- |
| `CLOUDFLARE_PREVIEW_API_TOKEN` + account         | `deploy-preview.yml`                                     |
| `CLOUDFLARE_API_TOKEN` + account                 | `deploy-production.yml`                                  |
| `CLOUDFLARE_OBSERVABILITY_TOKEN` + account       | `monitor-workers-health.yml`                             |
| `ADMIN_API_TOKEN` + `PROD_API_URL`               | `monitor-r2-quotas.yml`, `deploy-production.yml`          |
| `FANALYX_SMOKE_TOKEN` (production environment)   | `cloudflare-boundary-smoke.yml`, `deploy-production.yml` |
| `BUDGET_CONFORMANCE_TOKEN` (preview environment) | `cloudflare-budget-conformance.yml`                      |
| Slack webhooks (if used)                         | `monitor-workers-health.yml`, `monitor-r2-quotas.yml`    |

The preview budget canary requires the same randomly generated,
preview-only `BUDGET_CONFORMANCE_TOKEN` in both the GitHub **preview
environment secret** and the API Worker **preview secret binding**. Set it
through the provider UIs or interactive secret commands; never commit it,
print it, or reuse `INTERNAL_API_TOKEN`. The API accepts this credential only
for preview `POST /mcp` requests and maps it to an isolated conformance budget
principal.

See [workflows/README.md](./workflows/README.md) for the full workflow map.

## 7. Controlled NUC runner

The repository has a dedicated NUC workflow, but it must not be enabled as a
required merge check until the host has been registered and evidence exists.

Follow [`docs/NUC_GITHUB_ACTIONS.md`](../docs/NUC_GITHUB_ACTIONS.md) to:

1. register a separate `automation-nuc-financial-analysis` runner on the
   `automation` host;
2. confirm labels `self-hosted, linux, x64, nuc, financial-analysis`;
3. complete `NUC CI` smoke and verification dispatches; and
4. run one controlled `feature/promote-nuc-*` certification PR.

Only after those checks pass should `NUC / certified` be added to
`.github/branch-protection.json` and synchronized to GitHub. Keep ordinary
fork/PR checks on hosted runners.
