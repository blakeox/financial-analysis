/**
 * Brand chart palette (#412) — Fanalyx tokens, not Tailwind blue/violet guests.
 * Prefer CSS custom properties when the app tokens stylesheet is loaded.
 * Hex fallbacks match `packages/tokens/tokens.css` for Storybook / isolated mounts.
 */

/** Token-backed fills (resolve via `:root` / `.dark`). */
export const chartColors = {
  series1: 'var(--fa-chart-1)',
  series2: 'var(--fa-chart-2)',
  series3: 'var(--fa-chart-3)',
  series4: 'var(--fa-chart-4)',
  series5: 'var(--fa-chart-5)',
  positive: 'var(--fa-chart-positive)',
  negative: 'var(--fa-chart-negative)',
  total: 'var(--fa-chart-total)',
  grid: 'var(--fa-chart-grid)',
  axis: 'var(--fa-chart-axis)',
  surface: 'var(--fa-chart-surface)',
} as const;

/** Solid hex fallbacks when CSS variables are unavailable. */
export const chartColorFallbacks = {
  series1: '#6d4aff',
  series2: '#16a34a',
  series3: '#f59e0b',
  series4: '#4328bb',
  series5: '#0284c7',
  positive: '#16a34a',
  negative: '#e11d48',
  total: '#6d4aff',
  grid: '#e7e4f2',
  axis: '#475569',
  surface: '#ffffff',
} as const;

export type ChartSeriesKey = keyof typeof chartColors;

/**
 * Ordered series palette for multi-series charts (stacked bars, legends).
 */
export const chartSeriesPalette = [
  chartColors.series1,
  chartColors.series2,
  chartColors.series3,
  chartColors.series4,
  chartColors.series5,
] as const;

/**
 * A11y bar checklist (match AmortizationChart):
 * - role="img" (or figure) + descriptive aria-label
 * - Visible axis/tick labels; do not rely on color alone for meaning
 * - Keyboard-focusable legend / period controls when interactive
 * - Prefer pattern/dash fallbacks under forced-colors (document in chart copy)
 * - Tabular nums on value tooltips where money is shown
 */
export const CHART_A11Y_NOTES =
  'Charts must expose role+label, labeled axes, and non-color cues; see AmortizationChart.';
