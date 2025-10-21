/**
 * Circuit Breaker Pattern Implementation
 * 
 * Prevents cascading failures by stopping requests to a failing service
 * after a threshold of consecutive failures is reached.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests fail fast
 * - HALF_OPEN: Testing if service recovered, limited requests pass through
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening circuit */
  failureThreshold: number;
  /** Time in milliseconds to wait before attempting recovery */
  resetTimeout: number;
  /** Time window in milliseconds for tracking failures */
  windowSize: number;
  /** Optional: Success threshold in HALF_OPEN state before closing */
  successThreshold?: number;
}

export interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number;
  lastStateChange: number;
  nextAttemptTime: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  circuitOpen: boolean;
  state: CircuitState;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 60000, // 60 seconds
  windowSize: 60000, // 60 seconds
  successThreshold: 2,
};

/**
 * Circuit Breaker for protecting against cascading failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private serviceName: string;

  constructor(serviceName: string, config?: Partial<CircuitBreakerConfig>) {
    this.serviceName = serviceName;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now(),
      nextAttemptTime: 0,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<CircuitBreakerResult<T>> {
    const now = Date.now();

    // Check if circuit should transition states
    this.checkStateTransition(now);

    // If circuit is OPEN, fail fast
    if (this.state.state === 'OPEN') {
      return {
        success: false,
        error: new Error(`Circuit breaker OPEN for ${this.serviceName}`),
        circuitOpen: true,
        state: this.state.state,
      };
    }

    // Attempt execution
    try {
      const data = await fn();
      this.recordSuccess(now);
      return {
        success: true,
        data,
        circuitOpen: false,
        state: this.state.state,
      };
    } catch (error) {
      this.recordFailure(now);
      // State may have changed to OPEN after recordFailure
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        circuitOpen: (this.state.state as CircuitState) === 'OPEN',
        state: this.state.state,
      };
    }
  }

  /**
   * Check if circuit breaker should transition states
   */
  private checkStateTransition(now: number): void {
    if (this.state.state === 'OPEN' && now >= this.state.nextAttemptTime) {
      // Transition to HALF_OPEN to test recovery
      this.state.state = 'HALF_OPEN';
      this.state.successes = 0;
      this.state.failures = 0;
      this.state.lastStateChange = now;
      console.log(
        JSON.stringify({
          level: 'info',
          message: `Circuit breaker transitioning to HALF_OPEN`,
          service: this.serviceName,
          timestamp: new Date(now).toISOString(),
        })
      );
    }

    // Reset failure count if window has expired
    if (
      this.state.state === 'CLOSED' &&
      this.state.lastFailureTime > 0 &&
      now - this.state.lastFailureTime > this.config.windowSize
    ) {
      this.state.failures = 0;
    }
  }

  /**
   * Record a successful execution
   */
  private recordSuccess(now: number): void {
    if (this.state.state === 'HALF_OPEN') {
      this.state.successes++;
      const successThreshold = this.config.successThreshold || 2;

      if (this.state.successes >= successThreshold) {
        // Service recovered, close circuit
        this.state.state = 'CLOSED';
        this.state.failures = 0;
        this.state.successes = 0;
        this.state.lastStateChange = now;
        console.log(
          JSON.stringify({
            level: 'info',
            message: `Circuit breaker CLOSED - service recovered`,
            service: this.serviceName,
            timestamp: new Date(now).toISOString(),
          })
        );
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success
      this.state.failures = 0;
    }
  }

  /**
   * Record a failed execution
   */
  private recordFailure(now: number): void {
    this.state.failures++;
    this.state.lastFailureTime = now;

    if (this.state.state === 'HALF_OPEN') {
      // Failed during recovery attempt, reopen circuit
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = now + this.config.resetTimeout;
      this.state.lastStateChange = now;
      console.error(
        JSON.stringify({
          level: 'error',
          message: `Circuit breaker reopened - recovery failed`,
          service: this.serviceName,
          failures: this.state.failures,
          timestamp: new Date(now).toISOString(),
        })
      );
    } else if (
      this.state.state === 'CLOSED' &&
      this.state.failures >= this.config.failureThreshold
    ) {
      // Threshold exceeded, open circuit
      this.state.state = 'OPEN';
      this.state.nextAttemptTime = now + this.config.resetTimeout;
      this.state.lastStateChange = now;
      console.error(
        JSON.stringify({
          level: 'error',
          message: `Circuit breaker OPENED - failure threshold exceeded`,
          service: this.serviceName,
          failures: this.state.failures,
          threshold: this.config.failureThreshold,
          timestamp: new Date(now).toISOString(),
        })
      );
    }
  }

  /**
   * Get current circuit breaker state (for monitoring)
   */
  getState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }

  /**
   * Manually reset circuit breaker (for admin use)
   */
  reset(): void {
    this.state = {
      state: 'CLOSED',
      failures: 0,
      successes: 0,
      lastFailureTime: 0,
      lastStateChange: Date.now(),
      nextAttemptTime: 0,
    };
    console.log(
      JSON.stringify({
        level: 'info',
        message: `Circuit breaker manually reset`,
        service: this.serviceName,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

/**
 * Global circuit breakers for different services
 */
const circuitBreakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker for a service
 */
export function getCircuitBreaker(
  serviceName: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!circuitBreakers.has(serviceName)) {
    circuitBreakers.set(serviceName, new CircuitBreaker(serviceName, config));
  }
  const breaker = circuitBreakers.get(serviceName);
  if (!breaker) {
    throw new Error(`Circuit breaker not found for ${serviceName}`);
  }
  return breaker;
}

/**
 * Get all circuit breaker states (for monitoring endpoint)
 */
export function getAllCircuitStates(): Record<string, CircuitBreakerState> {
  const states: Record<string, CircuitBreakerState> = {};
  circuitBreakers.forEach((breaker, name) => {
    states[name] = breaker.getState();
  });
  return states;
}
