/**
 * API monitoring wrapper for tracking and analyzing API call results
 * Provides deep insights into API performance, errors, and patterns
 */

import { trackApiCall } from './analytics';

export interface ApiCallMetrics {
  endpoint: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  success: boolean;
  errorMessage?: string;
  requestPayload?: unknown;
  responseData?: unknown;
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
  retryCount?: number;
}

export interface ApiAnalysis {
  totalCalls: number;
  successRate: number;
  averageDuration: number;
  errorRate: number;
  cacheHitRate: number;
  slowestCalls: ApiCallMetrics[];
  recentErrors: ApiCallMetrics[];
  endpointStats: Map<string, EndpointStats>;
}

export interface EndpointStats {
  endpoint: string;
  callCount: number;
  successCount: number;
  errorCount: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  cacheHits: number;
}

class ApiMonitor {
  private callHistory: ApiCallMetrics[] = [];
  private maxHistorySize: number = 100;
  private endpointStats: Map<string, EndpointStats> = new Map();

  /**
   * Wrap a fetch call with monitoring and analytics
   */
  public async monitoredFetch<T = unknown>(
    url: string,
    options?: RequestInit
  ): Promise<{ data: T; metrics: ApiCallMetrics }> {
    const method = options?.method || 'GET';
    const endpoint = new URL(url, window.location.origin).pathname;
    
    const metrics: ApiCallMetrics = {
      endpoint,
      method,
      startTime: Date.now(),
      success: false,
    };

    // Calculate request size
    if (options?.body) {
      metrics.requestSize = this.estimateSize(options.body);
      metrics.requestPayload = this.safeParseJson(options.body);
    }

    try {
      const response = await fetch(url, options);
      
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.statusCode = response.status;
      metrics.success = response.ok;
      
      // Check for cache hit header
      metrics.cacheHit = response.headers.get('X-Cache') === 'HIT';

      // Parse response
      const responseText = await response.text();
      metrics.responseSize = new Blob([responseText]).size;
      
      let data: T;
      try {
        data = JSON.parse(responseText) as T;
        metrics.responseData = data;
      } catch {
        data = responseText as T;
      }

      if (!response.ok) {
        metrics.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      // Record metrics
      this.recordCall(metrics);

      // Track in analytics
      trackApiCall({
        endpoint: metrics.endpoint,
        method: metrics.method,
        statusCode: metrics.statusCode,
        duration: metrics.duration,
        ...(metrics.requestSize !== undefined && { requestSize: metrics.requestSize }),
        ...(metrics.responseSize !== undefined && { responseSize: metrics.responseSize }),
        ...(metrics.cacheHit !== undefined && { cacheHit: metrics.cacheHit }),
        success: metrics.success,
        ...(metrics.errorMessage && { errorMessage: metrics.errorMessage }),
      });

      if (!response.ok) {
        throw new Error(metrics.errorMessage);
      }

      return { data, metrics };
    } catch (error) {
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.success = false;
      metrics.errorMessage = error instanceof Error ? error.message : String(error);

      // Record failed call
      this.recordCall(metrics);

      // Track error in analytics
      trackApiCall({
        endpoint: metrics.endpoint,
        method: metrics.method,
        duration: metrics.duration,
        success: false,
        errorMessage: metrics.errorMessage,
      });

      throw error;
    }
  }

  /**
   * Monitor an API call with automatic retry logic
   */
  public async monitoredFetchWithRetry<T = unknown>(
    url: string,
    options?: RequestInit,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<{ data: T; metrics: ApiCallMetrics }> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.monitoredFetch<T>(url, options);
        if (attempt > 0) {
          result.metrics.retryCount = attempt;
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise((resolve) => 
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Record a completed API call
   */
  private recordCall(metrics: ApiCallMetrics): void {
    // Add to history
    this.callHistory.unshift(metrics);
    if (this.callHistory.length > this.maxHistorySize) {
      this.callHistory.pop();
    }

    // Update endpoint stats
    this.updateEndpointStats(metrics);
  }

  /**
   * Update statistics for an endpoint
   */
  private updateEndpointStats(metrics: ApiCallMetrics): void {
    const key = `${metrics.method} ${metrics.endpoint}`;
    const existing = this.endpointStats.get(key);

    if (existing) {
      existing.callCount++;
      if (metrics.success) existing.successCount++;
      else existing.errorCount++;
      
      if (metrics.duration !== undefined) {
        existing.totalDuration += metrics.duration;
        existing.averageDuration = existing.totalDuration / existing.callCount;
        existing.minDuration = Math.min(existing.minDuration, metrics.duration);
        existing.maxDuration = Math.max(existing.maxDuration, metrics.duration);
      }
      
      if (metrics.cacheHit) existing.cacheHits++;
    } else {
      this.endpointStats.set(key, {
        endpoint: key,
        callCount: 1,
        successCount: metrics.success ? 1 : 0,
        errorCount: metrics.success ? 0 : 1,
        totalDuration: metrics.duration || 0,
        averageDuration: metrics.duration || 0,
        minDuration: metrics.duration || 0,
        maxDuration: metrics.duration || 0,
        cacheHits: metrics.cacheHit ? 1 : 0,
      });
    }
  }

  /**
   * Get comprehensive API analysis
   */
  public getAnalysis(): ApiAnalysis {
    const totalCalls = this.callHistory.length;
    const successfulCalls = this.callHistory.filter((c) => c.success).length;
    const cachedCalls = this.callHistory.filter((c) => c.cacheHit).length;
    const durations = this.callHistory
      .filter((c) => c.duration !== undefined)
      .map((c) => c.duration!);

    const slowestCalls = [...this.callHistory]
      .filter((c) => c.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const recentErrors = this.callHistory
      .filter((c) => !c.success)
      .slice(0, 10);

    return {
      totalCalls,
      successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0,
      errorRate: totalCalls > 0 ? ((totalCalls - successfulCalls) / totalCalls) * 100 : 0,
      averageDuration: durations.length > 0 
        ? durations.reduce((a, b) => a + b, 0) / durations.length 
        : 0,
      cacheHitRate: totalCalls > 0 ? (cachedCalls / totalCalls) * 100 : 0,
      slowestCalls,
      recentErrors,
      endpointStats: this.endpointStats,
    };
  }

  /**
   * Get metrics for a specific endpoint
   */
  public getEndpointMetrics(endpoint: string): EndpointStats | undefined {
    return this.endpointStats.get(endpoint);
  }

  /**
   * Get recent call history
   */
  public getCallHistory(limit: number = 20): ApiCallMetrics[] {
    return this.callHistory.slice(0, limit);
  }

  /**
   * Clear all history and stats
   */
  public clearHistory(): void {
    this.callHistory = [];
    this.endpointStats.clear();
  }

  /**
   * Estimate size of request body
   */
  private estimateSize(body: BodyInit): number {
    if (typeof body === 'string') {
      return new Blob([body]).size;
    }
    if (body instanceof FormData) {
      // Rough estimate
      return 1024; // Placeholder
    }
    if (body instanceof Blob) {
      return body.size;
    }
    return 0;
  }

  /**
   * Safely parse JSON
   */
  private safeParseJson(body: BodyInit): unknown {
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }
    return undefined;
  }
}

// Singleton instance
let monitorInstance: ApiMonitor | null = null;

export function getApiMonitor(): ApiMonitor {
  if (!monitorInstance) {
    monitorInstance = new ApiMonitor();
  }
  return monitorInstance;
}

/**
 * Convenience wrapper for monitored fetch
 */
export async function monitoredFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; metrics: ApiCallMetrics }> {
  return getApiMonitor().monitoredFetch<T>(url, options);
}

/**
 * Convenience wrapper for monitored fetch with retry
 */
export async function monitoredFetchWithRetry<T = unknown>(
  url: string,
  options?: RequestInit,
  maxRetries?: number,
  retryDelay?: number
): Promise<{ data: T; metrics: ApiCallMetrics }> {
  return getApiMonitor().monitoredFetchWithRetry<T>(url, options, maxRetries, retryDelay);
}
