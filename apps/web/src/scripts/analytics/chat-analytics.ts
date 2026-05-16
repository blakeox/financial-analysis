/**
 * Comprehensive Chat Analytics and Monitoring System
 * Tracks usage patterns, performance metrics, and user experience
 */

export interface ChatAnalytics {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  messageCount: number;
  toolUsage: Record<string, number>;
  errorCount: number;
  averageResponseTime: number;
  userSatisfaction?: number;
  contextSwitches: number;
  offlineTime: number;
}

export interface ChatMetrics {
  timestamp: Date;
  type:
    | 'message_sent'
    | 'message_received'
    | 'tool_used'
    | 'error_occurred'
    | 'context_changed'
    | 'session_started'
    | 'session_ended'
    | 'session_paused'
    | 'session_resumed'
    | 'satisfaction_rated';
  data: Record<string, unknown>;
}

export interface PerformanceMetrics {
  messageId: string;
  requestTime: Date;
  responseTime?: Date;
  duration?: number;
  toolName?: string;
  fromCache?: boolean;
  success: boolean;
  errorCode?: string;
  retryCount: number;
}

export interface UserBehaviorMetrics {
  sessionId: string;
  pageContext: string;
  messageLength: number;
  timeToFirstMessage: number;
  messagesPerMinute: number;
  toolRequestsPerSession: number;
  errorRate: number;
  satisfactionScore?: number;
}

class ChatAnalyticsCollector {
  private sessionId: string;
  private startTime: Date;
  private metrics: ChatMetrics[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private toolUsage: Record<string, number> = {};
  private errorCount = 0;
  private contextSwitches = 0;
  private offlineTime = 0;
  private offlineStartTime: Date | null = null;
  private messageCount = 0;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || this.generateSessionId();
    this.startTime = new Date();

    this.setupEventListeners();
    this.trackSessionStart();
  }

  private generateSessionId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private setupEventListeners(): void {
    // Track online/offline status
    window.addEventListener('online', () => {
      if (this.offlineStartTime) {
        this.offlineTime += Date.now() - this.offlineStartTime.getTime();
        this.offlineStartTime = null;
      }
    });

    window.addEventListener('offline', () => {
      this.offlineStartTime = new Date();
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackMetric('session_paused', { timestamp: new Date() });
      } else {
        this.trackMetric('session_resumed', { timestamp: new Date() });
      }
    });

    // Track beforeunload for session end
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });
  }

  public trackMessageSent(message: string, context: string): void {
    this.messageCount++;

    this.trackMetric('message_sent', {
      messageLength: message.length,
      context,
      timestamp: new Date(),
      sessionDuration: Date.now() - this.startTime.getTime(),
    });
  }

  public trackMessageReceived(response: string, toolUsed?: string, fromCache?: boolean): void {
    if (toolUsed) {
      this.toolUsage[toolUsed] = (this.toolUsage[toolUsed] || 0) + 1;
    }

    this.trackMetric('message_received', {
      responseLength: response.length,
      toolUsed,
      fromCache,
      timestamp: new Date(),
    });
  }

  public trackToolUsed(toolName: string, success: boolean, duration?: number): void {
    this.toolUsage[toolName] = (this.toolUsage[toolName] || 0) + 1;

    this.trackMetric('tool_used', {
      toolName,
      success,
      duration,
      timestamp: new Date(),
    });
  }

  public trackError(error: string, errorCode?: string, context?: string): void {
    this.errorCount++;

    this.trackMetric('error_occurred', {
      error,
      errorCode,
      context,
      timestamp: new Date(),
    });
  }

  public trackContextChange(oldContext: string, newContext: string): void {
    this.contextSwitches++;

    this.trackMetric('context_changed', {
      oldContext,
      newContext,
      timestamp: new Date(),
    });
  }

  public trackPerformance(metrics: PerformanceMetrics): void {
    this.performanceMetrics.push(metrics);

    // Keep only last 100 performance metrics to prevent memory issues
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  public trackSatisfaction(score: number, feedback?: string): void {
    this.trackMetric('satisfaction_rated', {
      score,
      feedback,
      timestamp: new Date(),
    });
  }

  public trackMetric(type: ChatMetrics['type'], data: Record<string, unknown>): void {
    const metric: ChatMetrics = {
      timestamp: new Date(),
      type,
      data,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  private trackSessionStart(): void {
    this.trackMetric('session_started', {
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  private trackSessionEnd(): void {
    const endTime = new Date();
    const sessionDuration = endTime.getTime() - this.startTime.getTime();

    this.trackMetric('session_ended', {
      sessionId: this.sessionId,
      sessionDuration,
      messageCount: this.messageCount,
      toolUsage: this.toolUsage,
      errorCount: this.errorCount,
      contextSwitches: this.contextSwitches,
      offlineTime: this.offlineTime,
    });

    // Send analytics data to server
    this.sendAnalytics();
  }

  public getAnalytics(): ChatAnalytics {
    const endTime = new Date();

    // Calculate average response time
    const responseTimes = this.performanceMetrics
      .filter((m) => m.duration !== undefined)
      .map((m) => m.duration as number);
    const averageResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime,
      messageCount: this.messageCount,
      toolUsage: this.toolUsage,
      errorCount: this.errorCount,
      averageResponseTime,
      contextSwitches: this.contextSwitches,
      offlineTime: this.offlineTime,
    };
  }

  public getUserBehaviorMetrics(): UserBehaviorMetrics {
    const sessionDuration = Date.now() - this.startTime.getTime();
    const messagesPerMinute =
      sessionDuration > 0 ? (this.messageCount / sessionDuration) * 60000 : 0;
    const toolRequestsPerSession = Object.values(this.toolUsage).reduce((a, b) => a + b, 0);
    const errorRate = this.messageCount > 0 ? (this.errorCount / this.messageCount) * 100 : 0;

    return {
      sessionId: this.sessionId,
      pageContext: this.getCurrentContext(),
      messageLength: this.getAverageMessageLength(),
      timeToFirstMessage: this.getTimeToFirstMessage(),
      messagesPerMinute,
      toolRequestsPerSession,
      errorRate,
    };
  }

  private getCurrentContext(): string {
    const path = window.location.pathname;
    if (path.includes('/models')) return 'models';
    if (path.includes('/analysis')) return 'analysis';
    if (path.includes('/amortization')) return 'amortization';
    if (path.includes('/lease')) return 'lease';
    return 'general';
  }

  private getAverageMessageLength(): number {
    const messageMetrics = this.metrics.filter((m) => m.type === 'message_sent');
    if (messageMetrics.length === 0) return 0;

    const totalLength = messageMetrics.reduce((sum, m) => {
      return sum + ((m.data.messageLength as number) || 0);
    }, 0);

    return totalLength / messageMetrics.length;
  }

  private getTimeToFirstMessage(): number {
    const firstMessage = this.metrics.find((m) => m.type === 'message_sent');
    if (!firstMessage) return 0;

    return firstMessage.timestamp.getTime() - this.startTime.getTime();
  }

  private async sendAnalytics(): Promise<void> {
    try {
      const analytics = this.getAnalytics();
      const behaviorMetrics = this.getUserBehaviorMetrics();

      // Send to analytics endpoint
      await fetch('/api/v1/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analytics,
          behaviorMetrics,
          performanceMetrics: this.performanceMetrics.slice(-50), // Send last 50 performance metrics
          recentMetrics: this.metrics.slice(-100), // Send last 100 general metrics
        }),
      });
    } catch (error) {
      console.warn('Failed to send chat analytics:', error);
    }
  }

  public exportMetrics(): string {
    return JSON.stringify(
      {
        analytics: this.getAnalytics(),
        behaviorMetrics: this.getUserBehaviorMetrics(),
        performanceMetrics: this.performanceMetrics,
        metrics: this.metrics,
      },
      null,
      2
    );
  }

  public clearMetrics(): void {
    this.metrics = [];
    this.performanceMetrics = [];
    this.toolUsage = {};
    this.errorCount = 0;
    this.contextSwitches = 0;
    this.messageCount = 0;
  }
}

// Global analytics instance
let analyticsCollector: ChatAnalyticsCollector | null = null;

export function initializeChatAnalytics(sessionId?: string): ChatAnalyticsCollector {
  if (analyticsCollector) {
    return analyticsCollector;
  }

  analyticsCollector = new ChatAnalyticsCollector(sessionId);
  return analyticsCollector;
}

export function getChatAnalytics(): ChatAnalyticsCollector | null {
  return analyticsCollector;
}

export function trackChatEvent(type: ChatMetrics['type'], data: Record<string, unknown>): void {
  if (analyticsCollector) {
    analyticsCollector.trackMetric(type, data);
  }
}

export function trackChatPerformance(metrics: PerformanceMetrics): void {
  if (analyticsCollector) {
    analyticsCollector.trackPerformance(metrics);
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static activeTimers: Map<string, number> = new Map();

  static startTimer(operation: string): void {
    this.activeTimers.set(operation, Date.now());
  }

  static endTimer(operation: string): number | null {
    const startTime = this.activeTimers.get(operation);
    if (!startTime) return null;

    const duration = Date.now() - startTime;
    this.activeTimers.delete(operation);

    // Track performance metric
    trackChatPerformance({
      messageId: operation,
      requestTime: new Date(startTime),
      responseTime: new Date(),
      duration,
      success: true,
      retryCount: 0,
    });

    return duration;
  }

  static async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    this.startTimer(operation);
    try {
      return await fn();
    } finally {
      this.endTimer(operation);
    }
  }
}

// Error tracking utilities
export class ErrorTracker {
  static trackError(error: Error, context?: string): void {
    const errorData = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Track in analytics
    trackChatEvent('error_occurred', errorData);

    // Send to error reporting service
    this.reportError(errorData);
  }

  private static async reportError(errorData: Record<string, unknown>): Promise<void> {
    try {
      await fetch('/api/v1/errors/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  }
}

// Usage analytics dashboard data
export interface ChatDashboardData {
  totalSessions: number;
  averageSessionDuration: number;
  totalMessages: number;
  mostUsedTools: Array<{ name: string; count: number }>;
  errorRate: number;
  userSatisfaction: number;
  contextDistribution: Record<string, number>;
  performanceMetrics: {
    averageResponseTime: number;
    cacheHitRate: number;
    retryRate: number;
  };
}

export async function getChatDashboardData(
  timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
): Promise<ChatDashboardData> {
  try {
    const response = await fetch(`/api/v1/analytics/chat/dashboard?range=${timeRange}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch chat dashboard data:', error);
    throw error;
  }
}
