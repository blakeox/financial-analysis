# Design system (apps/web + packages/ui)

This document describes how visual patterns are split between the Astro app and the shared React UI package, and which primitives to use for new work.

## Two tiers

| Tier | Location | Use for |
|------|----------|---------|
| **App spine (`fa-*`)** | `apps/web/src/styles/global.css` | Calculator template pages, client-script HTML, Astro layouts, workflow rail |
| **React components** | `@financial-analysis/ui` | Islands, dashboards, forms with validation props, charts |

Prefer extending an existing tier over inventing one-off Tailwind blocks in client scripts.

## Page archetypes

### Calculator template (`IndividualCalculatorPage`)

- **Form:** `#calculator-form` from `CALCULATOR_CONFIGS` in `apps/web/src/calculators/` (`configs/personal|business/{id}.ts`, merged in `calculator-configs.ts`; re-exported by `CalculatorTemplate.tsx`)
- **Results rail:** `WorkflowSupportRail.astro` — `#summary-cards`, `#results-section`, optional impact summary when `hasAnalysisEngine(modelType)`
- **Errors:** field-level via `fa-field-error` + `handleCalculatorFormError`; page-level via `#error` / `.fa-callout-danger`

### Journey step

Same rail pattern as calculators; step scripts write into `#summary-cards` when showing KPIs.

### Standalone tool page (`ToolPageShell` + client script)

Use when a model has a dedicated URL outside `/calculator/*` (e.g. `/bond-pricing`, `/cash-flow-analysis`, `/commercial-real-estate-lease`).

- **Layout:** `showChat={false}` and `showToolAnalysis={false}` — chat lives in `WorkflowSupportRail`.
- **Hook:** hidden `<div id="results" aria-hidden="true">` for `storeAnalysisResult` metadata.
- **Grid:** `xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]` with form/dashboard in the left column.
- **Rail:** `<WorkflowSupportRail modelType="…" />` where `modelType` matches `ANALYSIS_ENGINE_MODEL_TYPES` (use overrides like `cca-valuation` for `analyze_cca_valuation`).
- **Client:** call `storeAnalysisResult('analyze_<kebab>', payload)` after each successful run; use `renderMetricCards()` for in-page KPIs when applicable.
- **Lease dashboard:** mount via `lease-analysis-dashboard-host.client.ts` so `persistLeaseAnalysisResult()` wires `analyze_lease` correctly.
- **Landing-only pages** (e.g. `/dcf-analysis`): rail + CTA to `/calculator/dcf-valuation`; no `ClientScriptLoader` unless the page runs a calculation.

### Marketing / static

Layouts use `Layout.astro` tokens; avoid calculator-specific `fa-metric-card` unless displaying numeric KPIs.

## Metric cards (`fa-metric-card`)

KPI tiles in `#summary-cards` should use the shared HTML helper, not ad hoc `bg-violet-50` blocks.

**CSS:** `.fa-metric-card`, tone modifiers (`fa-metric-card-violet`, `emerald`, `orange`, `primary`, `surface`), `.fa-metric-card-title`, `.fa-metric-card-value`, `.fa-metric-card-value-lg`, `.fa-metric-card-meta`

**TypeScript:** `renderMetricCard` / `renderMetricCards` in `apps/web/src/scripts/_shared/metric-card-html.ts`

Prose insight blocks (not KPIs) use `renderInsightCard()` from `apps/web/src/scripts/_shared/insight-card-html.ts` (`fa-highlight-card` or `fa-callout-*`).

Structured detail sections use `renderResultPanel()` / `renderResultRow()` from `apps/web/src/scripts/_shared/result-panel-html.ts`.

Workflow page heroes (calculators + journeys) share `WorkflowHero.astro`; `WorkflowPageIntro` and `JourneyStepHero` are thin wrappers.

Journey steps should use `JourneyStepNavigation.astro` for back/next/complete CTA rows instead of inline per-page navigation markup.

```ts
import { renderMetricCards } from '../_shared/metric-card-html';

summaryCards.innerHTML = renderMetricCards([
  { title: 'Monthly Payment', value: formatCurrency(n), tone: 'violet' },
  { title: 'Total Interest', value: formatCurrency(i), meta: '12% of payments', tone: 'emerald' },
]);
```

**Tones:** `violet` (default KPI), `emerald` (positive / secondary), `orange` or `amber` (caution / comparison), `primary` (hero metric, e.g. payment), `surface` (neutral card with colored value via `fa-metric-card-value-emerald` / `fa-metric-card-value-violet`)

## Rail cards (`fa-rail-card`)

Structured sections in the workflow rail (headers, copy, body). Used in `WorkflowSupportRail.astro`:

- `.fa-rail-card`, `.fa-rail-card-header`, `.fa-rail-card-title`, `.fa-rail-card-copy`, `.fa-rail-card-body`

## Field highlight (chat / AI)

When the chat focuses a form field, apply `.field-highlight` (global CSS, including dark animation). Do not duplicate keyframes in page-level `<style>` blocks.

## Form validation

See [CONTRIBUTING.md](../CONTRIBUTING.md#form-validation-styling). Summary:

- Template inputs: `fa-field-error`, `aria-invalid`, `.field-error[role="alert"]`
- React: `Input` / `CurrencyField` `error` prop from `@financial-analysis/ui`
- Scripts: `handleCalculatorFormError` — no `alert()` for validation

## React UI package

Use for interactive islands:

- **Forms:** `CurrencyField`, `PercentField`, `Input`, `Select` — `inputStateClasses.error`, `textColors.muted` for helper text
- **Metrics:** `EnhancedMetricCard`, charts under `packages/ui/src/components/charts/`
- **Contrast:** `textColors.muted` from `ui-constants`; do not use bare `text-slate-400` on light surfaces (enforced by `check-a11y-contrast.mjs` and ESLint `fa-a11y/prefer-accessible-muted-text`)

Documented further in `packages/ui/docs/financial-forms.mdx`.

## Analysis results events

Client scripts that persist results for the rail should use `dispatchAnalysisResultUpdated` / `storeAnalysisResult` with shape `{ modelType, result, toolName }`. Impact summary in the rail only appears when `hasAnalysisEngine(modelType)` — see `ANALYSIS_ENGINE_MODEL_TYPES` in `analysis-event-contract.ts`. Analyzers live in `financial-analysis-engine.ts`, `financial-analysis-engine-personal.ts`, and `financial-analysis-engine-business.ts`.

## When to add new `fa-*` classes

Add to `global.css` when:

- Three or more pages/scripts repeat the same pattern, or
- The pattern is part of the calculator/journey spine (rail, KPI grid, callouts)

Otherwise use `@financial-analysis/ui` components or existing Tailwind utilities in Astro only.

## Related checks

- `apps/web/scripts/check-a11y-contrast.mjs`, `check-a11y-patterns.mjs`, `check-calculator-hrefs.mjs` (via `pnpm run test:layout` in `apps/web`)
- Playwright a11y: `tests/a11y/`
