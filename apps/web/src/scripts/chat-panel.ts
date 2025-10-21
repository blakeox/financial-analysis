export {};

// Security and validation constants
const MAX_MESSAGE_LENGTH = 2000;
const RATE_LIMIT_DELAY_MS = 1000; // 1 second between messages
const API_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 1000; // Initial backoff time

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
  private customContextData: Record<string, unknown> | null;
  private externalContextListener: ((event: Event) => void) | null;
  private headerObserver: ResizeObserver | null;
  private lastContext: ContextKey;
  private mcpTools: Array<{ name: string; description: string }> | null;
  
  // Rate limiting
  private lastMessageTime: number;

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
    console.log('[ChatPanel] Constructor starting...');
    const panel = document.getElementById('chat-panel');
    const toggle = document.getElementById('chat-toggle');
    const closeBtn = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messages = document.getElementById('chat-messages');
    const thinkingIndicator = document.getElementById('thinking-indicator');
    const contextIndicator = document.getElementById('context-indicator');

    console.log('[ChatPanel] Elements found:', {
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
    
    console.log('[ChatPanel] All elements validated, assigning to instance...');
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
    this.externalContextListener = null;
    this.mcpTools = null;
    
    // Initialize rate limiting
    this.lastMessageTime = 0;

    // Fetch available MCP tools
    this.fetchMCPTools().catch((err) => {
      console.warn('Failed to fetch MCP tools:', err);
    });
    this.mcpTools = null;

    // Fetch available MCP tools
    this.fetchMCPTools().catch((err) => {
      console.warn('Failed to fetch MCP tools:', err);
    });
    this.headerObserver = null;

    console.log('[ChatPanel] About to bind events...');
    this.bindEvents();
    console.log('[ChatPanel] Events bound successfully');
    this.setupLayoutSync();
    this.updateContextIndicator();
    console.log('[ChatPanel] Constructor complete');
    this.syncAriaState();
    this.emitStateChange();
    this.setupNavigationListener();

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
        intro: "Hi! I'm your AI assistant for Lease Analysis. I can help you modify lease parameters and explore scenarios. Try asking:",
        examples: [
          '"What if the interest rate was 5.5%?"',
          '"Change the lease amount to $150,000"',
          '"Show me a 36-month lease term"',
        ],
      },
      ebitda: {
        intro: "Hi! I'm your AI assistant for EBITDA Forecasting. I can help you adjust revenue projections and growth rates. Try asking:",
        examples: [
          '"Set initial revenue to $500,000"',
          '"Change the growth rate to 15%"',
          '"What if expenses increased by 10%?"',
        ],
      },
      amortization: {
        intro: "Hi! I'm your AI assistant for Amortization Analysis. I can help you modify loan parameters and view different schedules. Try asking:",
        examples: [
          '"Change the interest rate to 4.5%"',
          '"Increase the loan amount to $300,000"',
          '"Show me a 20-year term"',
        ],
      },
      models: {
        intro: "Hi! I'm your AI assistant. Select a model to get context-specific help, or ask general questions about the available financial tools.",
        examples: [
          '"Tell me about lease analysis"',
          '"What models are available?"',
          '"How do I analyze EBITDA?"',
        ],
      },
      general: {
        intro: "Hi! I'm your AI assistant. I can help you navigate financial analysis tools and answer questions. Try asking:",
        examples: [
          '"What tools are available?"',
          '"Help me analyze a lease"',
          '"Show me amortization options"',
        ],
      },
    };

    const messageConfig = contextMessages[context];
    let toolsSection = '';
    
    // Add available MCP tools if loaded
    if (this.mcpTools && this.mcpTools.length > 0) {
      const toolsList = this.mcpTools
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

  private async fetchMCPTools(): Promise<void> {
    try {
      const response = await fetch('/api/v1/mcp/tools');
      if (!response.ok) {
        throw new Error(`Failed to fetch MCP tools: ${response.statusText}`);
      }
      const data = await response.json();
      this.mcpTools = data.tools || [];
      if (import.meta.env.DEV) {
        console.log('[ChatPanel] Available MCP tools:', this.mcpTools);
      }
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      this.mcpTools = [];
    }
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

  public rebindToggleButton(newToggleBtn: HTMLButtonElement): void {
    this.toggle = newToggleBtn;
    this.bindEvents();
  }

  private bindEvents(): void {
    console.log('[ChatPanel] bindEvents() starting, toggle element:', this.toggle);
    
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

    // Use capture phase to ensure we get the event first
    console.log('[ChatPanel] Adding click listener to toggle button...');
    const clickHandler = (event: MouseEvent) => {
      console.log('[ChatPanel] 🎯 CLICK HANDLER CALLED!', {
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
    console.log('[ChatPanel] Click listener function created:', clickHandler);
    
    // DIAGNOSTIC: Add mousedown listener to test if ANY events reach the button
    this.toggle.addEventListener('mousedown', (event: MouseEvent) => {
      console.log('[ChatPanel] 🔵 MOUSEDOWN detected!', {
        target: event.target,
        currentTarget: event.currentTarget,
        button: event.button,
      });
    }, { capture: true });
    
    console.log('[ChatPanel] Click listener added successfully');
    
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

    // Check rate limiting
    const now = Date.now();
    const timeSinceLastMessage = now - this.lastMessageTime;
    
    if (timeSinceLastMessage < RATE_LIMIT_DELAY_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_DELAY_MS - timeSinceLastMessage) / 1000);
      this.addMessage(
        `Please wait ${waitTime} second${waitTime > 1 ? 's' : ''} before sending another message.`,
        'assistant'
      );
      return;
    }

    this.lastMessageTime = now;
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
        availableTools: this.mcpTools || [],
      };
      
      if (import.meta.env.DEV) {
        console.log('[ChatPanel] Sending message with context:', {
          context: contextKey,
          pathname: window.location.pathname,
          hasModelData: Object.keys(currentModel).length > 0,
        });
      }
      if (this.customContextLabel) {
        payload.contextLabel = this.customContextLabel;
      }
      if (this.customContextData) {
        payload.contextData = this.customContextData;
      }

      // Fetch with timeout and retry logic
      const data = await this.fetchWithRetry('/api/v1/chat/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      this.hideThinking();
      this.addMessage(data.response, 'assistant');
      this.sendBtn.disabled = false;

      if (data.modelChanges) {
        this.applyModelChanges(data.modelChanges);
      }
    } catch (error) {
      this.hideThinking();
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
        this.addMessage(
          'Sorry, I encountered an error. Please try again.',
          'assistant'
        );
      }
      
      this.sendBtn.disabled = false;
      console.error('Chat error:', error);
    }
  }

  /**
   * Fetch with timeout and retry logic
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    attempt = 1
  ): Promise<{ response: string; modelChanges?: ModelChanges }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 && attempt < MAX_RETRY_ATTEMPTS) {
          // Rate limited, retry with backoff
          const backoffTime = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return this.fetchWithRetry(url, options, attempt + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as {
        response: string;
        modelChanges?: ModelChanges;
      };

      return data;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      
      // Retry on network errors
      if (attempt < MAX_RETRY_ATTEMPTS && error instanceof TypeError) {
        const backoffTime = RETRY_BACKOFF_MS * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      
      throw error;
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
      // Use dispatchEvent with cancelable:false to prevent event propagation to document listeners
      const clickEvent = new MouseEvent('click', { bubbles: false, cancelable: false });
      analyzeBtn.dispatchEvent(clickEvent);
    } else if (analyzeBtn) {
      const clickEvent = new MouseEvent('click', { bubbles: false, cancelable: false });
      analyzeBtn.dispatchEvent(clickEvent);
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
                  console.log('[chat-panel] Initial button load detected');
                } else {
                  console.warn('[chat-panel] Button re-added to DOM, re-attaching listeners');
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
