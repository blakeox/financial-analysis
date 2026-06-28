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

export type HealthLevel = 'excellent' | 'good' | 'needs-improvement' | 'critical';

export function healthBannerClass(level: HealthLevel): string {
  const map: Record<HealthLevel, string> = {
    excellent: 'fa-callout-success mb-6 p-6',
    good: 'fa-highlight-card mb-6 p-6',
    'needs-improvement': 'fa-callout-warning mb-6 p-6',
    critical: 'fa-callout-danger mb-6 p-6',
  };
  return map[level];
}

export type BenchmarkStatus = 'good' | 'warning' | 'poor';

export function benchmarkStatusChipClass(status: BenchmarkStatus): string {
  const map: Record<BenchmarkStatus, string> = {
    good: 'fa-chip fa-chip-success',
    warning: 'fa-chip fa-chip-warning',
    poor: 'fa-chip fa-chip-danger',
  };
  return map[status];
}

export function scenarioCardClass(isHighlighted: boolean): string {
  return isHighlighted ? 'fa-subcard border-2 border-emerald-500' : 'fa-subcard';
}

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

export function renderDataTableHeaderCell(label: string, align: 'left' | 'right' = 'left'): string {
  const alignClass = align === 'right' ? ' text-right' : '';
  return `<th class="${spineCopyClasses.dataTableHeader}${alignClass}">${label}</th>`;
}

export function renderProgressBar(percent: number): string {
  const width = Math.min(100, Math.max(0, percent));
  return `<div class="fa-progress-track h-2 w-full"><div class="fa-progress-bar" style="width: ${width}%"></div></div>`;
}

export function renderKeyValueRow(label: string, value: string): string {
  return `<div class="flex justify-between gap-4">
    <span class="${spineCopyClasses.scriptCopyMuted}">${label}</span>
    <span class="${spineCopyClasses.scriptCopyStrong}">${value}</span>
  </div>`;
}

export function renderTimelineRow(label: string, value: string): string {
  return `<div class="flex justify-between items-center py-2 fa-panel-divider">
    <span class="${spineCopyClasses.listCopyStrong}">${label}</span>
    <span class="${spineCopyClasses.scriptCopyMuted}">${value}</span>
  </div>`;
}
