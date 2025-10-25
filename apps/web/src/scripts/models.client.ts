declare global {
  interface Window {
    toggleChatPanel?: () => void;
    updateChatContext?: (modelName: string | null, modelData: Record<string, unknown> | null) => void;
    adjustLayoutForChat?: (isOpen: boolean) => void;
    selectedModel?: () => string | null;
    selectedModelData?: () => Record<string, unknown> | null;
    selectModel?: (element: HTMLElement, modelId?: string) => void;
    clearSelection?: () => void;
    openChatPanel?: () => void;
  }
}

const chatWindow = window;
let selectedModel: string | null = null;
let selectedModelData: Record<string, unknown> | null = null;
let chatPanelOpen = false;

const removeSelectionStyling = () => {
  document.querySelectorAll<HTMLElement>('.model-card').forEach((card) => {
    card.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');
  });
};

const selectModel = (element: HTMLElement, modelId?: string) => {
  removeSelectionStyling();
  element.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20');

  const infoSection = document.getElementById('selected-model-info');
  const titleElement = document.getElementById('selected-model-title');
  const descriptionElement = document.getElementById('selected-model-description');

  const modelName = element.dataset.model ?? modelId ?? null;
  selectedModel = modelName;

  if (modelName && titleElement) {
    titleElement.textContent = `Selected: ${modelName}`;
  }

  if (modelName && descriptionElement) {
    descriptionElement.textContent = `You've selected the ${modelName} model. Open it to run calculations, then use the AI assistant for analysis and insights.`;
  }

  if (infoSection) {
    if (modelName) {
      infoSection.classList.remove('hidden');
      infoSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      infoSection.classList.add('hidden');
    }
  }

  if (chatPanelOpen && chatWindow.updateChatContext) {
    chatWindow.updateChatContext(selectedModel, selectedModelData);
  }
};

const clearSelection = () => {
  removeSelectionStyling();
  const infoSection = document.getElementById('selected-model-info');
  if (infoSection) {
    infoSection.classList.add('hidden');
  }

  selectedModel = null;
  selectedModelData = null;

  if (chatPanelOpen && chatWindow.updateChatContext) {
    chatWindow.updateChatContext(null, null);
  }
};

const openChatPanel = () => {
  if (chatWindow.toggleChatPanel) {
    chatWindow.toggleChatPanel();
  }
};

const adjustLayoutForChat = (isOpen: boolean) => {
  const mainContainer = document.getElementById('main-container');
  if (mainContainer) {
    mainContainer.style.marginRight = isOpen ? '384px' : '0';
  }
  chatPanelOpen = isOpen;
};

document.querySelectorAll<HTMLElement>('.model-card').forEach((card) => {
  card.addEventListener('focus', () => selectModel(card));
  card.addEventListener('mouseenter', () => selectModel(card));
  card.addEventListener('click', () => selectModel(card));
});

window.addEventListener('message', (event: MessageEvent) => {
  if (event.data?.type === 'modelData') {
    selectedModelData = event.data.data as Record<string, unknown> | null;
    if (chatPanelOpen && chatWindow.updateChatContext) {
      chatWindow.updateChatContext(selectedModel, selectedModelData);
    }
  }
});

chatWindow.adjustLayoutForChat = adjustLayoutForChat;
chatWindow.selectedModel = () => selectedModel;
chatWindow.selectedModelData = () => selectedModelData;
chatWindow.selectModel = selectModel;
chatWindow.clearSelection = clearSelection;
chatWindow.openChatPanel = openChatPanel;

export {};
