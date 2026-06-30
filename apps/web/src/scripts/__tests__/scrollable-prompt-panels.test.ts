import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enhanceScrollablePromptPanels } from '../a11y/scrollable-prompt-panels';

describe('enhanceScrollablePromptPanels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds region semantics to fa-prompt-panel elements', () => {
    const panel = document.createElement('div');
    panel.className = 'fa-prompt-panel mb-6';
    panel.textContent = '{ "error": "INVALID_INPUT" }';
    document.body.append(panel);

    enhanceScrollablePromptPanels();

    expect(panel.getAttribute('tabindex')).toBe('0');
    expect(panel.getAttribute('role')).toBe('region');
    expect(panel.getAttribute('aria-label')).toBe('Code sample');
  });

  it('does not override existing aria-label', () => {
    const panel = document.createElement('pre');
    panel.className = 'fa-prompt-panel';
    panel.setAttribute('aria-label', 'API request example');
    document.body.append(panel);

    enhanceScrollablePromptPanels();

    expect(panel.getAttribute('aria-label')).toBe('API request example');
  });
});
