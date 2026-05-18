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

Desired rules live in [branch-protection.json](./branch-protection.json). They are applied automatically on push to `main` ([sync-branch-protection.yml](./workflows/sync-branch-protection.yml)). To apply locally with admin `gh` access:

```bash
pnpm run sync:branch-protection
# preview payload only:
node scripts/sync-branch-protection.mjs --dry-run
```

Shared doc/code path rules for CI live in [path-filters.yml](./path-filters.yml).

Default required checks: **PR gate**, **Secret scan**, **CI gate**, **Build and test** (all run on every PR; doc-only PRs skip heavy CI steps but still report success).

## 4. Auto-merge and Dependabot

- **Settings → General → Allow auto-merge** — enabled
- Dependabot config: [.github/dependabot.yml](./dependabot.yml)
- Auto-merge workflow: [dependabot-automerge.yml](./workflows/dependabot-automerge.yml)

## 5. OpenSSF Scorecard

[scorecard.yml](./workflows/scorecard.yml) runs weekly and on relevant pushes to `main`. Results publish to the repo **Security** tab (Code scanning / SARIF) when the workflow has `security-events: write`.

Optional: add the repo to the [OpenSSF Scorecard dashboard](https://scorecard.dev/) for public score tracking.

## 6. Deploy and monitors

| Secret / setting | Used by |
|------------------|---------|
| Cloudflare API token / account | `deploy-preview.yml`, `deploy-production.yml` |
| Slack webhooks (if used) | `monitor-workers-health.yml`, `monitor-r2-quotas.yml` |

See [workflows/README.md](./workflows/README.md) for the full workflow map.
