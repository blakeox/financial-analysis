import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelMetadata } from '../models/types';
import type { ModelSelectionAPI } from '../models/model-selection-controller';

const publishChatContextMock = vi.fn();
const setSelectionMock = vi.fn();
const clearStoreMock = vi.fn();

vi.mock('../chat/chat-context', () => ({
  publishChatContext: (...args: Parameters<typeof publishChatContextMock>) =>
    publishChatContextMock(...args),
}));

vi.mock('../models/model-selection-store', () => ({
  modelSelectionStore: {
    setSelection: (...args: Parameters<typeof setSelectionMock>) => setSelectionMock(...args),
    clear: (...args: Parameters<typeof clearStoreMock>) => clearStoreMock(...args),
  },
}));

const { initializeModelSelection } = await import('../models/model-selection-controller');

declare global {
  interface Window {
    modelSelection?: ModelSelectionAPI;
  }
}

// Builds the minimal DOM structure the controller expects (cards, info panel, layout container).
const buildSelectionDom = () => {
  document.body.innerHTML = '';

  const mainContainer = document.createElement('div');
  mainContainer.id = 'main-container';
  document.body.appendChild(mainContainer);

  const infoSection = document.createElement('section');
  infoSection.id = 'selected-model-info';
  infoSection.classList.add('hidden');

  const title = document.createElement('h2');
  title.id = 'selected-model-title';
  infoSection.appendChild(title);

  const description = document.createElement('p');
  description.id = 'selected-model-description';
  infoSection.appendChild(description);

  const features = document.createElement('ul');
  features.id = 'selected-model-features';
  features.classList.add('hidden');
  infoSection.appendChild(features);

  const status = document.createElement('span');
  status.id = 'selected-model-status';
  status.classList.add('hidden');
  infoSection.appendChild(status);

  const panelCta = document.createElement('button');
  panelCta.id = 'selected-model-cta';
  panelCta.hidden = true;
  infoSection.appendChild(panelCta);

  document.body.appendChild(infoSection);

  const cardsWrapper = document.createElement('div');
  document.body.appendChild(cardsWrapper);

  const card = document.createElement('div');
  card.classList.add('model-card');
  card.dataset.model = 'Alpha Model';
  card.dataset.modelId = 'alpha-model';
  card.dataset.modelDescription = 'Deterministic alpha analysis';
  card.dataset.modelStatus = 'available';
  card.dataset.modelCtaHref = '/models/alpha';
  card.dataset.modelCtaLabel = 'Launch Model';

  const feature = document.createElement('div');
  feature.setAttribute('data-model-feature', '');
  feature.textContent = 'Deterministic schedules';
  card.appendChild(feature);

  const featureTwo = document.createElement('div');
  featureTwo.setAttribute('data-model-feature', '');
  featureTwo.textContent = 'Comparative insights';
  card.appendChild(featureTwo);

  const cardCta = document.createElement('button');
  cardCta.setAttribute('data-model-cta', '');
  cardCta.textContent = 'Launch Model';
  card.appendChild(cardCta);

  cardsWrapper.appendChild(card);

  return { card, mainContainer, infoSection };
};

describe('model-selection-controller chat sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    window.modelSelection?.destroy?.();
    window.modelSelection = undefined;
    document.body.innerHTML = '';
  });

  it('syncs chat context whenever the panel is open and a selection occurs', () => {
    const { card, mainContainer } = buildSelectionDom();
    const api = initializeModelSelection(window as Window & typeof globalThis);

    api.adjustLayoutForChat(true);
    expect(mainContainer.style.marginRight).toBe('384px');

    publishChatContextMock.mockClear();

    api.select(card, 'alpha-model', 'pointer');

    expect(publishChatContextMock).toHaveBeenCalledTimes(1);
    expect(publishChatContextMock).toHaveBeenCalledWith(
      'models',
      'Alpha Model',
      expect.objectContaining({ id: 'alpha-model', name: 'Alpha Model' })
    );

    api.adjustLayoutForChat(false);
    expect(mainContainer.style.marginRight).toBe('0px');
  });

  it('applies message-provided metadata to chat context when the chat is open', () => {
    const { card } = buildSelectionDom();
    const api = initializeModelSelection(window as Window & typeof globalThis);

    api.select(card, 'alpha-model', 'pointer');
    api.adjustLayoutForChat(true);

    publishChatContextMock.mockClear();
    setSelectionMock.mockClear();

    const enrichedMetadata: ModelMetadata = {
      id: 'alpha-model',
      name: 'Alpha Model (server)',
      description: 'Server-enriched metadata',
      status: 'available',
      ctaHref: '/models/enriched-alpha',
      ctaLabel: 'Launch Enriched Alpha',
      features: ['Server detail'],
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'modelData', data: enrichedMetadata },
      })
    );

    expect(setSelectionMock).toHaveBeenCalledTimes(1);
    expect(setSelectionMock).toHaveBeenCalledWith(enrichedMetadata);
    expect(publishChatContextMock).toHaveBeenCalledWith('models', 'Alpha Model', enrichedMetadata);
  });
});
