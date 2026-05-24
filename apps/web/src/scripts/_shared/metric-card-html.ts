/**
 * HTML helpers for KPI tiles in calculator result rails (`#summary-cards`).
 */

export type MetricCardTone = 'violet' | 'emerald' | 'amber' | 'orange' | 'primary' | 'surface';

export interface MetricCardOptions {
  title: string;
  value: string;
  meta?: string;
  tone?: MetricCardTone;
  valueClassName?: string;
  spanCols?: 2;
}

function toneClass(tone: MetricCardTone): string {
  if (tone === 'surface') return 'fa-metric-card-surface';
  if (tone === 'primary') return 'fa-metric-card-primary';
  return `fa-metric-card-${tone}`;
}

export function renderMetricCard({
  title,
  value,
  meta,
  tone = 'violet',
  valueClassName = 'fa-metric-card-value',
  spanCols,
}: MetricCardOptions): string {
  const spanClass = spanCols === 2 ? ' col-span-2' : '';
  const metaHtml = meta ? `<p class="fa-metric-card-meta">${meta}</p>` : '';

  return `<div class="fa-metric-card ${toneClass(tone)}${spanClass}">
      <h5 class="fa-metric-card-title">${title}</h5>
      <p class="${valueClassName}">${value}</p>
      ${metaHtml}
    </div>`;
}

export function renderMetricCards(cards: MetricCardOptions[]): string {
  return cards.map((card) => renderMetricCard(card)).join('\n');
}
