/**
 * SEO Testing and Validation System
 * Comprehensive SEO testing suite for automated validation
 */

export interface SEOTestResult {
  testName: string;
  category: 'technical' | 'content' | 'performance' | 'accessibility' | 'mobile' | 'security';
  status: 'pass' | 'fail' | 'warning' | 'info';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
  value?: string | number;
  expected?: string | number;
}

export interface SEOTestSuite {
  name: string;
  description: string;
  tests: SEOTestResult[];
  overallScore: number;
  passedTests: number;
  failedTests: number;
  warningTests: number;
  timestamp: Date;
}

class SEOTestRunner {
  private tests: Array<() => SEOTestResult> = [];

  constructor() {
    this.registerDefaultTests();
  }

  private registerDefaultTests(): void {
    // Technical SEO Tests
    this.tests.push(() => this.testTitleTag());
    this.tests.push(() => this.testMetaDescription());
    this.tests.push(() => this.testCanonicalUrl());
    this.tests.push(() => this.testRobotsMeta());
    this.tests.push(() => this.testStructuredData());
    this.tests.push(() => this.testOpenGraphTags());
    this.tests.push(() => this.testTwitterCards());
    this.tests.push(() => this.testHreflangTags());

    // Content SEO Tests
    this.tests.push(() => this.testHeadingStructure());
    this.tests.push(() => this.testH1Tag());
    this.tests.push(() => this.testImageAltText());
    this.tests.push(() => this.testInternalLinks());
    this.tests.push(() => this.testWordCount());
    this.tests.push(() => this.testContentQuality());

    // Performance Tests
    this.tests.push(() => this.testPageLoadTime());
    this.tests.push(() => this.testFirstContentfulPaint());
    this.tests.push(() => this.testLargestContentfulPaint());
    this.tests.push(() => this.testCumulativeLayoutShift());
    this.tests.push(() => this.testResourceOptimization());

    // Accessibility Tests
    this.tests.push(() => this.testAltTextCoverage());
    this.tests.push(() => this.testHeadingHierarchy());
    this.tests.push(() => this.testSkipLinks());
    this.tests.push(() => this.testAriaLabels());
    this.tests.push(() => this.testColorContrast());

    // Mobile Optimization Tests
    this.tests.push(() => this.testViewportMeta());
    this.tests.push(() => this.testTouchTargets());
    this.tests.push(() => this.testResponsiveImages());
    this.tests.push(() => this.testMobileFriendly());

    // Security Tests
    this.tests.push(() => this.testHTTPS());
    this.tests.push(() => this.testSecurityHeaders());
    this.tests.push(() => this.testContentSecurityPolicy());
    this.tests.push(() => this.testXSSProtection());
  }

  async runTests(): Promise<SEOTestSuite> {
    const results: SEOTestResult[] = [];

    for (const test of this.tests) {
      try {
        const result = test();
        results.push(result);
      } catch (error) {
        results.push({
          testName: 'Test Execution Error',
          category: 'technical',
          status: 'fail',
          message: `Test failed with error: ${error}`,
          impact: 'high',
        });
      }
    }

    const suite: SEOTestSuite = {
      name: 'SEO Test Suite',
      description: 'Comprehensive SEO validation tests',
      tests: results,
      overallScore: this.calculateOverallScore(results),
      passedTests: results.filter((r) => r.status === 'pass').length,
      failedTests: results.filter((r) => r.status === 'fail').length,
      warningTests: results.filter((r) => r.status === 'warning').length,
      timestamp: new Date(),
    };

    return suite;
  }

  private calculateOverallScore(results: SEOTestResult[]): number {
    if (results.length === 0) return 0;

    let totalScore = 0;
    let maxScore = 0;

    results.forEach((result) => {
      const weight = this.getTestWeight(result.impact);
      maxScore += weight;

      switch (result.status) {
        case 'pass':
          totalScore += weight;
          break;
        case 'warning':
          totalScore += weight * 0.5;
          break;
        case 'fail':
          totalScore += 0;
          break;
        case 'info':
          totalScore += weight * 0.8;
          break;
      }
    });

    return Math.round((totalScore / maxScore) * 100);
  }

  private getTestWeight(impact: 'high' | 'medium' | 'low'): number {
    switch (impact) {
      case 'high':
        return 3;
      case 'medium':
        return 2;
      case 'low':
        return 1;
      default:
        return 1;
    }
  }

  // Technical SEO Tests
  private testTitleTag(): SEOTestResult {
    const title = document.title;
    const titleLength = title.length;

    if (titleLength === 0) {
      return {
        testName: 'Title Tag Present',
        category: 'technical',
        status: 'fail',
        message: 'No title tag found',
        impact: 'high',
        fix: 'Add a descriptive title tag',
      };
    }

    if (titleLength < 30) {
      return {
        testName: 'Title Tag Length',
        category: 'technical',
        status: 'warning',
        message: 'Title tag is too short',
        impact: 'medium',
        value: titleLength,
        expected: '30-60 characters',
        fix: 'Increase title tag length to 30-60 characters',
      };
    }

    if (titleLength > 60) {
      return {
        testName: 'Title Tag Length',
        category: 'technical',
        status: 'warning',
        message: 'Title tag is too long',
        impact: 'medium',
        value: titleLength,
        expected: '30-60 characters',
        fix: 'Reduce title tag length to 30-60 characters',
      };
    }

    return {
      testName: 'Title Tag',
      category: 'technical',
      status: 'pass',
      message: 'Title tag is properly configured',
      impact: 'high',
      value: titleLength,
    };
  }

  private testMetaDescription(): SEOTestResult {
    const metaDesc = document.querySelector('meta[name="description"]');
    const description = metaDesc?.getAttribute('content') || '';
    const descLength = description.length;

    if (descLength === 0) {
      return {
        testName: 'Meta Description Present',
        category: 'technical',
        status: 'fail',
        message: 'No meta description found',
        impact: 'high',
        fix: 'Add a descriptive meta description',
      };
    }

    if (descLength < 120) {
      return {
        testName: 'Meta Description Length',
        category: 'technical',
        status: 'warning',
        message: 'Meta description is too short',
        impact: 'medium',
        value: descLength,
        expected: '120-160 characters',
        fix: 'Increase meta description length to 120-160 characters',
      };
    }

    if (descLength > 160) {
      return {
        testName: 'Meta Description Length',
        category: 'technical',
        status: 'warning',
        message: 'Meta description is too long',
        impact: 'medium',
        value: descLength,
        expected: '120-160 characters',
        fix: 'Reduce meta description length to 120-160 characters',
      };
    }

    return {
      testName: 'Meta Description',
      category: 'technical',
      status: 'pass',
      message: 'Meta description is properly configured',
      impact: 'high',
      value: descLength,
    };
  }

  private testCanonicalUrl(): SEOTestResult {
    const canonical = document.querySelector('link[rel="canonical"]');
    const canonicalUrl = canonical?.getAttribute('href') || '';

    if (canonicalUrl.length === 0) {
      return {
        testName: 'Canonical URL',
        category: 'technical',
        status: 'fail',
        message: 'No canonical URL found',
        impact: 'high',
        fix: 'Add a canonical URL to prevent duplicate content issues',
      };
    }

    return {
      testName: 'Canonical URL',
      category: 'technical',
      status: 'pass',
      message: 'Canonical URL is present',
      impact: 'high',
      value: canonicalUrl,
    };
  }

  private testRobotsMeta(): SEOTestResult {
    const robots = document.querySelector('meta[name="robots"]');
    const robotsContent = robots?.getAttribute('content') || '';

    if (robotsContent.length === 0) {
      return {
        testName: 'Robots Meta Tag',
        category: 'technical',
        status: 'warning',
        message: 'No robots meta tag found',
        impact: 'medium',
        fix: 'Add robots meta tag for better crawl control',
      };
    }

    if (robotsContent.includes('noindex')) {
      return {
        testName: 'Robots Meta Tag',
        category: 'technical',
        status: 'warning',
        message: 'Page is set to noindex',
        impact: 'high',
        value: robotsContent,
        fix: 'Remove noindex if you want this page to be indexed',
      };
    }

    return {
      testName: 'Robots Meta Tag',
      category: 'technical',
      status: 'pass',
      message: 'Robots meta tag is properly configured',
      impact: 'medium',
      value: robotsContent,
    };
  }

  private testStructuredData(): SEOTestResult {
    const structuredData = document.querySelectorAll('script[type="application/ld+json"]');
    const count = structuredData.length;

    if (count === 0) {
      return {
        testName: 'Structured Data',
        category: 'technical',
        status: 'warning',
        message: 'No structured data found',
        impact: 'medium',
        fix: 'Add structured data to improve search results',
      };
    }

    return {
      testName: 'Structured Data',
      category: 'technical',
      status: 'pass',
      message: 'Structured data is present',
      impact: 'medium',
      value: count,
    };
  }

  private testOpenGraphTags(): SEOTestResult {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');

    const hasRequiredTags = ogTitle && ogDescription && ogImage;

    if (!hasRequiredTags) {
      return {
        testName: 'Open Graph Tags',
        category: 'technical',
        status: 'warning',
        message: 'Missing required Open Graph tags',
        impact: 'medium',
        fix: 'Add og:title, og:description, and og:image tags',
      };
    }

    return {
      testName: 'Open Graph Tags',
      category: 'technical',
      status: 'pass',
      message: 'Open Graph tags are present',
      impact: 'medium',
    };
  }

  private testTwitterCards(): SEOTestResult {
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');

    const hasRequiredTags = twitterCard && twitterTitle && twitterDescription;

    if (!hasRequiredTags) {
      return {
        testName: 'Twitter Cards',
        category: 'technical',
        status: 'warning',
        message: 'Missing required Twitter Card tags',
        impact: 'low',
        fix: 'Add twitter:card, twitter:title, and twitter:description tags',
      };
    }

    return {
      testName: 'Twitter Cards',
      category: 'technical',
      status: 'pass',
      message: 'Twitter Card tags are present',
      impact: 'low',
    };
  }

  private testHreflangTags(): SEOTestResult {
    const hreflangTags = document.querySelectorAll('link[hreflang]');
    const count = hreflangTags.length;

    if (count === 0) {
      return {
        testName: 'Hreflang Tags',
        category: 'technical',
        status: 'info',
        message: 'No hreflang tags found',
        impact: 'low',
        fix: 'Add hreflang tags if you have multiple language versions',
      };
    }

    return {
      testName: 'Hreflang Tags',
      category: 'technical',
      status: 'pass',
      message: 'Hreflang tags are present',
      impact: 'low',
      value: count,
    };
  }

  // Content SEO Tests
  private testHeadingStructure(): SEOTestResult {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let isValid = true;

    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        isValid = false;
        break;
      }
      previousLevel = level;
    }

    if (!isValid) {
      return {
        testName: 'Heading Structure',
        category: 'content',
        status: 'fail',
        message: 'Heading structure is invalid',
        impact: 'high',
        fix: 'Ensure headings follow proper hierarchy (H1 > H2 > H3, etc.)',
      };
    }

    return {
      testName: 'Heading Structure',
      category: 'content',
      status: 'pass',
      message: 'Heading structure is valid',
      impact: 'high',
    };
  }

  private testH1Tag(): SEOTestResult {
    const h1Tags = document.querySelectorAll('h1');
    const count = h1Tags.length;

    if (count === 0) {
      return {
        testName: 'H1 Tag',
        category: 'content',
        status: 'fail',
        message: 'No H1 tag found',
        impact: 'high',
        fix: 'Add an H1 tag to define the main heading',
      };
    }

    if (count > 1) {
      return {
        testName: 'H1 Tag',
        category: 'content',
        status: 'warning',
        message: 'Multiple H1 tags found',
        impact: 'medium',
        value: count,
        expected: 1,
        fix: 'Use only one H1 tag per page',
      };
    }

    return {
      testName: 'H1 Tag',
      category: 'content',
      status: 'pass',
      message: 'H1 tag is properly configured',
      impact: 'high',
      value: count,
    };
  }

  private testImageAltText(): SEOTestResult {
    const images = document.querySelectorAll('img');
    const imagesWithAlt = document.querySelectorAll('img[alt]');
    const totalImages = images.length;
    const altCoverage = totalImages > 0 ? imagesWithAlt.length / totalImages : 1;

    if (altCoverage < 0.8) {
      return {
        testName: 'Image Alt Text',
        category: 'content',
        status: 'warning',
        message: 'Some images are missing alt text',
        impact: 'medium',
        value: `${Math.round(altCoverage * 100)}%`,
        expected: '80%+',
        fix: 'Add alt text to images for better accessibility',
      };
    }

    return {
      testName: 'Image Alt Text',
      category: 'content',
      status: 'pass',
      message: 'Image alt text coverage is good',
      impact: 'medium',
      value: `${Math.round(altCoverage * 100)}%`,
    };
  }

  private testInternalLinks(): SEOTestResult {
    const links = document.querySelectorAll('a[href]');
    const currentDomain = window.location.hostname;
    let internalCount = 0;

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.startsWith('/') || href.includes(currentDomain))) {
        internalCount++;
      }
    });

    if (internalCount === 0) {
      return {
        testName: 'Internal Links',
        category: 'content',
        status: 'warning',
        message: 'No internal links found',
        impact: 'medium',
        fix: 'Add internal links to improve site structure',
      };
    }

    return {
      testName: 'Internal Links',
      category: 'content',
      status: 'pass',
      message: 'Internal links are present',
      impact: 'medium',
      value: internalCount,
    };
  }

  private testWordCount(): SEOTestResult {
    const textContent = document.body.textContent || '';
    const wordCount = textContent.split(/\s+/).filter((word) => word.length > 0).length;

    if (wordCount < 300) {
      return {
        testName: 'Word Count',
        category: 'content',
        status: 'warning',
        message: 'Content is too short',
        impact: 'medium',
        value: wordCount,
        expected: '300+ words',
        fix: 'Add more content to improve SEO value',
      };
    }

    return {
      testName: 'Word Count',
      category: 'content',
      status: 'pass',
      message: 'Content length is adequate',
      impact: 'medium',
      value: wordCount,
    };
  }

  private testContentQuality(): SEOTestResult {
    const textContent = document.body.textContent || '';
    const wordCount = textContent.split(/\s+/).filter((word) => word.length > 0).length;
    const sentences = textContent.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

    if (avgWordsPerSentence > 20) {
      return {
        testName: 'Content Quality',
        category: 'content',
        status: 'warning',
        message: 'Sentences are too long',
        impact: 'low',
        value: Math.round(avgWordsPerSentence),
        expected: '< 20 words per sentence',
        fix: 'Use shorter sentences for better readability',
      };
    }

    return {
      testName: 'Content Quality',
      category: 'content',
      status: 'pass',
      message: 'Content quality is good',
      impact: 'low',
      value: Math.round(avgWordsPerSentence),
    };
  }

  // Performance Tests
  private testPageLoadTime(): SEOTestResult {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const loadTime = navigation.loadEventEnd - navigation.fetchStart;

    if (loadTime > 3000) {
      return {
        testName: 'Page Load Time',
        category: 'performance',
        status: 'fail',
        message: 'Page load time is too slow',
        impact: 'high',
        value: `${Math.round(loadTime)}ms`,
        expected: '< 3000ms',
        fix: 'Optimize page load time for better user experience',
      };
    }

    return {
      testName: 'Page Load Time',
      category: 'performance',
      status: 'pass',
      message: 'Page load time is acceptable',
      impact: 'high',
      value: `${Math.round(loadTime)}ms`,
    };
  }

  private testFirstContentfulPaint(): SEOTestResult {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    const fcp = fcpEntry ? fcpEntry.startTime : 0;

    if (fcp > 1800) {
      return {
        testName: 'First Contentful Paint',
        category: 'performance',
        status: 'fail',
        message: 'First contentful paint is too slow',
        impact: 'high',
        value: `${Math.round(fcp)}ms`,
        expected: '< 1800ms',
        fix: 'Optimize first contentful paint',
      };
    }

    return {
      testName: 'First Contentful Paint',
      category: 'performance',
      status: 'pass',
      message: 'First contentful paint is good',
      impact: 'high',
      value: `${Math.round(fcp)}ms`,
    };
  }

  private testLargestContentfulPaint(): SEOTestResult {
    const lcpEntry = performance.getEntriesByName('largest-contentful-paint')[0];
    const lcp = lcpEntry ? lcpEntry.startTime : 0;

    if (lcp > 2500) {
      return {
        testName: 'Largest Contentful Paint',
        category: 'performance',
        status: 'fail',
        message: 'Largest contentful paint is too slow',
        impact: 'high',
        value: `${Math.round(lcp)}ms`,
        expected: '< 2500ms',
        fix: 'Optimize largest contentful paint',
      };
    }

    return {
      testName: 'Largest Contentful Paint',
      category: 'performance',
      status: 'pass',
      message: 'Largest contentful paint is good',
      impact: 'high',
      value: `${Math.round(lcp)}ms`,
    };
  }

  private testCumulativeLayoutShift(): SEOTestResult {
    // This would need to be measured over time, simplified for demo
    return {
      testName: 'Cumulative Layout Shift',
      category: 'performance',
      status: 'info',
      message: 'CLS measurement requires user interaction',
      impact: 'high',
      fix: 'Monitor CLS during user interactions',
    };
  }

  private testResourceOptimization(): SEOTestResult {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const unoptimizedResources = resources.filter((resource) => {
      return resource.duration > 1000 || resource.transferSize > 100000;
    });

    if (unoptimizedResources.length > 0) {
      return {
        testName: 'Resource Optimization',
        category: 'performance',
        status: 'warning',
        message: 'Some resources are not optimized',
        impact: 'medium',
        value: unoptimizedResources.length,
        fix: 'Optimize slow or large resources',
      };
    }

    return {
      testName: 'Resource Optimization',
      category: 'performance',
      status: 'pass',
      message: 'Resources are well optimized',
      impact: 'medium',
    };
  }

  // Accessibility Tests
  private testAltTextCoverage(): SEOTestResult {
    const images = document.querySelectorAll('img');
    const imagesWithAlt = document.querySelectorAll('img[alt]');
    const coverage = images.length > 0 ? imagesWithAlt.length / images.length : 1;

    if (coverage < 0.8) {
      return {
        testName: 'Alt Text Coverage',
        category: 'accessibility',
        status: 'fail',
        message: 'Alt text coverage is insufficient',
        impact: 'high',
        value: `${Math.round(coverage * 100)}%`,
        expected: '80%+',
        fix: 'Add alt text to images',
      };
    }

    return {
      testName: 'Alt Text Coverage',
      category: 'accessibility',
      status: 'pass',
      message: 'Alt text coverage is good',
      impact: 'high',
      value: `${Math.round(coverage * 100)}%`,
    };
  }

  private testHeadingHierarchy(): SEOTestResult {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let isValid = true;

    for (const heading of headings) {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        isValid = false;
        break;
      }
      previousLevel = level;
    }

    if (!isValid) {
      return {
        testName: 'Heading Hierarchy',
        category: 'accessibility',
        status: 'fail',
        message: 'Heading hierarchy is invalid',
        impact: 'high',
        fix: 'Fix heading hierarchy for screen readers',
      };
    }

    return {
      testName: 'Heading Hierarchy',
      category: 'accessibility',
      status: 'pass',
      message: 'Heading hierarchy is valid',
      impact: 'high',
    };
  }

  private testSkipLinks(): SEOTestResult {
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const hasSkipLink = Array.from(skipLinks).some((link) =>
      link.textContent?.toLowerCase().includes('skip')
    );

    if (!hasSkipLink) {
      return {
        testName: 'Skip Links',
        category: 'accessibility',
        status: 'warning',
        message: 'No skip links found',
        impact: 'medium',
        fix: 'Add skip links for keyboard navigation',
      };
    }

    return {
      testName: 'Skip Links',
      category: 'accessibility',
      status: 'pass',
      message: 'Skip links are present',
      impact: 'medium',
    };
  }

  private testAriaLabels(): SEOTestResult {
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby]');
    const count = ariaElements.length;

    return {
      testName: 'ARIA Labels',
      category: 'accessibility',
      status: count > 0 ? 'pass' : 'info',
      message: count > 0 ? 'ARIA labels are present' : 'No ARIA labels found',
      impact: 'medium',
      value: count,
    };
  }

  private testColorContrast(): SEOTestResult {
    // Simplified test - in real implementation, use a library
    return {
      testName: 'Color Contrast',
      category: 'accessibility',
      status: 'info',
      message: 'Color contrast requires manual testing',
      impact: 'high',
      fix: 'Use a color contrast checker tool',
    };
  }

  // Mobile Optimization Tests
  private testViewportMeta(): SEOTestResult {
    const viewport = document.querySelector('meta[name="viewport"]');
    const viewportContent = viewport?.getAttribute('content') || '';

    if (!viewport) {
      return {
        testName: 'Viewport Meta Tag',
        category: 'mobile',
        status: 'fail',
        message: 'No viewport meta tag found',
        impact: 'high',
        fix: 'Add viewport meta tag for mobile optimization',
      };
    }

    if (!viewportContent.includes('width=device-width')) {
      return {
        testName: 'Viewport Meta Tag',
        category: 'mobile',
        status: 'warning',
        message: 'Viewport meta tag is not properly configured',
        impact: 'high',
        value: viewportContent,
        expected: 'width=device-width',
        fix: 'Configure viewport meta tag properly',
      };
    }

    return {
      testName: 'Viewport Meta Tag',
      category: 'mobile',
      status: 'pass',
      message: 'Viewport meta tag is properly configured',
      impact: 'high',
      value: viewportContent,
    };
  }

  private testTouchTargets(): SEOTestResult {
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea');
    const smallTargets = Array.from(touchTargets).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width < 44 || rect.height < 44;
    });

    if (smallTargets.length > 0) {
      return {
        testName: 'Touch Targets',
        category: 'mobile',
        status: 'warning',
        message: 'Some touch targets are too small',
        impact: 'medium',
        value: smallTargets.length,
        expected: '44x44px minimum',
        fix: 'Increase touch target sizes to 44x44px minimum',
      };
    }

    return {
      testName: 'Touch Targets',
      category: 'mobile',
      status: 'pass',
      message: 'Touch targets are properly sized',
      impact: 'medium',
    };
  }

  private testResponsiveImages(): SEOTestResult {
    const images = document.querySelectorAll('img');
    const responsiveImages = document.querySelectorAll('img[srcset], img[sizes]');
    const coverage = images.length > 0 ? responsiveImages.length / images.length : 1;

    if (coverage < 0.5) {
      return {
        testName: 'Responsive Images',
        category: 'mobile',
        status: 'warning',
        message: 'Many images are not responsive',
        impact: 'medium',
        value: `${Math.round(coverage * 100)}%`,
        expected: '50%+',
        fix: 'Add srcset and sizes attributes to images',
      };
    }

    return {
      testName: 'Responsive Images',
      category: 'mobile',
      status: 'pass',
      message: 'Responsive images are well implemented',
      impact: 'medium',
      value: `${Math.round(coverage * 100)}%`,
    };
  }

  private testMobileFriendly(): SEOTestResult {
    const viewport = document.querySelector('meta[name="viewport"]');
    const hasViewport = viewport !== null;
    const hasResponsiveImages = document.querySelectorAll('img[srcset], img[sizes]').length > 0;

    if (!hasViewport) {
      return {
        testName: 'Mobile Friendly',
        category: 'mobile',
        status: 'fail',
        message: 'Page is not mobile friendly',
        impact: 'high',
        fix: 'Add viewport meta tag and responsive design',
      };
    }

    if (!hasResponsiveImages) {
      return {
        testName: 'Mobile Friendly',
        category: 'mobile',
        status: 'warning',
        message: 'Add responsive images so mobile users see properly sized assets',
        impact: 'medium',
        fix: 'Provide srcset/sizes for hero and product imagery to match device widths',
      };
    }

    return {
      testName: 'Mobile Friendly',
      category: 'mobile',
      status: 'pass',
      message: 'Page is mobile friendly',
      impact: 'high',
    };
  }

  // Security Tests
  private testHTTPS(): SEOTestResult {
    const isHTTPS = window.location.protocol === 'https:';

    if (!isHTTPS) {
      return {
        testName: 'HTTPS',
        category: 'security',
        status: 'fail',
        message: 'Site is not using HTTPS',
        impact: 'high',
        fix: 'Enable HTTPS for security and SEO',
      };
    }

    return {
      testName: 'HTTPS',
      category: 'security',
      status: 'pass',
      message: 'Site is using HTTPS',
      impact: 'high',
    };
  }

  private testSecurityHeaders(): SEOTestResult {
    // This would need to be checked server-side
    return {
      testName: 'Security Headers',
      category: 'security',
      status: 'info',
      message: 'Security headers require server-side testing',
      impact: 'high',
      fix: 'Check security headers with online tools',
    };
  }

  private testContentSecurityPolicy(): SEOTestResult {
    const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    const hasCSP = csp !== null;

    if (!hasCSP) {
      return {
        testName: 'Content Security Policy',
        category: 'security',
        status: 'warning',
        message: 'No Content Security Policy found',
        impact: 'medium',
        fix: 'Add Content Security Policy for security',
      };
    }

    return {
      testName: 'Content Security Policy',
      category: 'security',
      status: 'pass',
      message: 'Content Security Policy is present',
      impact: 'medium',
    };
  }

  private testXSSProtection(): SEOTestResult {
    const xss = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
    const hasXSS = xss !== null;

    if (!hasXSS) {
      return {
        testName: 'XSS Protection',
        category: 'security',
        status: 'warning',
        message: 'No XSS protection found',
        impact: 'medium',
        fix: 'Add XSS protection headers',
      };
    }

    return {
      testName: 'XSS Protection',
      category: 'security',
      status: 'pass',
      message: 'XSS protection is present',
      impact: 'medium',
    };
  }
}

// Global instance
let seoTestRunner: SEOTestRunner | null = null;

export function initializeSEOTesting(): SEOTestRunner {
  if (!seoTestRunner) {
    seoTestRunner = new SEOTestRunner();
  }
  return seoTestRunner;
}

export function getSEOTestRunner(): SEOTestRunner | null {
  return seoTestRunner;
}

export async function runSEOTests(): Promise<SEOTestSuite> {
  const runner = initializeSEOTesting();
  return await runner.runTests();
}

// Initialize when the script loads
if (typeof window !== 'undefined') {
  initializeSEOTesting();
}
