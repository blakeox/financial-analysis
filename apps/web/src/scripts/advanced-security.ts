/**
 * Advanced Security Features for Chatbot and MCP Systems
 * Implements comprehensive security measures including threat detection, input sanitization, and access control
 */

export interface SecurityConfig {
  enableThreatDetection: boolean;
  enableInputSanitization: boolean;
  enableRateLimiting: boolean;
  enableAccessControl: boolean;
  enableAuditLogging: boolean;
  maxRequestSize: number;
  maxMessageLength: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  suspiciousActivityThreshold: number;
  blockDurationMs: number;
}

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type:
    | 'threat_detected'
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
    | 'access_denied'
    | 'input_sanitized';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: Record<string, unknown>;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
}

export interface ThreatPattern {
  id: string;
  name: string;
  pattern: RegExp;
  severity: SecurityEvent['severity'];
  description: string;
  enabled: boolean;
}

export interface RateLimitRule {
  id: string;
  name: string;
  windowMs: number;
  maxRequests: number;
  keyGenerator: (request: any) => string;
  enabled: boolean;
}

export interface AccessControlRule {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'in' | 'not_in';
    value: any;
  }>;
  effect: 'allow' | 'deny';
  enabled: boolean;
}

export class AdvancedSecurityManager {
  private config: SecurityConfig;
  private events: SecurityEvent[] = [];
  private threatPatterns: ThreatPattern[] = [];
  private rateLimitRules: RateLimitRule[] = [];
  private accessControlRules: AccessControlRule[] = [];
  private blockedIPs: Map<string, Date> = new Map();
  private suspiciousActivities: Map<string, number> = new Map();
  private rateLimitCounters: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = {
      enableThreatDetection: true,
      enableInputSanitization: true,
      enableRateLimiting: true,
      enableAccessControl: true,
      enableAuditLogging: true,
      maxRequestSize: 1024 * 1024, // 1MB
      maxMessageLength: 2000,
      rateLimitWindowMs: 60000, // 1 minute
      rateLimitMaxRequests: 100,
      suspiciousActivityThreshold: 5,
      blockDurationMs: 300000, // 5 minutes
      ...config,
    };

    this.initializeDefaultThreatPatterns();
    this.initializeDefaultRateLimitRules();
    this.initializeDefaultAccessControlRules();
  }

  /**
   * Analyze request for security threats
   */
  analyzeRequest(request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
  }): {
    isSafe: boolean;
    threats: Array<{ pattern: ThreatPattern; match: string }>;
    sanitizedBody?: string;
    shouldBlock: boolean;
  } {
    const threats: Array<{ pattern: ThreatPattern; match: string }> = [];
    let sanitizedBody: string | undefined;

    // Check request size
    if (request.body && request.body.length > this.config.maxRequestSize) {
      this.logSecurityEvent({
        type: 'threat_detected',
        severity: 'high',
        source: 'request_size',
        details: { size: request.body.length, maxSize: this.config.maxRequestSize },
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        userId: request.userId,
      });
      return { isSafe: false, threats, shouldBlock: true };
    }

    // Check for threat patterns
    if (this.config.enableThreatDetection) {
      const bodyText = request.body || '';
      const urlText = request.url;
      const headerText = JSON.stringify(request.headers);

      for (const pattern of this.threatPatterns.filter((p) => p.enabled)) {
        const matches = [
          ...bodyText.matchAll(pattern.pattern),
          ...urlText.matchAll(pattern.pattern),
          ...headerText.matchAll(pattern.pattern),
        ];

        for (const match of matches) {
          threats.push({
            pattern,
            match: match[0],
          });

          this.logSecurityEvent({
            type: 'threat_detected',
            severity: pattern.severity,
            source: 'threat_pattern',
            details: {
              patternId: pattern.id,
              patternName: pattern.name,
              match: match[0],
              description: pattern.description,
            },
            userAgent: request.userAgent,
            ipAddress: request.ipAddress,
            userId: request.userId,
          });
        }
      }
    }

    // Sanitize input if enabled
    if (this.config.enableInputSanitization && request.body) {
      sanitizedBody = this.sanitizeInput(request.body);

      if (sanitizedBody !== request.body) {
        this.logSecurityEvent({
          type: 'input_sanitized',
          severity: 'low',
          source: 'input_sanitization',
          details: {
            originalLength: request.body.length,
            sanitizedLength: sanitizedBody.length,
          },
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          userId: request.userId,
        });
      }
    }

    // Check rate limiting
    if (this.config.enableRateLimiting) {
      const rateLimitResult = this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        this.logSecurityEvent({
          type: 'rate_limit_exceeded',
          severity: 'medium',
          source: 'rate_limiting',
          details: {
            ruleId: rateLimitResult.ruleId,
            currentCount: rateLimitResult.currentCount,
            maxRequests: rateLimitResult.maxRequests,
          },
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          userId: request.userId,
        });
        return { isSafe: false, threats, sanitizedBody, shouldBlock: true };
      }
    }

    // Check access control
    if (this.config.enableAccessControl) {
      const accessResult = this.checkAccessControl(request);
      if (!accessResult.allowed) {
        this.logSecurityEvent({
          type: 'access_denied',
          severity: 'high',
          source: 'access_control',
          details: {
            ruleId: accessResult.ruleId,
            reason: accessResult.reason,
          },
          userAgent: request.userAgent,
          ipAddress: request.ipAddress,
          userId: request.userId,
        });
        return { isSafe: false, threats, sanitizedBody, shouldBlock: true };
      }
    }

    // Check for suspicious activity
    const suspiciousLevel = this.checkSuspiciousActivity(request);
    if (suspiciousLevel > this.config.suspiciousActivityThreshold) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        source: 'suspicious_activity',
        details: { suspiciousLevel, threshold: this.config.suspiciousActivityThreshold },
        userAgent: request.userAgent,
        ipAddress: request.ipAddress,
        userId: request.userId,
      });

      // Block IP if suspicious activity is too high
      if (request.ipAddress && suspiciousLevel > this.config.suspiciousActivityThreshold * 2) {
        this.blockIP(request.ipAddress);
        return { isSafe: false, threats, sanitizedBody, shouldBlock: true };
      }
    }

    const isSafe =
      threats.length === 0 && suspiciousLevel <= this.config.suspiciousActivityThreshold;
    return { isSafe, threats, sanitizedBody, shouldBlock: false };
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  sanitizeInput(input: string): string {
    return (
      input
        // Remove script tags and their content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remove javascript: protocols
        .replace(/javascript:/gi, '')
        // Remove on* event handlers
        .replace(/\son\w+\s*=/gi, ' ')
        // Remove dangerous HTML tags
        .replace(/<(iframe|object|embed|form|input|textarea|select|button)\b[^>]*>/gi, '')
        // Escape HTML entities
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        // Remove excessive whitespace
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Check rate limiting rules
   */
  checkRateLimit(request: any): {
    allowed: boolean;
    ruleId?: string;
    currentCount: number;
    maxRequests: number;
    resetTime: number;
  } {
    for (const rule of this.rateLimitRules.filter((r) => r.enabled)) {
      const key = rule.keyGenerator(request);
      const now = Date.now();

      let counter = this.rateLimitCounters.get(key);

      if (!counter || now > counter.resetTime) {
        counter = {
          count: 1,
          resetTime: now + rule.windowMs,
        };
      } else {
        counter.count++;
      }

      this.rateLimitCounters.set(key, counter);

      if (counter.count > rule.maxRequests) {
        return {
          allowed: false,
          ruleId: rule.id,
          currentCount: counter.count,
          maxRequests: rule.maxRequests,
          resetTime: counter.resetTime,
        };
      }
    }

    return { allowed: true, currentCount: 0, maxRequests: 0, resetTime: 0 };
  }

  /**
   * Check access control rules
   */
  checkAccessControl(request: any): {
    allowed: boolean;
    ruleId?: string;
    reason?: string;
  } {
    for (const rule of this.accessControlRules.filter((r) => r.enabled)) {
      let matches = true;

      for (const condition of rule.conditions) {
        const fieldValue = this.getFieldValue(request, condition.field);

        if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return {
          allowed: rule.effect === 'allow',
          ruleId: rule.id,
          reason: rule.effect === 'deny' ? 'Access denied by rule' : undefined,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check for suspicious activity patterns
   */
  checkSuspiciousActivity(request: any): number {
    const key = request.ipAddress || request.userId || 'unknown';
    const now = Date.now();

    // Check for rapid requests
    const recentRequests = this.events.filter(
      (e) =>
        e.timestamp.getTime() > now - 60000 && // Last minute
        (e.ipAddress === request.ipAddress || e.userId === request.userId)
    );

    let suspiciousLevel = 0;

    // Rapid requests
    if (recentRequests.length > 50) {
      suspiciousLevel += 3;
    } else if (recentRequests.length > 20) {
      suspiciousLevel += 2;
    } else if (recentRequests.length > 10) {
      suspiciousLevel += 1;
    }

    // Multiple threat detections
    const threatEvents = recentRequests.filter((e) => e.type === 'threat_detected');
    suspiciousLevel += threatEvents.length;

    // Rate limit violations
    const rateLimitEvents = recentRequests.filter((e) => e.type === 'rate_limit_exceeded');
    suspiciousLevel += rateLimitEvents.length * 2;

    // Update suspicious activity counter
    this.suspiciousActivities.set(key, suspiciousLevel);

    return suspiciousLevel;
  }

  /**
   * Block IP address
   */
  blockIP(ipAddress: string): void {
    this.blockedIPs.set(ipAddress, new Date(Date.now() + this.config.blockDurationMs));
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ipAddress: string): boolean {
    const blockUntil = this.blockedIPs.get(ipAddress);
    if (!blockUntil) return false;

    if (Date.now() > blockUntil.getTime()) {
      this.blockedIPs.delete(ipAddress);
      return false;
    }

    return true;
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    if (!this.config.enableAuditLogging) return;

    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event,
    };

    this.events.push(securityEvent);

    // Keep only recent events
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', securityEvent);
    }
  }

  /**
   * Get security events
   */
  getSecurityEvents(filters?: {
    type?: SecurityEvent['type'];
    severity?: SecurityEvent['severity'];
    since?: Date;
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filters) {
      if (filters.type) {
        filteredEvents = filteredEvents.filter((e) => e.type === filters.type);
      }

      if (filters.severity) {
        filteredEvents = filteredEvents.filter((e) => e.severity === filters.severity);
      }

      if (filters.since) {
        filteredEvents = filteredEvents.filter((e) => e.timestamp >= filters.since!);
      }

      if (filters.limit) {
        filteredEvents = filteredEvents.slice(-filters.limit);
      }
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    blockedIPs: number;
    suspiciousActivities: number;
    rateLimitViolations: number;
    threatDetections: number;
  } {
    const now = Date.now();
    const last24Hours = this.events.filter((e) => e.timestamp.getTime() > now - 86400000);

    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};

    for (const event of last24Hours) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    }

    return {
      totalEvents: last24Hours.length,
      eventsByType,
      eventsBySeverity,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousActivities.size,
      rateLimitViolations: eventsByType['rate_limit_exceeded'] || 0,
      threatDetections: eventsByType['threat_detected'] || 0,
    };
  }

  /**
   * Add threat pattern
   */
  addThreatPattern(pattern: ThreatPattern): void {
    this.threatPatterns.push(pattern);
  }

  /**
   * Add rate limit rule
   */
  addRateLimitRule(rule: RateLimitRule): void {
    this.rateLimitRules.push(rule);
  }

  /**
   * Add access control rule
   */
  addAccessControlRule(rule: AccessControlRule): void {
    this.accessControlRules.push(rule);
  }

  /**
   * Initialize default threat patterns
   */
  private initializeDefaultThreatPatterns(): void {
    this.threatPatterns = [
      {
        id: 'sql-injection',
        name: 'SQL Injection',
        pattern:
          /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|where|set|values)\b)/i,
        severity: 'critical',
        description: 'Potential SQL injection attack',
        enabled: true,
      },
      {
        id: 'xss-script',
        name: 'XSS Script Injection',
        pattern: /<script[^>]*>.*?<\/script>/i,
        severity: 'high',
        description: 'Potential XSS script injection',
        enabled: true,
      },
      {
        id: 'command-injection',
        name: 'Command Injection',
        pattern: /[;&|`$(){}[\]\\]/,
        severity: 'high',
        description: 'Potential command injection',
        enabled: true,
      },
      {
        id: 'path-traversal',
        name: 'Path Traversal',
        pattern: /\.\.\/|\.\.\\|\.\.%2f|\.\.%5c/i,
        severity: 'high',
        description: 'Potential path traversal attack',
        enabled: true,
      },
      {
        id: 'ldap-injection',
        name: 'LDAP Injection',
        pattern: /[()=*!&|]/,
        severity: 'medium',
        description: 'Potential LDAP injection',
        enabled: true,
      },
    ];
  }

  /**
   * Initialize default rate limit rules
   */
  private initializeDefaultRateLimitRules(): void {
    this.rateLimitRules = [
      {
        id: 'general-rate-limit',
        name: 'General Rate Limit',
        windowMs: 60000, // 1 minute
        maxRequests: 100,
        keyGenerator: (request) => request.ipAddress || 'unknown',
        enabled: true,
      },
      {
        id: 'api-rate-limit',
        name: 'API Rate Limit',
        windowMs: 60000, // 1 minute
        maxRequests: 200,
        keyGenerator: (request) => `api:${request.ipAddress || 'unknown'}`,
        enabled: true,
      },
      {
        id: 'chat-rate-limit',
        name: 'Chat Rate Limit',
        windowMs: 60000, // 1 minute
        maxRequests: 50,
        keyGenerator: (request) => `chat:${request.userId || request.ipAddress || 'unknown'}`,
        enabled: true,
      },
    ];
  }

  /**
   * Initialize default access control rules
   */
  private initializeDefaultAccessControlRules(): void {
    this.accessControlRules = [
      {
        id: 'block-admin-endpoints',
        name: 'Block Admin Endpoints',
        resource: '/admin/*',
        action: 'access',
        conditions: [
          {
            field: 'userId',
            operator: 'not_in',
            value: ['admin', 'superuser'],
          },
        ],
        effect: 'deny',
        enabled: true,
      },
      {
        id: 'require-auth-for-api',
        name: 'Require Auth for API',
        resource: '/api/*',
        action: 'access',
        conditions: [
          {
            field: 'userId',
            operator: 'equals',
            value: null,
          },
        ],
        effect: 'deny',
        enabled: true,
      },
    ];
  }

  /**
   * Get field value from request
   */
  private getFieldValue(request: any, field: string): any {
    const parts = field.split('.');
    let value = request;

    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(expectedValue);
      case 'matches':
        return typeof fieldValue === 'string' && new RegExp(expectedValue).test(fieldValue);
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Cleanup expired data
   */
  cleanup(): void {
    const now = Date.now();

    // Clean up expired blocked IPs
    for (const [ip, blockUntil] of this.blockedIPs.entries()) {
      if (now > blockUntil.getTime()) {
        this.blockedIPs.delete(ip);
      }
    }

    // Clean up old suspicious activities
    for (const [key, level] of this.suspiciousActivities.entries()) {
      if (level <= 0) {
        this.suspiciousActivities.delete(key);
      }
    }

    // Clean up old rate limit counters
    for (const [key, counter] of this.rateLimitCounters.entries()) {
      if (now > counter.resetTime) {
        this.rateLimitCounters.delete(key);
      }
    }

    // Clean up old events
    const cutoff = now - 86400000; // 24 hours
    this.events = this.events.filter((e) => e.timestamp.getTime() > cutoff);
  }

  /**
   * Destroy security manager
   */
  destroy(): void {
    this.events = [];
    this.threatPatterns = [];
    this.rateLimitRules = [];
    this.accessControlRules = [];
    this.blockedIPs.clear();
    this.suspiciousActivities.clear();
    this.rateLimitCounters.clear();
  }
}

// Export default instance
export const defaultSecurityManager = new AdvancedSecurityManager();
