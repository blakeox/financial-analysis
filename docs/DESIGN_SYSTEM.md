# Design system (apps/web + packages/ui)

This document describes how visual patterns are split between the Astro app and the shared React UI package, and which primitives to use for new work.

**Live catalog:** [/developers/design-system](/developers/design-system) (buttons, badges, callouts, metric cards, both tiers).

## Two tiers

| Tier | Location | Use for |
|------|----------|---------|
| **App spine (`fa-*`)** | `apps/web/src/styles/` (`components.css` + partials; tokens from package) | Calculator template pages, client-script HTML, Astro layouts, workflow rail |
| **React components** | `@financial-analysis/ui` | Islands, dashboards, forms with validation props, charts |

Prefer extending an existing tier over inventing one-off Tailwind blocks in client scripts.

### Third tier: chat chrome

Chat is intentionally a **third visual tier**, not brand spine:

| Surface | File | Notes |
|---------|------|-------|
| **Chat theme** | `apps/web/src/styles/chat-theme.css` | VS Code–inspired variables (`--vscode-*`); imported only from `ChatPanel.astro` |
| **Panel markup** | `ChatPanel.astro` | Global “Site guide” + embedded “Guided analysis” in `WorkflowSupportRail` |

Do not reuse chat-theme selectors for calculator chrome. Workflow impact summary (`EnhancedAnalysisResults`) uses spine/`fa-*` + React primitives so the rail stays brand-aligned beside chat.

## Design tokens

Single source of truth: **`@financial-analysis/tokens`** (`packages/tokens/tokens.css`).

Imported once by `apps/web/src/styles/global.css`:

```css
@import '@financial-analysis/tokens/tokens.css';
```

Legacy re-export: `apps/web/src/styles/tokens.css` → same package (prefer the package path).

- **Semantic vars:** `--fa-brand`, `--fa-brand-glow`, `--fa-brand-shadow`, `--fa-text-muted`, `--fa-shadow-card`, `--fa-shadow-rail`, `--fa-focus-ring`, etc.
- **Type / motion / z:** `--fa-fs-*`, `--fa-duration-*` / `--fa-ease-*`, `--fa-z-*`, `--fa-radius-pill`
- **Breakpoints:** `--fa-bp-sm/md/lg/xl` (40/48/64/80rem — Tailwind-aligned). Media queries must use literals that match these values (CSS custom properties are invalid in `@media`).
- **Status surfaces:** `--fa-status-{success,warning,danger,info}-{fg,bg}`
- **Muted copy:** one hex — `--fa-text-muted` (`#475569` light / `#94a3b8` dark). `--color-gray-600`, `--color-muted-text`, `--color-soft-text`, and `fa-meta-copy` resolve to it.
- **Ambient light:** `--fa-brand-glow` / `--fa-brand-glow-soft` (color-mix from brand); optional `--fa-surface-grain` (~2%, off under `forced-colors`).
- **Palette:** `--color-primary-*`, `--color-gray-*` (purple-tinted brand)
- **Homepage aliases:** `--color-navy`, `--color-purple`, etc. are aliases of `--color-gray-900` / `--fa-brand` / related tokens — keep for landing/`fa-home-*`; prefer `--fa-*` in new work.
- **Tailwind bridge:** `@theme` block exposes `bg-brand`, `text-text-muted`, `shadow-card`, `shadow-rail`, etc.

React primitives in `packages/ui/src/lib/classNames.ts` compose spine `fa-*` classes (Button → `fa-button-*`, Badge → `fa-badge-*`, Card → `fa-card` / modifiers, Callout → `fa-callout-*`) so both tiers share one surface. Change brand purple once in the tokens package to update both tiers.

**Button aliases:** prefer canonical `danger` / `ghost`. `destructive` ≡ `danger`, `tertiary` ≡ `ghost` remain for back-compat.

**Token change checklist:**

1. Edit `packages/tokens/tokens.css`
2. Update `REQUIRED_CONTRAST_PAIRS` in `packages/ui/src/lib/a11y-contrast.ts` if text colors change
3. Run `pnpm run test:layout` in `apps/web` and `pnpm run verify` at repo root

## Copy ladder

Prefer this hierarchy for new copy (spine + React):

| Role | Spine class | React (`copyClasses` / size) |
|------|-------------|------------------------------|
| **display** | `fa-display`, `fa-display-section` | large headings |
| **body** | `fa-body-copy` | default body |
| **meta** | `fa-meta-copy` | `copyClasses.helper` (`text-sm` + muted) |
| **caption** | `fa-script-note` / help copy | `copyClasses.caption` (`text-xs` + muted) |

**Deprecated aliases:** `fa-script-copy-muted`, `fa-script-copy-strong`, `fa-script-copy-subtle` remain for existing client scripts — do not add new uses; migrate toward the ladder when touching a file.

Status text/surfaces: use `--fa-status-*-fg/bg` or `statusSurfaces` / `textColors.success|danger|warning` — do not mass-migrate emerald utility classes.

## Page shells

| Class | Max width token | Typical use |
|-------|-----------------|-------------|
| `.fa-page-shell` | `--fa-shell` (= `--fa-bp-xl` / 80rem) | Calculators, journeys, tools |
| `.fa-page-shell-narrow` | `--fa-shell-narrow` (= `--fa-bp-lg` / 64rem) | Legal, blog, 404 |
| `.fa-page-shell-wide` | `--fa-shell-wide` (96rem) | Dense dashboards / catalogs |

Workflow two-column layout: `.fa-workflow-grid` switches at **80rem** (`--fa-bp-xl`).

## Catalog notes (retain)

- **`.fa-toast-*`** and **`.fa-accordion*`** remain in `spine.css` for existing surfaces — do not delete without a usage audit; catalog later if unused.
- Client-script Tailwind color baseline: `check-client-script-colors.mjs` — emerald leaks in helpers should use `fa-*` (e.g. `scenarioCardClass` → `fa-subcard-highlighted`). Broad script emerald cleanup is out of scope for token Wave 2.

## CSS file layout

```
packages/tokens/
└── tokens.css           # :root, .dark, @theme (SSOT)

apps/web/src/styles/
├── global.css           # @import hub (tailwindcss + tokens package + partials)
├── tokens.css           # thin re-export of @financial-analysis/tokens
├── utilities.css        # gpu, safe-bottom, bg-linear-to-r, etc.
├── base.css             # body, skip-link, reduced-motion
├── a11y-forced-colors.css # forced-colors / prefers-contrast (#409)
├── chat-theme.css       # ChatPanel VS Code sub-theme (third tier; #373)
├── components.css       # @import hub for fa-* partials
└── components/
    ├── spine.css        # layout shells, cards, workflow, typography copy
    ├── buttons.css      # fa-button-*, fa-actions
    ├── forms.css        # fa-field-*, fa-input-surface, fa-checkbox, fa-form-*
    ├── home.css         # fa-home-* landing page typography
    └── navbar.css       # #site-nav.modern-nav scoped styles
```

## Page archetypes

### Calculator template (`IndividualCalculatorPage`)

- **Form:** `#calculator-form` from `CALCULATOR_CONFIGS` in `apps/web/src/calculators/` (`configs/personal|business/{id}.ts`, merged in `calculator-configs.ts`; re-exported by `CalculatorTemplate.tsx`)
- **Results rail:** `WorkflowSupportRail.astro` — `#summary-cards`, `#results-section`, optional impact summary when `hasAnalysisEngine(modelType)`
- **Errors:** field-level via `fa-field-error` + `handleCalculatorFormError`; page-level via `#error` / `.fa-callout-danger`

### Journey step

Same rail pattern as calculators; step scripts write into `#summary-cards` when showing KPIs.

**Layout:** wrap main + sidebar/rail columns in `.fa-workflow-grid` (form column + tips/rail). Calculator-backed fallback steps use `JourneyCalculatorPage`, which already uses this grid with `WorkflowSupportRail`.

**Contract:** every dedicated `journey/**/step/*.astro` page must mount `WorkflowSupportRail` (or `JourneyCalculatorPage`), use `.fa-workflow-grid`, and set `showChat={false}` so chat is not double-mounted. Enforced by `journey-support-rail-contract.test.ts`.

Optional tip cards go in the rail via `<div slot="tips">…</div>` on `WorkflowSupportRail` (prefer `fa-rail-card` / `fa-card`, not a second aside).

### Standalone tool page (`ToolPageShell` + client script)

Use when a model has a dedicated URL outside `/calculator/*` (e.g. `/bond-pricing`, `/cash-flow-analysis`, `/commercial-real-estate-lease`).

- **Layout:** `showChat={false}` and `showToolAnalysis={false}` — chat lives in `WorkflowSupportRail`.
- **Hook:** hidden `<div id="results" aria-hidden="true">` for `storeAnalysisResult` metadata.
- **Grid:** `.fa-workflow-grid` with form/dashboard in the left column.
- **Rail:** `<WorkflowSupportRail modelType="…" />` where `modelType` matches `ANALYSIS_ENGINE_MODEL_TYPES` (use overrides like `cca-valuation` for `analyze_cca_valuation`).
- **Client:** call `storeAnalysisResult('analyze_<kebab>', payload)` after each successful run; use `renderMetricCards()` for in-page KPIs when applicable.
- **Lease dashboard:** mount via `lease-analysis-dashboard-host.client.ts` so `persistLeaseAnalysisResult()` wires `analyze_lease` correctly.
- **Landing-only pages** (e.g. `/dcf-analysis`): rail + CTA to `/calculator/dcf-valuation`; no `ClientScriptLoader` unless the page runs a calculation.

### Marketing / static

Layouts use `Layout.astro` tokens; avoid calculator-specific `fa-metric-card` unless displaying numeric KPIs.

Site chrome footer is static Astro (`components/site/Footer.astro`) — not the React `Footer` island.

## Heroes

| Hero | Use for | Type |
|------|---------|------|
| **`PageHero.astro`** | Marketing / catalog / tools (`fa-page-hero` + `fa-display` Fraunces) | Questions & product pages |
| **`WorkflowHero.astro`** | Calculators + journey steps (title inside `fa-card`, progress optional) | Workflow stage |

Chip tone prop is `badgeTone?: 'accent' | 'muted'` (legacy `blue`/`slate` still accepted).

## Forced colors / contrast

`apps/web/src/styles/a11y-forced-colors.css` (imported from `global.css`) provides minimal High Contrast Mode support:

- **`forced-colors: active`:** `fa-button-*`, `fa-input-surface`, `fa-callout-*`, `fa-card` / `fa-rail-card` / `fa-answer` / `fa-compare-col` get `currentColor` borders (and Canvas/CanvasText where needed). `.field-highlight` and `.fa-assumption-chip` use Highlight/ButtonText.
- **`prefers-contrast: more`:** border width strengthened to 2px on the same primitives.

Keep this file additive — do not fold forced-color rules into Wave 1–2 token edits.

## Data tables

One pattern for tabular results:

| Piece | Role |
|-------|------|
| **`.fa-data-table`** | Table chrome (borders, header fill) |
| **`.fa-data-table-header` / `.fa-data-table-cell`** | Cells — helpers in `spine-html.ts` (`renderDataTableHeader` / `renderDataTableCell`) |
| **Overflow** | Astro: `role="region"` + `aria-label` + `tabindex="0"` + `overflow-x-auto`. React islands: `ScrollableRegion` from `@financial-analysis/ui` |

Calculator amortization schedule (`IndividualCalculatorPage`) uses this pattern. Do not invent new `divide-slate-*` table chrome.

## Metric cards (`fa-metric-card`)

KPI tiles in `#summary-cards` should use the shared HTML helper, not ad hoc `bg-violet-50` blocks.

**CSS:** `.fa-metric-card`, tone modifiers (`fa-metric-card-violet`, `emerald`, `orange`, `primary`, `surface`), `.fa-metric-card-title`, `.fa-metric-card-value`, `.fa-metric-card-value-lg`, `.fa-metric-card-meta`

**TypeScript:** `renderMetricCard` / `renderMetricCards` in `apps/web/src/scripts/_shared/metric-card-html.ts`

Prose insight blocks (not KPIs) use `renderInsightCard()` from `apps/web/src/scripts/_shared/insight-card-html.ts` (`fa-highlight-card` or `fa-callout-*`).

Structured detail sections use `renderResultPanel()` / `renderResultRow()` from `apps/web/src/scripts/_shared/result-panel-html.ts`.

### The Answer (hero metric) — Wave 4

First results viewport: **one** tabular hero number, **one** meaning sentence, optional assumption chips, **one** primary next step — not a KPI wall.

**Answer budget:** Do not place competing KPI tiles above The Answer in the first results viewport. Secondary metrics may sit below.

**CSS:** `.fa-answer`, `.fa-answer-label`, `.fa-answer-value`, `.fa-answer-meaning`, `.fa-answer-reveal` (ink-dry motion)

**TypeScript:** `renderTheAnswer()` in `apps/web/src/scripts/_shared/answer-html.ts`

**Assumption chips:** `.fa-assumption-chip` + `renderAssumptionChips()` / `bindAssumptionChipClicks()` in `assumption-chip-html.ts` (chip click focuses field + `.field-highlight`).

**Compare A/B:** `.fa-compare` + `renderComparePair()` / `renderCompareToggle()` in `compare-html.ts` (uses `.fa-segmented-*`).

### Tabular lining figures

`--fa-font-numeric` + `.fa-tabular-nums` (`font-variant-numeric: tabular-nums lining-nums`). Applied to metric values, The Answer, result rows, `CurrencyField` / `PercentField` (`numericInputClasses`).

### Signature motion (exactly 3)

1. **Ink-dry reveal** — `.fa-answer-reveal` / `@keyframes fa-ink-dry` (~`--fa-duration-normal`)
2. **Field highlight** — `.field-highlight` / `@keyframes fa-field-highlight` (chat + assumption chips)
3. **Journey progress** — `.fa-progress-bar` width transition (`--fa-duration-slow`)

`prefers-reduced-motion: reduce` kills decorative animation (see `base.css`).

### Chart palette + a11y

`--fa-chart-1`…`--fa-chart-5`, positive/negative/total/grid/axis in `@financial-analysis/tokens`. React: `chartColors` / `chartSeriesPalette` from `@financial-analysis/ui`. DualAxis / Waterfall / Stacked defaults use brand tokens (not `#2563eb` / violet).

**A11y bar (match AmortizationChart):** `role="img"` + aria-label; labeled axes; do not rely on color alone; keyboard-focusable controls when interactive; pattern/dash notes under forced-colors.

Workflow page heroes (calculators + journeys) share `WorkflowHero.astro`; `WorkflowPageIntro` and `JourneyStepHero` are thin wrappers.

Journey steps should use `JourneyStepNavigation.astro` for back/next/complete CTA rows instead of inline per-page navigation markup.

**Journey routing:** `journeyStepRouting.ts` and `journeyStepAvailability.ts` decide when a model link stays on a marketing/tool URL vs. the journey shell (`/journey/{scenario}/step/{id}`). Calculator-backed steps without a dedicated `.astro` page use the `[stepId].astro` fallback (`JourneyCalculatorPage`). Known tool-only handoffs (e.g. `/ebitda-forecasting`, `/bond-pricing`) stay on their original URLs and are listed in `journey-routing-contract.test.ts`.

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

### Autofill + RTL readiness (#381)

- **Autofill:** `.fa-input-surface` uses `:-webkit-autofill` / `:autofill` with token inset shadows (`forms.css`). React `Input` / financial fields use `inputClasses` with `autofill:shadow-[inset_0_0_0_1000px_var(--fa-surface-elevated)]` so browser yellow/blue fill does not break brand chrome.
- **RTL:** Product is **LTR English-only** today (`dir` is not set to `rtl`). Full RTL is **not supported**. When adding layout, prefer logical CSS (`padding-inline`, `margin-inline`, `inset-inline-*`) over physical `left`/`right` so a future pass is cheaper. Mirrored nav/chevron icons, chart axis label order, and currency affix placement would all need an explicit RTL checklist before claiming support.

## React UI package

Use for interactive islands:

- **Primitives:** prefer `@financial-analysis/ui/primitives` — `Button`, `Card`, `Badge`, `Callout`, `Input`, `Select`, `FieldShell`, `Tabs`, forms helpers
- **Root barrel:** still exports feature dashboards (lease / EBITDA / analytics) until moved — see `packages/ui/SLIM.md` (#374)
- **Forms:** `CurrencyField`, `PercentField` — share `FieldShell` for label/helper/error; `inputStateClasses.error`, `textColors.muted` for helper text
- **Metrics:** `EnhancedMetricCard`, charts under `packages/ui/src/components/charts/` (brand defaults via `chartColors` / `--fa-chart-*`)
- **Contrast:** `textColors.muted` from `classNames.ts`; do not use bare `text-slate-400` on light surfaces (enforced by `check-a11y-contrast.mjs` and ESLint `fa-a11y/prefer-accessible-muted-text`)
- **Status:** prefer `statusSurfaces` / `textColors.success|danger|warning` (token-backed) over new emerald utility pairs
- **Theme:** light/dark helpers live in `apps/web/src/scripts/_shared/theme.ts` (`THEME_BOOT_INLINE` for Layout FOUC, `toggleTheme` for showcase; nav mirrors the same storage key)

Variant contracts live in `packages/ui/src/lib/primitiveContracts.ts` with enforcement tests (assert `fa-*` / `var(--fa-*)`).

Documented further in `packages/ui/docs/financial-forms.mdx`.

## Styling exceptions

Allowed page-level / island `<style>` blocks (do not add more without updating this list):

- **`ChatPanel.astro` / `chat-theme.css`** — VS Code–inspired sub-theme (third tier). Intentionally separate from Fanalyx brand tokens; CSS lives in `apps/web/src/styles/chat-theme.css`.
- **Homepage** (`.landing-page` in `index.astro`) — scoped landing aliases; shared homepage typography uses `fa-home-*` classes backed by `@financial-analysis/tokens`.
- **AdSense / ad layout islands** — third-party embed layout only.

## Package CSS / sideEffects

`@financial-analysis/tokens` ships CSS with `"sideEffects": ["**/*.css"]` and exports `./tokens.css`.

`packages/ui` currently ships JS-only primitives (`"sideEffects": false`). When CSS is added for primitives composing `fa-*` or `@financial-analysis/tokens`:

1. Set `"sideEffects": ["**/*.css"]` (or list exact CSS entry paths) in `packages/ui/package.json`.
2. Export CSS via `package.json` `"exports"` (e.g. `"./styles.css"`).
3. Import that CSS once from the app spine (`global.css` or layout), not per-island.

## Analysis results events

Client scripts that persist results for the rail should use `dispatchAnalysisResultUpdated` / `storeAnalysisResult` with shape `{ modelType, result, toolName }`. Impact summary in the rail only appears when `hasAnalysisEngine(modelType)` — see `ANALYSIS_ENGINE_MODEL_TYPES` in `analysis-event-contract.ts`. Analyzers live in `financial-analysis-engine.ts`, `financial-analysis-engine-personal.ts`, and `financial-analysis-engine-business.ts`.

## When to add new `fa-*` classes

Add to `apps/web/src/styles/components.css` (via the `@layer components` block) when:

- Three or more pages/scripts repeat the same pattern, or
- The pattern is part of the calculator/journey spine (rail, KPI grid, callouts)

Otherwise use `@financial-analysis/ui` components or existing Tailwind utilities in Astro only.

## Related checks

- `apps/web/scripts/check-a11y-contrast.mjs`, `check-a11y-patterns.mjs`, `check-client-script-colors.mjs` (baseline — blocks new raw Tailwind colors in `.client.ts` HTML output), `check-calculator-hrefs.mjs` (via `pnpm run test:layout` in `apps/web`)
- Playwright a11y: `tests/a11y/`
- Design system catalog: `tests/site/design-system.spec.ts` (light + dark screenshots)
- ESLint: `fa-a11y/prefer-accessible-muted-text`, `fa-a11y/no-adhoc-violet-metric-blocks`, `fa-a11y/no-violet-in-ui-primitives`
