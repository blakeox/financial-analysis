/**
 * HTML helpers for prose insight / callout blocks in calculator result panels.
 */

export type InsightCardTone = 'info' | 'success' | 'warning' | 'danger';

function toneClass(tone: InsightCardTone): string {
  if (tone === 'info') return 'fa-highlight-card';
  return `fa-callout-${tone}`;
}

export interface InsightCardOptions {
  content: string;
  tone?: InsightCardTone;
  className?: string;
  title?: string;
  /** When true, `content` is HTML (not wrapped in a paragraph). */
  html?: boolean;
}

export function renderInsightCard({
  content,
  tone = 'info',
  className = '',
  title,
  html = false,
}: InsightCardOptions): string {
  const classes = [toneClass(tone), className].filter(Boolean).join(' ');
  const titleHtml = title ? `<h4 class="fa-script-title-sm mb-2">${title}</h4>` : '';
  const bodyHtml = html
    ? `<div class="fa-script-copy-muted text-sm">${content}</div>`
    : `<p class="fa-script-copy-muted text-sm">${content}</p>`;
  return `<div class="${classes}">${titleHtml}${bodyHtml}</div>`;
}
