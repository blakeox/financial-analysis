import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CircuitBreaker,
  getCircuitBreaker,
  getAllCircuitStates,
  type CircuitBreakerConfig,
} from '../lib/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;
  const testConfig: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeout: 1000,
    windowSize: 5000,
    successThreshold: 2,
  };

  beforeEach(() => {
    breaker = new CircuitBreaker('test-service', testConfig);
  });

  describe('CLOSED state behavior', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.circuitOpen).toBe(false);
      expect(result.state).toBe('CLOSED');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should record failure but stay closed below threshold', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      await breaker.execute(fn);
      const state = breaker.getState();

      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(1);
    });

    it('should open circuit when failure threshold is exceeded', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Execute failures up to threshold
      for (let i = 0; i < testConfig.failureThreshold; i++) {
        await breaker.execute(fn);
      }

      const state = breaker.getState();
      expect(state.state).toBe('OPEN');
      expect(state.failures).toBe(testConfig.failureThreshold);
    });

    it('should reset failure count on success', async () => {
      const failFn = vi.fn().mockRejectedValue(new Error('failure'));
      const successFn = vi.fn().mockResolvedValue('success');

      // Record some failures
      await breaker.execute(failFn);
      await breaker.execute(failFn);

      // Then succeed
      await breaker.execute(successFn);

      const state = breaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(0);
    });
  });

  describe('OPEN state behavior', () => {
    beforeEach(async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));
      // Open the circuit
      for (let i = 0; i < testConfig.failureThreshold; i++) {
        await breaker.execute(fn);
      }
    });

    it('should fail fast when circuit is open', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result.success).toBe(false);
      expect(result.circuitOpen).toBe(true);
      expect(result.state).toBe('OPEN');
      expect(result.error?.message).toContain('Circuit breaker OPEN');
      expect(fn).not.toHaveBeenCalled();
    });

    it('should return error with service name', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result.error?.message).toContain('test-service');
    });
  });

  describe('HALF_OPEN state behavior', () => {
    beforeEach(async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));
      // Open the circuit
      for (let i = 0; i < testConfig.failureThreshold; i++) {
        await breaker.execute(fn);
      }
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      // Wait for reset timeout (mocked with manual state transition)
      const state = breaker.getState();
      const resetTime = state.nextAttemptTime;

      // Manually advance time by calling checkStateTransition
      vi.spyOn(Date, 'now').mockReturnValue(resetTime);

      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn);

      let newState = breaker.getState();
      // Should have transitioned to HALF_OPEN, but needs successThreshold (2) calls to close
      expect(newState.state).toBe('HALF_OPEN');
      expect(newState.successes).toBe(1);

      // Second success should close the circuit
      await breaker.execute(fn);
      newState = breaker.getState();
      expect(newState.state).toBe('CLOSED');
    });

    it('should close circuit after successful recovery attempts', async () => {
      const state = breaker.getState();
      vi.spyOn(Date, 'now').mockReturnValue(state.nextAttemptTime);

      const fn = vi.fn().mockResolvedValue('success');

      // Execute successes to meet threshold
      for (let i = 0; i < (testConfig.successThreshold || 2); i++) {
        await breaker.execute(fn);
      }

      const newState = breaker.getState();
      expect(newState.state).toBe('CLOSED');
      expect(newState.successes).toBe(0);
      expect(newState.failures).toBe(0);
    });

    it('should reopen circuit if recovery attempt fails', async () => {
      const state = breaker.getState();
      vi.spyOn(Date, 'now').mockReturnValue(state.nextAttemptTime);

      const fn = vi.fn().mockRejectedValue(new Error('still failing'));
      await breaker.execute(fn);

      const newState = breaker.getState();
      expect(newState.state).toBe('OPEN');
    });
  });

  describe('Manual reset', () => {
    it('should reset circuit to CLOSED state', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < testConfig.failureThreshold; i++) {
        await breaker.execute(fn);
      }

      expect(breaker.getState().state).toBe('OPEN');

      breaker.reset();

      const state = breaker.getState();
      expect(state.state).toBe('CLOSED');
      expect(state.failures).toBe(0);
      expect(state.successes).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle non-Error rejections', async () => {
      const fn = vi.fn().mockRejectedValue('string error');
      const result = await breaker.execute(fn);

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toBe('string error');
    });

    it('should preserve Error instances', async () => {
      const customError = new TypeError('custom error');
      const fn = vi.fn().mockRejectedValue(customError);
      const result = await breaker.execute(fn);

      expect(result.success).toBe(false);
      expect(result.error).toBe(customError);
    });
  });

  describe('Global circuit breaker management', () => {
    it('should create and retrieve circuit breaker by name', () => {
      const breaker1 = getCircuitBreaker('service-1');
      const breaker2 = getCircuitBreaker('service-1');

      expect(breaker1).toBe(breaker2);
    });

    it('should create different breakers for different services', () => {
      const breaker1 = getCircuitBreaker('service-1');
      const breaker2 = getCircuitBreaker('service-2');

      expect(breaker1).not.toBe(breaker2);
    });

    it('should get all circuit states', async () => {
      const breaker1 = getCircuitBreaker('service-1');
      getCircuitBreaker('service-2'); // Create second breaker

      const fn = vi.fn().mockRejectedValue(new Error('failure'));
      await breaker1.execute(fn);

      const states = getAllCircuitStates();

      expect(states['service-1']).toBeDefined();
      expect(states['service-2']).toBeDefined();

      const state1 = states['service-1'];
      const state2 = states['service-2'];

      if (state1 && state2) {
        expect(state1.failures).toBe(1);
        expect(state2.failures).toBe(0);
      } else {
        throw new Error('Circuit states not found');
      }
    });
  });

  describe('Window size behavior', () => {
    it('should reset failures after window expires', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Record a failure
      await breaker.execute(fn);
      expect(breaker.getState().failures).toBe(1);

      // Advance time beyond window size
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now + testConfig.windowSize + 1000);

      // Execute another failure (should reset count first)
      await breaker.execute(fn);

      const state = breaker.getState();
      expect(state.failures).toBe(1); // Reset then incremented
    });
  });
});
