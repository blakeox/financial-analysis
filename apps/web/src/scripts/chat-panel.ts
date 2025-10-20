export {};

type ContextKey = 'lease' | 'ebitda' | 'amortization' | 'general' | 'models';

type ModelState = Record<string, string>;
type ModelChanges = Record<string, string | number>;

type WindowWithChatPanel = Window & {
  toggleChatPanel?: () => void;
  openChatPanel?: () => void;
  closeChatPanel?: () => void;
  updateChatContext?: (label: string | null, data: Record<string, unknown> | null) => void;
  adjustLayoutForChat?: (isOpen: boolean) => void;
  __chatPanelInstance?: ChatPanel;
  chatPanelBootstrapError?: string;
};

class ChatPanel {
  private panel: HTMLDivElement;
  private toggle: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;
  private input: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private messages: HTMLDivElement;
  private thinkingIndicator: HTMLDivElement;
  private contextIndicator: HTMLSpanElement;
  private isOpen: boolean;
  private currentContext: ContextKey;
  private customContextKey: ContextKey | null;
  private customContextLabel: string | null;
  private customContextData: Record<string, unknown> | null;
  private externalContextListener: ((event: Event) => void) | null;
  private headerObserver: ResizeObserver | null;

  private updateLayoutOffsets = (): void => {
    const header = document.getElementById('site-header');
    const nav = document.getElementById('site-nav');
    const headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
    const navHeight = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    const offset = Math.max(headerHeight, navHeight, 64);
    document.documentElement.style.setProperty('--chat-panel-top-offset', `${offset}px`);
    if (this.isOpen) {
      this.updateActiveWidth();
    }
  };

  constructor() {
    const panel = document.getElementById('chat-panel');
    const toggle = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');
    const thinkingIndicator = document.getElementById('thinking-indicator');
    const contextIndicator = document.getElementById('context-indicator');

    if (!(panel instanceof HTMLDivElement)) throw new Error('Chat panel container not found');
    if (!(toggle instanceof HTMLButtonElement)) throw new Error('Chat toggle button not found');
    if (!(closeBtn instanceof HTMLButtonElement)) throw new Error('Chat close button not found');
    if (!(input instanceof HTMLTextAreaElement)) throw new Error('Chat input not found');
    if (!(sendBtn instanceof HTMLButtonElement)) throw new Error('Chat send button not found');
    if (!(messages instanceof HTMLDivElement)) throw new Error('Chat messages container not found');
    if (!(thinkingIndicator instanceof HTMLDivElement)) throw new Error('Chat thinking indicator not found');
    if (!(contextIndicator instanceof HTMLSpanElement)) throw new Error('Chat context indicator not found');

    this.panel = panel;
    this.toggle = toggle;
    this.closeBtn = closeBtn;
    this.input = input;
    this.sendBtn = sendBtn;
    this.messages = messages;
    this.thinkingIndicator = thinkingIndicator;
    this.contextIndicator = contextIndicator;

    this.isOpen = false;
    this.currentContext = this.detectContext();
    this.customContextKey = null;
    this.customContextLabel = null;
    this.customContextData = null;
    this.externalContextListener = null;
    this.headerObserver = null;

    this.bindEvents();
    this.setupLayoutSync();
    this.updateContextIndicator();
    this.syncAriaState();
    this.emitStateChange();

    const win = window as WindowWithChatPanel;
    win.__chatPanelInstance = this;
    if (document.body) {
      document.body.dataset.chatPanelStatus = 'ready';
    }
  }

  private detectContext(): ContextKey {
    const path = window.location.pathname;
    if (path.includes('/models')) return 'models';
    if (path.includes('/analysis')) return 'lease';
    if (path.includes('/ebitda')) return 'ebitda';
    if (path.includes('/amortization')) return 'amortization';
    return 'general';
  }

  private updateContextIndicator(): void {
    const contexts: Record<ContextKey, string> = {
      lease: 'Lease Analysis',
      ebitda: 'EBITDA Forecasting',
      amortization: 'Amortization',
      models: 'Models',
      general: 'General',
    };
    const activeContext = this.getActiveContextKey();
    const label = this.customContextLabel || contexts[activeContext] || 'General';
    this.contextIndicator.textContent = label;
    if (this.customContextLabel) {
      this.contextIndicator.setAttribute('title', contexts[activeContext] || activeContext);
    } else {
      this.contextIndicator.removeAttribute('title');
    }
  }

  private getActiveContextKey(): ContextKey {
    return this.customContextKey || this.currentContext;
  }

  private setExternalContext(
    contextKey: ContextKey | null,
    label: string | null,
    data: Record<string, unknown> | null,
  ): void {
    if (!contextKey) {
      this.clearExternalContext();
      return;
    }
    this.customContextKey = contextKey;
    this.customContextLabel = label;
    this.customContextData = data;
    this.updateContextIndicator();
  }

  private clearExternalContext(): void {
    this.customContextKey = null;
    this.customContextLabel = null;
    this.customContextData = null;
    this.updateContextIndicator();
  }

  private getContextData(): Record<string, unknown> {
    const base = this.getCurrentModelState();
    if (this.customContextData && typeof this.customContextData === 'object') {
      return { ...base, ...this.customContextData };
    }
    return base;
  }

  private emitStateChange(): void {
    const win = window as WindowWithChatPanel;
    if (typeof win.adjustLayoutForChat === 'function') {
      win.adjustLayoutForChat(this.isOpen);
    }
    const event = new CustomEvent('chat-panel-state', { detail: { isOpen: this.isOpen } });
    window.dispatchEvent(event);
  }

  private setupLayoutSync(): void {
    this.updateLayoutOffsets();
    if (typeof ResizeObserver !== 'undefined') {
      this.headerObserver = new ResizeObserver(() => {
        this.updateLayoutOffsets();
      });
      const header = document.getElementById('site-header');
      const nav = document.getElementById('site-nav');
      if (header) {
        this.headerObserver.observe(header);
      }
      if (nav) {
        this.headerObserver.observe(nav);
      }
    }
    window.addEventListener('resize', this.updateLayoutOffsets, { passive: true });
    window.addEventListener('orientationchange', this.updateLayoutOffsets);
    window.addEventListener('scroll', this.updateLayoutOffsets, { passive: true });
  }

  private updateActiveWidth(): void {
    const panelWidth = Math.round(this.panel.getBoundingClientRect().width);
    if (!Number.isFinite(panelWidth) || panelWidth <= 0) {
      return;
    }
    const shouldOffset = this.shouldOffsetContent(panelWidth);
    const widthValue = shouldOffset ? `${panelWidth}px` : '0px';
    document.documentElement.style.setProperty('--chat-panel-active-width', widthValue);
    if (shouldOffset) {
      document.body.classList.add('chat-panel-open');
    } else {
      document.body.classList.remove('chat-panel-open');
    }
  }

  private clearActiveWidth(): void {
    document.documentElement.style.setProperty('--chat-panel-active-width', '0px');
    document.body.classList.remove('chat-panel-open');
  }

  private shouldOffsetContent(panelWidth: number): boolean {
    const minContentWidth = 640;
    return window.innerWidth - panelWidth >= minContentWidth;
  }

  private bindEvents(): void {
    const win = window as WindowWithChatPanel;
    win.toggleChatPanel = () => this.togglePanel();
    win.openChatPanel = () => this.openPanel();
    win.closeChatPanel = () => this.closePanel();
    win.updateChatContext = (label: string | null, data: Record<string, unknown> | null) => {
      if (!label) {
        this.clearExternalContext();
        return;
      }
      this.setExternalContext('models', label, data);
    };

    if (!this.externalContextListener) {
      this.externalContextListener = (event: Event) => {
        const customEvent = event as CustomEvent<{
          contextKey?: ContextKey | null;
          label?: string | null;
          data?: Record<string, unknown> | null;
        }>;
        const detail = customEvent.detail || {};
        const { contextKey, label, data } = detail;
        if (!contextKey && !label) {
          this.clearExternalContext();
        } else {
          this.setExternalContext(contextKey ?? 'models', label ?? null, data ?? null);
        }
      };
      win.addEventListener('chat-panel-context', this.externalContextListener as EventListener);
    }

    this.toggle.addEventListener('click', () => this.togglePanel());
    this.closeBtn.addEventListener('click', () => this.closePanel());
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    this.input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void this.sendMessage();
      }
    });

    this.input.addEventListener('input', () => {
      this.sendBtn.disabled = !this.input.value.trim();
      this.autoResizeInput();
    });

    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (this.isOpen && target && !this.panel.contains(target) && !this.toggle.contains(target)) {
        this.closePanel();
      }
    });

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (this.isOpen && event.key === 'Escape') {
        event.preventDefault();
        this.closePanel();
        this.toggle.focus();
      }
    });
  }

  private autoResizeInput(): void {
    this.input.style.height = 'auto';
    this.input.style.height = `${Math.min(this.input.scrollHeight, 100)}px`;
  }

  private togglePanel(): void {
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.panel.classList.add('visible');
    this.toggle.classList.add('panel-open');
    this.isOpen = true;
    this.updateLayoutOffsets();
    this.syncAriaState();
    this.emitStateChange();
    setTimeout(() => this.input.focus(), 300);
  }

  private closePanel(): void {
    this.panel.classList.remove('visible');
    this.toggle.classList.remove('panel-open');
    this.isOpen = false;
    this.clearActiveWidth();
    this.syncAriaState();
    this.emitStateChange();
  }

  private syncAriaState(): void {
    this.toggle.setAttribute('aria-expanded', this.isOpen ? 'true' : 'false');
    this.toggle.setAttribute('aria-label', this.isOpen ? 'Close AI assistant' : 'Open AI assistant');
    this.panel.setAttribute('aria-hidden', this.isOpen ? 'false' : 'true');
  }

  private addMessage(content: string, type: 'user' | 'assistant' = 'user'): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content;

    messageDiv.appendChild(contentDiv);
    this.messages.appendChild(messageDiv);
    this.messages.scrollTop = this.messages.scrollHeight;
  }

  private showThinking(): void {
    this.thinkingIndicator.classList.remove('hidden');
  }

  private hideThinking(): void {
    this.thinkingIndicator.classList.add('hidden');
  }

  private async sendMessage(): Promise<void> {
    const message = this.input.value.trim();
    if (!message) return;

    this.addMessage(message, 'user');
    this.input.value = '';
    this.sendBtn.disabled = true;
    this.autoResizeInput();
    this.showThinking();

    try {
      const contextKey = this.getActiveContextKey();
      const currentModel = this.getContextData();
      const payload: Record<string, unknown> = {
        message,
        context: contextKey,
        currentModel,
      };
      if (this.customContextLabel) {
        payload.contextLabel = this.customContextLabel;
      }
      if (this.customContextData) {
        payload.contextData = this.customContextData;
      }

      const response = await fetch('/api/v1/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        response: string;
        modelChanges?: ModelChanges;
      };

      this.hideThinking();
      this.addMessage(data.response, 'assistant');

      if (data.modelChanges) {
        this.applyModelChanges(data.modelChanges);
      }
    } catch (error) {
      this.hideThinking();
      this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
      console.error('Chat error:', error);
    }
  }

  private getCurrentModelState(): ModelState {
    const formData: ModelState = {};
    const chatPanel = document.getElementById('chat-panel');

    const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      'input, select, textarea',
    );
    inputs.forEach((element) => {
      if (chatPanel && chatPanel.contains(element)) {
        return;
      }
      if (element.name && element.value) {
        formData[element.name] = element.value;
      }
    });

    return formData;
  }

  private applyModelChanges(changes: ModelChanges): void {
    Object.entries(changes).forEach(([field, value]) => {
      const input = document.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        `[name="${field}"]`,
      );
      if (input) {
        const stringValue = typeof value === 'number' ? String(value) : value;
        input.value = stringValue;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const analyzeBtn = document.querySelector<HTMLButtonElement | HTMLElement>(
      'button[type="submit"], .analyze-btn, #analyze',
    );
    if (analyzeBtn instanceof HTMLButtonElement) {
      analyzeBtn.click();
    } else if (analyzeBtn) {
      analyzeBtn.click();
    }
  }
}

function initializeChatPanel(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  const win = window as WindowWithChatPanel;
  if (win.__chatPanelInstance) {
    if (document.body) {
      document.body.dataset.chatPanelStatus = 'ready';
    }
    return;
  }
  const bootstrap = (): void => {
    if (win.__chatPanelInstance) {
      return;
    }
    try {
      win.__chatPanelInstance = new ChatPanel();
      if (document.body) {
        document.body.dataset.chatPanelStatus = 'ready';
      }
      if (import.meta.env.DEV) {
        console.info('[chat-panel] initialized');
      }
    } catch (error) {
      console.error('Chat panel bootstrap failed', error);
      win.chatPanelBootstrapError = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      if (document.body) {
        document.body.dataset.chatPanelStatus = 'error';
      }
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
}

initializeChatPanel();
