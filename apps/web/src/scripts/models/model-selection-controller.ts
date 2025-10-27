import { publishChatContext } from '../chat/chat-context';

type InteractionType = 'pointer' | 'keyboard' | 'programmatic';

type ModelCardElements = {
  root: HTMLElement;
  ctaButton?: HTMLAnchorElement | HTMLButtonElement | null;
};

export type ModelMetadata = {
  id: string | null;
  name: string | null;
  description: string | null;
  status: 'available' | 'coming-soon';
  ctaHref: string | null;
  ctaLabel: string | null;
  features: string[];
};

export type SelectModelFn = (
  element: HTMLElement,
  modelId?: string,
  interactionType?: InteractionType
) => void;

export interface ModelSelectionAPI {
  select: SelectModelFn;
  selectById: (modelId: string, interactionType?: InteractionType) => boolean;
  clear: () => void;
  getSelectedModel: () => string | null;
  getSelectedModelData: () => ModelMetadata | null;
  focusSelectedCard: () => boolean;
  focusInfoPanel: () => boolean;
  openChatPanel: () => void;
  adjustLayoutForChat: (isOpen: boolean) => void;
  destroy: () => void;
}

type WindowWithSelection = Window &
  typeof globalThis & {
    toggleChatPanel?: () => void;
    updateChatContext?: (
      modelName: string | null,
      modelData: ModelMetadata | Record<string, unknown> | null
    ) => void;
    modelSelection?: ModelSelectionAPI;
    adjustLayoutForChat?: (isOpen: boolean) => void;
    selectedModel?: () => string | null;
    selectedModelData?: () => ModelMetadata | Record<string, unknown> | null;
    selectModel?: SelectModelFn;
    selectModelById?: (modelId: string, interactionType?: InteractionType) => boolean;
    clearSelection?: () => void;
    focusSelectedModelCard?: () => boolean;
    focusSelectedModelInfo?: () => boolean;
    openChatPanel?: () => void;
  };

const SELECTED_CLASSES = [
  'ring-2',
  'ring-blue-500',
  'bg-blue-50',
  'dark:bg-blue-900/20',
] as const;
const HOVER_CLASSES = ['ring', 'ring-offset-1', 'ring-gray-200'] as const;
const STATUS_AVAILABLE_CLASSES = [
  'bg-green-100',
  'dark:bg-green-900',
  'text-green-800',
  'dark:text-green-200',
] as const;
const STATUS_COMING_SOON_CLASSES = [
  'bg-yellow-100',
  'dark:bg-yellow-900',
  'text-yellow-800',
  'dark:text-yellow-200',
] as const;

const addClasses = (element: HTMLElement, classes: readonly string[]) => {
  element.classList.add(...classes);
};

const removeClasses = (element: HTMLElement, classes: readonly string[]) => {
  element.classList.remove(...classes);
};

const setVisibility = (element: HTMLElement | null, isVisible: boolean) => {
  if (!element) {
    return;
  }

  element.classList.toggle('hidden', !isVisible);
  element.setAttribute('aria-hidden', isVisible ? 'false' : 'true');
};

const canReceiveFocus = (element: HTMLElement | null): element is HTMLElement => {
  if (!element) {
    return false;
  }
  if (element.hidden) {
    return false;
  }
  if (element.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  if (element instanceof HTMLButtonElement && element.disabled) {
    return false;
  }
  if (element instanceof HTMLAnchorElement && !element.hasAttribute('href')) {
    return false;
  }
  if (element.hasAttribute('disabled')) {
    return false;
  }
  return true;
};

const configureCtaElement = (
  element: HTMLAnchorElement | HTMLButtonElement | null,
  metadata: ModelMetadata,
  isAvailable: boolean
): boolean => {
  if (!element) {
    return false;
  }

  const hasRoute = Boolean(metadata.ctaHref);
  const enableCta = isAvailable && hasRoute;

  element.hidden = false;
  element.textContent = enableCta ? metadata.ctaLabel ?? 'Open Model' : 'Coming Soon';

  if (element instanceof HTMLAnchorElement) {
    if (enableCta && metadata.ctaHref) {
      element.href = metadata.ctaHref;
    } else {
      element.removeAttribute('href');
    }
  } else {
    element.disabled = !enableCta;
  }

  element.setAttribute('aria-disabled', enableCta ? 'false' : 'true');
  element.classList.toggle('cursor-not-allowed', !enableCta);

  return canReceiveFocus(element);
};

const resetCtaElement = (element: HTMLAnchorElement | HTMLButtonElement | null) => {
  if (!element) {
    return;
  }

  element.hidden = true;
  element.setAttribute('aria-disabled', 'true');
  element.classList.remove('cursor-not-allowed');

  if (element instanceof HTMLAnchorElement) {
    element.removeAttribute('href');
  } else {
    element.disabled = true;
  }
};

const updateStatusBadge = (badge: HTMLElement | null, isAvailable: boolean) => {
  if (!badge) {
    return;
  }

  badge.classList.remove(...STATUS_AVAILABLE_CLASSES, ...STATUS_COMING_SOON_CLASSES);
  setVisibility(badge, true);
  badge.textContent = isAvailable ? 'Available' : 'Coming Soon';
  badge.classList.add(...(isAvailable ? STATUS_AVAILABLE_CLASSES : STATUS_COMING_SOON_CLASSES));
};

const updateFeaturesList = (doc: Document, listElement: HTMLElement | null, features: string[]) => {
  if (!(listElement instanceof HTMLElement)) {
    return;
  }

  if (features.length === 0) {
    setVisibility(listElement, false);
    listElement.replaceChildren();
    return;
  }

  setVisibility(listElement, true);
  listElement.replaceChildren(
    ...features.map((featureText) => {
      const item = doc.createElement('li');
      item.textContent = featureText;
      item.className = 'flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400';
      return item;
    })
  );
};

const trackEvent = <T extends EventTarget>(
  target: T,
  type: string,
  listener: EventListenerOrEventListenerObject,
  cleanupFns: Array<() => void>,
  options?: boolean | AddEventListenerOptions
) => {
  target.addEventListener(type, listener, options);
  cleanupFns.push(() => target.removeEventListener(type, listener, options));
};

const coerceStatus = (rawStatus: string | undefined | null): ModelMetadata['status'] =>
  rawStatus === 'coming-soon' ? 'coming-soon' : 'available';

const collectFeatures = (card: HTMLElement): string[] => {
  const featureNodes = Array.from(card.querySelectorAll('[data-model-feature]'));
  return featureNodes.map((node) => node.textContent?.trim()).filter(Boolean) as string[];
};

const prefersReducedMotion = (win: Window): boolean => {
  if (typeof win.matchMedia !== 'function') {
    return false;
  }

  try {
    return win.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const getModelMetadata = (card: HTMLElement, explicitId?: string | null): ModelMetadata => ({
  id: explicitId ?? card.dataset.modelId ?? null,
  name: card.dataset.model ?? null,
  description: card.dataset.modelDescription ?? null,
  status: coerceStatus(card.dataset.modelStatus),
  ctaHref: card.dataset.modelCtaHref ?? null,
  ctaLabel: card.dataset.modelCtaLabel ?? null,
  features: collectFeatures(card),
});

const focusElement = (doc: Document, element: HTMLElement): boolean => {
  try {
    element.focus();
  } catch {
    return false;
  }
  return doc.activeElement === element;
};

const focusPanelPrimaryAction = (
  doc: Document,
  panel: HTMLElement | null,
  managedPanelTabIndexes: Set<HTMLElement>
): boolean => {
  const PANEL_PRIMARY_ACTION_SELECTOR = '#selected-model-cta, [data-model-cta]';
  const INTERACTIVE_PANEL_SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  if (!panel) {
    return false;
  }

  const primary = panel.querySelector<HTMLElement>(PANEL_PRIMARY_ACTION_SELECTOR);
  if (canReceiveFocus(primary) && focusElement(doc, primary)) {
    return true;
  }

  const fallbackCandidates = Array.from(
    panel.querySelectorAll<HTMLElement>(INTERACTIVE_PANEL_SELECTOR)
  );
  for (const candidate of fallbackCandidates) {
    if (candidate === primary) {
      continue;
    }
    if (!canReceiveFocus(candidate)) {
      continue;
    }
    if (focusElement(doc, candidate)) {
      return true;
    }
  }

  if (!panel.hasAttribute('tabindex')) {
    panel.setAttribute('tabindex', '-1');
    managedPanelTabIndexes.add(panel);
  }

  return focusElement(doc, panel);
};

const restorePanelFocusability = (
  panel: HTMLElement | null,
  managedPanelTabIndexes: Set<HTMLElement>
) => {
  if (!panel) {
    return;
  }

  if (panel.getAttribute('tabindex') === '-1') {
    panel.removeAttribute('tabindex');
  }

  managedPanelTabIndexes.delete(panel);
};

const createNoopApi = (chatWindow: WindowWithSelection): ModelSelectionAPI => ({
  select: () => undefined,
  selectById: () => false,
  clear: () => undefined,
  getSelectedModel: () => null,
  getSelectedModelData: () => null,
  focusSelectedCard: () => false,
  focusInfoPanel: () => false,
  openChatPanel: () => undefined,
  adjustLayoutForChat: () => undefined,
  destroy: () => {
    chatWindow.selectModel = undefined;
    chatWindow.selectModelById = undefined;
    chatWindow.clearSelection = undefined;
    chatWindow.selectedModel = undefined;
    chatWindow.selectedModelData = undefined;
    chatWindow.focusSelectedModelCard = undefined;
    chatWindow.focusSelectedModelInfo = undefined;
    chatWindow.openChatPanel = undefined;
    chatWindow.adjustLayoutForChat = undefined;
    chatWindow.modelSelection = undefined;
  },
});

export function initializeModelSelection(
  win: WindowWithSelection = window as WindowWithSelection
): ModelSelectionAPI {
  if (!win || !win.document) {
    return createNoopApi(win);
  }

  const doc = win.document;
  const chatWindow = win;

  chatWindow.modelSelection?.destroy?.();

  const infoSection = doc.getElementById('selected-model-info');
  const titleElement = doc.getElementById('selected-model-title');
  const descriptionElement = doc.getElementById('selected-model-description');
  const featuresListElement = doc.getElementById('selected-model-features');
  const statusBadgeElement = doc.getElementById('selected-model-status');
  const ctaElement = doc.getElementById('selected-model-cta') as
    | HTMLAnchorElement
    | HTMLButtonElement
    | null;

  const modelCards = Array.from(doc.querySelectorAll<HTMLElement>('.model-card'));
  const cardElements = modelCards.map<ModelCardElements>((root) => ({
    root,
    ctaButton: root.querySelector('[data-model-cta]') as
      | HTMLAnchorElement
      | HTMLButtonElement
      | null,
  }));
  const cardElementLookup = new Map<string, ModelCardElements>();

  for (const entry of cardElements) {
    const id = entry.root.dataset.modelId;
    if (id && !cardElementLookup.has(id)) {
      cardElementLookup.set(id, entry);
    }
  }

  const cardContainer = modelCards[0]?.parentElement ?? null;

  if (cardContainer && !cardContainer.hasAttribute('role')) {
    cardContainer.setAttribute('role', 'tablist');
    cardContainer.setAttribute('aria-orientation', 'horizontal');
  }

  if (infoSection?.id) {
    for (const { root } of cardElements) {
      if (!root.hasAttribute('aria-controls')) {
        root.setAttribute('aria-controls', infoSection.id);
      }
    }
  }

  for (const [index, { root }] of cardElements.entries()) {
    root.setAttribute('role', 'tab');
    root.setAttribute('aria-selected', 'false');
    if (!root.hasAttribute('tabindex')) {
      root.tabIndex = index === 0 ? 0 : -1;
    } else if (index !== 0) {
      root.tabIndex = -1;
    }
  }

  const cleanupFns: Array<() => void> = [];
  const managedPanelTabIndexes = new Set<HTMLElement>();
  let handlePanelKeydown: EventListener | null = null;

  if (infoSection) {
    infoSection.setAttribute('role', 'tabpanel');
    infoSection.setAttribute('aria-live', 'polite');
    infoSection.setAttribute(
      'aria-hidden',
      infoSection.classList.contains('hidden') ? 'true' : 'false'
    );
    if (titleElement?.id) {
      infoSection.setAttribute('aria-labelledby', titleElement.id);
    }
    if (descriptionElement?.id) {
      infoSection.setAttribute('aria-describedby', descriptionElement.id);
    }

    handlePanelKeydown = (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.defaultPrevented) {
        return;
      }

      if (keyboardEvent.key === 'ArrowUp' || keyboardEvent.key === 'Home') {
        if (focusSelectedCard()) {
          keyboardEvent.preventDefault();
        }
        return;
      }

      if (keyboardEvent.key === 'ArrowDown' || keyboardEvent.key === 'End') {
        if (focusInfoPanelPrimaryAction()) {
          keyboardEvent.preventDefault();
        }
      }
    };
  }

  if (statusBadgeElement) {
    statusBadgeElement.setAttribute('role', 'status');
    statusBadgeElement.setAttribute('aria-live', 'polite');
    statusBadgeElement.setAttribute(
      'aria-hidden',
      statusBadgeElement.classList.contains('hidden') ? 'true' : 'false'
    );
  }

  if (featuresListElement instanceof HTMLElement) {
    featuresListElement.setAttribute(
      'aria-hidden',
      featuresListElement.classList.contains('hidden') ? 'true' : 'false'
    );
  }

  if (infoSection && handlePanelKeydown) {
    trackEvent(infoSection, 'keydown', handlePanelKeydown, cleanupFns);
  }

  const clearLegacyGlobals = () => {
    chatWindow.selectModel = undefined;
    chatWindow.selectModelById = undefined;
    chatWindow.clearSelection = undefined;
    chatWindow.selectedModel = undefined;
    chatWindow.selectedModelData = undefined;
    chatWindow.focusSelectedModelCard = undefined;
    chatWindow.focusSelectedModelInfo = undefined;
    chatWindow.openChatPanel = undefined;
    chatWindow.adjustLayoutForChat = undefined;
  };

  const bindLegacyGlobals = (api: ModelSelectionAPI) => {
    chatWindow.selectModel = api.select;
    chatWindow.selectModelById = api.selectById;
    chatWindow.clearSelection = api.clear;
    chatWindow.selectedModel = api.getSelectedModel;
    chatWindow.selectedModelData = api.getSelectedModelData;
    chatWindow.focusSelectedModelCard = api.focusSelectedCard;
    chatWindow.focusSelectedModelInfo = api.focusInfoPanel;
    chatWindow.openChatPanel = api.openChatPanel;
    chatWindow.adjustLayoutForChat = api.adjustLayoutForChat;
  };

  if (modelCards.length === 0) {
    const noopApi = createNoopApi(chatWindow);
    chatWindow.modelSelection = noopApi;
    bindLegacyGlobals(noopApi);
    return noopApi;
  }

  const state = {
    lastInteractionType: 'pointer' as InteractionType,
    selectedModel: null as string | null,
    selectedModelData: null as ModelMetadata | null,
    selectedCard: null as HTMLElement | null,
    chatPanelOpen: false,
    pointerDown: false,
  };

  const accessibilityPrefs = {
    reduceMotion: prefersReducedMotion(chatWindow),
  };

  const reducedMotionQuery = (() => {
    if (typeof chatWindow.matchMedia !== 'function') {
      return null;
    }

    try {
      return chatWindow.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return null;
    }
  })();

  if (reducedMotionQuery) {
    const handleReduceMotionChange = (event: MediaQueryListEvent | MediaQueryList) => {
      accessibilityPrefs.reduceMotion = Boolean(event.matches);
    };

    handleReduceMotionChange(reducedMotionQuery);

    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', handleReduceMotionChange);
      cleanupFns.push(() =>
        reducedMotionQuery.removeEventListener('change', handleReduceMotionChange)
      );
    } else if (typeof reducedMotionQuery.addListener === 'function') {
      reducedMotionQuery.addListener(handleReduceMotionChange);
      cleanupFns.push(() => reducedMotionQuery.removeListener(handleReduceMotionChange));
    }
  }

  const removeSelectionStyling = () => {
    for (const card of modelCards) {
      removeClasses(card, SELECTED_CLASSES);
      removeClasses(card, HOVER_CLASSES);
    }
  };

  const updateSelectionAttributes = (selectedCard: HTMLElement | null) => {
    const defaultFocusableIndex = 0;

    for (const [index, { root }] of cardElements.entries()) {
      const isSelected = root === selectedCard;
      root.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      const targetTabIndex = selectedCard
        ? isSelected
          ? 0
          : -1
        : index === defaultFocusableIndex
          ? 0
          : -1;
      root.tabIndex = targetTabIndex;
    }
  };

  const focusCardAtIndex = (index: number) => {
    const target = cardElements[index]?.root;
    if (target) {
      target.focus();
    }
  };

  const focusCardByOffset = (currentCard: HTMLElement, offset: number) => {
    const currentIndex = cardElements.findIndex(({ root }) => root === currentCard);
    if (currentIndex === -1) {
      return;
    }

    const count = cardElements.length;
    if (count === 0) {
      return;
    }

    const nextIndex = currentIndex + offset;
    if (nextIndex < 0 || nextIndex >= count) {
      return;
    }

    focusCardAtIndex(nextIndex);
  };

  updateSelectionAttributes(null);

  const focusSelectedCard = (): boolean => {
    if (!state.selectedCard) {
      return false;
    }

    try {
      state.selectedCard.focus();
    } catch {
      return false;
    }

    return doc.activeElement === state.selectedCard;
  };

  const focusInfoPanelPrimaryAction = (): boolean => {
    if (!infoSection || infoSection.classList.contains('hidden')) {
      return false;
    }

    return focusPanelPrimaryAction(doc, infoSection, managedPanelTabIndexes);
  };

  const syncChatContext = () => {
    if (!state.chatPanelOpen) {
      return;
    }

    publishChatContext('models', state.selectedModel, state.selectedModelData ?? null);
  };

  const updateInfoPanel = (modelName: string | null, interactionType: InteractionType) => {
    if (!infoSection) {
      return;
    }

    const metadata = state.selectedModelData;
    const isAvailable = metadata?.status === 'available';

    if (modelName && metadata) {
      setVisibility(infoSection, true);
      if (titleElement) {
        titleElement.textContent = `Selected: ${modelName}`;
      }
      if (descriptionElement) {
        descriptionElement.textContent =
          metadata.description ??
          `You've selected the ${modelName} model. Open it to run calculations, then use the AI assistant for analysis and insights.`;
      }
      updateFeaturesList(doc, featuresListElement, metadata.features);
      updateStatusBadge(statusBadgeElement, isAvailable);

      const ctaIsFocusable = configureCtaElement(ctaElement, metadata, isAvailable);
      if (ctaIsFocusable) {
        restorePanelFocusability(infoSection, managedPanelTabIndexes);
      }

      if (interactionType === 'keyboard') {
        const scrollOptions: ScrollIntoViewOptions = accessibilityPrefs.reduceMotion
          ? { block: 'nearest' }
          : { behavior: 'smooth', block: 'nearest' };

        infoSection.scrollIntoView(scrollOptions);
      }
    } else {
      setVisibility(infoSection, false);
      restorePanelFocusability(infoSection, managedPanelTabIndexes);
      setVisibility(statusBadgeElement, false);
      updateFeaturesList(doc, featuresListElement, []);
      resetCtaElement(ctaElement);
    }
  };

  const selectModel: SelectModelFn = (
    element,
    modelId,
    interactionType: InteractionType = state.lastInteractionType
  ) => {
    state.lastInteractionType = interactionType;
    removeSelectionStyling();
    addClasses(element, SELECTED_CLASSES);
    removeClasses(element, HOVER_CLASSES);
    updateSelectionAttributes(element);

    state.selectedCard = element;
    const metadata = getModelMetadata(element, modelId ?? null);
    state.selectedModel = metadata.name;
    state.selectedModelData = metadata;

    updateInfoPanel(metadata.name, interactionType);
    syncChatContext();
  };

  const selectModelById = (
    modelId: string,
    interactionType: InteractionType = 'programmatic'
  ): boolean => {
    const entry = cardElementLookup.get(modelId);
    if (!entry) {
      return false;
    }

    selectModel(entry.root, modelId, interactionType);
    return true;
  };

  const clearSelection = () => {
    removeSelectionStyling();
    updateSelectionAttributes(null);
    updateInfoPanel(null, state.lastInteractionType);

    state.selectedModel = null;
    state.selectedModelData = null;
    state.selectedCard = null;

    syncChatContext();
  };

  const openChatPanel = () => {
    chatWindow.toggleChatPanel?.();
  };

  const adjustLayoutForChat = (isOpen: boolean) => {
    const mainContainer = doc.getElementById('main-container');
    if (mainContainer) {
      mainContainer.style.marginRight = isOpen ? '384px' : '0';
    }
    state.chatPanelOpen = isOpen;
    syncChatContext();
  };

  const handlePointerDown = () => {
    state.pointerDown = true;
    state.lastInteractionType = 'pointer';
  };

  const handlePointerEnd = () => {
    state.pointerDown = false;
  };

  trackEvent(chatWindow, 'pointerdown', handlePointerDown, cleanupFns);
  trackEvent(chatWindow, 'pointerup', handlePointerEnd, cleanupFns);
  trackEvent(chatWindow, 'pointercancel', handlePointerEnd, cleanupFns);
  trackEvent(chatWindow, 'blur', handlePointerEnd, cleanupFns, true);
  trackEvent(
    chatWindow,
    'keydown',
    (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== 'Escape' || keyboardEvent.defaultPrevented) {
        return;
      }

      if (!state.selectedModel) {
        return;
      }

      clearSelection();
    },
    cleanupFns
  );

  for (const { root: card, ctaButton } of cardElements) {
    const handleFocus = () => {
      const interactionType = state.pointerDown ? 'pointer' : 'keyboard';
      selectModel(card, card.dataset.modelId, interactionType);
      state.pointerDown = false;
    };

    const handleClick = () => {
      selectModel(card, card.dataset.modelId, 'pointer');
      state.pointerDown = false;
    };

    const handleKeydown: EventListener = (event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'ArrowRight') {
        keyboardEvent.preventDefault();
        focusCardByOffset(card, 1);
        return;
      }

      if (keyboardEvent.key === 'ArrowLeft') {
        keyboardEvent.preventDefault();
        focusCardByOffset(card, -1);
        return;
      }

      if (keyboardEvent.key === 'Home') {
        keyboardEvent.preventDefault();
        focusCardAtIndex(0);
        return;
      }

      if (keyboardEvent.key === 'End') {
        keyboardEvent.preventDefault();
        focusCardAtIndex(cardElements.length - 1);
        return;
      }

      if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
        keyboardEvent.preventDefault();
        selectModel(card, card.dataset.modelId, 'keyboard');
        return;
      }

      if (keyboardEvent.key === 'ArrowUp') {
        keyboardEvent.preventDefault();
        const controlId = card.getAttribute('aria-controls');
        if (controlId) {
          const panel = doc.getElementById(controlId) as HTMLElement | null;
          focusPanelPrimaryAction(doc, panel, managedPanelTabIndexes);
        }
        return;
      }

      if (keyboardEvent.key === 'ArrowDown') {
        keyboardEvent.preventDefault();
        const controlId = card.getAttribute('aria-controls');
        if (controlId) {
          const panel = doc.getElementById(controlId) as HTMLElement | null;
          focusPanelPrimaryAction(doc, panel, managedPanelTabIndexes);
        }
      }
    };

    const handleCtaClick = (event: Event) => {
      if (state.selectedModelData?.status !== 'available') {
        event.preventDefault();
      }
    };

    trackEvent(card, 'focus', handleFocus, cleanupFns);

    trackEvent(card, 'mouseenter', () => addClasses(card, HOVER_CLASSES), cleanupFns);
    trackEvent(card, 'mouseleave', () => removeClasses(card, HOVER_CLASSES), cleanupFns);

    trackEvent(card, 'click', handleClick, cleanupFns);
    trackEvent(card, 'keydown', handleKeydown, cleanupFns);

    if (ctaButton) {
      trackEvent(ctaButton, 'click', handleCtaClick, cleanupFns);
    }
  }

  trackEvent(
    chatWindow,
    'message',
    (event: Event) => {
      const message = event as MessageEvent<{ type?: string; data?: ModelMetadata | null } | null>;
      const payload = message.data;
      if (payload?.type === 'modelData') {
        state.selectedModelData = payload.data ?? null;
        syncChatContext();
      }
    },
    cleanupFns
  );

  const destroy = () => {
    clearSelection();
    for (const cleanup of cleanupFns.splice(0)) {
      cleanup();
    }
    for (const panel of Array.from(managedPanelTabIndexes)) {
      restorePanelFocusability(panel, managedPanelTabIndexes);
    }
    managedPanelTabIndexes.clear();
    clearLegacyGlobals();
    chatWindow.modelSelection = undefined;
  };

  const selectionAPI: ModelSelectionAPI = {
    select: selectModel,
    selectById: selectModelById,
    clear: clearSelection,
    getSelectedModel: () => state.selectedModel,
    getSelectedModelData: () => state.selectedModelData,
    focusSelectedCard,
    focusInfoPanel: focusInfoPanelPrimaryAction,
    openChatPanel,
    adjustLayoutForChat,
    destroy,
  };

  chatWindow.modelSelection = selectionAPI;
  bindLegacyGlobals(selectionAPI);

  return selectionAPI;
}
