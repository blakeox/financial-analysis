import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

type InteractionType = 'pointer' | 'keyboard' | 'programmatic';

type ModelMetadata = {
  id: string | null;
  name: string | null;
  description: string | null;
  status: 'available' | 'coming-soon';
  ctaHref: string | null;
  ctaLabel: string | null;
  features: string[];
};

type ScrollIntoViewMock = ReturnType<typeof vi.fn<(options?: ScrollIntoViewOptions) => void>>;

declare global {
  interface Window {
    selectModel?: (element: HTMLElement, modelId?: string, interactionType?: InteractionType) => void;
    selectModelById?: (modelId: string, interactionType?: InteractionType) => boolean;
    selectedModel?: () => string | null;
    clearSelection?: () => void;
    selectedModelData?: () => ModelMetadata | Record<string, unknown> | null;
    focusSelectedModelCard?: () => boolean;
    focusSelectedModelInfo?: () => boolean;
    modelSelection?: {
      select: (element: HTMLElement, modelId?: string, interactionType?: InteractionType) => void;
      selectById: (modelId: string, interactionType?: InteractionType) => boolean;
      clear: () => void;
      getSelectedModel: () => string | null;
      getSelectedModelData: () => ModelMetadata | null;
      focusSelectedCard: () => boolean;
      focusInfoPanel: () => boolean;
      openChatPanel: () => void;
      adjustLayoutForChat: (isOpen: boolean) => void;
      destroy: () => void;
    };
  }
}

describe('models.client selection behavior', () => {
  let scrollSpy: ScrollIntoViewMock;
  let reduceMotionMatches = false;
  let mediaListeners: Array<(event: MediaQueryListEvent) => void> = [];
  const originalMatchMedia = window.matchMedia;

  const setupDom = () => {
    document.body.innerHTML = '';
    mediaListeners = [];

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn((query: string) => {
        const targetQuery = '(prefers-reduced-motion: reduce)';
        const updateListeners = (listener: (event: MediaQueryListEvent) => void, action: 'add' | 'remove') => {
          if (query !== targetQuery || typeof listener !== 'function') {
            return;
          }

          if (action === 'add') {
            mediaListeners.push(listener);
          } else {
            mediaListeners = mediaListeners.filter((fn) => fn !== listener);
          }
        };

        return {
          get matches() {
            return query === targetQuery && reduceMotionMatches;
          },
          media: query,
          onchange: null,
          addListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
            updateListeners(listener, 'add');
          }),
          removeListener: vi.fn((listener: (event: MediaQueryListEvent) => void) => {
            updateListeners(listener, 'remove');
          }),
          addEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
            if (type === 'change') {
              updateListeners(listener, 'add');
            }
          }),
          removeEventListener: vi.fn((type: string, listener: (event: MediaQueryListEvent) => void) => {
            if (type === 'change') {
              updateListeners(listener, 'remove');
            }
          }),
          dispatchEvent: vi.fn((event: MediaQueryListEvent) => {
            if (query !== targetQuery) {
              return false;
            }
            for (const listener of mediaListeners) {
              listener(event);
            }
            return true;
          }),
        };
      }),
    });

    const mainContainer = document.createElement('div');
    mainContainer.id = 'main-container';
    document.body.appendChild(mainContainer);

    const infoSection = document.createElement('div');
    infoSection.id = 'selected-model-info';
    infoSection.classList.add('hidden');
    scrollSpy = vi.fn<(options?: ScrollIntoViewOptions) => void>();
    (infoSection as unknown as { scrollIntoView: (options?: ScrollIntoViewOptions) => void }).scrollIntoView = scrollSpy;

    const header = document.createElement('div');
    const titleElement = document.createElement('h2');
    titleElement.id = 'selected-model-title';
    header.appendChild(titleElement);

    const statusBadge = document.createElement('span');
    statusBadge.id = 'selected-model-status';
    statusBadge.classList.add('hidden');
    header.appendChild(statusBadge);
    infoSection.appendChild(header);

    const clearButton = document.createElement('button');
    clearButton.type = 'button';
    clearButton.addEventListener('click', () => window.clearSelection?.());
    infoSection.appendChild(clearButton);

    const descriptionElement = document.createElement('p');
    descriptionElement.id = 'selected-model-description';
    infoSection.appendChild(descriptionElement);

  const featuresElement = document.createElement('ul');
  featuresElement.id = 'selected-model-features';
  featuresElement.classList.add('hidden');
  infoSection.appendChild(featuresElement);

    const ctaElement = document.createElement('a');
    ctaElement.id = 'selected-model-cta';
    ctaElement.hidden = true;
    infoSection.appendChild(ctaElement);

    mainContainer.appendChild(infoSection);

    type CardConfig = {
      label: string;
      id: string;
      description: string;
      status: 'available' | 'coming-soon';
      ctaHref?: string;
      ctaLabel?: string;
    };

    const createCard = (config: CardConfig) => {
      const card = document.createElement('div');
      card.className = 'model-card';
      card.dataset.model = config.label;
      card.dataset.modelId = config.id;
      card.dataset.modelDescription = config.description;
      card.dataset.modelStatus = config.status;
      if (config.ctaHref) {
        card.dataset.modelCtaHref = config.ctaHref;
      }
      if (config.ctaLabel) {
        card.dataset.modelCtaLabel = config.ctaLabel;
      }
      card.tabIndex = 0;

      const feature = document.createElement('div');
      feature.setAttribute('data-model-feature', '');
      feature.textContent = `${config.label} feature`;
      card.appendChild(feature);

  const featureTwo = document.createElement('div');
  featureTwo.setAttribute('data-model-feature', '');
  featureTwo.textContent = `${config.label} insights`;
  card.appendChild(featureTwo);

      const cta = document.createElement('a');
      cta.setAttribute('data-model-cta', '');
      cta.textContent = config.ctaLabel ?? 'Coming Soon';
      if (config.ctaHref) {
        cta.href = config.ctaHref;
      }
      card.appendChild(cta);

      mainContainer.appendChild(card);
      return card;
    };

    const firstCard = createCard({
      label: 'Personal Mortgage Analyzer',
      id: 'personal-mortgage-analyzer',
      description: 'Deterministic mortgage analysis with schedules.',
      status: 'available',
      ctaHref: '/analysis',
      ctaLabel: 'Open Model',
    });

    const secondCard = createCard({
      label: 'Second Scenario',
      id: 'second-scenario',
      description: 'Scenario planning coming soon.',
      status: 'coming-soon',
    });

    return { infoSection, firstCard, secondCard, ctaElement };
  };

  const loadModule = async () => {
    await import('../models.client');
  };

  beforeEach(async () => {
    vi.resetModules();
    reduceMotionMatches = false;
    setupDom();
    await loadModule();
    scrollSpy.mockClear();
  });

  afterAll(() => {
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: originalMatchMedia,
      });
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('scrolls selected info into view when focused via keyboard navigation', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();
    const secondCard = document.querySelectorAll<HTMLElement>('.model-card')[1];
    const infoRegion = document.getElementById('selected-model-info');
    expect(card?.parentElement?.getAttribute('role')).toBe('tablist');
    expect(card?.parentElement?.getAttribute('aria-orientation')).toBe('horizontal');
    expect(infoRegion?.getAttribute('role')).toBe('tabpanel');
    expect(infoRegion?.getAttribute('aria-live')).toBe('polite');
    expect(infoRegion?.getAttribute('aria-labelledby')).toBe('selected-model-title');
    expect(infoRegion?.getAttribute('aria-describedby')).toBe('selected-model-description');
    expect(document.getElementById('selected-model-status')?.getAttribute('role')).toBe('status');
    expect(document.getElementById('selected-model-status')?.getAttribute('aria-live')).toBe('polite');
    expect(document.getElementById('selected-model-status')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.getElementById('selected-model-features')?.getAttribute('aria-hidden')).toBe('true');

    card?.dispatchEvent(new Event('focus'));

    expect(scrollSpy).toHaveBeenCalledTimes(1);
  expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
    expect(document.getElementById('selected-model-title')?.textContent).toBe(
      'Selected: Personal Mortgage Analyzer',
    );
    expect(document.getElementById('selected-model-info')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('selected-model-info')?.getAttribute('aria-hidden')).toBe('false');
    expect(document.getElementById('selected-model-description')?.textContent).toBe(
      'Deterministic mortgage analysis with schedules.',
    );
    expect(document.getElementById('selected-model-status')?.textContent).toBe('Available');
    expect(document.getElementById('selected-model-status')?.getAttribute('aria-hidden')).toBe('false');
    expect(document.getElementById('selected-model-features')?.getAttribute('aria-hidden')).toBe('false');
    expect(card?.getAttribute('aria-selected')).toBe('true');
    expect(card?.getAttribute('aria-controls')).toBe('selected-model-info');
    expect(secondCard?.getAttribute('aria-selected')).toBe('false');
    expect(card?.tabIndex).toBe(0);
    expect(secondCard?.tabIndex).toBe(-1);

    const features = Array.from(
      document.querySelectorAll('#selected-model-features li')
    ).map((node) => node.textContent);
    expect(features).toEqual([
      'Personal Mortgage Analyzer feature',
      'Personal Mortgage Analyzer insights',
    ]);

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta?.hidden).toBe(false);
    expect(cta?.getAttribute('href')).toBe('/analysis');
    expect(cta?.textContent?.trim()).toBe('Open Model');
    expect(cta?.getAttribute('aria-disabled')).toBe('false');
  });

  it('avoids scrolling when selection is triggered by pointer interaction', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    window.dispatchEvent(new Event('pointerdown'));
    card?.dispatchEvent(new Event('focus'));

    expect(scrollSpy).not.toHaveBeenCalled();
    expect(window.selectedModel?.()).toBe('Personal Mortgage Analyzer');

    window.dispatchEvent(new Event('pointerup'));
  });

  it('treats subsequent focus after pointer selection as keyboard interaction', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    window.dispatchEvent(new Event('pointerdown'));
    card?.dispatchEvent(new Event('focus'));

    // pointer-origin focus should not scroll
    expect(scrollSpy).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('pointerup'));
    scrollSpy.mockClear();

    // Focus again without pointer context should behave like keyboard navigation
    card?.dispatchEvent(new Event('focus'));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'nearest' });
  });

  it('supports keyboard activation via Enter key', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    const keyboardEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    card?.dispatchEvent(keyboardEvent);

    expect(window.selectedModel?.()).toBe('Personal Mortgage Analyzer');
  });

  it('moves focus into the info panel when pressing ArrowDown', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    card?.dispatchEvent(arrowDownEvent);

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(document.activeElement).toBe(cta);
  });

  it('falls back to the first interactive control when the CTA cannot be focused', () => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.model-card'));
    expect(cards).toHaveLength(2);

    const [, secondCard] = cards;
    secondCard.dispatchEvent(new Event('focus'));

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta?.getAttribute('aria-disabled')).toBe('true');

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    secondCard.dispatchEvent(arrowDownEvent);

    const clearButton = document.querySelector<HTMLButtonElement>('#selected-model-info button');
    expect(clearButton).not.toBeNull();
    expect(document.activeElement).toBe(clearButton);
  });

  it('focuses the info panel when no interactive controls can receive focus', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta).not.toBeNull();
    if (cta) {
      cta.hidden = true;
      cta.removeAttribute('href');
      cta.setAttribute('aria-disabled', 'true');
    }

    const clearButton = document.querySelector<HTMLButtonElement>('#selected-model-info button');
    expect(clearButton).not.toBeNull();
    if (clearButton) {
      clearButton.disabled = true;
      clearButton.setAttribute('aria-disabled', 'true');
    }

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    card?.dispatchEvent(arrowDownEvent);

    const infoPanel = document.getElementById('selected-model-info');
    expect(infoPanel).not.toBeNull();
    expect(infoPanel?.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(infoPanel);
  });

  it('removes temporary panel focusability once an actionable CTA is restored', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta).not.toBeNull();

    if (cta) {
      cta.hidden = true;
      cta.removeAttribute('href');
      cta.setAttribute('aria-disabled', 'true');
    }

    const clearButton = document.querySelector<HTMLButtonElement>('#selected-model-info button');
    expect(clearButton).not.toBeNull();

    if (clearButton) {
      clearButton.disabled = true;
      clearButton.setAttribute('aria-disabled', 'true');
    }

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    card?.dispatchEvent(arrowDownEvent);

    const infoPanel = document.getElementById('selected-model-info');
    expect(infoPanel?.getAttribute('tabindex')).toBe('-1');

    if (cta) {
      cta.hidden = false;
      cta.href = '/analysis';
      cta.setAttribute('aria-disabled', 'false');
    }

    if (clearButton) {
      clearButton.disabled = false;
      clearButton.removeAttribute('aria-disabled');
    }

    card?.dispatchEvent(new Event('focus'));

    expect(infoPanel?.hasAttribute('tabindex')).toBe(false);
  });

  it('returns focus to the selected card when ArrowUp is pressed inside the info panel', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    card?.dispatchEvent(arrowDownEvent);

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta).not.toBeNull();
    expect(document.activeElement).toBe(cta);

    const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
    cta?.dispatchEvent(arrowUpEvent);

    expect(document.activeElement).toBe(card);
  });

  it('moves focus from the info panel back to the CTA when ArrowDown is pressed', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta).not.toBeNull();

    const clearButton = document.querySelector<HTMLButtonElement>('#selected-model-info button');
    expect(clearButton).not.toBeNull();

    if (cta) {
      cta.hidden = true;
      cta.removeAttribute('href');
      cta.setAttribute('aria-disabled', 'true');
    }

    if (clearButton) {
      clearButton.disabled = true;
      clearButton.setAttribute('aria-disabled', 'true');
    }

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    card?.dispatchEvent(arrowDownEvent);

    const infoPanel = document.getElementById('selected-model-info');
    expect(document.activeElement).toBe(infoPanel);

    if (cta) {
      cta.hidden = false;
      cta.href = '/analysis';
      cta.setAttribute('aria-disabled', 'false');
    }

    if (clearButton) {
      clearButton.disabled = false;
      clearButton.removeAttribute('aria-disabled');
    }

    const panelArrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    infoPanel?.dispatchEvent(panelArrowDownEvent);

    expect(document.activeElement).toBe(cta);
  });

  it('supports arrow key navigation between cards', () => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.model-card'));
    expect(cards).toHaveLength(2);

    const [firstCard, secondCard] = cards;

    firstCard.dispatchEvent(new Event('focus'));
    expect(firstCard.tabIndex).toBe(0);
    expect(secondCard.tabIndex).toBe(-1);

    const arrowRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    firstCard.dispatchEvent(arrowRightEvent);

    expect(document.activeElement).toBe(secondCard);
    expect(secondCard.getAttribute('aria-selected')).toBe('true');
    expect(secondCard.tabIndex).toBe(0);
    expect(firstCard.tabIndex).toBe(-1);

    const arrowLeftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    secondCard.dispatchEvent(arrowLeftEvent);

    expect(document.activeElement).toBe(firstCard);
    expect(firstCard.tabIndex).toBe(0);
    expect(secondCard.tabIndex).toBe(-1);

    const arrowLeftAtStartEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    firstCard.dispatchEvent(arrowLeftAtStartEvent);

    expect(document.activeElement).toBe(firstCard);
    expect(firstCard.tabIndex).toBe(0);
    expect(secondCard.tabIndex).toBe(-1);

    const homeEvent = new KeyboardEvent('keydown', { key: 'Home', bubbles: true });
    secondCard.dispatchEvent(homeEvent);

    expect(document.activeElement).toBe(firstCard);
    expect(firstCard.tabIndex).toBe(0);
    expect(secondCard.tabIndex).toBe(-1);

    const endEvent = new KeyboardEvent('keydown', { key: 'End', bubbles: true });
    firstCard.dispatchEvent(endEvent);

    expect(document.activeElement).toBe(secondCard);
    expect(secondCard.tabIndex).toBe(0);
    expect(firstCard.tabIndex).toBe(-1);
  });

  it('removes hover highlight classes when selecting a card', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    // Simulate hover to apply highlight classes
    card?.dispatchEvent(new Event('mouseenter'));
    expect(card?.classList.contains('ring')).toBe(true);
    expect(card?.classList.contains('ring-offset-1')).toBe(true);
    expect(card?.classList.contains('ring-gray-200')).toBe(true);

    // Click should select the card and clear hover styling
    card?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(card?.classList.contains('ring')).toBe(false);
    expect(card?.classList.contains('ring-offset-1')).toBe(false);
    expect(card?.classList.contains('ring-gray-200')).toBe(false);
    expect(card?.classList.contains('ring-2')).toBe(true);
    expect(card?.classList.contains('ring-blue-500')).toBe(true);
  });

  it('allows programmatic selection without triggering scroll', () => {
    const secondCard = document.querySelectorAll<HTMLElement>('.model-card')[1];
    const firstCard = document.querySelectorAll<HTMLElement>('.model-card')[0];
    expect(secondCard).toBeDefined();

    scrollSpy.mockClear();
  window.selectModel?.(secondCard, undefined, 'programmatic');

    expect(scrollSpy).not.toHaveBeenCalled();
    expect(document.getElementById('selected-model-title')?.textContent).toBe('Selected: Second Scenario');
    expect(document.getElementById('selected-model-status')?.textContent).toBe('Coming Soon');
  expect(document.getElementById('selected-model-info')?.getAttribute('aria-hidden')).toBe('false');
  expect(document.getElementById('selected-model-status')?.getAttribute('aria-hidden')).toBe('false');
  expect(document.getElementById('selected-model-features')?.getAttribute('aria-hidden')).toBe('false');
    expect(secondCard?.getAttribute('aria-selected')).toBe('true');
    expect(firstCard?.getAttribute('aria-selected')).toBe('false');
  expect(secondCard?.tabIndex).toBe(0);
  expect(firstCard?.tabIndex).toBe(-1);

    const features = Array.from(
      document.querySelectorAll('#selected-model-features li')
    ).map((node) => node.textContent);
    expect(features).toEqual(['Second Scenario feature', 'Second Scenario insights']);

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta?.hidden).toBe(false);
    expect(cta?.hasAttribute('href')).toBe(false);
    expect(cta?.getAttribute('aria-disabled')).toBe('true');
    expect(cta?.classList.contains('cursor-not-allowed')).toBe(true);
  });

  it('exposes a namespaced selection API on window', () => {
    expect(window.modelSelection).toBeDefined();

    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    const selection = window.modelSelection;
    selection?.select(card as HTMLElement, undefined, 'keyboard');
    expect(selection?.getSelectedModel()).toBe('Personal Mortgage Analyzer');
    const metadata = selection?.getSelectedModelData();
    expect(metadata).toMatchObject({
      id: 'personal-mortgage-analyzer',
      status: 'available',
    });
    expect(metadata?.features).toEqual([
      'Personal Mortgage Analyzer feature',
      'Personal Mortgage Analyzer insights',
    ]);

    expect(selection?.focusSelectedCard()).toBe(true);
    expect(document.activeElement).toBe(card);

    const infoFocusResult = selection?.focusInfoPanel();
    expect(infoFocusResult).toBe(true);
    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(document.activeElement).toBe(cta);

    expect(window.focusSelectedModelInfo?.()).toBe(true);
    expect(document.activeElement).toBe(cta);

    selection?.clear();
    expect(selection?.getSelectedModel()).toBeNull();
    expect(selection?.getSelectedModelData()).toBeNull();
    expect(selection?.focusSelectedCard()).toBe(false);
    expect(selection?.focusInfoPanel()).toBe(false);
    expect(window.focusSelectedModelInfo?.()).toBe(false);

    expect(selection?.selectById('second-scenario', 'programmatic')).toBe(true);
    expect(selection?.getSelectedModel()).toBe('Second Scenario');
    expect(window.selectModelById?.('second-scenario', 'programmatic')).toBe(true);
    expect(window.selectModelById?.('unknown-model')).toBe(false);
    expect(selection?.focusSelectedCard()).toBe(true);
    const secondCard = document.querySelectorAll<HTMLElement>('.model-card')[1];
    expect(document.activeElement).toBe(secondCard);
  });

  it('respects reduced motion preferences when scrolling into view', () => {
    reduceMotionMatches = true;
    for (const listener of mediaListeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }

    scrollSpy.mockClear();

    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));

    expect(scrollSpy).toHaveBeenCalledWith({ block: 'nearest' });
  });

  it('updates reduced motion preference when the media query changes', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    card?.dispatchEvent(new Event('focus'));
    expect(scrollSpy).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'nearest' });

    reduceMotionMatches = true;
    for (const listener of mediaListeners) {
      listener({ matches: true } as MediaQueryListEvent);
    }

    scrollSpy.mockClear();
    card?.dispatchEvent(new Event('focus'));
    expect(scrollSpy).toHaveBeenLastCalledWith({ block: 'nearest' });
  });

  it('clears selection when Escape is pressed', () => {
    const firstCard = document.querySelectorAll<HTMLElement>('.model-card')[0];
    expect(firstCard).toBeDefined();

    firstCard.dispatchEvent(new Event('focus'));
    expect(window.selectedModel?.()).toBe('Personal Mortgage Analyzer');

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(window.selectedModel?.()).toBeNull();
    expect(document.getElementById('selected-model-info')?.classList.contains('hidden')).toBe(true);
  expect(document.getElementById('selected-model-info')?.getAttribute('aria-hidden')).toBe('true');
  expect(document.getElementById('selected-model-status')?.classList.contains('hidden')).toBe(true);
  expect(document.getElementById('selected-model-status')?.getAttribute('aria-hidden')).toBe('true');
  const features = document.getElementById('selected-model-features');
  expect(features?.classList.contains('hidden')).toBe(true);
  expect(features?.childElementCount).toBe(0);
  expect(features?.getAttribute('aria-hidden')).toBe('true');
    const cta = document.getElementById('selected-model-cta');
    expect(cta?.hidden).toBe(true);
    const cards = document.querySelectorAll<HTMLElement>('.model-card');
    expect(cards[0]?.getAttribute('aria-selected')).toBe('false');
    expect(cards[1]?.getAttribute('aria-selected')).toBe('false');
    expect(cards[0]?.tabIndex).toBe(0);
    expect(cards[1]?.tabIndex).toBe(-1);
  });

  it('cleans up global references and listeners when destroyed', () => {
    const card = document.querySelector<HTMLElement>('.model-card');
    expect(card).not.toBeNull();

    window.modelSelection?.destroy();

    expect(window.modelSelection).toBeUndefined();
    expect(window.selectModel).toBeUndefined();
    expect(window.clearSelection).toBeUndefined();

    card?.dispatchEvent(new Event('focus'));

    expect(card?.classList.contains('ring-2')).toBe(false);
    expect(document.getElementById('selected-model-info')?.classList.contains('hidden')).toBe(true);
  expect(document.getElementById('selected-model-info')?.getAttribute('aria-hidden')).toBe('true');
    expect(document.getElementById('selected-model-status')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('selected-model-status')?.getAttribute('aria-hidden')).toBe('true');
    expect(card?.getAttribute('aria-selected')).toBe('false');

    const cta = document.getElementById('selected-model-cta') as HTMLAnchorElement | null;
    expect(cta?.hidden).toBe(true);

    const features = document.getElementById('selected-model-features');
  expect(features?.classList.contains('hidden')).toBe(true);
  expect(features?.childElementCount).toBe(0);
  expect(features?.getAttribute('aria-hidden')).toBe('true');

    const cards = document.querySelectorAll<HTMLElement>('.model-card');
    expect(cards[0]?.tabIndex).toBe(0);
    expect(cards[1]?.tabIndex).toBe(-1);
  });
});
