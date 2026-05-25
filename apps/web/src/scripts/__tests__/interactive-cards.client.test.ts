import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { enhanceInteractiveScenarioCards } from '../a11y/interactive-cards.client';

describe('enhanceInteractiveScenarioCards', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('adds button semantics to scenario cards without nested links', () => {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.dataset.scenario = 'home-buying';
    const heading = document.createElement('h3');
    heading.textContent = 'Home buying';
    card.append(heading);
    document.body.append(card);

    enhanceInteractiveScenarioCards();

    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.getAttribute('aria-label')).toBe('Open Home buying');
  });

  it('skips cards wrapped in links', () => {
    const link = document.createElement('a');
    link.href = '/journey/home-buying';
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.dataset.scenario = 'home-buying';
    card.textContent = 'Home buying';
    link.append(card);
    document.body.append(link);

    enhanceInteractiveScenarioCards();

    expect(card.dataset.a11yEnhanced).toBeUndefined();
    expect(card.getAttribute('role')).toBeNull();
  });
});
