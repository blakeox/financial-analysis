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
} from './accessibility';
import {
  detectCalculatorContext,
  parseFieldUpdate,
  CALCULATOR_CONTEXTS,
  type CalculatorContextKey,
} from './calculator-contexts';
import { installChatContextBridge, subscribeChatContext } from './chat-context';
import { chatMemory } from './chat-memory';
import { FieldUpdateManager, type FieldUpdateInstruction } from './field-update-manager';
import { MessageQueue, type QueueEvent } from './message-queue';
import { ChatStateStore } from './state-store';
import { filterToolsForContext } from './tool-scope';
import { toolCatalog } from './tool-catalog';
import type { ChatTransport } from './transport';
import { createChatTransport } from './transport';
import type { HighlightFieldChangeFn } from '../_shared/field-highlighting.client';
import type { ChatRequestPayload, ChatResponsePayload, ContextKey, ToolSummary } from './types';

declare global {
  interface Window {
    highlightFieldChange: HighlightFieldChangeFn;
  }
}

installChatContextBridge();

// Security and validation constants
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_DELAY_MS = 1000; // 1 second between messages
const API_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1000; // Initial backoff time

const NEGATIVE_CONSTRAINTS = [
  "Do not say 'I can help update the model'",
  "Do not say 'Try: set interest to'",
  "Do not say 'Say help'",
  "Do not say 'Ask for a specific value'",
  "Do not say 'I can change interest rates'",
  "Do not say 'I can help update the general model'",
  "Do not start with 'Hi — I can help'",
  "Do not ask 'What tools/calculators'",
  "Do not say 'I can help update the models model'",
  'Do not provide generic filler responses',
  'Do not ask the user what they want to do if the intent is clear',
];

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

type SuggestedPrompt = {
  label: string;
  prompt?: string;
  action?: 'recalculate';
  kind?: 'primary' | 'secondary';
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
  private toggle: HTMLButtonElement | null;
  private closeBtn: HTMLButtonElement | null;
  private form: HTMLFormElement;
  private input: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private messages: HTMLDivElement;
  private thinkingIndicator: HTMLDivElement;
  private contextIndicator: HTMLSpanElement;
  private assistantStatus: HTMLDivElement | null;
  private charCounter: HTMLSpanElement | null;
  private isOpen: boolean;
  private currentContext: ContextKey;
  private customContextKey: ContextKey | null;
  private customContextLabel: string | null;
  private customContextData: SerializedContext | null;
  private unsubscribeChatContext: (() => void) | null;
  private headerObserver: ResizeObserver | null;
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
  private fieldUpdates: FieldUpdateManager;
  private isEmbedded: boolean;
  private pendingAssistantRecalculation: boolean;

  private updateLayoutOffsets = (): void => {
    if (this.isEmbedded) {
      return;
    }
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
    const assistantStatus = document.getElementById('assistant-status');

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
      assistantStatus: !!assistantStatus,
    });

    if (!(panel instanceof HTMLDivElement)) throw new Error('Chat panel container not found');
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
    this.toggle = toggle instanceof HTMLButtonElement ? toggle : null;
    this.closeBtn = closeBtn instanceof HTMLButtonElement ? closeBtn : null;
    this.form = form;
    this.input = input;
    this.sendBtn = sendBtn;
    this.messages = messages;
    this.thinkingIndicator = thinkingIndicator;
    this.contextIndicator = contextIndicator;
    this.assistantStatus = assistantStatus instanceof HTMLDivElement ? assistantStatus : null;

    // Character counter (optional, may not exist in DOM yet)
    this.charCounter = document.getElementById('chat-char-counter') as HTMLSpanElement | null;

    this.isEmbedded = panel.dataset.chatVariant === 'embedded';
    if (!this.isEmbedded && !this.toggle) {
      throw new Error('Chat toggle button not found');
    }
    if (!this.isEmbedded && !this.closeBtn) {
      throw new Error('Chat close button not found');
    }
    this.isOpen = this.isEmbedded;
    this.currentContext = this.detectContext();
    this.customContextKey = null;
    this.customContextLabel = null;
    this.customContextData = null;
    this.unsubscribeChatContext = null;
    this.mcpTools = null;
    this.mcpToolOutputs = null;
    this.outsideClickHandler = null;
    this.stateStore = new ChatStateStore();
    this.transport = createChatTransport({
      endpoint: '/v1/chat/enhanced',
      streamEndpoint: '/v1/chat/stream',
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
    this.pendingAssistantRecalculation = false;
    this.fieldUpdates = new FieldUpdateManager({
      updateField: (fieldId, value) => this.updateFormField(fieldId, value),
      captureOutputs: () => this.capturePageOutputs(),
      getFieldDisplayName: (fieldId) => this.getFieldDisplayName(fieldId),
      requestRecalculation: () => this.requestRecalculation(),
    });
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
    this.fieldUpdates.clearRememberedField();
  }

  private handleQueueEvent(event: QueueEvent<ChatRequestPayload>): void {
    this.stateStore.integrateQueueEvent(event);

    switch (event.type) {
      case 'enqueued':
      case 'sending':
      case 'retrying':
        this.showThinking();
        this.sendBtn.disabled = true;
        this.setAssistantStatus('Working through your request…', 'info');
        break;
      case 'succeeded':
        if (this.stateStore.getState().pendingCount === 0) {
          this.hideThinking();
          this.sendBtn.disabled = false;
          if (!this.pendingAssistantRecalculation) {
            this.clearAssistantStatus();
          }
        }
        break;
      case 'failed':
        this.hideThinking();
        this.sendBtn.disabled = false;
        this.setAssistantStatus(
          'That request did not complete. Try again or adjust the value.',
          'error'
        );
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
      <span>Context switched to <strong>${this.escapeHtmlText(label)}</strong></span>
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
    const hasOutputs = this.hasAnalysisOutputs();
    let toolsSection = '';

    // Add available MCP tools if loaded (simplified)
    const scopedTools = this.getScopedTools(context);
    if (!this.isEmbedded && scopedTools.length > 0) {
      toolsSection = `
        <div class="tools-section">
          <p><em>I can use ${scopedTools.length} tools that match this page. Ask about the current workflow or the result you just generated.</em></p>
        </div>
      `;
    }

    const intro = this.getWelcomeIntro(messageConfig.intro, hasOutputs);
    const examples = this.getWelcomeExamples(messageConfig.examples, hasOutputs);
    const suggestedPrompts = this.getSuggestedPrompts(context, hasOutputs);
    const promptButtons =
      suggestedPrompts.length > 0
        ? `
          <div class="suggested-prompts" aria-label="Suggested next actions">
            ${suggestedPrompts
              .map((item) => {
                if (item.action) {
                  return `<button type="button" class="suggested-prompt" data-chat-action="${this.escapeHtmlAttribute(item.action)}" data-kind="${item.kind ?? 'secondary'}">${this.escapeHtmlText(item.label)}</button>`;
                }
                return `<button type="button" class="suggested-prompt" data-suggested-prompt="${this.escapeHtmlAttribute(item.prompt ?? item.label)}" data-kind="${item.kind ?? 'secondary'}">${this.escapeHtmlText(item.label)}</button>`;
              })
              .join('')}
          </div>
        `
        : '';

    systemMessage.innerHTML = `
      <p>${this.escapeHtmlText(intro)}</p>
      <ul>
        ${examples.map((ex) => `<li>"${this.escapeHtmlText(ex)}"</li>`).join('')}
      </ul>
      ${promptButtons}
      ${toolsSection}
    `;

    this.updateInputAffordances(hasOutputs);
    this.updateEmbeddedAssistantStatus(hasOutputs);
  }

  private getWelcomeIntro(defaultIntro: string, hasOutputs: boolean): string {
    if (!this.isEmbedded) {
      return defaultIntro;
    }

    return hasOutputs
      ? 'Your latest result is ready. Ask me to explain what changed, compare scenarios, or update the form in plain English.'
      : 'Run the numbers once to unlock result-aware guidance. I can still update the form, but the best next step is to calculate the current scenario first.';
  }

  private getWelcomeExamples(defaultExamples: string[], hasOutputs: boolean): string[] {
    if (!this.isEmbedded) {
      return defaultExamples;
    }

    if (hasOutputs) {
      return this.getPostCalculationExamples(this.getActiveContextKey());
    }

    return ['Calculate the current scenario first', ...defaultExamples.slice(0, 2)];
  }

  private getPostCalculationExamples(context: ContextKey): string[] {
    switch (context) {
      case 'amortization':
        return [
          'What changed my monthly payment the most?',
          'Compare this with a 20-year term',
          'How much interest would extra payments save?',
        ];
      case 'lease':
      case 'equipment-lease':
        return [
          'Compare lease vs buy options',
          'Show a 36-month lease',
          'What changed the total cost the most?',
        ];
      default:
        return [
          'Explain the latest result',
          'Compare another scenario',
          'What should I change next?',
        ];
    }
  }

  private getSuggestedPrompts(context: ContextKey, hasOutputs: boolean): SuggestedPrompt[] {
    if (!this.isEmbedded) {
      return [];
    }

    if (!hasOutputs) {
      const contextDef =
        CALCULATOR_CONTEXTS[context as CalculatorContextKey] || CALCULATOR_CONTEXTS.general;
      return [
        { label: 'Calculate current scenario', action: 'recalculate', kind: 'primary' },
        ...contextDef.examples.slice(0, 2).map((example) => ({
          label: example,
          prompt: example,
        })),
      ];
    }

    const examples = this.getPostCalculationExamples(context);
    return examples.map((example, index) => ({
      label: example,
      prompt: example,
      kind: index === 0 ? 'primary' : 'secondary',
    }));
  }

  private escapeHtmlAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private escapeHtmlText(value: string): string {
    return this.escapeHtmlAttribute(value).replace(/'/g, '&#39;');
  }

  private hasAnalysisOutputs(): boolean {
    return Boolean(this.capturePageOutputs());
  }

  private updateInputAffordances(hasOutputs: boolean): void {
    if (!this.isEmbedded) {
      return;
    }

    this.input.placeholder = hasOutputs
      ? 'Ask what changed, compare scenarios, or update fields in plain English...'
      : 'Calculate first, or ask me to update a field before you run the numbers...';
  }

  private updateEmbeddedAssistantStatus(hasOutputs: boolean): void {
    if (
      !this.isEmbedded ||
      this.pendingAssistantRecalculation ||
      this.stateStore.getState().pendingCount > 0
    ) {
      return;
    }

    if (hasOutputs) {
      this.setAssistantStatus(
        'Result ready. Ask for an explanation, comparison, or another input change.',
        'success'
      );
      return;
    }

    this.setAssistantStatus(
      'Run the current scenario once to unlock result-aware guidance.',
      'info'
    );
  }

  private setAssistantStatus(message: string, tone: 'info' | 'success' | 'error'): void {
    if (!this.assistantStatus) {
      return;
    }

    this.assistantStatus.textContent = message;
    this.assistantStatus.classList.remove('hidden', 'is-info', 'is-success', 'is-error');
    this.assistantStatus.classList.add(`is-${tone}`);
  }

  private clearAssistantStatus(): void {
    if (!this.assistantStatus) {
      return;
    }

    this.assistantStatus.textContent = '';
    this.assistantStatus.classList.add('hidden');
    this.assistantStatus.classList.remove('is-info', 'is-success', 'is-error');
  }

  private getActiveContextKey(): ContextKey {
    return this.customContextKey || this.currentContext;
  }

  private getScopedTools(context: ContextKey = this.getActiveContextKey()): ToolSummary[] {
    return filterToolsForContext(context, this.mcpTools ?? []);
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
    this.fieldUpdates.clearRememberedField();
  }

  private clearExternalContext(): void {
    this.customContextKey = null;
    this.customContextLabel = null;
    this.customContextData = null;
    this.updateContextIndicator();
    this.fieldUpdates.clearRememberedField();
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
    if (!this.isEmbedded && typeof win.adjustLayoutForChat === 'function') {
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
      document.removeEventListener('analysis-result-updated', this.analysisResultsHandler);
      window.removeEventListener('calculator-completed', this.analysisResultsHandler);
    }

    this.analysisResultsHandler = () => {
      if (this.pendingAssistantRecalculation) {
        this.trackAssistantMetric('assistant_recalculation_completed', {
          context: this.getActiveContextKey(),
        });
        this.pendingAssistantRecalculation = false;
        this.setAssistantStatus('Results refreshed with the latest assistant edit.', 'success');
      }
      toolCatalog
        .load({
          forceRefresh: true,
          source: 'analysis-update',
          captureOutputs: () => this.capturePageOutputs(),
        })
        .catch((err) => {
          debugWarn('Failed to refresh MCP tools after analysis update:', err);
        });
      this.updateWelcomeMessage(this.getActiveContextKey());
    };

    window.addEventListener('analysis-result-updated', this.analysisResultsHandler);
    document.addEventListener('analysis-result-updated', this.analysisResultsHandler);
    window.addEventListener('calculator-completed', this.analysisResultsHandler);
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
      if (newContext !== this.currentContext) {
        this.currentContext = newContext;
        this.updateContextIndicator();
        this.fieldUpdates.clearRememberedField();

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
    if (this.isEmbedded) {
      return;
    }
    const panelWidth = Math.round(this.panel.getBoundingClientRect().width);
    if (!Number.isFinite(panelWidth) || panelWidth <= 0) {
      return;
    }
    applyActiveWidth(panelWidth, window.innerWidth);
  }

  private clearActiveWidth(): void {
    if (this.isEmbedded) {
      return;
    }
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
    if (this.toggle) {
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

      debugLog('[ChatPanel] Click listener function created:', clickHandler);

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
    }

    this.closeBtn?.addEventListener('click', () => this.closePanel());

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

    this.messages.addEventListener('click', (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const promptButton = target.closest<HTMLButtonElement>('[data-suggested-prompt]');
      if (promptButton) {
        event.preventDefault();
        const prompt = promptButton.dataset.suggestedPrompt;
        if (prompt) {
          void this.submitSuggestedPrompt(prompt);
        }
        return;
      }

      const actionButton = target.closest<HTMLButtonElement>('[data-chat-action]');
      if (!actionButton) {
        return;
      }

      event.preventDefault();
      if (actionButton.dataset.chatAction === 'recalculate') {
        this.handleRecalculateAction();
      }
    });

    if (!this.isEmbedded && !this.outsideClickHandler) {
      this.outsideClickHandler = (event: MouseEvent | TouchEvent) => {
        if (!this.isOpen) {
          return;
        }
        const target = event.target;
        if (!(target instanceof Node)) {
          return;
        }
        if (this.panel.contains(target) || (this.toggle && this.toggle.contains(target))) {
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
        this.toggle?.focus();
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
      this.charCounter.style.color = '#6b7280'; // Default gray (WCAG AA on white)
    }
  }

  private async submitSuggestedPrompt(prompt: string): Promise<void> {
    this.input.value = prompt;
    this.sendBtn.disabled = false;
    this.autoResizeInput();
    await this.sendMessage();
  }

  private handleRecalculateAction(): void {
    const recalculationTriggered = this.requestRecalculation();
    if (!recalculationTriggered) {
      this.setAssistantStatus('I could not trigger a recalculation on this page.', 'error');
    }
  }

  private togglePanel(): void {
    if (this.isEmbedded) {
      this.openPanel();
      return;
    }
    if (this.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.panel.classList.add('visible');
    this.toggle?.classList.add('panel-open');
    this.isOpen = true;
    this.stateStore.setOpen(true);
    this.updateLayoutOffsets();
    this.syncAriaState();
    this.emitStateChange();
    setTimeout(() => this.input.focus(), this.isEmbedded ? 0 : 300);
  }

  private closePanel(): void {
    if (this.isEmbedded) {
      return;
    }
    this.panel.classList.remove('visible');
    this.toggle?.classList.remove('panel-open');
    this.isOpen = false;
    this.stateStore.setOpen(false);
    this.clearActiveWidth();
    this.syncAriaState();
    this.emitStateChange();
  }

  private syncAriaState(): void {
    if (!this.toggle) {
      this.panel.setAttribute('aria-hidden', this.isEmbedded ? 'false' : String(!this.isOpen));
      return;
    }
    syncChatAriaState(this.toggle, this.panel, this.isOpen);
  }

  private addMessage(content: string, type: 'user' | 'assistant' = 'user'): HTMLDivElement {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // codeql[js/xss-through-dom]: textContent does not parse HTML; safe for user/assistant text.
    contentDiv.textContent = content;
    contentDiv.style.whiteSpace = 'pre-wrap';

    messageDiv.appendChild(contentDiv);
    this.messages.appendChild(messageDiv);
    this.messages.scrollTop = this.messages.scrollHeight;
    return messageDiv;
  }

  private showThinking(): void {
    this.thinkingIndicator.classList.remove('hidden');
  }

  private hideThinking(): void {
    this.thinkingIndicator.classList.add('hidden');
  }

  private updateLastAssistantMessage(content: string): void {
    const lastMessage = this.messages.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('assistant')) {
      const contentDiv = lastMessage.querySelector('.message-content');
      if (contentDiv) {
        contentDiv.textContent = content;
        (contentDiv as HTMLElement).style.whiteSpace = 'pre-wrap';
        this.messages.scrollTop = this.messages.scrollHeight;
      }
    }
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

    // Check if this is a field update request
    const context = this.getActiveContextKey();
    const fieldUpdate = parseFieldUpdate(message, context as CalculatorContextKey);

    if (
      fieldUpdate &&
      fieldUpdate.field &&
      fieldUpdate.value &&
      this.handleResolvedFieldUpdate(
        message,
        {
          field: fieldUpdate.field,
          value: fieldUpdate.value,
          fieldLabel: fieldUpdate.fieldLabel,
        },
        context
      )
    ) {
      return;
    }

    const implicitUpdate = this.fieldUpdates.detectImplicitInstruction(message, context);
    if (implicitUpdate && this.handleResolvedFieldUpdate(message, implicitUpdate, context)) {
      return;
    }

    // Normal message handling (send to AI)
    this.addMessage(message, 'user');
    this.input.value = '';
    this.sendBtn.disabled = true;
    this.autoResizeInput();
    const payload = this.buildRequestPayload(message);

    try {
      // Create placeholder for assistant response
      this.addMessage('', 'assistant');
      this.showThinking();

      let fullResponse = '';
      let modelChangeSummary: string | null = null;

      // Use streaming transport
      await this.transport.stream(payload, (chunk) => {
        // Handle structured function calling results
        if (typeof chunk === 'object' && chunk.functionCallingResults) {
          const { modelChanges } = chunk.functionCallingResults;
          if (modelChanges && typeof modelChanges === 'object') {
            modelChangeSummary = this.applyModelChanges(modelChanges);
          }
          return;
        }

        // Handle text tokens
        if (typeof chunk === 'string') {
          if (fullResponse.length === 0) {
            this.hideThinking();
          }
          fullResponse += chunk;
          this.updateLastAssistantMessage(fullResponse);
        }
      });

      // Ensure thinking is hidden if it wasn't already
      this.hideThinking();

      // If model changes were applied, add a confirmation message
      if (modelChangeSummary && !fullResponse) {
        fullResponse = modelChangeSummary;
        this.updateLastAssistantMessage(fullResponse);
      } else if (modelChangeSummary && fullResponse) {
        fullResponse = `${fullResponse}\n\n${modelChangeSummary}`;
        this.updateLastAssistantMessage(fullResponse);
      }

      // Update memory with the full response
      chatMemory.addConversationEntry(message, fullResponse, this.getActiveContextKey(), undefined);

      this.sendBtn.disabled = false;
    } catch (error) {
      this.handleFailedResponse(error);
    }
  }

  /**
   * Apply model changes from function calling results
   */
  private applyModelChanges(modelChanges: Record<string, unknown>): string | null {
    debugLog('[ChatPanel] Applying model changes:', modelChanges);
    let successCount = 0;
    let failCount = 0;
    const updatedFields: string[] = [];

    for (const [fieldId, value] of Object.entries(modelChanges)) {
      if (value !== null && value !== undefined) {
        const stringValue = String(value);
        const result = this.updateFormField(fieldId, stringValue);
        if (result.success) {
          successCount++;
          updatedFields.push(this.getFieldDisplayName(fieldId));
          debugLog(`[ChatPanel] ✓ Updated ${fieldId} = ${stringValue}`);
        } else {
          failCount++;
          debugWarn(`[ChatPanel] ✗ Failed to update ${fieldId}`);
        }
      }
    }

    if (successCount === 0) {
      this.trackAssistantMetric('assistant_field_update_blocked', {
        context: this.getActiveContextKey(),
        failedChanges: failCount,
      });
      this.setAssistantStatus(
        'I could not match that request to editable fields on this form.',
        'error'
      );
      return failCount > 0
        ? 'I could not apply those changes to the current form, so nothing was recalculated.'
        : null;
    }

    const recalculationTriggered = this.requestRecalculation();
    this.trackAssistantMetric('assistant_field_update_applied', {
      context: this.getActiveContextKey(),
      appliedChanges: successCount,
      failedChanges: failCount,
      source: 'model_changes',
    });
    this.setAssistantStatus(
      failCount > 0
        ? `Updated ${successCount} field${successCount === 1 ? '' : 's'} and skipped ${failCount}.`
        : `Updated ${successCount} field${successCount === 1 ? '' : 's'}.`,
      failCount > 0 ? 'info' : 'success'
    );
    const updatedSummary = updatedFields.slice(0, 3).join(', ');
    const changedLabel =
      successCount === 1
        ? `Updated ${updatedSummary}.`
        : `Updated ${successCount} fields${updatedSummary ? ` (${updatedSummary})` : ''}.`;

    if (failCount > 0) {
      return `${changedLabel} I skipped ${failCount} change${failCount === 1 ? '' : 's'} that did not match live fields.${recalculationTriggered ? ' Recalculating now.' : ''}`;
    }

    return recalculationTriggered ? `${changedLabel} Recalculating now.` : changedLabel;
  }

  /**
   * Update a form field value
   */
  private updateFormField(
    fieldId: string,
    value: string
  ): { success: boolean; previousValue?: string } {
    try {
      // Try to find the field by ID
      const field = document.getElementById(fieldId) as HTMLInputElement | null;

      if (!field) {
        debugWarn(`[ChatPanel] Field not found: ${fieldId}`);
        return { success: false };
      }

      // Update the field value
      const oldValue = field.value;
      field.value = value;

      // Trigger change and input events
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));

      // Highlight the field to show it changed
      if (typeof window.highlightFieldChange === 'function') {
        window.highlightFieldChange(fieldId, value, true);
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
      return { success: true, previousValue: oldValue };
    } catch (error) {
      debugWarn('[ChatPanel] Error updating field:', error);
      return { success: false };
    }
  }

  private handleResolvedFieldUpdate(
    userMessage: string,
    instruction: FieldUpdateInstruction,
    context: ContextKey
  ): boolean {
    const assistantResponse = this.fieldUpdates.tryApply(instruction, context);
    if (!assistantResponse) {
      return false;
    }

    this.addMessage(userMessage, 'user');
    this.resetInputAfterLocalAction();
    this.addMessage(assistantResponse, 'assistant');
    this.setAssistantStatus('Applied your update and queued a recalculation.', 'success');
    this.trackAssistantMetric('assistant_field_update_applied', {
      context,
      appliedChanges: 1,
      failedChanges: 0,
      source: 'local_parse',
    });
    return true;
  }

  private requestRecalculation(): boolean {
    const form = document.getElementById('calculator-form');
    if (!(form instanceof HTMLFormElement)) {
      this.setAssistantStatus(
        'I updated the field, but could not trigger recalculation on this page.',
        'error'
      );
      return false;
    }

    this.setAssistantStatus('Recalculating with your updated inputs…', 'info');
    const submitButton = document.getElementById('calculate-btn');
    if (submitButton instanceof HTMLButtonElement && !submitButton.disabled) {
      this.pendingAssistantRecalculation = true;
      this.trackAssistantMetric('assistant_recalculation_requested', {
        context: this.getActiveContextKey(),
      });
      form.requestSubmit(submitButton);
      return true;
    }

    this.pendingAssistantRecalculation = true;
    this.trackAssistantMetric('assistant_recalculation_requested', {
      context: this.getActiveContextKey(),
    });
    form.requestSubmit();
    return true;
  }

  private trackAssistantMetric(eventName: string, params: Record<string, unknown>): void {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params);
    }
  }

  private resetInputAfterLocalAction(): void {
    this.input.value = '';
    this.sendBtn.disabled = false;
    this.autoResizeInput();
  }

  private buildRequestPayload(message: string): ChatRequestPayload {
    const contextKey = this.getActiveContextKey();
    const currentModel = this.getContextData();
    const scopedTools = this.getScopedTools(contextKey);

    // Initialize memory session
    chatMemory.initializeSession();
    chatMemory.updateContext(contextKey);

    // Store current model state for comparison
    const modelType = this.getModelTypeFromContext(contextKey);
    if (modelType && Object.keys(currentModel).length > 0) {
      chatMemory.updateModelState(modelType, currentModel);
    }

    // Enable function calling when MCP tools are available
    // This allows the LLM to execute tools and generate natural language responses
    const hasTools = scopedTools.length > 0;

    const payload: ChatRequestPayload = {
      message,
      context: contextKey,
      currentModel,
      availableTools: scopedTools,
      toolOutputs: this.mcpToolOutputs,
      memoryContext: {
        conversationHistory: chatMemory.getConversationContext(),
        modelStates: chatMemory.getModelStateSummary(),
      },
      negative_constraints: NEGATIVE_CONSTRAINTS,
      enableFunctionCalling: hasTools,
    };

    if (import.meta.env.DEV) {
      debugLog('[ChatPanel] Prepared payload with context:', {
        context: contextKey,
        pathname: window.location.pathname,
        hasModelData: Object.keys(currentModel).length > 0,
        scopedToolCount: scopedTools.length,
        totalToolCount: this.mcpTools?.length ?? 0,
        hasToolOutputs: Boolean(this.mcpToolOutputs),
        hasMemoryContext: Boolean(payload.memoryContext),
        enableFunctionCalling: hasTools,
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

    this.setAssistantStatus(
      'The assistant hit an error before it could finish the request.',
      'error'
    );

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
      document.removeEventListener('analysis-result-updated', this.analysisResultsHandler);
      window.removeEventListener('calculator-completed', this.analysisResultsHandler);
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
