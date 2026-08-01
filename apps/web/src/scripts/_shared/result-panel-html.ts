/**
 * HTML helpers for structured result sections in calculator detail panels.
 */

import { spineCopyClasses } from './spine-html';

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
  return `<div class="flex justify-between items-center py-2 fa-panel-divider">
      <span class="${spineCopyClasses.scriptCopySubtle}">${label}</span>
      <span class="${spineCopyClasses.scriptCopyStrong} font-semibold fa-tabular-nums">${value}</span>
    </div>`;
}
