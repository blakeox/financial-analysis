/**
 * “The Answer” — hero metric pattern for calculator result surfaces (#410).
 * One dominant tabular number + short meaning + optional next-step CTA.
 * Pair with `renderAssumptionChips` (#414) under the answer.
 */

import { renderAssumptionChips, type AssumptionChip } from './assumption-chip-html';

export interface AnswerCtaOptions {
  label: string;
  href?: string;
  /** Extra attributes string, e.g. `data-action="scroll-schedule"`. */
  attrs?: string;
}

export interface TheAnswerOptions {
  /** Eyebrow / metric label (e.g. “Monthly payment”). */
  label?: string;
  value: string;
  /** One sentence of meaning — not a KPI wall. */
  meaning: string;
  cta?: AnswerCtaOptions;
  assumptions?: AssumptionChip[];
  /** Pre-rendered HTML (e.g. from `renderAssumptionChips`). */
  assumptionsHtml?: string;
  /** When true, apply ink-dry reveal motion (#413). */
  reveal?: boolean;
  className?: string;
}

export function renderTheAnswer({
  label = 'The answer',
  value,
  meaning,
  cta,
  assumptions,
  assumptionsHtml,
  reveal = true,
  className = '',
}: TheAnswerOptions): string {
  const classes = ['fa-answer', reveal ? 'fa-answer-reveal' : '', className]
    .filter(Boolean)
    .join(' ');

  const chipsHtml =
    assumptionsHtml ?? (assumptions?.length ? renderAssumptionChips(assumptions) : '');

  const ctaHtml = cta
    ? cta.href
      ? `<a class="fa-button-primary fa-answer-cta" href="${cta.href}" ${cta.attrs ?? ''}>${cta.label}</a>`
      : `<button type="button" class="fa-button-primary fa-answer-cta" ${cta.attrs ?? ''}>${cta.label}</button>`
    : '';

  return `<div class="${classes}" role="status" aria-live="polite">
      <p class="fa-answer-label">${label}</p>
      <p class="fa-answer-value fa-tabular-nums">${value}</p>
      <p class="fa-answer-meaning">${meaning}</p>
      ${chipsHtml}
      ${ctaHtml ? `<div class="fa-answer-actions">${ctaHtml}</div>` : ''}
    </div>`;
}
