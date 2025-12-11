/**
 * SEO Analytics Dashboard
 * Comprehensive SEO monitoring and reporting system
 */

export interface SEOAnalytics {
  timestamp: Date;
  url: string;
  title: string;
  metaDescription: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  imageCount: number;
  imageAltCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  wordCount: number;
  readingTime: number;
  structuredDataCount: number;
  canonicalUrl: string;
  robotsMeta: string;
  socialMediaTags: {
    openGraph: boolean;
    twitterCard: boolean;
    linkedin: boolean;
    pinterest: boolean;
  };
  performance: {
    pageLoadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    cumulativeLayoutShift: number;
  };
  accessibility: {
    altTextCoverage: number;
    headingStructure: boolean;
    skipLinks: boolean;
    ariaLabels: number;
    colorContrast: 'good' | 'needs-improvement' | 'poor';
  };
  mobileOptimization: {
    viewportMeta: boolean;
    touchTargets: boolean;
    responsiveImages: boolean;
    mobileFriendly: boolean;
  };
  security: {
    https: boolean;
    securityHeaders: string[];
    cspPresent: boolean;
    xssProtection: boolean;
  };
  seoScore: number;
  recommendations: string[];
}

export interface SEOReport {
  url: string;
  timestamp: Date;
  overallScore: number;
  categoryScores: {
    technical: number;
    content: number;
    performance: number;
    accessibility: number;
    mobile: number;
    security: number;
  };
  issues: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
  trends: {
    scoreChange: number;
    performanceChange: number;
    contentChange: number;
  };
}

class SEOAnalyticsCollector {
  private reports: SEOReport[] = [];
  private currentAnalytics: Partial<SEOAnalytics> = {};

  async analyzePage(url: string = window.location.href): Promise<SEOAnalytics> {
    const analytics: SEOAnalytics = {
      timestamp: new Date(),
      url,
      title: document.title,
      metaDescription: this.getMetaDescription(),
      h1Count: document.querySelectorAll('h1').length,
      h2Count: document.querySelectorAll('h2').length,
      h3Count: document.querySelectorAll('h3').length,
      imageCount: document.querySelectorAll('img').length,
      imageAltCount: document.querySelectorAll('img[alt]').length,
      internalLinkCount: this.countInternalLinks(),
      externalLinkCount: this.countExternalLinks(),
      wordCount: this.countWords(),
      readingTime: this.calculateReadingTime(),
      structuredDataCount: this.countStructuredData(),
      canonicalUrl: this.getCanonicalUrl(),
      robotsMeta: this.getRobotsMeta(),
      socialMediaTags: this.analyzeSocialMediaTags(),
      performance: await this.analyzePerformance(),
      accessibility: this.analyzeAccessibility(),
      mobileOptimization: this.analyzeMobileOptimization(),
      security: this.analyzeSecurity(),
      seoScore: 0, // Will be calculated
      recommendations: [], // Will be generated
    };

    analytics.seoScore = this.calculateSEOScore(analytics);
    analytics.recommendations = this.generateRecommendations(analytics);

    this.currentAnalytics = analytics;
    return analytics;
  }

  private getMetaDescription(): string {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc?.getAttribute('content') || '';
  }

  private countInternalLinks(): number {
    const links = document.querySelectorAll('a[href]');
    const currentDomain = window.location.hostname;
    let count = 0;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('/') || href.includes(currentDomain))) {
        count++;
      }
    });

    return count;
  }

  private countExternalLinks(): number {
    const links = document.querySelectorAll('a[href]');
    const currentDomain = window.location.hostname;
    let count = 0;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('http') && !href.includes(currentDomain)) {
        count++;
      }
    });

    return count;
  }

  private countWords(): number {
    const textContent = document.body.textContent || '';
    return textContent.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private calculateReadingTime(): number {
    const wordsPerMinute = 200;
    return Math.ceil(this.countWords() / wordsPerMinute);
  }

  private countStructuredData(): number {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    return scripts.length;
  }

  private getCanonicalUrl(): string {
    const canonical = document.querySelector('link[rel="canonical"]');
    return canonical?.getAttribute('href') || '';
  }

  private getRobotsMeta(): string {
    const robots = document.querySelector('meta[name="robots"]');
    return robots?.getAttribute('content') || '';
  }

  private analyzeSocialMediaTags(): SEOAnalytics['socialMediaTags'] {
    return {
      openGraph: document.querySelector('meta[property^="og:"]') !== null,
      twitterCard: document.querySelector('meta[name^="twitter:"]') !== null,
      linkedin: document.querySelector('meta[name="linkedin:owner"]') !== null,
      pinterest: document.querySelector('meta[name="pinterest-rich-pin"]') !== null,
    };
  }

  private async analyzePerformance(): Promise<SEOAnalytics['performance']> {
    return new Promise((resolve) => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;

      resolve({
        pageLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstContentfulPaint: this.getMetricValue('first-contentful-paint'),
        largestContentfulPaint: this.getMetricValue('largest-contentful-paint'),
        cumulativeLayoutShift: this.getMetricValue('layout-shift'),
      });
    });
  }

  private getMetricValue(metricName: string): number {
    const entries = performance.getEntriesByName(metricName);
    return entries.length > 0 ? entries[0].startTime : 0;
  }

  private analyzeAccessibility(): SEOAnalytics['accessibility'] {
    const images = document.querySelectorAll('img');
    const altTextCoverage =
      images.length > 0 ? (this.currentAnalytics.imageAltCount || 0) / images.length : 1;

    return {
      altTextCoverage,
      headingStructure: this.checkHeadingStructure(),
      skipLinks: document.querySelector('a[href^="#"]') !== null,
      ariaLabels: document.querySelectorAll('[aria-label], [aria-labelledby]').length,
      colorContrast: this.checkColorContrast(),
    };
  }

  private checkHeadingStructure(): boolean {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        return false;
      }
      previousLevel = level;
    }

    return true;
  }

  private checkColorContrast(): 'good' | 'needs-improvement' | 'poor' {
    // Simplified color contrast check
    // In a real implementation, you'd use a library like axe-core
    return 'good';
  }

  private analyzeMobileOptimization(): SEOAnalytics['mobileOptimization'] {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
    const responsiveImages = document.querySelectorAll('img[srcset], img[sizes]');

    return {
      viewportMeta: viewportMeta !== null,
      touchTargets: Array.from(touchTargets).every((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width >= 44 && rect.height >= 44;
      }),
      responsiveImages: responsiveImages.length > 0,
      mobileFriendly: viewportMeta !== null && responsiveImages.length > 0,
    };
  }

  private analyzeSecurity(): SEOAnalytics['security'] {
    const securityHeaders: string[] = [];
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const xssMeta = document.querySelector('meta[http-equiv="X-XSS-Protection"]');

    if (cspMeta) securityHeaders.push('CSP');
    if (xssMeta) securityHeaders.push('XSS-Protection');

    return {
      https: window.location.protocol === 'https:',
      securityHeaders,
      cspPresent: cspMeta !== null,
      xssProtection: xssMeta !== null,
    };
  }

  private calculateSEOScore(analytics: SEOAnalytics): number {
    let score = 0;
    let maxScore = 0;

    // Technical SEO (25 points)
    maxScore += 25;
    if (analytics.title.length > 0) score += 5;
    if (analytics.metaDescription.length > 0) score += 5;
    if (analytics.canonicalUrl.length > 0) score += 5;
    if (analytics.robotsMeta.includes('index')) score += 5;
    if (analytics.structuredDataCount > 0) score += 5;

    // Content Quality (25 points)
    maxScore += 25;
    if (analytics.h1Count === 1) score += 5;
    if (analytics.h2Count > 0) score += 5;
    if (analytics.wordCount > 300) score += 5;
    if (analytics.internalLinkCount > 0) score += 5;
    if (analytics.imageAltCount / analytics.imageCount > 0.8) score += 5;

    // Performance (20 points)
    maxScore += 20;
    if (analytics.performance.pageLoadTime < 3000) score += 5;
    if (analytics.performance.firstContentfulPaint < 1800) score += 5;
    if (analytics.performance.largestContentfulPaint < 2500) score += 5;
    if (analytics.performance.cumulativeLayoutShift < 0.1) score += 5;

    // Accessibility (15 points)
    maxScore += 15;
    if (analytics.accessibility.altTextCoverage > 0.8) score += 5;
    if (analytics.accessibility.headingStructure) score += 5;
    if (analytics.accessibility.skipLinks) score += 5;

    // Mobile Optimization (10 points)
    maxScore += 10;
    if (analytics.mobileOptimization.viewportMeta) score += 3;
    if (analytics.mobileOptimization.touchTargets) score += 3;
    if (analytics.mobileOptimization.responsiveImages) score += 4;

    // Security (5 points)
    maxScore += 5;
    if (analytics.security.https) score += 3;
    if (analytics.security.cspPresent) score += 2;

    return Math.round((score / maxScore) * 100);
  }

  private generateRecommendations(analytics: SEOAnalytics): string[] {
    const recommendations: string[] = [];

    if (analytics.title.length === 0) {
      recommendations.push('Add a descriptive title tag');
    }

    if (analytics.metaDescription.length === 0) {
      recommendations.push('Add a meta description');
    }

    if (analytics.h1Count === 0) {
      recommendations.push('Add an H1 heading');
    } else if (analytics.h1Count > 1) {
      recommendations.push('Use only one H1 heading per page');
    }

    if (analytics.imageAltCount / analytics.imageCount < 0.8) {
      recommendations.push('Add alt text to images');
    }

    if (analytics.performance.pageLoadTime > 3000) {
      recommendations.push('Optimize page load time');
    }

    if (analytics.accessibility.altTextCoverage < 0.8) {
      recommendations.push('Improve image accessibility');
    }

    if (!analytics.mobileOptimization.viewportMeta) {
      recommendations.push('Add viewport meta tag for mobile optimization');
    }

    if (!analytics.security.https) {
      recommendations.push('Enable HTTPS');
    }

    return recommendations;
  }

  async generateReport(url: string = window.location.href): Promise<SEOReport> {
    const analytics = await this.analyzePage(url);

    const report: SEOReport = {
      url,
      timestamp: new Date(),
      overallScore: analytics.seoScore,
      categoryScores: {
        technical: this.calculateTechnicalScore(analytics),
        content: this.calculateContentScore(analytics),
        performance: this.calculatePerformanceScore(analytics),
        accessibility: this.calculateAccessibilityScore(analytics),
        mobile: this.calculateMobileScore(analytics),
        security: this.calculateSecurityScore(analytics),
      },
      issues: this.identifyIssues(analytics),
      recommendations: analytics.recommendations,
      trends: {
        scoreChange: 0, // Would compare with previous reports
        performanceChange: 0,
        contentChange: 0,
      },
    };

    this.reports.push(report);
    return report;
  }

  private calculateTechnicalScore(analytics: SEOAnalytics): number {
    let score = 0;
    if (analytics.title.length > 0) score += 20;
    if (analytics.metaDescription.length > 0) score += 20;
    if (analytics.canonicalUrl.length > 0) score += 20;
    if (analytics.structuredDataCount > 0) score += 20;
    if (analytics.robotsMeta.includes('index')) score += 20;
    return score;
  }

  private calculateContentScore(analytics: SEOAnalytics): number {
    let score = 0;
    if (analytics.h1Count === 1) score += 25;
    if (analytics.wordCount > 300) score += 25;
    if (analytics.internalLinkCount > 0) score += 25;
    if (analytics.imageAltCount / analytics.imageCount > 0.8) score += 25;
    return score;
  }

  private calculatePerformanceScore(analytics: SEOAnalytics): number {
    let score = 0;
    if (analytics.performance.pageLoadTime < 3000) score += 25;
    if (analytics.performance.firstContentfulPaint < 1800) score += 25;
    if (analytics.performance.largestContentfulPaint < 2500) score += 25;
    if (analytics.performance.cumulativeLayoutShift < 0.1) score += 25;
    return score;
  }

  private calculateAccessibilityScore(analytics: SEOAnalytics): number {
    let score = 0;
    if (analytics.accessibility.altTextCoverage > 0.8) score += 33;
    if (analytics.accessibility.headingStructure) score += 33;
    if (analytics.accessibility.skipLinks) score += 34;
    return score;
  }

  private calculateMobileScore(analytics: SEOAnalytics): number {
    let score = 0;
    if (analytics.mobileOptimization.viewportMeta) score += 33;
    if (analytics.mobileOptimization.touchTargets) score += 33;
    if (analytics.mobileOptimization.responsiveImages) score += 34;
    return score;
  }

  private calculateSecurityScore(analytics: SEOAnalytics): number {
    let score = 0;
    if (analytics.security.https) score += 50;
    if (analytics.security.cspPresent) score += 50;
    return score;
  }

  private identifyIssues(analytics: SEOAnalytics): SEOReport['issues'] {
    const issues: SEOReport['issues'] = [];

    if (analytics.title.length === 0) {
      issues.push({
        type: 'error',
        message: 'Missing title tag',
        category: 'technical',
        impact: 'high',
      });
    }

    if (analytics.metaDescription.length === 0) {
      issues.push({
        type: 'warning',
        message: 'Missing meta description',
        category: 'technical',
        impact: 'medium',
      });
    }

    if (analytics.h1Count === 0) {
      issues.push({
        type: 'error',
        message: 'Missing H1 heading',
        category: 'content',
        impact: 'high',
      });
    }

    if (analytics.imageAltCount / analytics.imageCount < 0.8) {
      issues.push({
        type: 'warning',
        message: 'Images missing alt text',
        category: 'accessibility',
        impact: 'medium',
      });
    }

    if (analytics.performance.pageLoadTime > 3000) {
      issues.push({
        type: 'warning',
        message: 'Slow page load time',
        category: 'performance',
        impact: 'medium',
      });
    }

    return issues;
  }

  getReports(): SEOReport[] {
    return [...this.reports];
  }

  getLatestReport(): SEOReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  async exportReport(format: 'json' | 'csv' = 'json'): Promise<string> {
    const report = await this.generateReport();

    if (format === 'csv') {
      return this.convertToCSV(report);
    }

    return JSON.stringify(report, null, 2);
  }

  private convertToCSV(report: SEOReport): string {
    const headers = [
      'URL',
      'Score',
      'Technical',
      'Content',
      'Performance',
      'Accessibility',
      'Mobile',
      'Security',
    ];
    const row = [
      report.url,
      report.overallScore,
      report.categoryScores.technical,
      report.categoryScores.content,
      report.categoryScores.performance,
      report.categoryScores.accessibility,
      report.categoryScores.mobile,
      report.categoryScores.security,
    ];

    return [headers.join(','), row.join(',')].join('\n');
  }
}

// Global instance
let seoAnalytics: SEOAnalyticsCollector | null = null;

export function initializeSEOAnalytics(): SEOAnalyticsCollector {
  if (!seoAnalytics) {
    seoAnalytics = new SEOAnalyticsCollector();
  }
  return seoAnalytics;
}

export function getSEOAnalytics(): SEOAnalyticsCollector | null {
  return seoAnalytics;
}

// Initialize when the script loads
if (typeof window !== 'undefined') {
  initializeSEOAnalytics();
}
