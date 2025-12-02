/**
 * Enhanced Chat Panel with improved error handling, accessibility, and UX
 * Implements modern chat interface best practices
 */

// Simple validation function
function validateMessage(message: string): { valid: boolean; error?: string } {
  if (!message || message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }
  if (message.length > 2000) {
    return { valid: false, error: 'Message too long' };
  }
  return { valid: true };
}

// Simple transport implementation
function createChatTransport(config: {
  endpoint: string;
  timeoutMs: number;
  maxAttempts: number;
  backoffMs: number;
}): ChatTransport {
  return {
    async send(payload: ChatRequestPayload): Promise<ChatResponsePayload> {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      return await response.json();
    },
  };
}

// Simple message queue interface
class MessageQueue<T, R> {
  constructor(private sendFn: (payload: T) => Promise<R>) {}

  async enqueue(payload: T): Promise<R> {
    return this.sendFn(payload);
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed' | 'retrying';
  error?: string;
  toolUsed?: string;
  fromCache?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastActivity: Date;
}

export interface ChatConfig {
  maxRetries: number;
  retryDelayMs: number;
  messageTimeoutMs: number;
  maxMessageLength: number;
  enableTypingIndicator: boolean;
  enableMessageHistory: boolean;
  enableOfflineMode: boolean;
}

const DEFAULT_CONFIG: ChatConfig = {
  maxRetries: 3,
  retryDelayMs: 1000,
  messageTimeoutMs: 30000,
  maxMessageLength: 2000,
  enableTypingIndicator: true,
  enableMessageHistory: true,
  enableOfflineMode: true,
};

export class EnhancedChatPanel {
  private config: ChatConfig;
  private state: ChatState;
  private elements: ChatElements;
  private messageQueue: MessageQueue<ChatRequestPayload, ChatResponsePayload>;
  private transport: ChatTransport;
  private retryTimeout: number | null = null;
  private typingTimeout: number | null = null;
  private offlineHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;

  constructor(config: Partial<ChatConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
    this.elements = this.initializeElements();
    this.transport = createChatTransport({
      endpoint: '/v1/chat/enhanced',
      timeoutMs: this.config.messageTimeoutMs,
      maxAttempts: this.config.maxRetries,
      backoffMs: this.config.retryDelayMs,
    });
    this.messageQueue = new MessageQueue<ChatRequestPayload, ChatResponsePayload>((payload) =>
      this.transport.send(payload)
    );

    this.setupEventListeners();
    this.setupOfflineHandling();
    this.loadMessageHistory();
  }

  private createInitialState(): ChatState {
    return {
      messages: [
        {
          id: this.generateMessageId(),
          role: 'system',
          content:
            'Hi! I can help with financial analysis and calculations. What would you like to know?',
          timestamp: new Date(),
          status: 'sent',
        },
      ],
      isOpen: false,
      isLoading: false,
      error: null,
      retryCount: 0,
      lastActivity: new Date(),
    };
  }

  private initializeElements(): ChatElements {
    const panel = document.getElementById('chat-panel') as HTMLDivElement;
    const toggle = document.getElementById('chat-toggle') as HTMLButtonElement;
    const closeBtn = document.getElementById('chat-close') as HTMLButtonElement;
    const form = document.getElementById('chat-form') as HTMLFormElement;
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    const sendBtn = document.getElementById('chat-send') as HTMLButtonElement;
    const messages = document.getElementById('chat-messages') as HTMLDivElement;
    const thinkingIndicator = document.getElementById('thinking-indicator') as HTMLDivElement;
    const errorDisplay = document.getElementById('chat-error') as HTMLDivElement;
    const retryBtn = document.getElementById('chat-retry') as HTMLButtonElement;
    const offlineIndicator = document.getElementById('chat-offline') as HTMLDivElement;

    if (!panel || !toggle || !form || !input || !sendBtn || !messages) {
      throw new Error('Required chat panel elements not found');
    }

    return {
      panel,
      toggle,
      closeBtn,
      form,
      input,
      sendBtn,
      messages,
      thinkingIndicator,
      errorDisplay,
      retryBtn,
      offlineIndicator,
    };
  }

  private setupEventListeners(): void {
    // Form submission
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSendMessage();
    });

    // Input handling
    this.elements.input.addEventListener('input', () => {
      this.handleInputChange();
      this.updateLastActivity();
    });

    this.elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });

    // Panel toggle
    this.elements.toggle.addEventListener('click', () => {
      this.togglePanel();
    });

    // Close button
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', () => {
        this.closePanel();
      });
    }

    // Retry button
    if (this.elements.retryBtn) {
      this.elements.retryBtn.addEventListener('click', () => {
        this.retryLastMessage();
      });
    }

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isOpen) {
        this.closePanel();
      }
    });

    // Auto-resize input
    this.elements.input.addEventListener('input', () => {
      this.autoResizeInput();
    });
  }

  private setupOfflineHandling(): void {
    if (!this.config.enableOfflineMode) return;

    this.offlineHandler = () => {
      this.showOfflineIndicator();
      this.state.error =
        'You are offline. Messages will be queued and sent when connection is restored.';
      this.updateErrorDisplay();
    };

    this.onlineHandler = () => {
      this.hideOfflineIndicator();
      this.state.error = null;
      this.updateErrorDisplay();
      // Retry any failed messages
      this.retryFailedMessages();
    };

    window.addEventListener('offline', this.offlineHandler);
    window.addEventListener('online', this.onlineHandler);
  }

  private async handleSendMessage(): Promise<void> {
    const message = this.elements.input.value.trim();

    if (!message || this.state.isLoading) {
      return;
    }

    // Validate message
    const validation = validateMessage(message);
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid message');
      return;
    }

    // Create message object
    const userMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      status: 'sending',
    };

    // Add to state and UI
    this.addMessage(userMessage);
    this.elements.input.value = '';
    this.autoResizeInput();
    this.updateLastActivity();

    // Show typing indicator
    if (this.config.enableTypingIndicator) {
      this.showTypingIndicator();
    }

    try {
      // Build request payload
      const payload = this.buildRequestPayload(message);

      // Send message
      const response = await this.messageQueue.enqueue(payload);

      // Hide typing indicator
      this.hideTypingIndicator();

      // Update user message status
      this.updateMessageStatus(userMessage.id, 'sent');

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.response || "I apologize, but I couldn't process your request.",
        timestamp: new Date(),
        status: 'sent',
        toolUsed: response.toolUsed,
        fromCache: response.fromCache,
      };

      this.addMessage(assistantMessage);

      // Clear any errors
      this.state.error = null;
      this.state.retryCount = 0;
      this.updateErrorDisplay();

      // Save to history
      if (this.config.enableMessageHistory) {
        this.saveMessageHistory();
      }
    } catch (error) {
      this.handleSendError(error, userMessage);
    }
  }

  private handleSendError(error: unknown, userMessage: ChatMessage): void {
    this.hideTypingIndicator();

    const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
    this.state.error = errorMessage;
    this.state.retryCount++;

    // Update message status
    this.updateMessageStatus(userMessage.id, 'failed', errorMessage);

    // Show retry option if under retry limit
    if (this.state.retryCount < this.config.maxRetries) {
      this.showRetryOption(userMessage);
    } else {
      this.showError(
        `Failed to send message after ${this.config.maxRetries} attempts: ${errorMessage}`
      );
    }

    this.updateErrorDisplay();
  }

  private showRetryOption(message: ChatMessage): void {
    if (!this.elements.retryBtn) return;

    this.elements.retryBtn.style.display = 'block';
    this.elements.retryBtn.dataset.messageId = message.id;
  }

  private async retryLastMessage(): Promise<void> {
    const failedMessage = this.state.messages.filter((m) => m.status === 'failed').pop();

    if (!failedMessage) return;

    this.state.retryCount = 0;
    this.state.error = null;
    this.updateErrorDisplay();

    // Hide retry button
    if (this.elements.retryBtn) {
      this.elements.retryBtn.style.display = 'none';
    }

    // Update message status to retrying
    this.updateMessageStatus(failedMessage.id, 'retrying');

    try {
      const payload = this.buildRequestPayload(failedMessage.content);
      const response = await this.messageQueue.enqueue(payload);

      // Update message status
      this.updateMessageStatus(failedMessage.id, 'sent');

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: response.response || "I apologize, but I couldn't process your request.",
        timestamp: new Date(),
        status: 'sent',
        toolUsed: response.toolUsed,
        fromCache: response.fromCache,
      };

      this.addMessage(assistantMessage);
    } catch (error) {
      this.handleSendError(error, failedMessage);
    }
  }

  private async retryFailedMessages(): Promise<void> {
    const failedMessages = this.state.messages.filter((m) => m.status === 'failed');

    for (const message of failedMessages) {
      try {
        const payload = this.buildRequestPayload(message.content);
        await this.messageQueue.enqueue(payload);
        this.updateMessageStatus(message.id, 'sent');
      } catch (error) {
        console.warn('Failed to retry message:', message.id, error);
      }
    }
  }

  private addMessage(message: ChatMessage): void {
    this.state.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  private updateMessageStatus(
    messageId: string,
    status: ChatMessage['status'],
    error?: string
  ): void {
    const message = this.state.messages.find((m) => m.id === messageId);
    if (message) {
      message.status = status;
      if (error) {
        message.error = error;
      }
      this.updateMessageElement(message);
    }
  }

  private renderMessage(message: ChatMessage): void {
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message chat-message--${message.role}`;
    messageElement.dataset.messageId = message.id;

    const content = document.createElement('div');
    content.className = 'chat-message__content';
    content.textContent = message.content;

    const meta = document.createElement('div');
    meta.className = 'chat-message__meta';

    const timestamp = document.createElement('span');
    timestamp.className = 'chat-message__timestamp';
    timestamp.textContent = this.formatTimestamp(message.timestamp);

    meta.appendChild(timestamp);

    // Add status indicator
    if (message.status && message.status !== 'sent') {
      const status = document.createElement('span');
      status.className = `chat-message__status chat-message__status--${message.status}`;
      status.textContent = this.getStatusText(message.status);
      meta.appendChild(status);
    }

    // Add tool indicator
    if (message.toolUsed) {
      const tool = document.createElement('span');
      tool.className = 'chat-message__tool';
      tool.textContent = `via ${message.toolUsed}`;
      meta.appendChild(tool);
    }

    // Add cache indicator
    if (message.fromCache) {
      const cache = document.createElement('span');
      cache.className = 'chat-message__cache';
      cache.textContent = 'cached';
      meta.appendChild(cache);
    }

    messageElement.appendChild(content);
    messageElement.appendChild(meta);

    this.elements.messages.appendChild(messageElement);
  }

  private updateMessageElement(message: ChatMessage): void {
    const element = this.elements.messages.querySelector(`[data-message-id="${message.id}"]`);
    if (!element) return;

    // Update status
    const statusElement = element.querySelector('.chat-message__status');
    if (statusElement) {
      statusElement.textContent = this.getStatusText(message.status || 'sent');
      statusElement.className = `chat-message__status chat-message__status--${message.status}`;
    }

    // Update error display
    if (message.error) {
      const errorElement =
        element.querySelector('.chat-message__error') || document.createElement('div');
      errorElement.className = 'chat-message__error';
      errorElement.textContent = message.error;
      element.appendChild(errorElement);
    }
  }

  private getStatusText(status: ChatMessage['status']): string {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'retrying':
        return 'Retrying...';
      case 'failed':
        return 'Failed';
      case 'sent':
        return 'Sent';
      default:
        return '';
    }
  }

  private formatTimestamp(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private showTypingIndicator(): void {
    if (this.elements.thinkingIndicator) {
      this.elements.thinkingIndicator.classList.remove('hidden');
    }
  }

  private hideTypingIndicator(): void {
    if (this.elements.thinkingIndicator) {
      this.elements.thinkingIndicator.classList.add('hidden');
    }
  }

  private showOfflineIndicator(): void {
    if (this.elements.offlineIndicator) {
      this.elements.offlineIndicator.classList.remove('hidden');
    }
  }

  private hideOfflineIndicator(): void {
    if (this.elements.offlineIndicator) {
      this.elements.offlineIndicator.classList.add('hidden');
    }
  }

  private showError(message: string): void {
    this.state.error = message;
    this.updateErrorDisplay();
  }

  private updateErrorDisplay(): void {
    if (!this.elements.errorDisplay) return;

    if (this.state.error) {
      this.elements.errorDisplay.textContent = this.state.error;
      this.elements.errorDisplay.classList.remove('hidden');
    } else {
      this.elements.errorDisplay.classList.add('hidden');
    }
  }

  private togglePanel(): void {
    if (this.state.isOpen) {
      this.closePanel();
    } else {
      this.openPanel();
    }
  }

  private openPanel(): void {
    this.state.isOpen = true;
    this.elements.panel.classList.add('chat-panel--open');
    this.elements.toggle.setAttribute('aria-expanded', 'true');
    this.elements.input.focus();
    this.scrollToBottom();
  }

  private closePanel(): void {
    this.state.isOpen = false;
    this.elements.panel.classList.remove('chat-panel--open');
    this.elements.toggle.setAttribute('aria-expanded', 'false');
  }

  private handleInputChange(): void {
    const hasContent = this.elements.input.value.trim().length > 0;
    this.elements.sendBtn.disabled = !hasContent || this.state.isLoading;

    // Update character counter
    const counter = document.getElementById('chat-char-counter');
    if (counter) {
      const length = this.elements.input.value.length;
      counter.textContent = `${length}/${this.config.maxMessageLength}`;

      // Add warning class if approaching limit
      if (length > this.config.maxMessageLength * 0.9) {
        counter.classList.add('char-counter--warning');
      } else {
        counter.classList.remove('char-counter--warning');
      }
    }
  }

  private autoResizeInput(): void {
    this.elements.input.style.height = 'auto';
    this.elements.input.style.height = `${Math.min(this.elements.input.scrollHeight, 120)}px`;
  }

  private scrollToBottom(): void {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  private updateLastActivity(): void {
    this.state.lastActivity = new Date();
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private buildRequestPayload(message: string): ChatRequestPayload {
    // Implementation depends on your existing payload structure
    return {
      message,
      context: this.detectContext(),
      currentModel: this.getCurrentModelData(),
      availableTools: this.getAvailableTools(),
      toolOutputs: this.getToolOutputs(),
    };
  }

  private detectContext(): string {
    // Implementation depends on your context detection logic
    return 'general';
  }

  private getCurrentModelData(): Record<string, unknown> {
    // Implementation depends on your model data extraction
    return {};
  }

  private getAvailableTools(): Array<{ name: string; description: string }> {
    // Implementation depends on your tools listing
    return [];
  }

  private getToolOutputs(): Record<string, unknown> {
    // Implementation depends on your tool outputs extraction
    return {};
  }

  private loadMessageHistory(): void {
    if (!this.config.enableMessageHistory) return;

    try {
      const saved = localStorage.getItem('chat-history');
      if (saved) {
        const history = JSON.parse(saved);
        if (Array.isArray(history)) {
          // Restore recent messages (last 10)
          const recentMessages = history.slice(-10);
          this.state.messages = [
            this.state.messages[0], // Keep system message
            ...recentMessages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          ];

          // Re-render messages
          this.elements.messages.innerHTML = '';
          this.state.messages.forEach((msg) => this.renderMessage(msg));
        }
      }
    } catch (error) {
      console.warn('Failed to load chat history:', error);
    }
  }

  private saveMessageHistory(): void {
    if (!this.config.enableMessageHistory) return;

    try {
      const history = this.state.messages.filter((msg) => msg.role !== 'system').slice(-20); // Keep last 20 messages

      localStorage.setItem('chat-history', JSON.stringify(history));
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  }

  public destroy(): void {
    // Clean up event listeners
    if (this.offlineHandler) {
      window.removeEventListener('offline', this.offlineHandler);
    }
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }

    // Clear timeouts
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Save final state
    this.saveMessageHistory();
  }
}

interface ChatElements {
  panel: HTMLDivElement;
  toggle: HTMLButtonElement;
  closeBtn: HTMLButtonElement | null;
  form: HTMLFormElement;
  input: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
  messages: HTMLDivElement;
  thinkingIndicator: HTMLDivElement | null;
  errorDisplay: HTMLDivElement | null;
  retryBtn: HTMLButtonElement | null;
  offlineIndicator: HTMLDivElement | null;
}

interface ChatRequestPayload {
  message: string;
  context?: string;
  currentModel?: Record<string, unknown>;
  availableTools?: Array<{ name: string; description: string }>;
  toolOutputs?: Record<string, unknown>;
}

interface ChatResponsePayload {
  response: string;
  context?: string;
  toolUsed?: string;
  fromCache?: boolean;
  requestId?: string;
  thinking?: string[];
  metadata?: {
    intent?: string;
    latency?: number;
    attempt?: number;
  };
  tooling?: {
    availableTools: string[];
    toolOutputsIncluded: number;
    contextKey: string;
    hasWebsiteContent?: boolean;
    hasConversationHistory?: boolean;
    cacheKey?: string;
  };
  modelChanges?: Record<string, unknown>;
}

interface ChatTransport {
  send(payload: ChatRequestPayload): Promise<ChatResponsePayload>;
}
