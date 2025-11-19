/**
 * Real-time Performance Monitoring Dashboard
 * Provides live metrics, alerts, and performance insights for chatbot and MCP systems
 */

export interface PerformanceMetrics {
  timestamp: Date;
  operation: string;
  duration: number;
  success: boolean;
  errorCode?: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  lastUpdated: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: PerformanceMetrics[]) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMs: number;
  lastTriggered?: Date;
}

export interface DashboardConfig {
  refreshIntervalMs: number;
  maxMetricsHistory: number;
  alertCooldownMs: number;
  enableRealTimeUpdates: boolean;
  enableAlerts: boolean;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  throughput: number;
  topErrors: Array<{ errorCode: string; count: number }>;
  topOperations: Array<{ operation: string; count: number; avgDuration: number }>;
}

export type DashboardEvent =
  | {
      type: 'update';
      data: {
        health: SystemHealth;
        stats: PerformanceStats;
        metrics: PerformanceMetrics[];
      };
    }
  | {
      type: 'alert';
      data: {
        id: string;
        name: string;
        severity: AlertRule['severity'];
        timestamp: Date;
        metrics: PerformanceMetrics[];
      };
    };

export class PerformanceDashboard {
  private metrics: PerformanceMetrics[] = [];
  private alerts: AlertRule[] = [];
  private config: DashboardConfig;
  private refreshInterval?: number;
  private subscribers: Set<(data: DashboardEvent) => void> = new Set();
  private startTime: number;

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      refreshIntervalMs: 1000,
      maxMetricsHistory: 1000,
      alertCooldownMs: 60000,
      enableRealTimeUpdates: true,
      enableAlerts: true,
      ...config,
    };

    this.startTime = Date.now();
    this.initializeDefaultAlerts();

    if (this.config.enableRealTimeUpdates) {
      this.startRealTimeUpdates();
    }
  }

  /**
   * Add performance metric
   */
  addMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.config.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.config.maxMetricsHistory);
    }

    // Check alerts
    if (this.config.enableAlerts) {
      this.checkAlerts();
    }

    // Notify subscribers
    this.notifySubscribers();
  }

  /**
   * Get current system health
   */
  getSystemHealth(): SystemHealth {
    const now = Date.now();
    const recentMetrics = this.getRecentMetrics(60000); // Last minute

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter((m) => m.success).length;
    const errorRate = totalRequests > 0 ? (totalRequests - successfulRequests) / totalRequests : 0;

    const avgResponseTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length
        : 0;

    const throughput = totalRequests / 60; // Requests per second

    let status: SystemHealth['status'] = 'healthy';
    if (errorRate > 0.1 || avgResponseTime > 5000) {
      status = 'critical';
    } else if (errorRate > 0.05 || avgResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      uptime: now - this.startTime,
      responseTime: avgResponseTime,
      errorRate,
      throughput,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(timeRangeMs: number = 300000): PerformanceStats {
    const recentMetrics = this.getRecentMetrics(timeRangeMs);

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter((m) => m.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = recentMetrics.map((m) => m.duration).sort((a, b) => a - b);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

    const p95ResponseTime = this.getPercentile(responseTimes, 95);
    const p99ResponseTime = this.getPercentile(responseTimes, 99);

    const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;
    const throughput = totalRequests / (timeRangeMs / 1000);

    // Top errors
    const errorCounts = new Map<string, number>();
    recentMetrics
      .filter((m) => !m.success && m.errorCode)
      .forEach((m) => {
        const errorCode = m.errorCode;
        if (!errorCode) {
          return;
        }

        const count = errorCounts.get(errorCode) ?? 0;
        errorCounts.set(errorCode, count + 1);
      });

    const topErrors = Array.from(errorCounts.entries())
      .map(([errorCode, count]) => ({ errorCode, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top operations
    const operationStats = new Map<string, { count: number; totalDuration: number }>();
    recentMetrics.forEach((m) => {
      const stats = operationStats.get(m.operation) || { count: 0, totalDuration: 0 };
      stats.count++;
      stats.totalDuration += m.duration;
      operationStats.set(m.operation, stats);
    });

    const topOperations = Array.from(operationStats.entries())
      .map(([operation, stats]) => ({
        operation,
        count: stats.count,
        avgDuration: stats.totalDuration / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      throughput,
      topErrors,
      topOperations,
    };
  }

  /**
   * Add alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alerts.push(rule);
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alerts = this.alerts.filter((rule) => rule.id !== ruleId);
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: DashboardEvent) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get metrics for specific time range
   */
  getMetrics(timeRangeMs: number): PerformanceMetrics[] {
    return this.getRecentMetrics(timeRangeMs);
  }

  /**
   * Export metrics data
   */
  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'operation', 'duration', 'success', 'errorCode', 'context'];
      const rows = this.metrics.map((m) => [
        m.timestamp.toISOString(),
        m.operation,
        m.duration,
        m.success,
        m.errorCode || '',
        m.context || '',
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }

    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get recent metrics within time range
   */
  private getRecentMetrics(timeRangeMs: number): PerformanceMetrics[] {
    const cutoff = Date.now() - timeRangeMs;
    return this.metrics.filter((m) => m.timestamp.getTime() >= cutoff);
  }

  /**
   * Calculate percentile
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Check alert conditions
   */
  private checkAlerts(): void {
    for (const alert of this.alerts) {
      if (!alert.enabled) continue;

      // Check cooldown
      if (alert.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - alert.lastTriggered.getTime();
        if (timeSinceLastTrigger < alert.cooldownMs) continue;
      }

      // Check condition
      if (alert.condition(this.metrics)) {
        this.triggerAlert(alert);
      }
    }
  }

  /**
   * Trigger alert
   */
  private triggerAlert(alert: AlertRule): void {
    alert.lastTriggered = new Date();

    const alertData = {
      id: alert.id,
      name: alert.name,
      severity: alert.severity,
      timestamp: new Date(),
      metrics: this.getRecentMetrics(60000),
    };

    // Notify subscribers
    this.notifySubscribers({ type: 'alert', data: alertData });

    // Log alert
    console.warn(`Performance Alert: ${alert.name}`, alertData);
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(data?: DashboardEvent): void {
    const updateData: DashboardEvent =
      data || {
      type: 'update',
      data: {
        health: this.getSystemHealth(),
        stats: this.getPerformanceStats(),
        metrics: this.metrics.slice(-100), // Last 100 metrics
      },
    };

    this.subscribers.forEach((callback) => {
      try {
        callback(updateData);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.refreshInterval = window.setInterval(() => {
      this.notifySubscribers();
    }, this.config.refreshIntervalMs);
  }

  /**
   * Stop real-time updates
   */
  stopRealTimeUpdates(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlerts(): void {
    // High error rate alert
    this.addAlertRule({
      id: 'high-error-rate',
      name: 'High Error Rate',
      condition: (metrics) => {
        const recent = metrics.slice(-100);
        if (recent.length < 10) return false;

        const errorRate = recent.filter((m) => !m.success).length / recent.length;
        return errorRate > 0.1;
      },
      severity: 'high',
      enabled: true,
      cooldownMs: 300000, // 5 minutes
    });

    // High response time alert
    this.addAlertRule({
      id: 'high-response-time',
      name: 'High Response Time',
      condition: (metrics) => {
        const recent = metrics.slice(-50);
        if (recent.length < 5) return false;

        const avgResponseTime = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
        return avgResponseTime > 5000;
      },
      severity: 'medium',
      enabled: true,
      cooldownMs: 300000, // 5 minutes
    });

    // Service unavailable alert
    this.addAlertRule({
      id: 'service-unavailable',
      name: 'Service Unavailable',
      condition: (metrics) => {
        const recent = metrics.slice(-20);
        if (recent.length < 5) return false;

        const serviceErrors = recent.filter(
          (m) => !m.success && m.errorCode?.includes('SERVICE_UNAVAILABLE')
        ).length;

        return serviceErrors >= 3;
      },
      severity: 'critical',
      enabled: true,
      cooldownMs: 60000, // 1 minute
    });
  }

  /**
   * Destroy dashboard and cleanup
   */
  destroy(): void {
    this.stopRealTimeUpdates();
    this.subscribers.clear();
    this.metrics = [];
    this.alerts = [];
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private dashboard: PerformanceDashboard;

  constructor(dashboard: PerformanceDashboard) {
    this.dashboard = dashboard;
  }

  /**
   * Monitor function execution
   */
  async monitor<T>(operation: string, fn: () => Promise<T>, context?: string): Promise<T> {
    const startTime = Date.now();
    let success = true;
    let errorCode: string | undefined;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      errorCode = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      this.dashboard.addMetric({
        timestamp: new Date(),
        operation,
        duration,
        success,
        errorCode,
        context,
      });
    }
  }

  /**
   * Monitor synchronous function execution
   */
  monitorSync<T>(operation: string, fn: () => T, context?: string): T {
    const startTime = Date.now();
    let success = true;
    let errorCode: string | undefined;

    try {
      return fn();
    } catch (error) {
      success = false;
      errorCode = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    } finally {
      const duration = Date.now() - startTime;

      this.dashboard.addMetric({
        timestamp: new Date(),
        operation,
        duration,
        success,
        errorCode,
        context,
      });
    }
  }
}

// Export default instance
export const defaultDashboard = new PerformanceDashboard();
export const defaultMonitor = new PerformanceMonitor(defaultDashboard);
