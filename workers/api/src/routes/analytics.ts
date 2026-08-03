/**
 * Analytics endpoint for receiving client-side events
 * Writes to Analytics Engine for comprehensive user behavior analysis
 */

import { z } from 'zod';
import type { Env } from '../types';
import { buildDefaultHeaders, redactTelemetryValue, sha256Hex } from '../lib';

const PageInteractionEventSchema = z.object({
  type: z.enum(['page_view', 'form_submit', 'api_call', 'api_result', 'error', 'user_action']),
  page: z.string().min(1).max(512),
  action: z.string().max(256).optional(),
  metadata: z.record(z.string().max(80), z.unknown()).optional(),
  timestamp: z.number().finite().min(0).max(9_999_999_999_999),
});

const AnalyticsPayloadSchema = z.object({
  sessionId: z.string().min(1).max(256),
  visitorId: z.string().min(1).max(256),
  events: z.array(PageInteractionEventSchema).max(100),
});

const ChatAnalyticsSchema = z.object({
  sessionId: z.string().min(1).max(256),
  userId: z.string().min(1).max(256).optional(),
  startTime: z.string().max(128).or(z.date()), // Client sends ISO string
  endTime: z.string().max(128).or(z.date()).optional(),
  messageCount: z.number().finite().min(0).max(1_000_000),
  toolUsage: z.record(z.string().max(80), z.number().finite().min(0).max(1_000_000)),
  errorCount: z.number().finite().min(0).max(1_000_000),
  averageResponseTime: z.number().finite().min(0).max(86_400_000),
  userSatisfaction: z.number().finite().min(0).max(100).optional(),
  contextSwitches: z.number().finite().min(0).max(1_000_000),
  offlineTime: z.number().finite().min(0).max(86_400_000),
});

const UserBehaviorMetricsSchema = z.object({
  sessionId: z.string().min(1).max(256),
  pageContext: z.string().min(1).max(512),
  messageLength: z.number().finite().min(0).max(1_000_000),
  timeToFirstMessage: z.number().finite().min(0).max(86_400_000),
  messagesPerMinute: z.number().finite().min(0).max(1_000_000),
  toolRequestsPerSession: z.number().finite().min(0).max(1_000_000),
  errorRate: z.number().finite().min(0).max(1),
  satisfactionScore: z.number().finite().min(0).max(100).optional(),
});

const PerformanceMetricsSchema = z.object({
  messageId: z.string().min(1).max(256),
  requestTime: z.string().max(128).or(z.date()),
  responseTime: z.string().max(128).or(z.date()).optional(),
  duration: z.number().finite().min(0).max(86_400_000).optional(),
  toolName: z.string().max(80).optional(),
  fromCache: z.boolean().optional(),
  success: z.boolean(),
  errorCode: z.string().max(80).optional(),
  retryCount: z.number().finite().min(0).max(1_000_000),
});

const ChatMetricsSchema = z.object({
  timestamp: z.string().max(128).or(z.date()),
  type: z.string().min(1).max(80),
  data: z.record(z.string().max(80), z.unknown()),
});

const ChatAnalyticsPayloadSchema = z.object({
  analytics: ChatAnalyticsSchema,
  behaviorMetrics: UserBehaviorMetricsSchema,
  performanceMetrics: z.array(PerformanceMetricsSchema).max(50),
  recentMetrics: z.array(ChatMetricsSchema).max(100),
});

const MAX_ANALYTICS_LABEL_LENGTH = 256;

async function pseudonymousAnalyticsId(value: string, env: Env): Promise<string | null> {
  const salt = env.ANALYTICS_HASH_SALT?.trim();
  if (!salt) return null;
  return (await sha256Hex(`${salt}:${value.trim()}`)).slice(0, 32);
}

function safeAnalyticsPath(value: string): string {
  try {
    const url = new URL(value, 'https://analytics.invalid');
    return url.pathname.slice(0, MAX_ANALYTICS_LABEL_LENGTH) || '/';
  } catch {
    return '/invalid';
  }
}

function safeAnalyticsLabel(value: string | undefined): string {
  if (!value) return 'unknown';
  return String(redactTelemetryValue(value)).slice(0, MAX_ANALYTICS_LABEL_LENGTH);
}

function safeMetadataSummary(metadata: Record<string, unknown> | undefined) {
  const metadataKeyCount = Math.min(Object.keys(metadata ?? {}).length, 100);
  return { hasMetadata: metadataKeyCount > 0, metadataKeyCount };
}

function safeToolUsage(toolUsage: Record<string, number>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(toolUsage)
      .filter(
        ([key, value]) =>
          /^[A-Za-z0-9_.:-]{1,80}$/.test(key) && Number.isFinite(value) && value >= 0
      )
      .slice(0, 100)
      .map(([key, value]) => [key, Math.min(Math.floor(value), 1_000_000)])
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAnalyticsRoutes(router: any) {
  /**
   * POST /v1/api/analytics/events
   * Receive batch of client-side analytics events
   */
  router.post('/v1/api/analytics/events', async (request: Request, env: Env) => {
    try {
      // Parse and validate request
      const body = await request.json();
      const result = AnalyticsPayloadSchema.safeParse(body);

      if (!result.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid analytics payload',
            details: result.error.issues,
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      const { sessionId, visitorId, events } = result.data;
      const [sessionRef, visitorRef] = await Promise.all([
        pseudonymousAnalyticsId(sessionId, env),
        pseudonymousAnalyticsId(visitorId, env),
      ]);

      // Write events to Analytics Engine if available
      const analyticsWritten = Boolean(env.ANALYTICS && sessionRef && visitorRef);
      if (env.ANALYTICS && sessionRef && visitorRef) {
        for (const event of events) {
          try {
            env.ANALYTICS.writeDataPoint({
              // Indexes (up to 20) - for querying/filtering
              indexes: [
                event.type, // index1: event type
                safeAnalyticsPath(event.page), // index2: bounded page path
                sessionRef, // index3: salted session reference
                visitorRef, // index4: salted visitor reference
                safeAnalyticsLabel(event.action), // index5: bounded action name
              ],
              // Doubles (up to 20) - for numeric aggregation
              doubles: [
                event.timestamp, // double1: timestamp
                1, // double2: event count (for aggregation)
              ],
              // Blobs (up to 20) - for additional context
              blobs: [
                JSON.stringify(safeMetadataSummary(event.metadata)), // blob1: metadata shape only
              ],
            });
          } catch (error) {
            console.error('Failed to write analytics event:', error);
            // Don't fail the request if Analytics Engine write fails
          }
        }
      }

      // Return success
      return new Response(
        JSON.stringify({
          success: true,
          eventsProcessed: events.length,
          analyticsWritten,
        }),
        {
          status: 200,
          headers: buildDefaultHeaders(env),
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to process analytics events',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  });

  /**
   * POST /v1/api/analytics/chat
   * Receive chat session analytics
   */
  router.post('/v1/api/analytics/chat', async (request: Request, env: Env) => {
    try {
      const body = await request.json();
      const result = ChatAnalyticsPayloadSchema.safeParse(body);

      if (!result.success) {
        return new Response(
          JSON.stringify({
            error: 'Invalid chat analytics payload',
            details: result.error.issues,
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      const { analytics, behaviorMetrics } = result.data;
      const [sessionRef, userRef] = await Promise.all([
        pseudonymousAnalyticsId(analytics.sessionId, env),
        analytics.userId
          ? pseudonymousAnalyticsId(analytics.userId, env)
          : Promise.resolve('anonymous'),
      ]);

      const analyticsWritten = Boolean(env.ANALYTICS && sessionRef && userRef);
      if (env.ANALYTICS && sessionRef && userRef) {
        try {
          // Write session summary
          env.ANALYTICS.writeDataPoint({
            indexes: [
              'chat_session_summary', // index1: event type
              safeAnalyticsPath(behaviorMetrics.pageContext), // index2: page path
              sessionRef, // index3: salted session reference
              userRef, // index4: salted user reference
              '', // index5: unused
            ],
            doubles: [
              Date.now(), // double1: timestamp
              analytics.messageCount, // double2: message count
              analytics.averageResponseTime, // double3: avg response time
              analytics.errorCount, // double4: error count
              analytics.userSatisfaction || 0, // double5: satisfaction
            ],
            blobs: [
              JSON.stringify({
                toolUsage: safeToolUsage(analytics.toolUsage),
                behavior: {
                  pageContext: safeAnalyticsPath(behaviorMetrics.pageContext),
                  messageLength: behaviorMetrics.messageLength,
                  timeToFirstMessage: behaviorMetrics.timeToFirstMessage,
                  messagesPerMinute: behaviorMetrics.messagesPerMinute,
                  toolRequestsPerSession: behaviorMetrics.toolRequestsPerSession,
                  errorRate: behaviorMetrics.errorRate,
                  satisfactionScore: behaviorMetrics.satisfactionScore ?? null,
                },
              }), // blob1: detailed metrics
            ],
          });
        } catch (error) {
          console.error('Failed to write chat analytics:', error);
        }
      }

      return new Response(JSON.stringify({ success: true, analyticsWritten }), {
        status: 200,
        headers: buildDefaultHeaders(env),
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to process chat analytics',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  });

  /**
   * GET /v1/api/analytics/summary
   * Get analytics summary for the current session (debugging/testing)
   */
  router.get('/v1/api/analytics/summary', async (request: Request, env: Env) => {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');

      if (!sessionId) {
        return new Response(
          JSON.stringify({
            error: 'sessionId query parameter required',
          }),
          { status: 400, headers: buildDefaultHeaders(env) }
        );
      }

      const sessionRef = await pseudonymousAnalyticsId(sessionId, env);

      if (!sessionRef) {
        return new Response(JSON.stringify({ error: 'Analytics identity is not configured' }), {
          status: 503,
          headers: buildDefaultHeaders(env),
        });
      }

      // Note: Analytics Engine doesn't support real-time queries
      // This would typically use GraphQL API to query historical data
      // For now, return a placeholder response
      return new Response(
        JSON.stringify({
          message: 'Analytics summary',
          sessionRef,
          note: 'Use Cloudflare GraphQL API to query Analytics Engine data',
          queryUrl: 'https://api.cloudflare.com/client/v4/graphql',
        }),
        {
          status: 200,
          headers: buildDefaultHeaders(env),
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Failed to get analytics summary',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
        { status: 500, headers: buildDefaultHeaders(env) }
      );
    }
  });
}
