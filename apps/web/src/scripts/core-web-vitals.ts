/**
 * Core Web Vitals Monitoring and Optimization
 * Advanced performance tracking for SEO and user experience
 */

export interface WebVitalsMetrics {
  // Core Web Vitals
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte

  // Additional metrics
  tbt: number; // Total Blocking Time
  si: number; // Speed Index
  fmp: number; // First Meaningful Paint

  // Custom metrics
  pageLoadTime: number;
  domContentLoaded: number;
  resourceLoadTime: number;
  jsExecutionTime: number;
}

export interface PerformanceReport {
  timestamp: Date;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  metrics: WebVitalsMetrics;
  score: {
    lcp: 'good' | 'needs-improvement' | 'poor';
    fid: 'good' | 'needs-improvement' | 'poor';
    cls: 'good' | 'needs-improvement' | 'poor';
    overall: 'good' | 'needs-improvement' | 'poor';
  };
  recommendations: string[];
}

class CoreWebVitalsMonitor {
  private metrics: Partial<WebVitalsMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private reportCallback?: (report: PerformanceReport) => void;
  private isMonitoring = false;

  constructor(reportCallback?: (report: PerformanceReport) => void) {
    this.reportCallback = reportCallback;
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor LCP (Largest Contentful Paint)
    this.observeLCP();

    // Monitor FID (First Input Delay)
    this.observeFID();

    // Monitor CLS (Cumulative Layout Shift)
    this.observeCLS();

    // Monitor FCP (First Contentful Paint)
    this.observeFCP();

    // Monitor TTFB (Time to First Byte)
    this.observeTTFB();

    // Monitor additional metrics
    this.observeAdditionalMetrics();

    // Report metrics when page is about to unload
    window.addEventListener('beforeunload', () => {
      this.generateReport();
    });

    // Report metrics after a delay for single-page apps
    setTimeout(() => {
      this.generateReport();
    }, 10000);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { element?: Element };

      this.metrics.lcp = lastEntry.startTime;

      // Log LCP element for debugging
      if (lastEntry.element) {
        console.log('LCP element:', lastEntry.element);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
    this.observers.push(observer);
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.fid = entry.processingStart - entry.startTime;
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
    this.observers.push(observer);
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.metrics.cls = clsValue;
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.push(observer);
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        this.metrics.fcp = entry.startTime;
      });
    });

    observer.observe({ entryTypes: ['paint'] });
    this.observers.push(observer);
  }

  private observeTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.responseStart > 0) {
          this.metrics.ttfb = entry.responseStart - entry.requestStart;
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  private observeAdditionalMetrics(): void {
    if (!('PerformanceObserver' in window)) return;

    // Monitor Total Blocking Time
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalBlockingTime = 0;

      entries.forEach((entry: any) => {
        if (entry.duration > 50) {
          totalBlockingTime += entry.duration - 50;
        }
      });

      this.metrics.tbt = totalBlockingTime;
    });

    observer.observe({ entryTypes: ['longtask'] });
    this.observers.push(observer);

    // Monitor resource loading
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let totalResourceTime = 0;

      entries.forEach((entry: any) => {
        totalResourceTime += entry.duration;
      });

      this.metrics.resourceLoadTime = totalResourceTime;
    });

    resourceObserver.observe({ entryTypes: ['resource'] });
    this.observers.push(resourceObserver);
  }

  private generateReport(): void {
    if (!this.isMonitoring) return;

    const report: PerformanceReport = {
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory,
      metrics: this.metrics as WebVitalsMetrics,
      score: this.calculateScores(),
      recommendations: this.generateRecommendations(),
    };

    // Send to analytics endpoint
    this.sendToAnalytics(report);

    // Call custom callback if provided
    if (this.reportCallback) {
      this.reportCallback(report);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Core Web Vitals Report:', report);
    }
  }

  private calculateScores(): PerformanceReport['score'] {
    const lcp = this.metrics.lcp || 0;
    const fid = this.metrics.fid || 0;
    const cls = this.metrics.cls || 0;

    const lcpScore = lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor';
    const fidScore = fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor';
    const clsScore = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor';

    const overallScore =
      lcpScore === 'good' && fidScore === 'good' && clsScore === 'good'
        ? 'good'
        : lcpScore === 'poor' || fidScore === 'poor' || clsScore === 'poor'
          ? 'poor'
          : 'needs-improvement';

    return {
      lcp: lcpScore,
      fid: fidScore,
      cls: clsScore,
      overall: overallScore,
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.metrics;

    if (metrics.lcp && metrics.lcp > 2500) {
      recommendations.push(
        'Optimize Largest Contentful Paint: Consider image optimization, preloading critical resources, or reducing server response time'
      );
    }

    if (metrics.fid && metrics.fid > 100) {
      recommendations.push(
        'Reduce First Input Delay: Minimize JavaScript execution time, use code splitting, or defer non-critical scripts'
      );
    }

    if (metrics.cls && metrics.cls > 0.1) {
      recommendations.push(
        'Improve Cumulative Layout Shift: Reserve space for images, avoid inserting content above existing content, or use CSS transforms'
      );
    }

    if (metrics.ttfb && metrics.ttfb > 600) {
      recommendations.push(
        'Optimize Time to First Byte: Improve server response time, use CDN, or optimize database queries'
      );
    }

    if (metrics.tbt && metrics.tbt > 200) {
      recommendations.push(
        'Reduce Total Blocking Time: Break up long tasks, use web workers, or optimize JavaScript execution'
      );
    }

    return recommendations;
  }

  private async sendToAnalytics(report: PerformanceReport): Promise<void> {
    try {
      await fetch('/api/v1/analytics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.warn('Failed to send Web Vitals report:', error);
    }
  }

  getCurrentMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }
}

// Global instance
let webVitalsMonitor: CoreWebVitalsMonitor | null = null;

export function initializeWebVitalsMonitoring(
  reportCallback?: (report: PerformanceReport) => void
): CoreWebVitalsMonitor {
  if (!webVitalsMonitor) {
    webVitalsMonitor = new CoreWebVitalsMonitor(reportCallback);
    webVitalsMonitor.startMonitoring();
  }
  return webVitalsMonitor;
}

export function getWebVitalsMonitor(): CoreWebVitalsMonitor | null {
  return webVitalsMonitor;
}

export function stopWebVitalsMonitoring(): void {
  if (webVitalsMonitor) {
    webVitalsMonitor.stopMonitoring();
    webVitalsMonitor = null;
  }
}

// Utility functions for performance optimization
export function optimizeImages(): void {
  // Lazy load images
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
}

export function preloadCriticalResources(): void {
  // Preload critical CSS
  const criticalCSS = document.querySelector('link[rel="preload"][as="style"]');
  if (criticalCSS) {
    criticalCSS.setAttribute('rel', 'stylesheet');
  }

  // Preload critical fonts
  const criticalFonts = document.querySelectorAll('link[rel="preload"][as="font"]');
  criticalFonts.forEach((font) => {
    font.setAttribute('rel', 'stylesheet');
  });
}

export function optimizeJavaScript(): void {
  // Defer non-critical scripts
  const scripts = document.querySelectorAll('script[data-defer]');
  scripts.forEach((script) => {
    script.setAttribute('defer', '');
  });

  // Use requestIdleCallback for non-critical tasks
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Run non-critical JavaScript here
      console.log('Running non-critical JavaScript during idle time');
    });
  }
}

// Initialize monitoring when the script loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeWebVitalsMonitoring();
      optimizeImages();
      preloadCriticalResources();
      optimizeJavaScript();
    });
  } else {
    initializeWebVitalsMonitoring();
    optimizeImages();
    preloadCriticalResources();
    optimizeJavaScript();
  }
}
