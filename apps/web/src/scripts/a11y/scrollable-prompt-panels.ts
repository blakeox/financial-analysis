/**
 * Makes `.fa-prompt-panel` scroll regions keyboard-focusable (axe scrollable-region-focusable / Safari).
 */

export function enhanceScrollablePromptPanel(panel: HTMLElement): void {
  if (panel.dataset.a11yScrollEnhanced === 'true') return;

  panel.dataset.a11yScrollEnhanced = 'true';
  if (!panel.hasAttribute('tabindex')) {
    panel.setAttribute('tabindex', '0');
  }
  if (!panel.hasAttribute('role')) {
    panel.setAttribute('role', 'region');
  }
  if (!panel.hasAttribute('aria-label')) {
    panel.setAttribute('aria-label', 'Code sample');
  }
}

export function enhanceScrollablePromptPanels(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.fa-prompt-panel').forEach(enhanceScrollablePromptPanel);
}
