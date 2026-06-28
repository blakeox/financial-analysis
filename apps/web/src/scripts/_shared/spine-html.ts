/**
 * Semantic fa-* class strings for client-script HTML output.
 * Prefer these over raw Tailwind color utilities in innerHTML templates.
 */

export const spineCopyClasses = {
  displaySection: 'fa-display fa-display-section',
  panelTitle: 'fa-panel-title',
  panelTitleLg: 'fa-panel-title text-xl',
  bodyCopy: 'fa-body-copy',
  metaCopy: 'fa-meta-copy',
  listCopy: 'fa-list-copy',
  listCopyStrong: 'fa-list-copy-strong',
  scriptTitle: 'fa-script-title',
  scriptTitleSm: 'fa-script-title-sm',
  scriptCopyStrong: 'fa-script-copy-strong',
  scriptCopySubtle: 'fa-script-copy-subtle',
  scriptCopyMuted: 'fa-script-copy-muted',
  helpCopy: 'fa-help-copy',
  fieldLabel: 'fa-field-label',
  dataTableCell: 'fa-data-table-cell',
  dataTableHeader: 'fa-data-table-header',
} as const;

export type ChipVariant = 'accent' | 'success' | 'warning' | 'danger' | 'muted';

export function chipClass(variant: ChipVariant): string {
  return `fa-chip fa-chip-${variant}`;
}

export function renderChip(label: string, variant: ChipVariant = 'accent'): string {
  return `<span class="${chipClass(variant)}">${label}</span>`;
}

export function renderSectionHeading(title: string, className = 'mb-4'): string {
  return `<h3 class="${spineCopyClasses.panelTitleLg} ${className}">${title}</h3>`;
}

export function renderLegendItem(
  label: string,
  options?: { swatchStyle?: string; swatchClass?: string }
): string {
  const swatchClass = options?.swatchClass ?? 'rounded';
  const swatchStyle = options?.swatchStyle ? ` style="${options.swatchStyle}"` : '';
  return `<span class="inline-flex items-center gap-2 ${spineCopyClasses.listCopyStrong}">
    <span class="inline-block h-4 w-4 ${swatchClass}" aria-hidden="true"${swatchStyle}></span>
    ${label}
  </span>`;
}

export function renderDataTableCell(content: string, align: 'left' | 'right' = 'left'): string {
  const alignClass = align === 'right' ? ' text-right' : '';
  return `<td class="${spineCopyClasses.dataTableCell}${alignClass}">${content}</td>`;
}
