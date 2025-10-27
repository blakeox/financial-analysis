import { installChatContextBridge, subscribeChatContext } from './chat/chat-context';
import { toolCatalog } from './chat/tool-catalog';
import { MessageQueue, type QueueEvent } from './chat/message-queue';
import { ChatStateStore } from './chat/state-store';
import { appEventBus, type ChatToolsUpdateEvent, type SerializedContext } from '@financial-analysis/tools';
import {
  clearActiveWidth as resetActiveWidth,
  setTopOffset,
  syncChatAriaState,
  updateActiveWidth as applyActiveWidth,
} from './chat/accessibility';
import { createChatTransport } from './chat/transport';
import type { ChatTransport } from './chat/transport';
import type {
  ChatRequestPayload,
  ChatResponsePayload,
  ContextKey,
  ModelChanges,
  ToolSummary,
} from './chat/types';

installChatContextBridge();

// Security and validation constants
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_DELAY_MS = 1000; // 1 second between messages
const API_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1000; // Initial backoff time

const debugLog = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

const debugWarn = (...args: unknown[]): void => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

type ModelState = Record<string, string>;
type WindowWithChatPanel = Window & {
  toggleChatPanel?: () => void;
  openChatPanel?: () => void;
  closeChatPanel?: () => void;
  updateChatContext?: (label: string | null, data: Record<string, unknown> | null) => void;
  adjustLayoutForChat?: (isOpen: boolean) => void;
  __chatPanelInstance?: ChatPanel;
  chatPanelBootstrapError?: string;
};

/**
 * Validate message meets security requirements
 */
function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  
  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      valid: false,
      error: `Message too long (${message.length} characters). Maximum is ${MAX_MESSAGE_LENGTH}.`,
    };
  }
  
  return { valid: true };
}

class ChatPanel {
  private panel: HTMLDivElement;
  private toggle: HTMLButtonElement;
  private closeBtn: HTMLButtonElement;
  private form: HTMLFormElement;
  private input: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private messages: HTMLDivElement;
  private thinkingIndicator: HTMLDivElement;
  private contextIndicator: HTMLSpanElement;
  private charCounter: HTMLSpanElement | null;
  private isOpen: boolean;
  private currentContext: ContextKey;
  private customContextKey: ContextKey | null;
  private customContextLabel: string | null;
  private customContextData: SerializedContext | null;
  private unsubscribeChatContext: (() => void) | null;
  private headerObserver: ResizeObserver | null;
  private lastContext: ContextKey;
  private mcpTools: ToolSummary[] | null;
  private mcpToolOutputs: SerializedContext | null;
  private outsideClickHandler: ((event: MouseEvent | TouchEvent) => void) | null;
  private stateStore: ChatStateStore;
  private messageQueue: MessageQueue<ChatRequestPayload, ChatResponsePayload>;
  private transport: ChatTransport;
  private queueSubscription: (() => void) | null;
  private toolCatalogUnsubscribe: (() => void) | null;
  private beforeUnloadHandler: (() => void) | null;
  private analysisResultsHandler: ((event: Event) => void) | null;
  private chatStateSubscription: (() => void) | null;

  private updateLayoutOffsets = (): void => {
    const header = document.getElementById('site-header');
    const nav = document.getElementById('site-nav');
    const headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
    const navHeight = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    const offset = Math.max(headerHeight, navHeight, 64);
    setTopOffset(offset);
    if (this.isOpen) {
      this.updateActiveWidth();
    }
  };

  constructor() {
    debugLog('[ChatPanel] Constructor starting...');
    const panel = document.getElementById('chat-panel');
    const toggle = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');
    const thinkingIndicator = document.getElementById('thinking-indicator');
    const contextIndicator = document.getElementById('context-indicator');

    debugLog('[ChatPanel] Elements found:', {
      panel: !!panel,
      toggle: !!toggle,
      closeBtn: !!closeBtn,
      form: !!form,
      input: !!input,
      sendBtn: !!sendBtn,
      messages: !!messages,
      thinkingIndicator: !!thinkingIndicator,
      contextIndicator: !!contextIndicator
    });

    if (!(panel instanceof HTMLDivElement)) throw new Error('Chat panel container not found');
    if (!(toggle instanceof HTMLButtonElement)) throw new Error('Chat toggle button not found');
    if (!(closeBtn instanceof HTMLButtonElement)) throw new Error('Chat close button not found');
    if (!(form instanceof HTMLFormElement)) throw new Error('Chat form not found');
    if (!(input instanceof HTMLTextAreaElement)) throw new Error('Chat input not found');
    if (!(sendBtn instanceof HTMLButtonElement)) throw new Error('Chat send button not found');
    if (!(messages instanceof HTMLDivElement)) throw new Error('Chat messages container not found');
    if (!(thinkingIndicator instanceof HTMLDivElement)) throw new Error('Chat thinking indicator not found');
    if (!(contextIndicator instanceof HTMLSpanElement)) throw new Error('Chat context indicator not found');
    
    debugLog('[ChatPanel] All elements validated, assigning to instance...');
    this.panel = panel;
    this.toggle = toggle;
    this.closeBtn = closeBtn;
    this.form = form;
    this.input = input;
    this.sendBtn = sendBtn;
    this.messages = messages;
    this.thinkingIndicator = thinkingIndicator;
    this.contextIndicator = contextIndicator;
    
    // Character counter (optional, may not exist in DOM yet)
    this.charCounter = document.getElementById('chat-char-counter') as HTMLSpanElement | null;

    this.isOpen = false;
    this.currentContext = this.detectContext();
    this.lastContext = this.currentContext;
    this.customContextKey = null;
    this.customContextLabel = null;
    this.customContextData = null;
    this.unsubscribeChatContext = null;
  this.mcpTools = null;
    this.mcpToolOutputs = null;
    this.outsideClickHandler = null;
    this.stateStore = new ChatStateStore();
    this.transport = createChatTransport({
      endpoint: '/api/v1/chat/enhanced',
      timeoutMs: API_TIMEOUT_MS,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      backoffMs: RETRY_BACKOFF_MS,
    });
    this.messageQueue = new MessageQueue<ChatRequestPayload, ChatResponsePayload>(
      (payload) => this.transport.send(payload),
      {
        maxAttempts: MAX_RETRY_ATTEMPTS,
        initialBackoffMs: RETRY_BACKOFF_MS,
        maxBackoffMs: RETRY_BACKOFF_MS * 8,
        minIntervalMs: RATE_LIMIT_DELAY_MS,
        jitterRatio: 0.3,
      }
    );
    this.queueSubscription = this.messageQueue.subscribe((event) => {
      this.handleQueueEvent(event);
    });
    this.toolCatalogUnsubscribe = toolCatalog.subscribe((event) => {
      this.handleToolCatalogUpdate(event);
    });
    this.chatStateSubscription = null;
    this.beforeUnloadHandler = () => this.destroy();
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    this.analysisResultsHandler = null;
    const existingSnapshot = toolCatalog.getSnapshot();
    if (existingSnapshot) {
      this.handleToolCatalogUpdate({
        tools: existingSnapshot.tools,
        outputs: existingSnapshot.outputs,
        source: 'initial',
      });
    }
    this.chatStateSubscription = appEventBus.on('chat:state', (event) => {
      if (event.source === 'panel') {
        return;
      }
      if (event.isOpen) {
        if (!this.isOpen) {
          this.openPanel();
        }
      } else if (this.isOpen) {
        this.closePanel();
      }
    });
    this.headerObserver = null;

    toolCatalog
      .load({ source: 'initial', captureOutputs: () => this.capturePageOutputs() })
      .catch((err) => {
        debugWarn('Failed to load MCP tools:', err);
      });

    debugLog('[ChatPanel] About to bind events...');
    this.bindEvents();
    debugLog('[ChatPanel] Events bound successfully');
    this.setupLayoutSync();
    this.updateContextIndicator();
    debugLog('[ChatPanel] Constructor complete');
    this.syncAriaState();
    this.emitStateChange();
    this.setupNavigationListener();
    this.setupAnalysisResultsListener();

    const win = window as WindowWithChatPanel;
    win.__chatPanelInstance = this;
    if (document.body) {
      document.body.dataset.chatPanelStatus = 'ready';
    }
  }

  private detectContext(): ContextKey {
    const path = window.location.pathname;
    // Check specific page contexts
    if (path.includes('/amortization')) return 'amortization';
    if (path.includes('/ebitda')) return 'ebitda';
    if (path.includes('/lease-analysis') || path.includes('/enhanced-lease')) return 'lease';
    if (path === '/analysis' || path === '/analysis/') return 'lease';
    if (path.includes('/models')) return 'models';
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
    
    // Update welcome message based on context
    this.updateWelcomeMessage(activeContext);
  }

  private handleQueueEvent(event: QueueEvent<ChatRequestPayload>): void {
    this.stateStore.integrateQueueEvent(event);

    switch (event.type) {
      case 'enqueued':
      case 'sending':
      case 'retrying':
        this.showThinking();
        this.sendBtn.disabled = true;
        break;
      case 'succeeded':
        if (this.stateStore.getState().pendingCount === 0) {
          this.hideThinking();
          this.sendBtn.disabled = false;
        }
        break;
      case 'failed':
        this.hideThinking();
        this.sendBtn.disabled = false;
        break;
      default:
        break;
    }
  }

  private handleToolCatalogUpdate(event: ChatToolsUpdateEvent): void {
    this.mcpTools = event.tools;
    this.mcpToolOutputs = event.outputs;

    if (import.meta.env.DEV) {
      debugLog('[ChatPanel] Tool catalog updated', {
        source: event.source,
        toolCount: this.mcpTools?.length ?? 0,
        hasOutputs: Boolean(this.mcpToolOutputs),
      });
    }

    this.updateWelcomeMessage(this.getActiveContextKey());
  }

  private showContextChangeNotification(newContext: ContextKey): void {
    const contexts: Record<ContextKey, string> = {
      lease: 'Lease Analysis',
      ebitda: 'EBITDA Forecasting',
      amortization: 'Amortization',
      models: 'Models',
      general: 'General',
    };

    const notification = document.createElement('div');
    notification.className = 'context-change-notification';
    notification.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 11a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.25a.75.75 0 01-1.5 0V5a.75.75 0 011.5 0v2.75z" fill="currentColor"/>
      </svg>
      <span>Context switched to <strong>${contexts[newContext]}</strong></span>
    `;

    this.messages.appendChild(notification);
    this.messages.scrollTop = this.messages.scrollHeight;

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  private updateWelcomeMessage(context: ContextKey): void {
    const systemMessage = this.messages.querySelector('.system-message');
    if (!systemMessage) return;

    const contextMessages: Record<ContextKey, { intro: string; examples: string[] }> = {
      lease: {
        intro: "Hi — I can help with lease analysis.",
        examples: [
          '"What if the interest rate was 5.5%?"',
          '"Show a 36-month lease"',
        ],
      },
      ebitda: {
        intro: "Hi — I can help with EBITDA forecasting.",
        examples: [
          '"Set revenue to $500,000"',
          '"Change growth to 15%"',
        ],
      },
      amortization: {
        intro: "Hi — I can help with amortization schedules.",
        examples: [
          '"Set interest to 4.5%"',
          '"Show a 20-year term"',
        ],
      },
      models: {
        intro: "Hi — select a model or ask about available tools.",
        examples: [
          '"What models are available?"',
          '"Tell me about lease analysis"',
        ],
      },
      general: {
        intro: "Hi — I can help with finance tools and quick analysis.",
        examples: [
          '"What tools are available?"',
          '"Show amortization options"',
        ],
      },
    };

    const messageConfig = contextMessages[context];
    let toolsSection = '';
    
    // Add available MCP tools if loaded
    if (this.mcpTools && this.mcpTools.length > 0) {
      const toolsList = (this.mcpTools ?? [])
        .map((tool) => `<li><strong>${tool.name}</strong>: ${tool.description}</li>`)
        .join('');
      toolsSection = `
        <div class="tools-section">
          <p><strong>Available Tools:</strong></p>
          <ul class="tools-list">${toolsList}</ul>
        </div>
      `;
    }
    
    systemMessage.innerHTML = `
      <p>${messageConfig.intro}</p>
      <ul>
        ${messageConfig.examples.map((ex) => `<li>${ex}</li>`).join('')}
      </ul>
      ${toolsSection}
    `;
  }

  private getActiveContextKey(): ContextKey {
    return this.customContextKey || this.currentContext;
  }

  private setExternalContext(
    contextKey: ContextKey | null,
    label: string | null,
    data: SerializedContext | null,
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

  private getContextData(): SerializedContext {
    const base: SerializedContext = { ...this.getCurrentModelState() };
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
  
  private setupAnalysisResultsListener(): void {
    // Listen for analysis result updates from model pages
    if (this.analysisResultsHandler) {
      window.removeEventListener('analysis-result-updated', this.analysisResultsHandler);
    }

    this.analysisResultsHandler = () => {
      toolCatalog
        .load({
          forceRefresh: true,
          source: 'analysis-update',
          captureOutputs: () => this.capturePageOutputs(),
        })
        .catch((err) => {
          debugWarn('Failed to refresh MCP tools after analysis update:', err);
        });
    };

    window.addEventListener('analysis-result-updated', this.analysisResultsHandler);
  }

  private capturePageOutputs(): SerializedContext | null {
    // Look for analysis result containers that might have outputs stored
    const outputs: SerializedContext = {};
    
    // Try to find results in various places on the page
    // Check for data attributes on result containers
    const resultContainers = document.querySelectorAll('[data-analysis-result]');
    resultContainers.forEach((container) => {
      try {
        const toolName = container.getAttribute('data-tool-name');
        const resultData = container.getAttribute('data-analysis-result');
        if (toolName && resultData) {
          outputs[toolName] = JSON.parse(resultData);
        }
      } catch {
        // Ignore parsing errors
      }
    });
    
    // Check window object for stored results (some pages might store there)
    const win = window as Window & { analysisResults?: Record<string, unknown> };
    if (win.analysisResults && typeof win.analysisResults === 'object') {
      Object.assign(outputs, win.analysisResults);
    }
    
    return Object.keys(outputs).length > 0 ? outputs : null;
  }

  private setupNavigationListener(): void {
    const handleContextChange = () => {
      const newContext = this.detectContext();
      if (newContext !== this.lastContext) {
        this.lastContext = this.currentContext;
        this.currentContext = newContext;
        this.updateContextIndicator();
        
        // Show notification if chat is open
        if (this.isOpen) {
          this.showContextChangeNotification(newContext);
        }
      }
    };

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleContextChange);

    // Patch history.pushState and history.replaceState
    const originalPushState = history.pushState.bind(history);
    const originalReplaceState = history.replaceState.bind(history);

    history.pushState = (...args) => {
      originalPushState(...args);
      handleContextChange();
    };

    history.replaceState = (...args) => {
      originalReplaceState(...args);
      handleContextChange();
    };
  }

  private updateActiveWidth(): void {
    const panelWidth = Math.round(this.panel.getBoundingClientRect().width);
    if (!Number.isFinite(panelWidth) || panelWidth <= 0) {
      return;
    }
    applyActiveWidth(panelWidth, window.innerWidth);
  }

  private clearActiveWidth(): void {
    resetActiveWidth();
  }

  public rebindToggleButton(newToggleBtn: HTMLButtonElement): void {
    this.toggle = newToggleBtn;
    this.bindEvents();
  }

  private bindEvents(): void {
    debugLog('[ChatPanel] bindEvents() starting, toggle element:', this.toggle);
    
    const win = window as WindowWithChatPanel;
    win.toggleChatPanel = () => this.togglePanel();
    win.openChatPanel = () => this.openPanel();
    win.closeChatPanel = () => this.closePanel();
    if (!this.unsubscribeChatContext) {
      this.unsubscribeChatContext = subscribeChatContext(({ contextKey, label, data, source }) => {
        if (!contextKey && !label) {
          this.clearExternalContext();
          return;
        }

        const contextData =
          data && typeof data === 'object' ? (data as SerializedContext) : null;

        this.setExternalContext((contextKey as ContextKey) ?? 'models', label ?? null, contextData);

        if (source && source !== 'legacy' && source !== 'chat' && !this.isOpen) {
          this.openPanel();
        }
      });
    }

    // Use capture phase to ensure we get the event first
    debugLog('[ChatPanel] Adding click listener to toggle button...');
    const clickHandler = (event: MouseEvent) => {
      debugLog('[ChatPanel] 🎯 CLICK HANDLER CALLED!', {
        target: event.target,
        currentTarget: event.currentTarget,
        eventPhase: event.eventPhase,
        bubbles: event.bubbles
      });
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();
      this.togglePanel();
    };
    this.toggle.addEventListener('click', clickHandler, { capture: true });
    
    // Verify the listener was added
    debugLog('[ChatPanel] Click listener function created:', clickHandler);
    
    // DIAGNOSTIC: Add mousedown listener to test if ANY events reach the button
    this.toggle.addEventListener(
      'mousedown',
      (event: MouseEvent) => {
        debugLog('[ChatPanel] 🔵 MOUSEDOWN detected!', {
          target: event.target,
          currentTarget: event.currentTarget,
          button: event.button,
        });
      },
      { capture: true }
    );
    
    debugLog('[ChatPanel] Click listener added successfully');
    
    this.closeBtn.addEventListener('click', () => this.closePanel());
    
    // Handle form submission (from Enter key or button click)
    this.form.addEventListener('submit', (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      void this.sendMessage();
      return false;
    });

    this.input.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        // Form submit will handle the message sending
        this.form.requestSubmit();
        return false;
      }
    });

    this.input.addEventListener('input', () => {
      const messageLength = this.input.value.length;
      const isValid = messageLength > 0 && messageLength <= MAX_MESSAGE_LENGTH;
      
      this.sendBtn.disabled = !isValid;
      this.autoResizeInput();
      
      // Update character count indicator
      this.updateCharacterCount(messageLength);
    });

    if (!this.outsideClickHandler) {
      this.outsideClickHandler = (event: MouseEvent | TouchEvent) => {
        if (!this.isOpen) {
          return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }
        if (this.panel.contains(target) || this.toggle.contains(target)) {
          return;
        }
        this.closePanel();
      };
      document.addEventListener('mousedown', this.outsideClickHandler, { capture: true });
      document.addEventListener('touchstart', this.outsideClickHandler, { capture: true });
    }

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

  private updateCharacterCount(length: number): void {
    if (!this.charCounter) return;
    
    this.charCounter.textContent = `${length}/${MAX_MESSAGE_LENGTH}`;
    
    // Visual warning when approaching limit
    if (length > MAX_MESSAGE_LENGTH * 0.9) {
      this.charCounter.style.color = '#f48771'; // Warning orange
    } else if (length > MAX_MESSAGE_LENGTH) {
      this.charCounter.style.color = '#f14c4c'; // Error red
    } else {
      this.charCounter.style.color = '#858585'; // Default gray
    }
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
    this.stateStore.setOpen(true);
    this.updateLayoutOffsets();
    this.syncAriaState();
    this.emitStateChange();
    setTimeout(() => this.input.focus(), 300);
  }

  private closePanel(): void {
    this.panel.classList.remove('visible');
    this.toggle.classList.remove('panel-open');
    this.isOpen = false;
    this.stateStore.setOpen(false);
    this.clearActiveWidth();
    this.syncAriaState();
    this.emitStateChange();
  }

  private syncAriaState(): void {
    syncChatAriaState(this.toggle, this.panel, this.isOpen);
  }

  private addMessage(content: string, type: 'user' | 'assistant' = 'user'): void {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Sanitize user messages to prevent XSS
    if (type === 'user') {
      contentDiv.textContent = content; // Use textContent for user messages (auto-escapes)
    } else {
      contentDiv.innerHTML = content; // Assistant messages can have formatted HTML
    }

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
    
    // Validate message
    const validation = validateMessage(message);
    if (!validation.valid) {
      if (validation.error) {
        this.addMessage(validation.error, 'assistant');
      }
      return;
    }

    this.addMessage(message, 'user');
    this.input.value = '';
    this.sendBtn.disabled = true;
    this.autoResizeInput();
    const payload = this.buildRequestPayload(message);

    try {
      const data = await this.messageQueue.enqueue(payload);
      this.handleSuccessfulResponse(data);
    } catch (error) {
      this.handleFailedResponse(error);
    }
  }

  private buildRequestPayload(message: string): ChatRequestPayload {
    const contextKey = this.getActiveContextKey();
    const currentModel = this.getContextData();
    const payload: ChatRequestPayload = {
      message,
      context: contextKey,
      currentModel,
      availableTools: this.mcpTools ?? [],
      toolOutputs: this.mcpToolOutputs,
    };

    if (import.meta.env.DEV) {
      debugLog('[ChatPanel] Prepared payload with context:', {
        context: contextKey,
        pathname: window.location.pathname,
        hasModelData: Object.keys(currentModel).length > 0,
        toolCount: this.mcpTools?.length ?? 0,
        hasToolOutputs: Boolean(this.mcpToolOutputs),
      });
    }

    if (this.customContextLabel) {
      payload.contextLabel = this.customContextLabel;
    }
    if (this.customContextData) {
      payload.contextData = this.customContextData;
    }

    return payload;
  }

  private handleSuccessfulResponse(data: ChatResponsePayload): void {
    this.addMessage(data.response, 'assistant');

    if (this.stateStore.getState().pendingCount === 0) {
      this.hideThinking();
      this.sendBtn.disabled = false;
    }

    if (data.modelChanges) {
      this.applyModelChanges(data.modelChanges);
    }
  }

  private handleFailedResponse(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    if (errorMessage.includes('timeout')) {
      this.addMessage(
        'Request timed out. The server may be busy. Please try again in a moment.',
        'assistant'
      );
    } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      this.addMessage(
        'Network error. Please check your connection and try again.',
        'assistant'
      );
    } else if (errorMessage.includes('429')) {
      this.addMessage(
        'Too many requests. Please wait a moment before trying again.',
        'assistant'
      );
    } else {
      this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    }

    if (this.stateStore.getState().pendingCount === 0) {
      this.hideThinking();
      this.sendBtn.disabled = false;
    }

    console.error('Chat error:', error);
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

  public destroy(): void {
    this.queueSubscription?.();
    this.queueSubscription = null;
    this.toolCatalogUnsubscribe?.();
    this.toolCatalogUnsubscribe = null;
    this.messageQueue.dispose();

    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }

    if (this.analysisResultsHandler) {
      window.removeEventListener('analysis-result-updated', this.analysisResultsHandler);
      this.analysisResultsHandler = null;
    }

    this.chatStateSubscription?.();
    this.chatStateSubscription = null;

    if (this.unsubscribeChatContext) {
      this.unsubscribeChatContext();
      this.unsubscribeChatContext = null;
    }

    if (this.outsideClickHandler) {
      document.removeEventListener('mousedown', this.outsideClickHandler, true);
      document.removeEventListener('touchstart', this.outsideClickHandler, true);
      this.outsideClickHandler = null;
    }

    window.removeEventListener('resize', this.updateLayoutOffsets);
    window.removeEventListener('orientationchange', this.updateLayoutOffsets);
    window.removeEventListener('scroll', this.updateLayoutOffsets);

    this.headerObserver?.disconnect();
    this.headerObserver = null;
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

    const analyzeCandidates = Array.from(
      document.querySelectorAll<HTMLButtonElement | HTMLElement>(
        'button[type="submit"], .analyze-btn, #analyze',
      ),
    );
    const analyzeBtn = analyzeCandidates.find((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      return !this.panel.contains(element);
    });

    if (analyzeBtn instanceof HTMLButtonElement) {
      const clickEvent = new MouseEvent('click', { bubbles: false, cancelable: false });
      analyzeBtn.dispatchEvent(clickEvent);
    } else if (analyzeBtn instanceof HTMLElement) {
      const clickEvent = new MouseEvent('click', { bubbles: false, cancelable: false });
      analyzeBtn.dispatchEvent(clickEvent);
    }
    
    // Refetch MCP tools to capture any new outputs from the analysis
    setTimeout(() => {
      toolCatalog
        .load({
          forceRefresh: true,
          source: 'analysis-update',
          captureOutputs: () => this.capturePageOutputs(),
        })
        .catch((err) => {
          debugWarn('Failed to refresh MCP tools after model change:', err);
        });
    }, 500); // Wait for analysis to complete
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
      
      // Watch for button being replaced in DOM and re-attach listeners
      let buttonSeenOnce = false;
      const buttonObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) {
              const element = node as Element;
              if (element.id === 'chat-toggle') {
                if (!buttonSeenOnce) {
                  buttonSeenOnce = true;
                  debugLog('[chat-panel] Initial button load detected');
                } else {
                  debugWarn('[chat-panel] Button re-added to DOM, re-attaching listeners');
                  if (win.__chatPanelInstance) {
                    // Re-bind just the toggle button events
                    const toggleBtn = element as HTMLButtonElement;
                    win.__chatPanelInstance.rebindToggleButton(toggleBtn);
                  }
                }
              }
            }
          });
        });
      });
      buttonObserver.observe(document.body, { childList: true, subtree: true });
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
    // Add small delay to ensure any DOM manipulation from other scripts is complete
    setTimeout(bootstrap, 50);
  }
}

initializeChatPanel();
