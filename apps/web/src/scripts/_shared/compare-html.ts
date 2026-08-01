/**
 * Lightweight A/B compare layout (#415) — scenario toggle + dual columns.
 * Uses existing `.fa-segmented-*` for the toggle.
 */

export interface CompareOption {
  id: string;
  label: string;
  active?: boolean;
}

export interface CompareColumn {
  title: string;
  bodyHtml: string;
  /** Optional eyebrow (e.g. “Scenario A”). */
  eyebrow?: string;
  metricHtml?: string;
}

export interface ComparePairOptions {
  a: CompareColumn;
  b: CompareColumn;
  className?: string;
}

export function renderCompareToggle(
  options: CompareOption[],
  { name = 'compare', className = '' }: { name?: string; className?: string } = {}
): string {
  if (!options.length) return '';
  const classes = ['fa-segmented-control', 'fa-compare-toggle', className]
    .filter(Boolean)
    .join(' ');

  const buttons = options
    .map((opt) => {
      const active = opt.active ? ' fa-segmented-button-active' : '';
      const pressed = opt.active ? 'true' : 'false';
      return `<button type="button" class="fa-segmented-button${active}" data-compare-option="${opt.id}" data-compare-group="${name}" aria-pressed="${pressed}">${opt.label}</button>`;
    })
    .join('\n');

  return `<div class="${classes}" role="group" aria-label="Compare scenarios">${buttons}</div>`;
}

export function renderComparePair({ a, b, className = '' }: ComparePairOptions): string {
  const classes = ['fa-compare', className].filter(Boolean).join(' ');

  const col = (side: 'a' | 'b', colOpts: CompareColumn) => {
    const eyebrow = colOpts.eyebrow ? `<p class="fa-compare-eyebrow">${colOpts.eyebrow}</p>` : '';
    const metric = colOpts.metricHtml ?? '';
    return `<div class="fa-compare-col fa-compare-col-${side}">
      ${eyebrow}
      <h3 class="fa-compare-title">${colOpts.title}</h3>
      ${metric}
      <div class="fa-compare-body">${colOpts.bodyHtml}</div>
    </div>`;
  };

  return `<div class="${classes}">
      ${col('a', a)}
      ${col('b', b)}
    </div>`;
}
