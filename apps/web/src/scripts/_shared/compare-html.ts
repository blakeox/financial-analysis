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
  /** When set, wraps toggle + pair for `bindCompareToggle` panel targeting. */
  group?: string;
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

export function renderComparePair({ a, b, className = '', group }: ComparePairOptions): string {
  const classes = ['fa-compare', className].filter(Boolean).join(' ');
  const groupAttr = group ? ` data-compare-root="${group}"` : '';

  const col = (side: 'a' | 'b', colOpts: CompareColumn) => {
    const eyebrow = colOpts.eyebrow ? `<p class="fa-compare-eyebrow">${colOpts.eyebrow}</p>` : '';
    const metric = colOpts.metricHtml ?? '';
    return `<div class="fa-compare-col fa-compare-col-${side}" data-compare-panel="${side}">
      ${eyebrow}
      <h3 class="fa-compare-title">${colOpts.title}</h3>
      ${metric}
      <div class="fa-compare-body">${colOpts.bodyHtml}</div>
    </div>`;
  };

  return `<div class="${classes}"${groupAttr}>
      ${col('a', a)}
      ${col('b', b)}
    </div>`;
}

export interface BindCompareToggleOptions {
  group?: string;
  /** `both` shows A+B; otherwise hide panels that do not match the option id. */
  onChange?: (id: string) => void;
}

/**
 * Wire segmented compare toggles: updates `aria-pressed` and optionally
 * shows/hides `[data-compare-panel]` under the matching `[data-compare-root]`.
 */
export function bindCompareToggle(
  root: ParentNode,
  { group = 'compare', onChange }: BindCompareToggleOptions = {}
): void {
  const buttons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(
      `button[data-compare-group="${group}"][data-compare-option]`
    )
  );
  if (!buttons.length) return;

  const apply = (id: string) => {
    buttons.forEach((btn) => {
      const active = btn.getAttribute('data-compare-option') === id;
      btn.classList.toggle('fa-segmented-button-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    const panelRoots = root.querySelectorAll<HTMLElement>(`[data-compare-root="${group}"]`);
    panelRoots.forEach((panelRoot) => {
      panelRoot.querySelectorAll<HTMLElement>('[data-compare-panel]').forEach((panel) => {
        const panelId = panel.getAttribute('data-compare-panel');
        panel.hidden = id !== 'both' && panelId !== id;
      });
    });

    onChange?.(id);
  };

  buttons.forEach((btn) => {
    if (btn.dataset.compareBound === '1') return;
    btn.dataset.compareBound = '1';
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-compare-option');
      if (!id) return;
      apply(id);
    });
  });

  const initiallyActive =
    buttons.find((b) => b.getAttribute('aria-pressed') === 'true') ?? buttons[0];
  const initialId = initiallyActive?.getAttribute('data-compare-option');
  if (initialId) apply(initialId);
}
