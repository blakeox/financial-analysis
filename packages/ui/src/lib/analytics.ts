/**
 * Client-side analytics tracking for page interactions and API results
 * Integrates with Cloudflare Analytics Engine via API endpoint
 */

export interface PageInteractionEvent {
  type: 'page_view' | 'form_submit' | 'api_call' | 'api_result' | 'error' | 'user_action';
  page: string;
  action?: string;
  metadata?: Record<string, unknown>;
  timestamp: number;
}

export interface ApiCallEvent {
  endpoint: string;
  method: string;
  statusCode?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  cacheHit?: boolean;
  success: boolean;
  errorMessage?: string;
}

export interface UserActionEvent {
  action: string;
  element?: string;
  value?: string | number;
  context?: Record<string, unknown>;
}

export interface FormAnalytics {
  formId: string;
  fieldsCompleted: number;
  totalFields: number;
  validationErrors: string[];
  timeToComplete: number;
  abandonedAt?: string;
}

export interface PageAnalytics {
  path: string;
  referrer: string;
  sessionId: string;
  visitorId: string;
  timeOnPage: number;
  scrollDepth: number;
  interactionCount: number;
}

class AnalyticsTracker {
  private apiBase: string;
  private sessionId: string;
  private visitorId: string;
  private pageLoadTime: number;
  private interactions: number = 0;
  private maxScrollDepth: number = 0;
  private enabled: boolean = true;
  private eventQueue: PageInteractionEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private flushTimer?: number;

  constructor(apiBase?: string) {
    this.apiBase = apiBase || this.detectApiBase();
    this.sessionId = this.getOrCreateSessionId();
    this.visitorId = this.getOrCreateVisitorId();
    this.pageLoadTime = Date.now();

    // Auto-track page view
    this.trackPageView();

    // Track scroll depth
    this.setupScrollTracking();

    // Track page unload
    this.setupUnloadTracking();

    // Start flush timer
    this.startFlushTimer();
  }

  private detectApiBase(): string {
    if (typeof window === 'undefined') return '';

    // Check environment variable first
    const envBase = (window as { __PUBLIC_API_BASE_URL__?: string }).__PUBLIC_API_BASE_URL__;
    if (envBase) return envBase;

    // Default to current origin in production, localhost in dev
    return window.location.hostname === 'localhost'
      ? 'http://127.0.0.1:8787'
      : window.location.origin;
  }

  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return 'ssr-session';

    const key = 'fanalyx_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
      sessionId = `sess_${crypto.randomUUID()}`;
      sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
  }

  private getOrCreateVisitorId(): string {
    if (typeof window === 'undefined') return 'ssr-visitor';

    const key = 'fanalyx_visitor_id';
    let visitorId = localStorage.getItem(key);
    if (!visitorId) {
      visitorId = `vis_${crypto.randomUUID()}`;
      localStorage.setItem(key, visitorId);
    }
    return visitorId;
  }

  private setupScrollTracking(): void {
    if (typeof window === 'undefined') return;

    const updateScrollDepth = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const scrollPercent = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);

      if (scrollPercent > this.maxScrollDepth) {
        this.maxScrollDepth = scrollPercent;
      }
    };

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    updateScrollDepth(); // Initial measurement
  }

  private setupUnloadTracking(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeunload', () => {
      this.trackPageUnload();
      this.flush(true); // Synchronous flush on unload
    });
  }

  private startFlushTimer(): void {
    if (typeof window === 'undefined') return;

    this.flushTimer = window.setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush(synchronous: boolean = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const payload = {
      sessionId: this.sessionId,
      visitorId: this.visitorId,
      events,
    };

    try {
      if (synchronous && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        // Use sendBeacon for synchronous unload tracking
        navigator.sendBeacon(`${this.apiBase}/v1/api/analytics/events`, JSON.stringify(payload));
      } else {
        // Standard async fetch
        await fetch(`${this.apiBase}/v1/api/analytics/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // Don't wait for response to avoid blocking
          keepalive: true,
        }).catch(() => {
          // Silently fail - analytics shouldn't break app
        });
      }
    } catch (error) {
      // Silently fail - analytics shouldn't break app
      console.debug('Analytics flush failed:', error);
    }
  }

  private queueEvent(event: PageInteractionEvent): void {
    if (!this.enabled) return;

    this.eventQueue.push(event);

    // Flush immediately for critical events
    if (event.type === 'error' || event.type === 'api_result') {
      this.flush();
    }
  }

  public trackPageView(): void {
    if (typeof window === 'undefined') return;

    const event: PageInteractionEvent = {
      type: 'page_view',
      page: window.location.pathname,
      metadata: {
        referrer: document.referrer,
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        userAgent: navigator.userAgent,
      },
      timestamp: Date.now(),
    };

    this.queueEvent(event);
  }

  public trackPageUnload(): void {
    if (typeof window === 'undefined') return;

    const timeOnPage = Date.now() - this.pageLoadTime;

    const event: PageInteractionEvent = {
      type: 'user_action',
      page: window.location.pathname,
      action: 'page_unload',
      metadata: {
        timeOnPage,
        scrollDepth: this.maxScrollDepth,
        interactionCount: this.interactions,
      },
      timestamp: Date.now(),
    };

    this.queueEvent(event);
  }

  public trackFormSubmit(analytics: FormAnalytics): void {
    this.interactions++;

    const event: PageInteractionEvent = {
      type: 'form_submit',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      action: analytics.formId,
      metadata: {
        ...analytics,
        completionRate: (analytics.fieldsCompleted / analytics.totalFields) * 100,
      },
      timestamp: Date.now(),
    };

    this.queueEvent(event);
  }

  public trackApiCall(callEvent: ApiCallEvent): void {
    this.interactions++;

    const event: PageInteractionEvent = {
      type: callEvent.success ? 'api_result' : 'error',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      action: `${callEvent.method} ${callEvent.endpoint}`,
      metadata: { ...callEvent },
      timestamp: Date.now(),
    };

    this.queueEvent(event);
  }

  public trackUserAction(actionEvent: UserActionEvent): void {
    this.interactions++;

    const event: PageInteractionEvent = {
      type: 'user_action',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      action: actionEvent.action,
      metadata: { ...actionEvent },
      timestamp: Date.now(),
    };

    this.queueEvent(event);
  }

  public trackError(error: Error, context?: Record<string, unknown>): void {
    const event: PageInteractionEvent = {
      type: 'error',
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      action: 'error',
      metadata: {
        message: error.message,
        ...context,
      },
      timestamp: Date.now(),
    };

    this.queueEvent(event);
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
  }
}

// Singleton instance
let trackerInstance: AnalyticsTracker | null = null;

export function initAnalytics(apiBase?: string): AnalyticsTracker {
  if (!trackerInstance) {
    trackerInstance = new AnalyticsTracker(apiBase);
  }
  return trackerInstance;
}

export function getAnalytics(): AnalyticsTracker | null {
  return trackerInstance;
}

export function trackPageView(): void {
  trackerInstance?.trackPageView();
}

export function trackFormSubmit(analytics: FormAnalytics): void {
  trackerInstance?.trackFormSubmit(analytics);
}

export function trackApiCall(callEvent: ApiCallEvent): void {
  trackerInstance?.trackApiCall(callEvent);
}

export function trackUserAction(actionEvent: UserActionEvent): void {
  trackerInstance?.trackUserAction(actionEvent);
}

export function trackError(error: Error, context?: Record<string, unknown>): void {
  trackerInstance?.trackError(error, context);
}
