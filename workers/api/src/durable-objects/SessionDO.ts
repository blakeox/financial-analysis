/**
 * Session Durable Object
 *
 * Manages per-session state for rate limiting, replay detection, and trust scoring.
 * Each session is identified by a fingerprint (IP + User-Agent hash or session ID).
 *
 * Features:
 * - Request counting with time windows
 * - Replay attack detection (hash-based deduplication)
 * - Trust score tracking (decreases on suspicious activity)
 * - Session limits enforcement (max messages, requests, lifetime)
 */

import type { DurableObjectState } from '@cloudflare/workers-types';

export interface SessionState {
  sessionId: string;
  createdAt: number;
  lastActivity: number;
  requestCount: number;
  messageCount: number;
  trustScore: number; // 0-100, starts at 100
  flags: string[]; // Security flags like 'prompt_injection', 'rate_limit_violation'
  ipAddress: string;
  userAgent: string;
  requestTimestamps: number[]; // For sliding window rate limiting
  replayCache: Map<string, number>; // hash -> timestamp for replay detection
}

export interface SessionLimits {
  maxMessagesPerSession: number;
  maxRequestsPerSession: number;
  sessionTimeoutMs: number;
  sessionMaxLifetimeMs: number;
  requestsPerMinute: number;
  replayCacheWindowMs: number;
}

const DEFAULT_LIMITS: SessionLimits = {
  maxMessagesPerSession: 50,
  maxRequestsPerSession: 100,
  sessionTimeoutMs: 60 * 60 * 1000, // 1 hour
  sessionMaxLifetimeMs: 24 * 60 * 60 * 1000, // 24 hours
  requestsPerMinute: 20,
  replayCacheWindowMs: 10 * 1000, // 10 seconds
};

export class SessionDO {
  private state: DurableObjectState;
  private session: SessionState | null = null;
  private limits: SessionLimits = DEFAULT_LIMITS;

  constructor(state: DurableObjectState) {
    this.state = state;
    // Block concurrent writes during initialization
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<SessionState>('session');
      this.session = stored || null;
    });
  }

  /**
   * Durable Object alarm handler for automatic session cleanup
   * Called when the alarm time is reached
   */
  async alarm(): Promise<void> {
    const now = Date.now();

    if (!this.session) {
      // No session, nothing to clean up
      return;
    }

    const age = now - this.session.createdAt;
    const inactiveTime = now - this.session.lastActivity;

    // Check if session should be cleaned up
    if (age > this.limits.sessionMaxLifetimeMs) {
      console.log(`Session expired (max lifetime): ${this.session.sessionId}`);
      await this.state.storage.deleteAll();
      this.session = null;
      return;
    }

    if (inactiveTime > this.limits.sessionTimeoutMs) {
      console.log(`Session expired (inactivity): ${this.session.sessionId}`);
      await this.state.storage.deleteAll();
      this.session = null;
      return;
    }

    // Still active, schedule next check
    const nextCheckTime = Math.min(
      this.session.createdAt + this.limits.sessionMaxLifetimeMs,
      this.session.lastActivity + this.limits.sessionTimeoutMs
    );

    await this.state.storage.setAlarm(nextCheckTime);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // RPC-style routing
      switch (path) {
        case '/init':
          return this.handleInit(request);
        case '/check':
          return this.handleCheck(request);
        case '/increment':
          return this.handleIncrement(request);
        case '/flag':
          return this.handleFlag(request);
        case '/get':
          return this.handleGet();
        case '/reset':
          return this.handleReset();
        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      console.error('SessionDO error:', error);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  /**
   * Initialize a new session
   * POST /init with { sessionId, ipAddress, userAgent }
   */
  private async handleInit(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      sessionId: string;
      ipAddress: string;
      userAgent: string;
    };

    const now = Date.now();
    this.session = {
      sessionId: body.sessionId,
      createdAt: now,
      lastActivity: now,
      requestCount: 0,
      messageCount: 0,
      trustScore: 100,
      flags: [],
      ipAddress: body.ipAddress,
      userAgent: body.userAgent,
      requestTimestamps: [],
      replayCache: new Map(),
    };

    await this.state.storage.put('session', this.session);

    // Set alarm for session expiry (check whichever comes first)
    const maxLifetimeExpiry = now + this.limits.sessionMaxLifetimeMs;
    const inactivityExpiry = now + this.limits.sessionTimeoutMs;
    const alarmTime = Math.min(maxLifetimeExpiry, inactivityExpiry);
    await this.state.storage.setAlarm(alarmTime);

    return new Response(
      JSON.stringify({ ok: true, session: this.serializeSession(this.session) }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Check if request is allowed (rate limits, replay detection, session validity)
   * POST /check with { requestHash, isMessage }
   */
  private async handleCheck(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      requestHash?: string;
      isMessage?: boolean;
    };

    if (!this.session) {
      return new Response(JSON.stringify({ allowed: false, reason: 'session_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = Date.now();
    const checks = this.performChecks(now, body.requestHash, body.isMessage || false);

    return new Response(JSON.stringify(checks), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Increment counters after successful request
   * POST /increment with { requestHash, isMessage }
   */
  private async handleIncrement(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      requestHash?: string;
      isMessage?: boolean;
    };

    if (!this.session) {
      return new Response(JSON.stringify({ error: 'session_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = Date.now();

    // Increment counters
    this.session.requestCount++;
    if (body.isMessage) {
      this.session.messageCount++;
    }
    this.session.lastActivity = now;

    // Add timestamp for sliding window
    this.session.requestTimestamps.push(now);

    // Add to replay cache if hash provided
    if (body.requestHash) {
      this.session.replayCache.set(body.requestHash, now);
    }

    // Cleanup old data
    this.cleanupOldData(now);

    await this.state.storage.put('session', this.session);

    // Update alarm since activity changed
    const maxLifetimeExpiry = this.session.createdAt + this.limits.sessionMaxLifetimeMs;
    const inactivityExpiry = this.session.lastActivity + this.limits.sessionTimeoutMs;
    const alarmTime = Math.min(maxLifetimeExpiry, inactivityExpiry);
    await this.state.storage.setAlarm(alarmTime);

    return new Response(
      JSON.stringify({ ok: true, session: this.serializeSession(this.session) }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Add security flag and adjust trust score
   * POST /flag with { flag, scoreAdjustment }
   */
  private async handleFlag(request: Request): Promise<Response> {
    const body = (await request.json()) as {
      flag: string;
      scoreAdjustment?: number;
    };

    if (!this.session) {
      return new Response(JSON.stringify({ error: 'session_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add flag if not already present
    if (!this.session.flags.includes(body.flag)) {
      this.session.flags.push(body.flag);
    }

    // Adjust trust score
    if (body.scoreAdjustment !== undefined) {
      this.session.trustScore = Math.max(
        0,
        Math.min(100, this.session.trustScore + body.scoreAdjustment)
      );
    }

    await this.state.storage.put('session', this.session);

    return new Response(
      JSON.stringify({ ok: true, session: this.serializeSession(this.session) }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  /**
   * Get current session state
   * GET /get
   */
  private async handleGet(): Promise<Response> {
    if (!this.session) {
      return new Response(JSON.stringify({ error: 'session_not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ session: this.serializeSession(this.session) }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Reset session (for testing or manual intervention)
   * POST /reset
   */
  private async handleReset(): Promise<Response> {
    await this.state.storage.deleteAll();
    this.session = null;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Perform all security checks
   */
  private performChecks(
    now: number,
    requestHash?: string,
    isMessage?: boolean
  ): {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    trustScore: number;
    flags: string[];
  } {
    if (!this.session) {
      return { allowed: false, reason: 'session_not_found', trustScore: 0, flags: [] };
    }

    // Check session expiration
    const age = now - this.session.createdAt;
    const idle = now - this.session.lastActivity;

    if (age > this.limits.sessionMaxLifetimeMs) {
      return {
        allowed: false,
        reason: 'session_expired',
        trustScore: this.session.trustScore,
        flags: this.session.flags,
      };
    }

    if (idle > this.limits.sessionTimeoutMs) {
      return {
        allowed: false,
        reason: 'session_timeout',
        trustScore: this.session.trustScore,
        flags: this.session.flags,
      };
    }

    // Check session limits
    if (this.session.requestCount >= this.limits.maxRequestsPerSession) {
      return {
        allowed: false,
        reason: 'max_requests_exceeded',
        trustScore: this.session.trustScore,
        flags: this.session.flags,
      };
    }

    if (isMessage && this.session.messageCount >= this.limits.maxMessagesPerSession) {
      return {
        allowed: false,
        reason: 'max_messages_exceeded',
        trustScore: this.session.trustScore,
        flags: this.session.flags,
      };
    }

    // Check rate limiting (sliding window)
    const windowStart = now - 60 * 1000; // 1 minute
    const recentRequests = this.session.requestTimestamps.filter((ts) => ts >= windowStart);

    if (recentRequests.length >= this.limits.requestsPerMinute) {
      const oldestInWindow = Math.min(...recentRequests);
      const retryAfter = Math.ceil((oldestInWindow + 60 * 1000 - now) / 1000);

      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        retryAfter,
        trustScore: this.session.trustScore,
        flags: this.session.flags,
      };
    }

    // Check replay cache
    if (requestHash) {
      const replayTimestamp = this.session.replayCache.get(requestHash);
      if (replayTimestamp && now - replayTimestamp < this.limits.replayCacheWindowMs) {
        return {
          allowed: false,
          reason: 'replay_detected',
          trustScore: this.session.trustScore,
          flags: this.session.flags,
        };
      }
    }

    return {
      allowed: true,
      trustScore: this.session.trustScore,
      flags: this.session.flags,
    };
  }

  /**
   * Cleanup old timestamps and replay cache entries
   */
  private cleanupOldData(now: number): void {
    if (!this.session) return;

    // Keep only last minute of timestamps
    const windowStart = now - 60 * 1000;
    this.session.requestTimestamps = this.session.requestTimestamps.filter(
      (ts) => ts >= windowStart
    );

    // Clean replay cache
    const replayCutoff = now - this.limits.replayCacheWindowMs;
    for (const [hash, timestamp] of this.session.replayCache.entries()) {
      if (timestamp < replayCutoff) {
        this.session.replayCache.delete(hash);
      }
    }
  }

  /**
   * Serialize session for JSON response (convert Map to object)
   */
  private serializeSession(session: SessionState): Record<string, unknown> {
    return {
      ...session,
      replayCache: Object.fromEntries(session.replayCache),
    };
  }
}
