# OpenSSF Best Practices — 10-minute quickstart

Clears Security alert `CIIBestPracticesID` (#84). Full detail: [OPENSSF_BEST_PRACTICES_QUESTIONNAIRE.md](./OPENSSF_BEST_PRACTICES_QUESTIONNAIRE.md).

## Steps

1. Open [Create project](https://www.bestpractices.dev/en/projects/new) → **Log in with GitHub** (browser must be you; agents cannot OAuth for you).

2. **Project URL:** `https://github.com/blakeox/financial-analysis`

3. **Homepage URL:** same as project URL (README is the site description).

4. **License:** MIT — link `https://github.com/blakeox/financial-analysis/blob/main/LICENSE`

5. Work through the **passing** criteria using the [questionnaire cheat sheet](./OPENSSF_BEST_PRACTICES_QUESTIONNAIRE.md). Most answers are already satisfied (CI, CodeQL, SECURITY.md, CONTRIBUTING.md, `v0.1.1` release).

6. **Submit** and request **passing** review on the site.

7. Copy **project ID** from the badge URL: `https://www.bestpractices.dev/projects/<ID>/`

8. Add the README badge (after the Scorecard line), or run:

   ```bash
   pnpm run apply:openssf-badge
   ```

9. Verify locally:

   ```bash
   pnpm run check:openssf-badge   # exit 0 when passing/silver/gold
   gh workflow run "OpenSSF Scorecard" --ref main
   ```

10. Close [issue #318](https://github.com/blakeox/financial-analysis/issues/318). Dismiss alert #84 on the Security tab if it remains after one Scorecard run.

## Verify enrollment anytime

```bash
pnpm run check:openssf-badge
```
