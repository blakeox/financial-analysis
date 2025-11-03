import {
  appEventBus,
  type ChatToolsUpdateEvent,
  type SerializedContext,
} from '@financial-analysis/tools';
import {
  updateActiveWidth as applyActiveWidth,
  clearActiveWidth as resetActiveWidth,
  setTopOffset,
  syncChatAriaState,
} from './chat/accessibility';
import {
  detectCalculatorContext,
  parseFieldUpdate,
  CALCULATOR_CONTEXTS,
  type CalculatorContextKey,
} from './chat/calculator-contexts';
import { installChatContextBridge, subscribeChatContext } from './chat/chat-context';
import { chatMemory } from './chat/chat-memory';
import { MessageQueue, type QueueEvent } from './chat/message-queue';
import { ChatStateStore } from './chat/state-store';
import { toolCatalog } from './chat/tool-catalog';
import type { ChatTransport } from './chat/transport';
import { createChatTransport } from './chat/transport';
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
      contextIndicator: !!contextIndicator,
    });

    if (!(panel instanceof HTMLDivElement)) throw new Error('Chat panel container not found');
    if (!(toggle instanceof HTMLButtonElement)) throw new Error('Chat toggle button not found');
    if (!(closeBtn instanceof HTMLButtonElement)) throw new Error('Chat close button not found');
    if (!(form instanceof HTMLFormElement)) throw new Error('Chat form not found');
    if (!(input instanceof HTMLTextAreaElement)) throw new Error('Chat input not found');
    if (!(sendBtn instanceof HTMLButtonElement)) throw new Error('Chat send button not found');
    if (!(messages instanceof HTMLDivElement)) throw new Error('Chat messages container not found');
    if (!(thinkingIndicator instanceof HTMLDivElement))
      throw new Error('Chat thinking indicator not found');
    if (!(contextIndicator instanceof HTMLSpanElement))
      throw new Error('Chat context indicator not found');

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
    // Use the new comprehensive calculator context detection
    return detectCalculatorContext(window.location.pathname) as ContextKey;
  }

  private updateContextIndicator(): void {
    const activeContext = this.getActiveContextKey();
    const contextDef = CALCULATOR_CONTEXTS[activeContext as CalculatorContextKey];
    
    // Use custom label if set, otherwise use the context definition label
    const label = this.customContextLabel || contextDef?.label || 'General';
    
    this.contextIndicator.textContent = label;
    
    if (this.customContextLabel) {
      this.contextIndicator.setAttribute('title', 'Custom context');
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
    const contextDef = CALCULATOR_CONTEXTS[newContext as CalculatorContextKey];
    const label = contextDef?.label || 'General';

    const notification = document.createElement('div');
    notification.className = 'context-change-notification';
    notification.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 11a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-3.25a.75.75 0 01-1.5 0V5a.75.75 0 011.5 0v2.75z" fill="currentColor"/>
      </svg>
      <span>Context switched to <strong>${label}</strong></span>
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

    const contextDef = CALCULATOR_CONTEXTS[context as CalculatorContextKey];
    
    // Fallback to general context if specific one not found
    const messageConfig = contextDef || CALCULATOR_CONTEXTS['general'];
    let toolsSection = '';

    // Add available MCP tools if loaded (simplified)
    if (this.mcpTools && this.mcpTools.length > 0) {
      toolsSection = `
        <div class="tools-section">
          <p><em>I have access to ${this.mcpTools.length} financial analysis tools. Ask me to analyze specific scenarios or say "help" for examples.</em></p>
        </div>
      `;
    }

    systemMessage.innerHTML = `
      <p>${messageConfig.intro}</p>
      <ul>
        ${messageConfig.examples.map((ex) => `<li>"${ex}"</li>`).join('')}
      </ul>
      ${toolsSection}
    `;
  }

  private getActiveContextKey(): ContextKey {
    return this.customContextKey || this.currentContext;
  }

  private getModelTypeFromContext(context: ContextKey): string | null {
    switch (context) {
      case 'amortization':
        return 'amortization';
      case 'lease':
        return 'lease';
      case 'ebitda':
        return 'ebitda';
      default:
        return null;
    }
  }

  private getLastUserMessage(): string | null {
    // Find the last user message from the messages container
    const messages = this.messages?.querySelectorAll('.message.user');
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const contentDiv = lastMessage.querySelector('.message-content');
      return contentDiv?.textContent?.trim() || null;
    }
    return null;
  }

  private dispatchToolAnalysisEvent(
    toolName: string,
    response: string,
    modelChanges?: Record<string, unknown>
  ): void {
    // Extract insights from the response
    const insights: string[] = [];

    // Look for insight patterns in the response
    const insightMatches = response.match(/💡 \*\*Insight\*\*: ([^\n]+)/g);
    if (insightMatches) {
      insights.push(...insightMatches.map((match) => match.replace(/💡 \*\*Insight\*\*: /, '')));
    }

    // Look for recommendation patterns
    const recommendationMatches = response.match(/💡 \*\*Recommendation\*\*: ([^\n]+)/g);
    if (recommendationMatches) {
      insights.push(
        ...recommendationMatches.map((match) => match.replace(/💡 \*\*Recommendation\*\*: /, ''))
      );
    }

    // Create tool analysis event
    const toolAnalysisEvent = new CustomEvent('tool-analysis-completed', {
      detail: {
        toolName,
        input: this.getContextData(),
        output: modelChanges || {},
        analysis: response,
        insights,
      },
    });

    document.dispatchEvent(toolAnalysisEvent);
  }

  private setExternalContext(
    contextKey: ContextKey | null,
    label: string | null,
    data: SerializedContext | null
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

        const contextData = data && typeof data === 'object' ? (data as SerializedContext) : null;

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
        bubbles: event.bubbles,
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

    // Check for help/tools questions first
    const helpResponse = this.checkForHelpQuery(message);
    if (helpResponse) {
      this.addMessage(message, 'user');
      this.input.value = '';
      this.sendBtn.disabled = false;
      this.autoResizeInput();
      this.addMessage(helpResponse, 'assistant');
      return;
    }

    // Check if this is a field update request
    const context = this.getActiveContextKey();
    const fieldUpdate = parseFieldUpdate(message, context as CalculatorContextKey);
    
    if (fieldUpdate && fieldUpdate.field && fieldUpdate.value) {
      // Apply the field update immediately
      const success = this.updateFormField(fieldUpdate.field, fieldUpdate.value);
      
      if (success) {
        this.addMessage(message, 'user');
        this.input.value = '';
        this.sendBtn.disabled = false;
        this.autoResizeInput();
        
        // Provide immediate feedback
        const feedbackMessage = `✓ Updated ${fieldUpdate.fieldLabel || fieldUpdate.field} to ${fieldUpdate.value}. The calculator will recalculate when you submit the form.`;
        this.addMessage(feedbackMessage, 'assistant');
        return;
      }
    }

    // Normal message handling (send to AI)
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

  /**
   * Check if the message is asking for help/tools and provide instant response
   */
  private checkForHelpQuery(message: string): string | null {
    const lowerMessage = message.toLowerCase().trim();
    
    // Patterns that indicate tool/help requests
    const toolsPatterns = [
      /what\s+(tools?|calculators?|models?)\s+(are\s+)?available/i,
      /show\s+(me\s+)?(all\s+)?(tools?|calculators?|models?)/i,
      /list\s+(all\s+)?(tools?|calculators?|models?)/i,
      /what\s+can\s+(you|this)\s+do/i,
      /available\s+(tools?|calculators?)/i,
    ];
    
    const helpPatterns = [
      /^help$/i,
      /^what(\s+can)?\s+(i|you)\s+do/i,
    ];
    
    const isToolsQuery = toolsPatterns.some(pattern => pattern.test(lowerMessage));
    const isHelpQuery = helpPatterns.some(pattern => pattern.test(lowerMessage));
    
    if (isToolsQuery) {
      return this.getToolsListResponse();
    }
    
    if (isHelpQuery) {
      return this.getHelpResponse();
    }
    
    // Check for category-specific questions
    if (lowerMessage.includes('business') && (lowerMessage.includes('calculator') || lowerMessage.includes('tool'))) {
      return this.getBusinessToolsResponse();
    }
    
    if (lowerMessage.includes('personal') && (lowerMessage.includes('calculator') || lowerMessage.includes('tool'))) {
      return this.getPersonalToolsResponse();
    }
    
    return null;
  }

  /**
   * Generate comprehensive tools list response
   */
  private getToolsListResponse(): string {
    return `I have access to **31 financial analysis tools** across two main categories:

**📊 Business Finance (17 tools):**
• [EBITDA Forecasting](/ebitda-forecasting) - Revenue & profitability
• [Unit Economics](/calculator/unit-economics) - CAC, LTV, payback
• [Business Valuation](/calculator/business-valuation) - Multiple methods
• [Revenue Forecast](/calculator/revenue-forecast) - Multi-stream projections
• [Cash Flow Forecast](/calculator/cash-flow-forecast) - Runway planning
• [Pricing Strategy](/calculator/pricing-strategy) - Margin optimization
• [Break-Even Analysis](/calculator/break-even) - Profitability targets
• [SaaS Metrics](/calculator/saas-metrics) - MRR, ARR, churn
• [M&A Analysis](/calculator/ma-analysis) - Deal evaluation
• [DCF Valuation](/calculator/dcf-valuation) - Discounted cash flow
• [Equipment Lease](/calculator/equipment-lease) - Lease vs buy
• [Commercial Lease](/calculator/commercial-real-estate-lease) - Real estate
• [Business Loan Qualifier](/calculator/business-loan-qualifier) - Loan eligibility
• [Risk Management](/calculator/risk-management) - Enterprise risk
• Plus 3 more...

**💰 Personal Finance (14 tools):**
• [Mortgage Calculator](/amortization) - Home loans & amortization
• [Auto Loan](/calculator/auto-loan) - Vehicle financing
• [Retirement Planning](/calculator/retirement) - Savings projections
• [Budget Planner](/calculator/budget) - Income vs expenses
• [Debt Payoff](/calculator/debt-payoff) - Multi-debt strategy
• [Student Loans](/calculator/student-loans) - Repayment options
• [Credit Card Payoff](/calculator/credit-card-payoff) - Balance elimination
• [Rent vs Buy](/calculator/rent-vs-buy) - Home ownership analysis
• [Invest vs Payoff Debt](/calculator/invest-vs-payoff-debt) - Strategy optimization
• [Savings Goal](/calculator/savings-goal) - Goal tracking
• [Side Hustle Income](/calculator/side-hustle-income) - Additional income
• Plus 3 more...

**🗺️ Or explore 8 guided journeys:**
• [Young Professional](/journey/young-professional) - Career start
• [Business Growth](/journey/business-growth) - SMB scaling
• [Startup Planning](/journey/startup-planning) - Launch to funding
• [Debt Freedom](/journey/debt-freedom) - Eliminate debt
• Plus 4 more at [/journey](/journey)

What would you like to calculate?`;
  }

  /**
   * Generate help response based on context
   */
  private getHelpResponse(): string {
    const context = this.getActiveContextKey();
    
    if (context === 'general' || context === 'models') {
      return `I can help you with:

**💬 Ask Questions:**
• "What tools are available?"
• "Show me business calculators"
• "Help me calculate a mortgage"

**🗺️ Explore Journeys:**
• "Young Professional journey"
• "Business Growth journey"
• "Debt Freedom journey"

**🔍 Get Specific:**
• "Calculate my retirement needs"
• "Analyze my unit economics"
• "Should I rent or buy?"

**📊 Financial Analysis:**
Ask me to analyze scenarios, compare options, or help you choose the right calculator for your needs.

What would you like to explore?`;
    }
    
    // Context-specific help
    return `I can help with this calculator:

**📝 Update Fields:**
• "Set interest rate to 4.5%"
• "Change loan amount to $500,000"
• "Update term to 20 years"

**❓ Ask Questions:**
• "What if I increase my down payment?"
• "How much can I afford?"
• "Show me different scenarios"

**🔍 Get Advice:**
Ask about strategies, what-if scenarios, or how to optimize your inputs.

Try saying something like "Set interest to 5%" or ask a question about your scenario!`;
  }

  /**
   * Generate business tools response
   */
  private getBusinessToolsResponse(): string {
    return `**📊 Business Finance Calculators (17 tools):**

**Growth & Planning:**
• [EBITDA Forecasting](/ebitda-forecasting) - Revenue & profitability projections
• [Unit Economics](/calculator/unit-economics) - CAC, LTV, payback period
• [Revenue Forecast](/calculator/revenue-forecast) - Multi-stream projections
• [Cash Flow Forecast](/calculator/cash-flow-forecast) - Runway & working capital

**Pricing & Strategy:**
• [Pricing Strategy](/calculator/pricing-strategy) - Margin optimization
• [Break-Even Analysis](/calculator/break-even) - Profitability targets
• [SaaS Metrics](/calculator/saas-metrics) - MRR, ARR, churn analysis

**Valuation & M&A:**
• [Business Valuation](/calculator/business-valuation) - Multiple methods
• [M&A Analysis](/calculator/ma-analysis) - Deal evaluation
• [DCF Valuation](/calculator/dcf-valuation) - Discounted cash flow

**Operations:**
• [Equipment Lease](/calculator/equipment-lease) - Lease vs buy
• [Commercial Lease](/calculator/commercial-real-estate-lease) - Real estate
• [Business Loan Qualifier](/calculator/business-loan-qualifier) - Loan eligibility
• [Risk Management](/calculator/risk-management) - Enterprise risk

**💡 Try our Business Journeys:**
• [Startup Planning](/journey/startup-planning) - Launch to funding
• [Business Growth](/journey/business-growth) - SMB scaling
• [M&A Analysis](/journey/ma-analysis-journey) - Acquisition planning

Which calculator interests you?`;
  }

  /**
   * Generate personal tools response
   */
  private getPersonalToolsResponse(): string {
    return `**💰 Personal Finance Calculators (14 tools):**

**Home & Real Estate:**
• [Mortgage Calculator](/amortization) - Home loans & amortization
• [Rent vs Buy](/calculator/rent-vs-buy) - Home ownership analysis
• [Mortgage Scenario Planning](/calculator/mortgage-scenario-planning) - Rate comparisons

**Debt Management:**
• [Debt Payoff](/calculator/debt-payoff) - Multi-debt strategy
• [Credit Card Payoff](/calculator/credit-card-payoff) - Balance elimination
• [Student Loans](/calculator/student-loans) - Repayment options
• [Auto Loan](/calculator/auto-loan) - Vehicle financing

**Savings & Planning:**
• [Retirement Planning](/calculator/retirement) - Long-term projections
• [Savings Goal](/calculator/savings-goal) - Goal tracking
• [Budget Planner](/calculator/budget) - Income vs expenses
• [Invest vs Payoff Debt](/calculator/invest-vs-payoff-debt) - Strategy optimization

**Income:**
• [Side Hustle Income](/calculator/side-hustle-income) - Additional income planning

**💡 Try our Personal Finance Journeys:**
• [Young Professional](/journey/young-professional) - Career start
• [Debt Freedom](/journey/debt-freedom) - Eliminate debt
• [Home Buying](/journey/home-buying) - Path to ownership
• [Family Planning](/journey/family-planning) - Growing family

Which calculator interests you?`;
  }

  /**
   * Update a form field value
   */
  private updateFormField(fieldId: string, value: string): boolean {
    try {
      // Try to find the field by ID
      const field = document.getElementById(fieldId) as HTMLInputElement | null;
      
      if (!field) {
        debugWarn(`[ChatPanel] Field not found: ${fieldId}`);
        return false;
      }
      
      // Update the field value
      const oldValue = field.value;
      field.value = value;
      
      // Trigger change and input events
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Highlight the field to show it changed
      if (typeof (window as any).highlightFieldChange === 'function') {
        (window as any).highlightFieldChange(fieldId, value, true);
      } else {
        // Fallback visual feedback
        field.style.transition = 'all 0.3s ease';
        field.style.backgroundColor = '#fef3c7'; // yellow highlight
        field.style.borderColor = '#f59e0b';
        
        setTimeout(() => {
          field.style.backgroundColor = '';
          field.style.borderColor = '';
        }, 2000);
      }
      
      debugLog(`[ChatPanel] Updated field ${fieldId}: "${oldValue}" → "${value}"`);
      return true;
    } catch (error) {
      debugWarn('[ChatPanel] Error updating field:', error);
      return false;
    }
  }

  private buildRequestPayload(message: string): ChatRequestPayload {
    const contextKey = this.getActiveContextKey();
    const currentModel = this.getContextData();

    // Initialize memory session
    chatMemory.initializeSession();
    chatMemory.updateContext(contextKey);

    // Store current model state for comparison
    const modelType = this.getModelTypeFromContext(contextKey);
    if (modelType && Object.keys(currentModel).length > 0) {
      chatMemory.updateModelState(modelType, currentModel);
    }

    const payload: ChatRequestPayload = {
      message,
      context: contextKey,
      currentModel,
      availableTools: this.mcpTools ?? [],
      toolOutputs: this.mcpToolOutputs,
      memoryContext: {
        conversationHistory: chatMemory.getConversationContext(),
        modelStates: chatMemory.getModelStateSummary(),
      },
    };

    if (import.meta.env.DEV) {
      debugLog('[ChatPanel] Prepared payload with context:', {
        context: contextKey,
        pathname: window.location.pathname,
        hasModelData: Object.keys(currentModel).length > 0,
        toolCount: this.mcpTools?.length ?? 0,
        hasToolOutputs: Boolean(this.mcpToolOutputs),
        hasMemoryContext: Boolean(payload.memoryContext),
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

    // Store conversation in memory
    const userMessage = this.getLastUserMessage();
    if (userMessage) {
      chatMemory.addConversationEntry(
        userMessage,
        data.response,
        this.getActiveContextKey(),
        data.modelChanges
      );
    }

    // Dispatch tool analysis event if this was a tool-based response
    if (data.toolUsed) {
      this.dispatchToolAnalysisEvent(data.toolUsed, data.response, data.modelChanges);
    }

    if (this.stateStore.getState().pendingCount === 0) {
      this.hideThinking();
      this.sendBtn.disabled = false;
    }

    if (data.modelChanges) {
      try {
        this.applyModelChanges(data.modelChanges);
      } catch (error) {
        console.warn('Error applying model changes:', error);
        // Continue processing even if model changes fail
      }

      // Update memory with new model state
      const modelType = this.getModelTypeFromContext(this.getActiveContextKey());
      if (modelType) {
        const currentModel = this.getContextData();
        const updatedModel = { ...currentModel, ...data.modelChanges };
        chatMemory.updateModelState(modelType, updatedModel);
      }
    }

    if (data.context && data.context !== this.getActiveContextKey()) {
      this.updateContext(data.context as ContextKey);
      chatMemory.updateContext(data.context);
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
      this.addMessage('Network error. Please check your connection and try again.', 'assistant');
    } else if (errorMessage.includes('429')) {
      this.addMessage('Too many requests. Please wait a moment before trying again.', 'assistant');
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

    const inputs = document.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input, select, textarea');
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
    const validationResults: Array<{
      field: string;
      value: unknown;
      isValid: boolean;
      error?: string;
    }> = [];

    // Validate each change before applying
    Object.entries(changes).forEach(([field, value]) => {
      const validation = this.validateFieldValue(field, value);
      validationResults.push({
        field,
        value,
        isValid: validation.isValid,
        error: validation.error,
      });

      if (validation.isValid) {
        const input = document.querySelector<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >(`[name="${field}"]`);
        if (input) {
          const stringValue = typeof value === 'number' ? String(value) : value;
          input.value = stringValue;
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
    });

    // Check if any validations failed
    const failedValidations = validationResults.filter((result) => !result.isValid);
    if (failedValidations.length > 0) {
      this.showValidationFeedback(failedValidations);
      return; // Don't trigger analysis if there are validation errors
    }

    // Only trigger analysis if all validations passed
    const analyzeCandidates = Array.from(
      document.querySelectorAll<HTMLButtonElement | HTMLElement>(
        'button[type="submit"], .analyze-btn, #analyze'
      )
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

  private validateFieldValue(field: string, value: unknown): { isValid: boolean; error?: string } {
    // Get the input element to check its constraints
    const input = document.querySelector<HTMLInputElement>(`[name="${field}"]`);
    if (!input) {
      return { isValid: false, error: `Field "${field}" not found on page` };
    }

    // Check if value is a valid number for numeric fields
    if (typeof value === 'number') {
      if (isNaN(value) || !isFinite(value)) {
        return { isValid: false, error: `Invalid number: ${value}` };
      }

      // Check min/max constraints
      const min = parseFloat(input.min);
      const max = parseFloat(input.max);

      if (!isNaN(min) && value < min) {
        return { isValid: false, error: `Value ${value} is below minimum ${min}` };
      }

      if (!isNaN(max) && value > max) {
        return { isValid: false, error: `Value ${value} is above maximum ${max}` };
      }

      // Check step constraints for decimal values
      const step = parseFloat(input.step);
      if (!isNaN(step) && step > 0) {
        const remainder = value % step;
        if (Math.abs(remainder) > 0.0001 && Math.abs(remainder - step) > 0.0001) {
          return { isValid: false, error: `Value ${value} doesn't match step size ${step}` };
        }
      }
    }

    // Check required fields
    if (input.required && (value === null || value === undefined || value === '')) {
      return { isValid: false, error: `Field "${field}" is required` };
    }

    // Check pattern constraints
    if (input.pattern && typeof value === 'string') {
      const regex = new RegExp(input.pattern);
      if (!regex.test(value)) {
        return { isValid: false, error: `Value "${value}" doesn't match required pattern` };
      }
    }

    // Field-specific validations
    switch (field) {
      case 'annualRate':
        if (typeof value === 'number' && (value < 0 || value > 1)) {
          return { isValid: false, error: `Interest rate must be between 0 and 1 (0% to 100%)` };
        }
        break;

      case 'principal':
      case 'loanAmount':
        if (typeof value === 'number' && value <= 0) {
          return { isValid: false, error: `Loan amount must be greater than 0` };
        }
        break;

      case 'termMonths':
        if (typeof value === 'number' && (value <= 0 || value > 600)) {
          return { isValid: false, error: `Loan term must be between 1 and 600 months` };
        }
        break;

      case 'monthlyPayment':
        if (typeof value === 'number' && value <= 0) {
          return { isValid: false, error: `Monthly payment must be greater than 0` };
        }
        break;
    }

    return { isValid: true };
  }

  private showValidationFeedback(
    failedValidations: Array<{ field: string; value: unknown; error?: string }>
  ): void {
    const errorMessages = failedValidations
      .map((validation) => {
        const fieldName = this.getFieldDisplayName(validation.field);
        return `• **${fieldName}**: ${validation.error}`;
      })
      .join('\n');

    const feedbackMessage = `❌ **Validation Error**\n\nI couldn't apply some of your requested changes:\n\n${errorMessages}\n\nPlease provide valid values and try again.`;

    this.addMessage(feedbackMessage, 'assistant');
  }

  private getFieldDisplayName(field: string): string {
    const fieldNames: Record<string, string> = {
      annualRate: 'Interest Rate',
      principal: 'Loan Amount',
      loanAmount: 'Loan Amount',
      termMonths: 'Loan Term',
      monthlyPayment: 'Monthly Payment',
      extraPayment: 'Extra Payment',
      propertyTax: 'Property Tax',
      homeInsurance: 'Home Insurance',
      hoaFees: 'HOA Fees',
      residualValue: 'Residual Value',
      leaseTerm: 'Lease Term',
      revenue: 'Revenue',
      growthRate: 'Growth Rate',
      expenses: 'Expenses',
    };

    return fieldNames[field] || field;
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
      win.chatPanelBootstrapError =
        error instanceof Error ? `${error.name}: ${error.message}` : String(error);
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
