/**
 * Analytics endpoint for receiving client-side events
 * Writes to Analytics Engine for comprehensive user behavior analysis
 */

import { z } from 'zod';
import type { Env } from '../types';
import { buildDefaultHeaders } from '../lib';

const PageInteractionEventSchema = z.object({
  type: z.enum(['page_view', 'form_submit', 'api_call', 'api_result', 'error', 'user_action']),
  page: z.string(),
  action: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.number(),
});

const AnalyticsPayloadSchema = z.object({
  sessionId: z.string(),
  visitorId: z.string(),
  events: z.array(PageInteractionEventSchema),
});

const ChatAnalyticsSchema = z.object({
  sessionId: z.string(),
  userId: z.string().optional(),
  startTime: z.string().or(z.date()), // Client sends ISO string
  endTime: z.string().or(z.date()).optional(),
  messageCount: z.number(),
  toolUsage: z.record(z.string(), z.number()),
  errorCount: z.number(),
  averageResponseTime: z.number(),
  userSatisfaction: z.number().optional(),
  contextSwitches: z.number(),
  offlineTime: z.number(),
});

const UserBehaviorMetricsSchema = z.object({
  sessionId: z.string(),
  pageContext: z.string(),
  messageLength: z.number(),
  timeToFirstMessage: z.number(),
  messagesPerMinute: z.number(),
  toolRequestsPerSession: z.number(),
  errorRate: z.number(),
  satisfactionScore: z.number().optional(),
});

const PerformanceMetricsSchema = z.object({
  messageId: z.string(),
  requestTime: z.string().or(z.date()),
  responseTime: z.string().or(z.date()).optional(),
  duration: z.number().optional(),
  toolName: z.string().optional(),
  fromCache: z.boolean().optional(),
  success: z.boolean(),
  errorCode: z.string().optional(),
  retryCount: z.number(),
});

const ChatMetricsSchema = z.object({
  timestamp: z.string().or(z.date()),
  type: z.string(),
  data: z.record(z.string(), z.unknown()),
});

const ChatAnalyticsPayloadSchema = z.object({
  analytics: ChatAnalyticsSchema,
  behaviorMetrics: UserBehaviorMetricsSchema,
  performanceMetrics: z.array(PerformanceMetricsSchema),
  recentMetrics: z.array(ChatMetricsSchema),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAnalyticsRoutes(router: any) {
  /**
   * POST /v1/api/analytics/events
   * Receive batch of client-side analytics events
   */
  router.post(
    '/v1/api/analytics/events',
    async (request: Request, env: Env) => {
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

        // Write events to Analytics Engine if available
        if (env.ANALYTICS) {
          for (const event of events) {
            try {
              env.ANALYTICS.writeDataPoint({
                // Indexes (up to 20) - for querying/filtering
                indexes: [
                  event.type, // index1: event type
                  event.page, // index2: page path
                  sessionId, // index3: session ID
                  visitorId, // index4: visitor ID
                  event.action || '', // index5: action name
                ],
                // Doubles (up to 20) - for numeric aggregation
                doubles: [
                  event.timestamp, // double1: timestamp
                  1, // double2: event count (for aggregation)
                ],
                // Blobs (up to 20) - for additional context
                blobs: [
                  JSON.stringify(event.metadata || {}), // blob1: metadata
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
    }
  );

  /**
   * POST /v1/api/analytics/chat
   * Receive chat session analytics
   */
  router.post(
    '/v1/api/analytics/chat',
    async (request: Request, env: Env) => {
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

        if (env.ANALYTICS) {
          try {
            // Write session summary
            env.ANALYTICS.writeDataPoint({
              indexes: [
                'chat_session_summary', // index1: event type
                behaviorMetrics.pageContext, // index2: page path
                analytics.sessionId, // index3: session ID
                analytics.userId || 'anonymous', // index4: user ID
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
                  toolUsage: analytics.toolUsage,
                  behavior: behaviorMetrics,
                }), // blob1: detailed metrics
              ],
            });
          } catch (error) {
            console.error('Failed to write chat analytics:', error);
          }
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: buildDefaultHeaders(env) }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Failed to process chat analytics',
            message: error instanceof Error ? error.message : 'Unknown error',
          }),
          { status: 500, headers: buildDefaultHeaders(env) }
        );
      }
    }
  );

  /**
   * GET /v1/api/analytics/summary
   * Get analytics summary for the current session (debugging/testing)
   */
  router.get(
    '/v1/api/analytics/summary',
    async (request: Request, env: Env) => {
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

        // Note: Analytics Engine doesn't support real-time queries
        // This would typically use GraphQL API to query historical data
        // For now, return a placeholder response
        return new Response(
          JSON.stringify({
            message: 'Analytics summary',
            sessionId,
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
    }
  );
}
