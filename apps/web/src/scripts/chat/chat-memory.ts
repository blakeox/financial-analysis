/**
 * Chat Memory System
 * Provides short-term memory for chatbot context and intelligent analysis
 */

export interface ModelState {
  modelType: string;
  timestamp: number;
  parameters: Record<string, unknown>;
  results?: Record<string, unknown>;
  analysis?: string;
}

export interface ConversationMemory {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  modelStates: ModelState[];
  conversationHistory: Array<{
    timestamp: number;
    userMessage: string;
    assistantResponse: string;
    context: string;
    modelChanges?: Record<string, unknown>;
  }>;
  currentContext: string;
}

export interface AnalysisComparison {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  impact: {
    description: string;
    magnitude: 'low' | 'medium' | 'high';
    direction: 'positive' | 'negative' | 'neutral';
  };
}

class ChatMemoryManager {
  private static instance: ChatMemoryManager;
  private memory: ConversationMemory | null = null;
  private readonly STORAGE_KEY = 'fanalyx_chat_memory';
  private readonly MAX_HISTORY_ITEMS = 50;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  static getInstance(): ChatMemoryManager {
    if (!ChatMemoryManager.instance) {
      ChatMemoryManager.instance = new ChatMemoryManager();
    }
    return ChatMemoryManager.instance;
  }

  constructor() {
    this.loadFromStorage();
    this.cleanupExpiredSessions();
  }

  /**
   * Initialize or restore conversation memory
   */
  initializeSession(): ConversationMemory {
    if (this.memory && this.isSessionValid()) {
      return this.memory;
    }

    this.memory = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      modelStates: [],
      conversationHistory: [],
      currentContext: 'general',
    };

    this.saveToStorage();
    return this.memory;
  }

  private ensureMemory(): ConversationMemory {
    return this.memory && this.isSessionValid() ? this.memory : this.initializeSession();
  }

  /**
   * Update current model state
   */
  updateModelState(
    modelType: string,
    parameters: Record<string, unknown>,
    results?: Record<string, unknown>,
    analysis?: string
  ): void {
    const memory = this.ensureMemory();

    const newState: ModelState = {
      modelType,
      timestamp: Date.now(),
      parameters,
      results,
      analysis,
    };

    // Remove old states of the same type
    memory.modelStates = memory.modelStates.filter((state) => state.modelType !== modelType);

    // Add new state
    memory.modelStates.push(newState);
    memory.lastActivity = Date.now();

    this.saveToStorage();
  }

  /**
   * Get previous model state for comparison
   */
  getPreviousModelState(modelType: string): ModelState | null {
    if (!this.memory) return null;

    return (
      this.memory.modelStates
        .filter((state) => state.modelType === modelType)
        .sort((a, b) => b.timestamp - a.timestamp)[1] || null
    );
  }

  /**
   * Get current model state
   */
  getCurrentModelState(modelType: string): ModelState | null {
    if (!this.memory) return null;

    return (
      this.memory.modelStates
        .filter((state) => state.modelType === modelType)
        .sort((a, b) => b.timestamp - a.timestamp)[0] || null
    );
  }

  /**
   * Add conversation entry
   */
  addConversationEntry(
    userMessage: string,
    assistantResponse: string,
    context: string,
    modelChanges?: Record<string, unknown>
  ): void {
    const memory = this.ensureMemory();

    memory.conversationHistory.push({
      timestamp: Date.now(),
      userMessage,
      assistantResponse,
      context,
      modelChanges,
    });

    // Keep only recent history
    if (memory.conversationHistory.length > this.MAX_HISTORY_ITEMS) {
      memory.conversationHistory = memory.conversationHistory.slice(-this.MAX_HISTORY_ITEMS);
    }

    memory.lastActivity = Date.now();
    this.saveToStorage();
  }

  /**
   * Update current context
   */
  updateContext(context: string): void {
    const memory = this.ensureMemory();

    memory.currentContext = context;
    memory.lastActivity = Date.now();
    this.saveToStorage();
  }

  /**
   * Generate intelligent analysis of parameter changes
   */
  generateChangeAnalysis(
    modelType: string,
    newParameters: Record<string, unknown>
  ): AnalysisComparison[] {
    const previousState = this.getPreviousModelState(modelType);
    if (!previousState) {
      return [];
    }

    const comparisons: AnalysisComparison[] = [];

    Object.entries(newParameters).forEach(([field, newValue]) => {
      const oldValue = previousState.parameters[field];
      if (oldValue !== newValue) {
        const impact = this.analyzeFieldImpact(modelType, field, oldValue, newValue);
        comparisons.push({
          field,
          oldValue,
          newValue,
          impact,
        });
      }
    });

    return comparisons;
  }

  /**
   * Analyze the impact of a field change
   */
  private analyzeFieldImpact(
    modelType: string,
    field: string,
    oldValue: unknown,
    newValue: unknown
  ): AnalysisComparison['impact'] {
    const oldNum = typeof oldValue === 'number' ? oldValue : 0;
    const newNum = typeof newValue === 'number' ? newValue : 0;
    const change = newNum - oldNum;
    const changePercent = oldNum !== 0 ? (change / oldNum) * 100 : 0;

    // Determine magnitude
    let magnitude: 'low' | 'medium' | 'high' = 'low';
    if (Math.abs(changePercent) > 50) magnitude = 'high';
    else if (Math.abs(changePercent) > 20) magnitude = 'medium';

    // Determine direction
    let direction: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (change > 0) direction = 'positive';
    else if (change < 0) direction = 'negative';

    // Generate field-specific analysis
    const description = this.generateFieldDescription(
      modelType,
      field,
      oldValue,
      newValue,
      changePercent
    );

    return {
      description,
      magnitude,
      direction,
    };
  }

  /**
   * Generate field-specific impact descriptions
   */
  private generateFieldDescription(
    modelType: string,
    field: string,
    oldValue: unknown,
    newValue: unknown,
    changePercent: number
  ): string {
    const oldNum = typeof oldValue === 'number' ? oldValue : 0;
    const newNum = typeof newValue === 'number' ? newValue : 0;

    switch (modelType) {
      case 'amortization':
        switch (field) {
          case 'annualRate':
            return `Interest rate ${changePercent > 0 ? 'increased' : 'decreased'} from ${(oldNum * 100).toFixed(2)}% to ${(newNum * 100).toFixed(2)}%. This will ${changePercent > 0 ? 'increase' : 'decrease'} monthly payments and total interest paid.`;
          case 'principal':
            return `Loan amount ${changePercent > 0 ? 'increased' : 'decreased'} from $${oldNum.toLocaleString()} to $${newNum.toLocaleString()}. Monthly payments will ${changePercent > 0 ? 'increase' : 'decrease'} proportionally.`;
          case 'termMonths':
            return `Loan term ${changePercent > 0 ? 'extended' : 'shortened'} from ${oldNum} to ${newNum} months. This will ${changePercent > 0 ? 'reduce monthly payments but increase total interest' : 'increase monthly payments but reduce total interest'}.`;
          default:
            return `${field} changed from ${oldValue} to ${newValue}.`;
        }

      case 'lease':
        switch (field) {
          case 'annualRate':
            return `Lease rate ${changePercent > 0 ? 'increased' : 'decreased'} from ${(oldNum * 100).toFixed(2)}% to ${(newNum * 100).toFixed(2)}%. This affects monthly payments and total lease cost.`;
          case 'principal':
            return `Lease amount ${changePercent > 0 ? 'increased' : 'decreased'} from $${oldNum.toLocaleString()} to $${newNum.toLocaleString()}. Monthly payments will adjust accordingly.`;
          case 'termMonths':
            return `Lease term ${changePercent > 0 ? 'extended' : 'shortened'} from ${oldNum} to ${newNum} months. This changes the payment structure and total cost.`;
          default:
            return `${field} changed from ${oldValue} to ${newValue}.`;
        }

      case 'ebitda':
        switch (field) {
          case 'revenueGrowthRate':
            return `Revenue growth rate ${changePercent > 0 ? 'increased' : 'decreased'} from ${(oldNum * 100).toFixed(1)}% to ${(newNum * 100).toFixed(1)}%. This will ${changePercent > 0 ? 'accelerate' : 'slow'} revenue growth over time.`;
          case 'initialRevenue':
            return `Starting revenue ${changePercent > 0 ? 'increased' : 'decreased'} from $${oldNum.toLocaleString()} to $${newNum.toLocaleString()}. This affects all future projections.`;
          default:
            return `${field} changed from ${oldValue} to ${newValue}.`;
        }

      default:
        return `${field} changed from ${oldValue} to ${newValue}.`;
    }
  }

  /**
   * Get conversation context for AI
   */
  getConversationContext(): string {
    if (!this.memory || this.memory.conversationHistory.length === 0) {
      return '';
    }

    const recentHistory = this.memory.conversationHistory.slice(-5); // Last 5 exchanges
    const context = recentHistory
      .map((entry) => `User: ${entry.userMessage}\nAssistant: ${entry.assistantResponse}`)
      .join('\n\n');

    return `Recent conversation:\n${context}\n\n`;
  }

  /**
   * Get model state summary
   */
  getModelStateSummary(): string {
    if (!this.memory || this.memory.modelStates.length === 0) {
      return '';
    }

    const currentStates = this.memory.modelStates
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3); // Most recent 3 states

    const summary = currentStates
      .map((state) => {
        const params = Object.entries(state.parameters)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        return `${state.modelType} (${new Date(state.timestamp).toLocaleTimeString()}): ${params}`;
      })
      .join('\n');

    return `Current model states:\n${summary}\n\n`;
  }

  /**
   * Save memory to browser storage
   */
  private saveToStorage(): void {
    if (!this.memory) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.memory));
    } catch (error) {
      console.warn('Failed to save chat memory to localStorage:', error);
    }
  }

  /**
   * Load memory from browser storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.memory = JSON.parse(stored) as ConversationMemory;
      }
    } catch (error) {
      console.warn('Failed to load chat memory from localStorage:', error);
      this.memory = null;
    }
  }

  /**
   * Check if current session is still valid
   */
  private isSessionValid(): boolean {
    if (!this.memory) return false;
    return Date.now() - this.memory.lastActivity < this.SESSION_TIMEOUT;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const memory = JSON.parse(stored) as ConversationMemory;
        if (Date.now() - memory.lastActivity > this.SESSION_TIMEOUT) {
          localStorage.removeItem(this.STORAGE_KEY);
          this.memory = null;
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup expired sessions:', error);
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all memory (for testing or reset)
   */
  clearMemory(): void {
    this.memory = null;
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Export memory for debugging
   */
  exportMemory(): ConversationMemory | null {
    return this.memory;
  }
}

export const chatMemory = ChatMemoryManager.getInstance();
