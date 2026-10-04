# NUC GitHub Actions lane

## Decision

All GitHub Actions jobs for this repository run on the self-hosted NUC runner
with labels `self-hosted`, `nuc`, and `financial-analysis`. There are no
GitHub-hosted (`ubuntu-latest`) jobs.

- Fork pull requests never execute on the NUC. Jobs use
  `github.event.pull_request.head.repo.full_name == github.repository` (or skip
  the workflow entirely for PR-only files).
- Deploy and secret-bearing scheduled monitors run only from trusted triggers
  (same-repository PRs, pushes to protected branches, or `workflow_dispatch`).
- Playwright browser dependencies run inside
  `mcr.microsoft.com/playwright:v1.63.0-jammy` via
  `scripts/ci/run-in-playwright-container.sh` (`--user 1001:1001`, not
  `--privileged`). Transient images are removed after each run.
- Scheduled monitors share concurrency group `nuc-scheduled-monitors` so cron
  jobs queue on the single runner instead of piling up.
- `nuc-ci.yml` retains an optional promotion certification lane
  (`feature/promote-nuc-*`, `pull_request_target`, `nuc-certification`
  environment). The hosted availability heartbeat was removed when CI moved
  entirely to the NUC.

## Register the separate runner

Do not reuse `/opt/actions-runner`, its service, or its credentials. That
directory belongs to the existing `whisperx-gui` runner.

Create a short-lived repository registration token from GitHub, then run the
following on `automation` as `github-runner`. Never commit or log the token.

```bash
sudo install -d -o github-runner -g github-runner /opt/actions-runner-financial-analysis
sudo -u github-runner bash
cd /opt/actions-runner-financial-analysis
curl -L --fail --output actions-runner.tar.gz \
  https://github.com/actions/runner/releases/download/v2.336.0/actions-runner-linux-x64-2.336.0.tar.gz
tar xzf actions-runner.tar.gz
./config.sh \
  --url https://github.com/blakeox/financial-analysis \
  --token '<ephemeral-registration-token>' \
  --name automation-nuc-financial-analysis \
  --labels self-hosted,linux,x64,nuc,financial-analysis \
  --work _work \
  --unattended
exit
sudo /opt/actions-runner-financial-analysis/svc.sh install github-runner
sudo systemctl enable --now actions.runner.blakeox-financial-analysis.automation-nuc-financial-analysis.service
```

The runner must appear online in **Settings → Actions → Runners** before CI
can execute. The exact service unit name should be taken from `svc.sh` output
rather than guessed.

## Host prerequisites (no sudo in jobs)

- `github-runner` (uid **1001**) in the `docker` group for Playwright containers
- `jq` on the host for monitor workflows (jobs fail fast if missing)
- Node/pnpm via `setup-monorepo` or `/home/github-runner/.local/node-v24.18.0/bin`
  for `nuc-ci.yml` smoke paths

## Operating model

1. Dispatch `NUC CI` in `smoke` mode and confirm runner identity.
2. Dispatch `verify` against `main` for a full `pnpm run test:ci` receipt.
3. Optional: open a same-repository `feature/promote-nuc-*` PR for
   `NUC / certified` after enabling the `nuc-certification` environment.

## Security and failure controls

- Never run fork PR code on the NUC; required checks skip until a maintainer
  approves workflow execution for outside contributors.
- `pull_request_target` in `nuc-ci.yml` loads workflow from `main`; candidate
  code is checked out only after same-repository and branch-prefix checks plus
  environment approval.
- Kill switch: stop `automation-nuc-financial-analysis` service only (not
  `whisperx-gui`).

## CodeQL and OpenSSF Scorecard

These workflows run on the NUC for convenience but may fail if GitHub’s
analysis tooling expects hosted-runner images or unavailable host packages.
Treat failures as environmental until the NUC tool chain is validated; they do
not block merges unless added to branch protection.
