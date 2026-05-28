/**
 * HTML helpers for structured result sections in calculator detail panels.
 */

export interface ResultPanelOptions {
  title: string;
  bodyHtml: string;
  className?: string;
}

export function renderResultPanel({
  title,
  bodyHtml,
  className = 'mb-8',
}: ResultPanelOptions): string {
  return `<div class="fa-card p-6 ${className}">
      <h3 class="fa-script-title text-xl mb-6">${title}</h3>
      ${bodyHtml}
    </div>`;
}

export function renderResultRow(label: string, value: string): string {
  return `<div class="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800">
      <span class="fa-script-copy-subtle">${label}</span>
      <span class="fa-script-copy-strong font-semibold">${value}</span>
    </div>`;
}
