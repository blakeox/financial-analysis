# OpenSSF Best Practices badge (enrollment)

Guide for clearing Scorecard alert `CIIBestPracticesID` by enrolling **financial-analysis** at [OpenSSF Best Practices](https://www.bestpractices.dev/).

## Check status (CLI)

```bash
pnpm run check:openssf-badge
# JSON: node scripts/check-openssf-badge.mjs --json
```

Exit **0** when a passing, silver, or gold badge exists for this repo; **1** if not enrolled yet.

**Tracking:** [GitHub issue #318](https://github.com/blakeox/financial-analysis/issues/318)

**Quick path:** [OPENSSF_ENROLLMENT_QUICKSTART.md](./OPENSSF_ENROLLMENT_QUICKSTART.md) (~10 minutes, requires your GitHub login).

## Enroll the project

1. Sign in at [bestpractices.dev](https://www.bestpractices.dev/) (GitHub OAuth) — **Log in with GitHub** on [New project](https://www.bestpractices.dev/en/projects/new).
2. **Create project** → [New project](https://www.bestpractices.dev/en/projects/new).
3. Set **Project URL** to: `https://github.com/blakeox/financial-analysis`
4. Work through the questionnaire using [OPENSSF_BEST_PRACTICES_QUESTIONNAIRE.md](./OPENSSF_BEST_PRACTICES_QUESTIONNAIRE.md) (criterion-by-criterion answers) and the evidence table below.
5. When criteria are satisfied, request **passing** (then silver/gold if desired).
6. Add the badge to [README.md](../README.md) (replace `PROJECT_ID`):

   ```markdown
   [![OpenSSF Best Practices](https://www.bestpractices.dev/projects/PROJECT_ID/badge)](https://www.bestpractices.dev/projects/PROJECT_ID)
   ```

7. Re-run Scorecard on `main` (see [SECURITY_HYGIENE.md](./SECURITY_HYGIENE.md#re-run-scans)).

## Evidence map (passing tier)

Most items are satisfied today; confirm wording on the site matches current `main`.

| Topic | Status | Evidence in repo |
|-------|--------|------------------|
| Public repo | Yes | `https://github.com/blakeox/financial-analysis` |
| License | MIT | [LICENSE](../LICENSE) |
| Version control | GitHub | Default branch `main` |
| Build / CI | Yes | [.github/workflows/ci.yml](../.github/workflows/ci.yml), README CI badge |
| Tests | Yes | `pnpm run verify`, Vitest in packages/workers, Playwright e2e |
| Code review | Policy | [.github/branch-protection.json](../.github/branch-protection.json) — **1** required approval on `main` / `dev` |
| Vulnerability reporting | Yes | [SECURITY.md](../SECURITY.md) |
| CoC | Yes | [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) |
| Contributing guide | Yes | [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Dependency updates | Yes | [.github/dependabot.yml](../.github/dependabot.yml), dependabot-automerge workflow |
| Static analysis (SAST) | Yes | [.github/workflows/codeql.yml](../.github/workflows/codeql.yml) |
| Supply-chain posture | Yes | [.github/workflows/scorecard.yml](../.github/workflows/scorecard.yml), pinned Actions SHAs |
| No committed secrets | Policy | [CONTRIBUTING.md](../CONTRIBUTING.md#security--privacy), CI secret scan |
| Release / versioning | Partial | Tags/releases as you ship; document in questionnaire if not semver-tagged yet |

## Maintainer notes

- **Solo maintainer:** Code review is enforced in branch protection; Scorecard `CodeReviewID` may still flag recent merges without a second human approver — see [SECURITY_HYGIENE.md](./SECURITY_HYGIENE.md).
- **Doc-only PRs:** CodeQL and heavy CI steps may skip; SAST is still configured (see dismissed `SASTID` note in hygiene doc).
- **Badge API:** Scorecard reads the Best Practices API; the badge must be **passing** (or in-progress, for partial credit) on the project URL.

## After passing

1. Add README badge (snippet above).
2. Update [SECURITY_HYGIENE.md](./SECURITY_HYGIENE.md) — set open policy alerts to **0** or dismiss stale `CIIBestPracticesID` if the alert lingers one Scorecard run.
3. Optional: list the project on [scorecard.dev](https://scorecard.dev/) (already have README Scorecard badge).
