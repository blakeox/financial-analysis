/**
 * Advanced Error Recovery Patterns for Chatbot and MCP Systems
 * Implements circuit breaker, exponential backoff, and intelligent retry strategies
 */

export interface ErrorRecoveryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeoutMs: number;
  healthCheckIntervalMs: number;
}

export interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export interface RetryContext {
  attempt: number;
  lastError: Error;
  totalDelayMs: number;
  startTime: number;
}

export class AdvancedErrorRecovery {
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private config: ErrorRecoveryConfig;

  constructor(config: Partial<ErrorRecoveryConfig> = {}) {
    this.config = {
      maxRetries: 5,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      jitterRatio: 0.1,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeoutMs: 60000,
      healthCheckIntervalMs: 10000,
      ...config,
    };

    this.startHealthCheckLoop();
  }

  /**
   * Execute operation with advanced error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    context: string,
    options: Partial<ErrorRecoveryConfig> = {}
  ): Promise<T> {
    const mergedConfig = { ...this.config, ...options };
    const circuitBreaker = this.getCircuitBreaker(context);

    // Check circuit breaker state
    if (this.isCircuitOpen(circuitBreaker)) {
      throw new Error(`Circuit breaker is OPEN for ${context}`);
    }

    const retryContext: RetryContext = {
      attempt: 0,
      lastError: new Error('Unknown error'),
      totalDelayMs: 0,
      startTime: Date.now(),
    };

    while (retryContext.attempt < mergedConfig.maxRetries) {
      try {
        const result = await operation();

        // Success - reset circuit breaker
        this.resetCircuitBreaker(circuitBreaker);
        return result;
      } catch (error) {
        retryContext.lastError = error instanceof Error ? error : new Error(String(error));
        retryContext.attempt++;

        // Update circuit breaker
        this.recordFailure(circuitBreaker);

        // Check if we should retry
        if (retryContext.attempt >= mergedConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(retryContext.attempt, mergedConfig);
        retryContext.totalDelayMs += delay;

        // Wait before retry
        await this.sleep(delay);
      }
    }

    // All retries failed
    throw new Error(
      `Operation failed after ${retryContext.attempt} attempts: ${retryContext.lastError.message}`
    );
  }

  /**
   * Execute operation with circuit breaker pattern
   */
  async executeWithCircuitBreaker<T>(operation: () => Promise<T>, context: string): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(context);

    if (this.isCircuitOpen(circuitBreaker)) {
      throw new Error(`Circuit breaker is OPEN for ${context}`);
    }

    try {
      const result = await operation();
      this.resetCircuitBreaker(circuitBreaker);
      return result;
    } catch (error) {
      this.recordFailure(circuitBreaker);
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  async executeWithTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Execute operation with retry and timeout
   */
  async executeWithRetryAndTimeout<T>(
    operation: () => Promise<T>,
    context: string,
    timeoutMs: number,
    options: Partial<ErrorRecoveryConfig> = {}
  ): Promise<T> {
    return this.executeWithRecovery(
      () => this.executeWithTimeout(operation, timeoutMs),
      context,
      options
    );
  }

  /**
   * Get circuit breaker state for context
   */
  private getCircuitBreaker(context: string): CircuitBreakerState {
    if (!this.circuitBreakers.has(context)) {
      this.circuitBreakers.set(context, {
        state: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: 0,
      });
    }
    return this.circuitBreakers.get(context)!;
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitOpen(circuitBreaker: CircuitBreakerState): boolean {
    if (circuitBreaker.state === 'OPEN') {
      if (Date.now() >= circuitBreaker.nextAttemptTime) {
        circuitBreaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Record failure in circuit breaker
   */
  private recordFailure(circuitBreaker: CircuitBreakerState): void {
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();

    if (circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
      circuitBreaker.state = 'OPEN';
      circuitBreaker.nextAttemptTime = Date.now() + this.config.circuitBreakerTimeoutMs;
    }
  }

  /**
   * Reset circuit breaker on success
   */
  private resetCircuitBreaker(circuitBreaker: CircuitBreakerState): void {
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failureCount = 0;
    circuitBreaker.lastFailureTime = 0;
    circuitBreaker.nextAttemptTime = 0;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number, config: ErrorRecoveryConfig): number {
    const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt - 1);
    const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * config.jitterRatio * Math.random();
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Start health check loop for circuit breakers
   */
  private startHealthCheckLoop(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Perform health checks on circuit breakers
   */
  private performHealthChecks(): void {
    for (const [context, circuitBreaker] of this.circuitBreakers) {
      if (circuitBreaker.state === 'OPEN' && Date.now() >= circuitBreaker.nextAttemptTime) {
        circuitBreaker.state = 'HALF_OPEN';
        console.log(`Circuit breaker for ${context} moved to HALF_OPEN state`);
      }
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats(): Record<string, CircuitBreakerState> {
    return Object.fromEntries(this.circuitBreakers);
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    for (const circuitBreaker of this.circuitBreakers.values()) {
      this.resetCircuitBreaker(circuitBreaker);
    }
  }
}

/**
 * Intelligent retry strategies based on error types
 */
export class IntelligentRetryStrategy {
  private static readonly RETRYABLE_ERRORS = [
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'ENETUNREACH',
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
  ];

  private static readonly NON_RETRYABLE_ERRORS = [
    'INVALID_REQUEST',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
  ];

  /**
   * Determine if error should be retried
   */
  static shouldRetry(error: Error, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }

    const errorMessage = error.message.toUpperCase();

    // Check for non-retryable errors
    for (const nonRetryable of this.NON_RETRYABLE_ERRORS) {
      if (errorMessage.includes(nonRetryable)) {
        return false;
      }
    }

    // Check for retryable errors
    for (const retryable of this.RETRYABLE_ERRORS) {
      if (errorMessage.includes(retryable)) {
        return true;
      }
    }

    // Default to retry for unknown errors
    return true;
  }

  /**
   * Calculate retry delay based on error type
   */
  static calculateRetryDelay(error: Error, attempt: number): number {
    const errorMessage = error.message.toUpperCase();

    // Rate limiting - use longer delays
    if (errorMessage.includes('RATE_LIMITED')) {
      return Math.min(1000 * Math.pow(2, attempt), 30000);
    }

    // Network errors - use moderate delays
    if (errorMessage.includes('ECONNRESET') || errorMessage.includes('ETIMEDOUT')) {
      return Math.min(500 * Math.pow(2, attempt), 10000);
    }

    // Service unavailable - use shorter delays
    if (errorMessage.includes('SERVICE_UNAVAILABLE')) {
      return Math.min(200 * Math.pow(2, attempt), 5000);
    }

    // Default exponential backoff
    return Math.min(1000 * Math.pow(2, attempt), 15000);
  }
}

/**
 * Error recovery middleware for MCP operations
 */
export class MCPErrorRecovery {
  private errorRecovery: AdvancedErrorRecovery;

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    this.errorRecovery = new AdvancedErrorRecovery(config);
  }

  /**
   * Execute MCP request with error recovery
   */
  async executeMCPRequest<T>(
    operation: () => Promise<T>,
    context: string = 'mcp-request'
  ): Promise<T> {
    return this.errorRecovery.executeWithRecovery(operation, context);
  }

  /**
   * Execute MCP request with circuit breaker
   */
  async executeMCPRequestWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    context: string = 'mcp-circuit'
  ): Promise<T> {
    return this.errorRecovery.executeWithCircuitBreaker(operation, context);
  }

  /**
   * Execute MCP request with timeout
   */
  async executeMCPRequestWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 30000
  ): Promise<T> {
    return this.errorRecovery.executeWithTimeout(operation, timeoutMs);
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats(): Record<string, CircuitBreakerState> {
    return this.errorRecovery.getCircuitBreakerStats();
  }
}

/**
 * Chat-specific error recovery
 */
export class ChatErrorRecovery {
  private errorRecovery: AdvancedErrorRecovery;
  private messageQueue: Map<string, { message: string; timestamp: number }> = new Map();

  constructor(config?: Partial<ErrorRecoveryConfig>) {
    this.errorRecovery = new AdvancedErrorRecovery({
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      circuitBreakerThreshold: 3,
      circuitBreakerTimeoutMs: 30000,
      ...config,
    });
  }

  /**
   * Send message with error recovery
   */
  async sendMessageWithRecovery(
    sendFn: () => Promise<any>,
    messageId: string,
    message: string
  ): Promise<any> {
    // Store message for potential retry
    this.messageQueue.set(messageId, {
      message,
      timestamp: Date.now(),
    });

    try {
      const result = await this.errorRecovery.executeWithRecovery(
        sendFn,
        `chat-message-${messageId}`
      );

      // Remove from queue on success
      this.messageQueue.delete(messageId);
      return result;
    } catch (error) {
      // Keep message in queue for manual retry
      console.warn(`Message ${messageId} failed, kept in queue for retry`);
      throw error;
    }
  }

  /**
   * Retry failed messages
   */
  async retryFailedMessages(
    sendFn: (messageId: string, message: string) => Promise<any>
  ): Promise<void> {
    const failedMessages = Array.from(this.messageQueue.entries());

    for (const [messageId, { message }] of failedMessages) {
      try {
        await this.errorRecovery.executeWithRecovery(
          () => sendFn(messageId, message),
          `chat-retry-${messageId}`
        );

        // Remove from queue on success
        this.messageQueue.delete(messageId);
      } catch (error) {
        console.warn(`Retry failed for message ${messageId}:`, error);
      }
    }
  }

  /**
   * Get failed messages count
   */
  getFailedMessagesCount(): number {
    return this.messageQueue.size;
  }

  /**
   * Clear failed messages
   */
  clearFailedMessages(): void {
    this.messageQueue.clear();
  }
}

// Export default instances
export const defaultErrorRecovery = new AdvancedErrorRecovery();
export const defaultMCPErrorRecovery = new MCPErrorRecovery();
export const defaultChatErrorRecovery = new ChatErrorRecovery();
