# Slimming `@financial-analysis/ui` (#374)

Target: primitives + approved composites only. Feature dashboards dilute the design system and pull `@financial-analysis/analysis` into the UI package.

## Safe cleanup landed (Wave 5)

| Action | Notes |
|--------|--------|
| Stopped exporting React `ChatPanel` | Production chat is `apps/web/.../ChatPanel.astro`. Source archived under `src/_archived/ChatPanel.tsx`. |
| Deleted `ForecastResults-original.tsx.bak` | Stale Finder/backup artifact. |
| Added `@financial-analysis/ui/primitives` subpath | Curated barrel for Button/Badge/Card/Callout/Input/Select/FieldShell/forms + classNames. |
| Chart defaults | Charts use `chartColors` / `--fa-chart-*` (not guest Tailwind hex). |

## Deferred (still imported by `apps/web` — do not delete yet)

Move these into `apps/web` (or feature packages) before dropping the analysis dependency:

| Export | Consumer(s) |
|--------|-------------|
| `LeaseAnalysisDashboard` (~3.7k LOC) | `lease-analysis-dashboard-host.client.ts` |
| EBITDA managers (`EmployeeManager`, `ExpenseTypesManager`, `FinancialsInputForm`, `ForecastResults`, `ScenarioConfig`, `ModuleSelector`, `ModuleCard`, `FixedAssetsManager`, `LeasesManager`) | `EbitdaDashboard.tsx` |
| `AnalyticsDashboard` + `lib/analytics` + `lib/api-monitor` | `analytics.astro`, `analytics.client.ts` |
| `AmortizationResults` | `AnalysisClient.tsx` |
| `StorageUsageCard` | `status.astro`, `debug.astro` |
| React `Footer` | Unused by app (Astro `site/Footer.astro`); keep until tests/docs migrate |

## Still blocked after moves

1. Remove `@financial-analysis/analysis` from `packages/ui/package.json`.
2. Curate the root `"."` barrel to re-export primitives only (or deprecate it in favor of `/primitives`).
3. Delete `_archived/` once no historical references remain.
