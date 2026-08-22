# Security hygiene (maintainers)

Living record of code-scanning remediation for **blakeox/financial-analysis**. For vulnerability reporting, see [SECURITY.md](../SECURITY.md). For CI setup, see [.github/MAINTAINER_SETUP.md](../.github/MAINTAINER_SETUP.md).

## Current posture (2026-05-26)

| Metric                                         | Status                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Open **CodeQL** (JavaScript/TypeScript) alerts | **0**                                                                                                               |
| Open **Scorecard policy** alerts               | **0** (`CIIBestPracticesID` dismissed — enroll to prevent reopen; [quickstart](./OPENSSF_ENROLLMENT_QUICKSTART.md)) |
| Dependabot                                     | Enabled; patch/minor auto-merge via workflow                                                                        |
| CodeQL workflow                                | [.github/workflows/codeql.yml](../.github/workflows/codeql.yml)                                                     |
| OpenSSF Scorecard                              | [.github/workflows/scorecard.yml](../.github/workflows/scorecard.yml) → SARIF on Security tab                       |

### Dependency remediation notes

`@cloudflare/puppeteer` releases through `1.4.0` pin `@puppeteer/browsers@2.2.4`,
which pulls `extract-zip@2.0.1`. That package has a high-severity symlink
extraction advisory with no upstream patched release. The API now uses
`@cloudflare/puppeteer@^1.4.0` and scopes an override to
`@cloudflare/puppeteer>@puppeteer/browsers` at `3.2.1`, whose maintained
extraction path removes `extract-zip`. This is intentionally scoped rather
than a global Puppeteer override. The project and NUC runner must use Node
`>=22.12.0`, matching the replacement package's engine requirement.

The override is a compatibility control to bridge an upstream pin, not a
permanent fork. Remove it after a Cloudflare Puppeteer release adopts a
maintained browser-helper version, then rerun the full NUC audit and build
gate before merging.

### Remaining open alerts (Scorecard policy)

These are **not** fixable by a single code change. They reflect OpenSSF Scorecard checks uploaded as SARIF (same severity as CodeQL in the Security tab).

| Alert                  | Rule ID              | Why it remains                                                                                                                                                                                                                                                                                                                                                        | Practical remediation                                                    |
| ---------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| ~~Code-Review~~        | `CodeReviewID`       | **Dismissed (won’t fix, 2026-05-26):** Solo-maintainer; branch protection still requires **1** approval on `main`/`dev`. Scorecard’s ~30-merge heuristic flags emergency self-merges documented below.                                                                                                                                                                | Add a second maintainer if you want Scorecard green without dismissal.   |
| ~~CII Best Practices~~ | `CIIBestPracticesID` | **Dismissed (won’t fix, 2026-05-26):** Badge needs maintainer OAuth at [bestpractices.dev](https://www.bestpractices.dev/en/projects/new); criteria documented in [#318](https://github.com/blakeox/financial-analysis/issues/318) and [quickstart](./OPENSSF_ENROLLMENT_QUICKSTART.md). May **reopen** after Scorecard until `pnpm run check:openssf-badge` exits 0. | Complete enrollment and request **passing**; re-run Scorecard on `main`. |
| ~~SAST~~               | `SASTID`             | **Dismissed (false positive, 2026-05-26):** CodeQL is configured; Scorecard reported “27/30 commits” with SAST because doc-only / path-filter skips do not run analyze on every commit.                                                                                                                                                                               | No action unless alert reopens after Scorecard upload.                   |

## Remediation timeline (merged PRs)

| PR                                                                                                                            | Focus                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [#302](https://github.com/blakeox/financial-analysis/pull/302)                                                                | Pinned Actions SHAs, scoped `GITHUB_TOKEN`, monitor workflow hygiene, branch protection review count, API/chat hardening                                |
| [#303](https://github.com/blakeox/financial-analysis/pull/303)–[#306](https://github.com/blakeox/financial-analysis/pull/306) | CodeQL init/analyze SHA pins; Scorecard SARIF-only upload (`publish_results: false`)                                                                    |
| [#307](https://github.com/blakeox/financial-analysis/pull/307)                                                                | Error handler, validation (markers vs regex), chat HTML escape, analytics stack removal, auth hosts                                                     |
| [#311](https://github.com/blakeox/financial-analysis/pull/311)                                                                | Safe logging (no raw `Error` objects), MCP responses without Zod issue leakage, marker threat detection, auth hostname checks, sitemap pathname parsing |
| [#313](https://github.com/blakeox/financial-analysis/pull/313)                                                                | `advanced-security` marker detectors; API validation = control-char strip only                                                                          |
| [#314](https://github.com/blakeox/financial-analysis/pull/314)                                                                | Lease print export: DOM `textContent` / JSON in `<pre>` instead of `document.write` HTML                                                                |

**Alert count trajectory:** ~90 open → ~31 → 14 → 8 → 3 → 2 → 1 → **0** open (all policy alerts dismissed or resolved; enroll for badge to keep Scorecard green).

## Code patterns introduced (for future PRs)

- **Logging:** log `error.message` (and safe fields), not full `Error` / stack in production paths (`workers/api/src/lib/request-context.ts`, error handler).
- **API keys:** unbiased hex from `crypto.getRandomValues` (`workers/api/src/lib/auth.ts`).
- **Auth hosts:** `fanalyx.com` and single-label `*.fanalyx.com` via hostname **label count**, not `endsWith` alone.
- **Validation:** `stripControlCharacters` + marker-based `detectThreats` in `workers/api/src/lib/validation.ts` (avoid ReDoS-prone regex chains).
- **Web advanced-security:** detector functions, not `RegExp`, in `apps/web/src/scripts/_shared/advanced-security.ts`.
- **Chat UI:** `textContent` / escaped labels in `chat-panel.ts`; avoid `innerHTML` with user content.
- **Same-origin links:** `toSafeSameOriginHref()` for mortgage scenario exports.

## Dismissals (stale / false positive)

Many historical alerts were dismissed after merge to `main` when:

- Line numbers pointed at **old** code already fixed on `main`.
- CodeQL flagged safe APIs (`textContent`, `crypto.randomUUID()`).
- Scorecard duplicated checks already satisfied by branch protection or CodeQL.

Use GitHub’s **Dismiss alert** with a short rationale; prefer **false positive** only after verifying current `main`.

## Re-run scans

```bash
gh workflow run "CodeQL" --ref main
gh workflow run "OpenSSF Scorecard" --ref main
gh api 'repos/blakeox/financial-analysis/code-scanning/alerts?state=open&per_page=100' \
  --jq '[.[] | {number, rule: .rule.id, path: .most_recent_instance.location.path}]'
```

## Solo-maintainer merge workflow

Branch protection requires **1** approving review on `main` / `dev`. To merge your own security PRs:

1. `node scripts/sync-branch-protection.mjs` (sets review count from [.github/branch-protection.json](../.github/branch-protection.json), temporarily `0` if configured for merge).
2. Merge when CI is green.
3. Restore `required_approving_review_count: 1` and sync again.

This unblocks delivery but **hurts** Scorecard **Code-Review** until a second human reviewer participates.

## Related docs

- [OPENSSF_BEST_PRACTICES.md](./OPENSSF_BEST_PRACTICES.md) — badge enrollment checklist (clears `CIIBestPracticesID`)
- [SECURITY.md](../SECURITY.md) — reporting vulnerabilities
- [PHASE2_SECURITY_IMPROVEMENTS.md](./PHASE2_SECURITY_IMPROVEMENTS.md) / [PHASE3_SECURITY_IMPROVEMENTS.md](./PHASE3_SECURITY_IMPROVEMENTS.md) — feature-era security notes
- [CHAT_SECURITY_ROADMAP.md](./CHAT_SECURITY_ROADMAP.md) — chat-specific roadmap
