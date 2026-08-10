# NUC GitHub Actions lane

## Decision

The controlled `automation` NUC is used for repository-specific certification,
not as the default runner for every GitHub Actions job.

- Hosted runners remain the portable baseline for ordinary pull requests,
  forked changes, CodeQL, and supply-chain checks.
- A separate repository runner is registered on the NUC with the labels
  `self-hosted, linux, x64, nuc, financial-analysis`.
- `.github/workflows/nuc-ci.yml` provides a weekly/manual runner smoke and a
  controlled promotion certification lane.
- Promotion certification only executes same-repository, non-draft PRs whose
  branch starts with `feature/promote-nuc-` and targets `main`.
- The NUC check is intentionally not a required branch-protection context until
  the runner registration, smoke run, and one real certification are complete.

This boundary prevents arbitrary fork code from executing on a private network
host while still giving the project a durable, hardware-backed Linux gate.

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

The runner must appear online in **Settings → Actions → Runners** before the
smoke workflow is dispatched. The exact service unit name should be taken from
`svc.sh` output rather than guessed.

## Operating model

1. Dispatch `NUC CI` in `smoke` mode and confirm the runner name, host, Node,
   pnpm, checkout, and disk report.
2. Dispatch it in `verify` mode against `main` and retain the run URL as the
   first NUC evidence receipt.
3. Create a clean promotion branch named
   `feature/promote-nuc-<sha>` only when a maintainer wants the NUC
   certification lane.
4. Open a same-repository PR from that branch to `main` and confirm
   the `nuc-certification` environment approval is granted before
   `NUC / certified` tests the exact PR head SHA.
5. Only after those gates pass should `NUC / certified` be added to
   `.github/branch-protection.json` and synchronized to GitHub.

The `nuc-certification` environment is configured with a required maintainer
reviewer and a deployment branch policy matching `feature/promote-nuc-*`.
Approval occurs before the certification job checks out candidate code.

Promotion certification is a maintainer-controlled operation. The
`feature/promote-nuc-*` prefix is an admission check, not a complete trust
boundary: never use this lane for fork PRs or code that has not received the
required maintainer review. Before making the check required for a public
repository, add an approval environment or move candidate execution to an
ephemeral/containerized runner so a compromised candidate cannot persist on
the NUC host.

## Security and failure controls

- The NUC runner is repository-scoped and uses a dedicated directory and
  service. It must never share the `whisperx-gui` runner checkout or labels.
- No long-lived GitHub token, Cloudflare token, Clerk secret, or 1Password
  credential is installed on the NUC. Actions uses its job-scoped token only
  where needed.
- `pull_request_target` loads the workflow from `main`; candidate code is
  checked out only after the same-repository and branch-prefix boundary passes.
- The `nuc-certification` environment approval is required before the
  persistent NUC job can execute candidate code.
- The promotion lane is deliberately not the ordinary fork-PR path. Its
  persistent-host risk must be reduced with maintainer approval or an
  ephemeral/containerized execution boundary before enforcement expands.
- The most expensive failure is merging code that was not NUC-certified. The
  mitigation is the exact-head checkout and the future required status.
- The silent failure is an offline or mislabeled runner leaving certification
  pending. The weekly smoke detects this; the owner must restore the runner or
  remove the lane from branch protection.
- Kill switch: disable `nuc-ci.yml` or stop only the
  `automation-nuc-financial-analysis` service. Do not stop the existing
  `whisperx-gui` runner.

## Acceptance evidence

Record these values in the related GitHub issue or project item:

- runner name and labels
- workflow run URL and exact commit SHA
- Node and pnpm versions
- disk capacity at admission and completion
- smoke and verification conclusions
- environment approval receipt for promotion certification
- whether `NUC / certified` is required by branch protection

The metric owner is the repository maintainer. Leading indicators are an
online runner and successful weekly smoke; the lagging indicator is the count
of regressions that escaped the hosted and NUC gates.
