/**
 * Assumption chips under The Answer / results (#414).
 * Chips with `fieldName` focus the related input and apply `.field-highlight`.
 */

export interface AssumptionChip {
  /** Display text, e.g. `30y` or `6.5%`. */
  label: string;
  /** Form field `name` / `id` / `data-field-id` to focus on click. */
  fieldName?: string;
  title?: string;
}

export interface AssumptionChipsOptions {
  chips: AssumptionChip[];
  className?: string;
  /** Accessible label for the chip group. */
  ariaLabel?: string;
}

export function renderAssumptionChip(chip: AssumptionChip): string {
  const titleAttr = chip.title ? ` title="${chip.title}"` : '';
  if (chip.fieldName) {
    return `<button type="button" class="fa-assumption-chip" data-assumption-field="${chip.fieldName}"${titleAttr}>${chip.label}</button>`;
  }
  return `<span class="fa-assumption-chip fa-assumption-chip-static"${titleAttr}>${chip.label}</span>`;
}

export function renderAssumptionChips(
  chipsOrOptions: AssumptionChip[] | AssumptionChipsOptions
): string {
  const options = Array.isArray(chipsOrOptions) ? { chips: chipsOrOptions } : chipsOrOptions;
  const { chips, className = '', ariaLabel = 'Key assumptions' } = options;
  if (!chips.length) return '';

  const chipHtml = chips.map((chip) => renderAssumptionChip(chip)).join('\n');
  const classes = ['fa-assumption-chips', className].filter(Boolean).join(' ');

  return `<div class="${classes}" role="group" aria-label="${ariaLabel}">
      ${chipHtml}
    </div>`;
}

/**
 * Wire click → focus + field-highlight. Call once per page after injecting chips.
 */
export function bindAssumptionChipClicks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-assumption-field]').forEach((chip) => {
    if (chip.dataset.assumptionBound === '1') return;
    chip.dataset.assumptionBound = '1';
    chip.addEventListener('click', () => {
      const fieldName = chip.dataset.assumptionField;
      if (!fieldName) return;
      const field =
        document.querySelector<HTMLElement>(`[name="${fieldName}"]`) ??
        document.getElementById(fieldName) ??
        document.querySelector<HTMLElement>(`[data-field-id="${fieldName}"]`);
      if (!field) return;
      field.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in field && typeof field.focus === 'function') {
        field.focus({ preventScroll: true });
      }
      field.classList.remove('field-highlight');
      // Retrigger animation
      void field.offsetWidth;
      field.classList.add('field-highlight');
      window.setTimeout(() => field.classList.remove('field-highlight'), 2200);
    });
  });
}
