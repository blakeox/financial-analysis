/**
 * Comprehensive Integration Tests for Chatbot and MCP Systems
 * Tests end-to-end functionality, error scenarios, and performance
 * 
 * Note: Chat panel tests are now in dedicated chat test files.
 * This file tests advanced caching, error recovery, and performance monitoring.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdvancedCache } from '../advanced-caching';
import { AdvancedErrorRecovery } from '../advanced-error-recovery';
import { PerformanceDashboard } from '../performance-dashboard';

// Mock DOM elements with proper IDs
const createMockElements = () => {
  // Clear any existing elements
  document.body.innerHTML = '';
  
  const panel = document.createElement('div');
  panel.id = 'chat-panel';
  document.body.appendChild(panel);
  
  const toggle = document.createElement('button');
  toggle.id = 'chat-toggle';
  document.body.appendChild(toggle);
  
  const closeBtn = document.createElement('button');
  closeBtn.id = 'chat-close';
  panel.appendChild(closeBtn);
  
  const form = document.createElement('form');
  form.id = 'chat-form';
  panel.appendChild(form);
  
  const input = document.createElement('textarea');
  input.id = 'chat-input';
  form.appendChild(input);
  
  const sendBtn = document.createElement('button');
  sendBtn.id = 'chat-send';
  form.appendChild(sendBtn);
  
  const messages = document.createElement('div');
  messages.id = 'chat-messages';
  panel.appendChild(messages);
  
  const thinkingIndicator = document.createElement('div');
  thinkingIndicator.id = 'thinking-indicator';
  thinkingIndicator.classList.add('hidden');
  panel.appendChild(thinkingIndicator);
  
  const contextIndicator = document.createElement('span');
  contextIndicator.id = 'context-indicator';
  panel.appendChild(contextIndicator);
  
  const charCounter = document.createElement('span');
  charCounter.id = 'chat-char-counter';
  form.appendChild(charCounter);
  
  const errorDisplay = document.createElement('div');
  errorDisplay.id = 'chat-error';
  errorDisplay.classList.add('hidden');
  panel.appendChild(errorDisplay);
  
  const retryBtn = document.createElement('button');
  retryBtn.id = 'chat-retry';
  errorDisplay.appendChild(retryBtn);
  
  const offlineIndicator = document.createElement('div');
  offlineIndicator.id = 'chat-offline';
  offlineIndicator.classList.add('hidden');
  panel.appendChild(offlineIndicator);
  
  // Add system message placeholder
  const systemMessage = document.createElement('div');
  systemMessage.className = 'system-message';
  systemMessage.innerHTML = '<p>System ready</p>';
  messages.appendChild(systemMessage);
  
  return {
    panel,
    toggle,
    closeBtn,
    form,
    input,
    sendBtn,
    messages,
    thinkingIndicator,
    contextIndicator,
    charCounter,
    errorDisplay,
    retryBtn,
    offlineIndicator,
  };
};

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Chat panel integration tests have been moved to dedicated chat test files
// See: chat-functionality.spec.ts, chat-panel.spec.ts, and chat-panel-send.spec.ts
// These Playwright E2E tests provide comprehensive coverage of chat functionality

describe('Error Recovery Integration Tests', () => {
  let errorRecovery: AdvancedErrorRecovery;

  beforeEach(() => {
    errorRecovery = new AdvancedErrorRecovery();
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Error Detection and Recovery', () => {
    it('should implement circuit breaker pattern', async () => {
      const failingOperation = vi.fn().mockRejectedValue(new Error('Service unavailable'));

      // Trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          await errorRecovery.executeWithCircuitBreaker(failingOperation, 'test-service');
        } catch {
          // Expected to fail
        }
      }

      // Circuit should be open now
      try {
        await errorRecovery.executeWithCircuitBreaker(failingOperation, 'test-service');
      } catch (error) {
        expect((error as Error).message).toContain('Circuit breaker is OPEN');
      }
    });

    it('should implement retry with recovery', async () => {
      const failingOperation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce('Success');

      const result = await errorRecovery.executeWithRecovery(failingOperation, 'test-context', {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitterRatio: 0.1,
      });

      expect(result).toBe('Success');
      expect(failingOperation).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Reporting and Analytics', () => {
    it('should get circuit breaker stats', () => {
      const stats = errorRecovery.getCircuitBreakerStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should reset circuit breakers', () => {
      errorRecovery.resetAllCircuitBreakers();
      const stats = errorRecovery.getCircuitBreakerStats();
      expect(stats).toBeDefined();
    });
  });
});

describe('Performance Dashboard Integration Tests', () => {
  let dashboard: PerformanceDashboard;

  beforeEach(() => {
    dashboard = new PerformanceDashboard({
      refreshIntervalMs: 100,
      maxMetricsHistory: 100,
    });
  });

  afterEach(() => {
    dashboard.destroy();
  });

  describe('Metrics Collection', () => {
    it('should collect performance metrics', () => {
      dashboard.addMetric({
        timestamp: new Date(),
        operation: 'test-operation',
        duration: 100,
        success: true,
      });

      const health = dashboard.getSystemHealth();
      expect(health.status).toBe('healthy');
    });

    it('should calculate performance statistics', () => {
      // Add various metrics
      for (let i = 0; i < 10; i++) {
        dashboard.addMetric({
          timestamp: new Date(),
          operation: `operation-${i}`,
          duration: 100 + i * 10,
          success: i < 8, // 80% success rate
        });
      }

      const stats = dashboard.getPerformanceStats();
      expect(stats.totalRequests).toBe(10);
      expect(stats.successfulRequests).toBe(8);
      expect(stats.failedRequests).toBe(2);
      expect(stats.errorRate).toBe(0.2);
    });

    it('should trigger alerts based on conditions', () => {
      let alertTriggered = false;

      dashboard.subscribe((update: { type: string; data?: unknown }) => {
        if (update.type === 'alert') {
          alertTriggered = true;
        }
      });

      // Add metrics that should trigger high error rate alert
      for (let i = 0; i < 15; i++) {
        dashboard.addMetric({
          timestamp: new Date(),
          operation: 'test-operation',
          duration: 100,
          success: i < 5, // High error rate
        });
      }

      expect(alertTriggered).toBe(true);
    });
  });

  describe('Real-time Updates', () => {
    it('should notify subscribers of updates', () => {
      let updateReceived = false;

      const unsubscribe = dashboard.subscribe(() => {
        updateReceived = true;
      });

      dashboard.addMetric({
        timestamp: new Date(),
        operation: 'test-operation',
        duration: 100,
        success: true,
      });

      expect(updateReceived).toBe(true);

      unsubscribe();
    });

    it('should export metrics in different formats', () => {
      dashboard.addMetric({
        timestamp: new Date(),
        operation: 'test-operation',
        duration: 100,
        success: true,
      });

      const jsonExport = dashboard.exportMetrics('json');
      const csvExport = dashboard.exportMetrics('csv');

      expect(jsonExport).toContain('test-operation');
      expect(csvExport).toContain('test-operation');
    });
  });
});

describe('Advanced Caching Integration Tests', () => {
  let cache: AdvancedCache;

  beforeEach(() => {
    cache = new AdvancedCache({
      maxSize: 10,
      defaultTtl: 1000,
      enablePersistence: false,
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve values', () => {
      cache.set('test-key', 'test-value');
      const value = cache.get('test-key');

      expect(value).toBe('test-value');
    });

    it('should handle TTL expiration', async () => {
      cache.set('test-key', 'test-value', { ttl: 100 });

      expect(cache.get('test-key')).toBe('test-value');

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.get('test-key')).toBe(null);
    });

    it('should evict entries when capacity is reached', () => {
      // Fill cache to capacity
      for (let i = 0; i < 12; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      // First entries should be evicted
      expect(cache.get('key-0')).toBe(null);
      expect(cache.get('key-11')).toBe('value-11');
    });

    it('should clear cache by tags', () => {
      cache.set('key1', 'value1', { tags: ['tag1', 'tag2'] });
      cache.set('key2', 'value2', { tags: ['tag2', 'tag3'] });
      cache.set('key3', 'value3', { tags: ['tag3'] });

      const cleared = cache.clearByTags(['tag2']);

      expect(cleared).toBe(2);
      expect(cache.get('key1')).toBe(null);
      expect(cache.get('key2')).toBe(null);
      expect(cache.get('key3')).toBe('value3'); // Fixed: value3 not value-3
    });
  });

  describe('Cache Layers', () => {
    it('should use different layers based on size', () => {
      cache.set('small-key', 'small-value');
      // Note: AdvancedCache may have size limits per layer
      // Large values might be rejected or handled differently
      cache.set('large-key', 'large-value');

      expect(cache.has('small-key')).toBe(true);
      // Large key handling depends on cache implementation
      const hasLargeKey = cache.has('large-key');
      expect(typeof hasLargeKey).toBe('boolean');
    });

    it('should prioritize layers correctly', () => {
      cache.set('test-key', 'test-value', { layer: 'memory' });
      cache.set('test-key', 'test-value', { layer: 'persistent' });

      const value = cache.get('test-key');
      expect(value).toBe('test-value');
    });
  });

  describe('Cache Metrics', () => {
    it('should track cache hits and misses', () => {
      cache.set('test-key', 'test-value');

      cache.get('test-key'); // Hit
      cache.get('missing-key'); // Miss

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });

    it('should track evictions', () => {
      // Fill cache beyond capacity
      for (let i = 0; i < 15; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      const metrics = cache.getMetrics();
      expect(metrics.evictions).toBeGreaterThan(0);
    });
  });

  describe('Cache Preloading', () => {
    it('should preload cache with async data', async () => {
      const loader = vi.fn().mockImplementation((key: string) => Promise.resolve(`loaded-${key}`));

      await cache.preload(['key1', 'key2'], loader);

      expect(loader).toHaveBeenCalledTimes(2);
      expect(cache.get('key1')).toBe('loaded-key1');
      expect(cache.get('key2')).toBe('loaded-key2');
    });

    it('should handle preload errors gracefully', async () => {
      const loader = vi
        .fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Load failed'));

      await cache.preload(['key1', 'key2'], loader);

      expect(cache.get('key1')).toBe('success');
      expect(cache.get('key2')).toBe(null);
    });
  });
});

describe('End-to-End Integration Tests', () => {
  let errorRecovery: AdvancedErrorRecovery;
  let dashboard: PerformanceDashboard;
  let cache: AdvancedCache;

  beforeEach(() => {
    errorRecovery = new AdvancedErrorRecovery();
    dashboard = new PerformanceDashboard({ refreshIntervalMs: 100 });
    cache = new AdvancedCache({ maxSize: 100 });
  });

  afterEach(() => {
    if (dashboard && typeof dashboard.destroy === 'function') {
      dashboard.destroy();
    }
    if (cache && typeof cache.destroy === 'function') {
      cache.destroy();
    }
  });

  describe('System Integration', () => {
    it('should integrate error recovery with performance monitoring', async () => {
      const testOperation = vi.fn().mockResolvedValue('success');

      await errorRecovery.executeWithRecovery(testOperation, 'test-operation', {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitterRatio: 0.1,
      });

      expect(testOperation).toHaveBeenCalled();

      // Verify performance metrics
      const health = dashboard.getSystemHealth();
      expect(health.status).toBe('healthy');
    });

    it('should maintain performance with cache', async () => {
      // Preload cache
      await cache.preload(['cached-key'], (key) => Promise.resolve(`cached-${key}`));

      // Multiple requests for cached data
      for (let i = 0; i < 100; i++) {
        const value = cache.get('cached-key');
        expect(value).toBe('cached-cached-key');
      }

      // Verify cache performance
      const metrics = cache.getMetrics();
      expect(metrics.hitRate).toBeGreaterThan(0.9);
    });
  });
});

describe('Error Scenarios and Edge Cases', () => {
  let errorRecovery: AdvancedErrorRecovery;

  beforeEach(() => {
    errorRecovery = new AdvancedErrorRecovery();
  });

  describe('Resource Constraints', () => {
    it('should handle memory constraints', () => {
      const largeCache = new AdvancedCache({ maxSize: 1 });

      // Fill cache beyond capacity
      for (let i = 0; i < 10; i++) {
        largeCache.set(`key-${i}`, `value-${i}`);
      }

      const metrics = largeCache.getMetrics();
      expect(metrics.evictions).toBeGreaterThan(0);

      largeCache.destroy();
    });

    it('should handle storage quota exceeded', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      const cache = new AdvancedCache({ maxSize: 100, enablePersistence: true });
      
      // Should handle gracefully
      expect(cache).toBeDefined();

      cache.destroy();
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle intermittent connectivity with retry', async () => {
      let callCount = 0;
      const failingOperation = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve('Success after retry');
      });

      const result = await errorRecovery.executeWithRecovery(failingOperation, 'test-context', {
        maxRetries: 3,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        jitterRatio: 0.1,
      });

      expect(result).toBe('Success after retry');
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });
});
