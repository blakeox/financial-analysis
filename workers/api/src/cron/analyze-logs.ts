/**
 * Daily Log Analysis Worker (Cron Job)
 *
 * Analyzes Cloudflare HTTP logs stored in R2 to identify:
 * - Top offending IPs (high error rate, WAF blocks, rate limit violations)
 * - Suspicious patterns (prompt injection attempts, repeated failures)
 * - Traffic anomalies
 *
 * Generates a firewall blocklist and optionally updates WAF rules.
 *
 * Scheduled via wrangler.toml cron trigger (runs daily at 2 AM UTC).
 */

import type { Env } from '../types';

interface LogEntry {
  ClientIP: string;
  ClientRequestMethod: string;
  ClientRequestPath: string;
  EdgeResponseStatus: number;
  WAFAction?: string;
  WAFRuleID?: string;
  FirewallMatchesActions?: string[];
  ClientRequestUserAgent?: string;
  EdgeStartTimestamp: string;
  RayID: string;
}

interface IPStats {
  ip: string;
  totalRequests: number;
  errorRequests: number; // 4xx, 5xx
  wafBlocks: number;
  wafChallenges: number;
  rateLimitViolations: number;
  promptInjectionAttempts: number;
  errorRate: number;
  riskScore: number;
  firstSeen: string;
  lastSeen: string;
  userAgents: Set<string>;
}

const RISK_THRESHOLDS = {
  errorRate: 0.5, // 50% errors = high risk
  wafBlocks: 10, // 10+ WAF blocks = block
  promptInjection: 3, // 3+ prompt injection attempts = block
  minRequests: 5, // Minimum requests to consider blocking
};

/**
 * Parse NDJSON log file from R2
 */
async function parseLogFile(content: string): Promise<LogEntry[]> {
  const lines = content.trim().split('\n');
  const entries: LogEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line) as LogEntry;
      entries.push(entry);
    } catch (error) {
      console.error('Failed to parse log line:', error);
    }
  }

  return entries;
}

/**
 * Analyze logs and compute IP statistics
 */
function analyzeLogs(entries: LogEntry[]): Map<string, IPStats> {
  const stats = new Map<string, IPStats>();

  for (const entry of entries) {
    const ip = entry.ClientIP;
    if (!stats.has(ip)) {
      stats.set(ip, {
        ip,
        totalRequests: 0,
        errorRequests: 0,
        wafBlocks: 0,
        wafChallenges: 0,
        rateLimitViolations: 0,
        promptInjectionAttempts: 0,
        errorRate: 0,
        riskScore: 0,
        firstSeen: entry.EdgeStartTimestamp,
        lastSeen: entry.EdgeStartTimestamp,
        userAgents: new Set(),
      });
    }

    const stat = stats.get(ip);
    if (!stat) continue; // Should never happen, but satisfy TypeScript
    stat.totalRequests++;
    stat.lastSeen = entry.EdgeStartTimestamp;

    if (entry.ClientRequestUserAgent) {
      stat.userAgents.add(entry.ClientRequestUserAgent);
    }

    // Count errors
    if (entry.EdgeResponseStatus >= 400) {
      stat.errorRequests++;
    }

    // Count WAF actions
    if (entry.WAFAction === 'block') {
      stat.wafBlocks++;
    } else if (entry.WAFAction === 'challenge') {
      stat.wafChallenges++;
    }

    // Check for rate limiting (429 status)
    if (entry.EdgeResponseStatus === 429) {
      stat.rateLimitViolations++;
    }

    // Check for prompt injection attempts (WAF rule IDs 100001-100004)
    if (entry.WAFRuleID && ['100001', '100002', '100003', '100004'].includes(entry.WAFRuleID)) {
      stat.promptInjectionAttempts++;
    }
  }

  // Calculate risk scores
  for (const stat of stats.values()) {
    stat.errorRate = stat.errorRequests / stat.totalRequests;

    // Risk score: weighted sum of violations
    stat.riskScore =
      stat.wafBlocks * 10 +
      stat.promptInjectionAttempts * 20 +
      stat.rateLimitViolations * 5 +
      stat.errorRate * 50 +
      stat.wafChallenges * 2;
  }

  return stats;
}

/**
 * Generate blocklist of IPs exceeding thresholds
 */
function generateBlocklist(stats: Map<string, IPStats>): string[] {
  const blocklist: string[] = [];

  for (const stat of stats.values()) {
    if (stat.totalRequests < RISK_THRESHOLDS.minRequests) {
      continue; // Ignore low-traffic IPs
    }

    const shouldBlock =
      stat.errorRate > RISK_THRESHOLDS.errorRate ||
      stat.wafBlocks >= RISK_THRESHOLDS.wafBlocks ||
      stat.promptInjectionAttempts >= RISK_THRESHOLDS.promptInjection;

    if (shouldBlock) {
      blocklist.push(stat.ip);
    }
  }

  return blocklist;
}

/**
 * Write analysis results to R2
 */
async function writeAnalysisResults(
  bucket: R2Bucket | undefined,
  date: string,
  stats: Map<string, IPStats>,
  blocklist: string[]
): Promise<void> {
  if (!bucket) {
    console.error('R2 bucket not provided, skipping write');
    return;
  }

  // Convert stats to array and sort by risk score
  const sortedStats = Array.from(stats.values())
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 100); // Top 100 offenders

  // Serialize (convert Set to Array)
  const serializedStats = sortedStats.map((stat) => ({
    ...stat,
    userAgents: Array.from(stat.userAgents),
  }));

  const report = {
    date,
    timestamp: new Date().toISOString(),
    summary: {
      totalIPs: stats.size,
      totalBlocklisted: blocklist.length,
      totalRequests: Array.from(stats.values()).reduce((sum, s) => sum + s.totalRequests, 0),
    },
    topOffenders: serializedStats,
    blocklist,
  };

  // Write to R2
  const key = `analysis/${date}/security-report.json`;
  await bucket.put(key, JSON.stringify(report, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  });

  // Also write blocklist as a simple text file
  const blocklistKey = `analysis/${date}/blocklist.txt`;
  await bucket.put(blocklistKey, blocklist.join('\n'), {
    httpMetadata: { contentType: 'text/plain' },
  });

  console.log(`Analysis complete: ${blocklist.length} IPs blocklisted, report written to ${key}`);
}

/**
 * Process logs for a specific date
 */
async function processLogsForDate(
  bucket: R2Bucket | undefined,
  date: string
): Promise<{ stats: Map<string, IPStats>; blocklist: string[] }> {
  if (!bucket) {
    console.error('R2 bucket not provided');
    return { stats: new Map(), blocklist: [] };
  }

  console.log(`Processing logs for ${date}...`);

  // List all log files for the date
  const prefix = `http-logs/${date}/`;
  const listed = await bucket.list({ prefix });

  if (!listed.objects || listed.objects.length === 0) {
    console.log(`No logs found for ${date}`);
    return { stats: new Map(), blocklist: [] };
  }

  console.log(`Found ${listed.objects.length} log files`);

  let allEntries: LogEntry[] = [];

  // Download and parse each log file
  for (const obj of listed.objects) {
    const object = await bucket.get(obj.key);
    if (!object) continue;

    let content = await object.text();

    // Decompress if gzipped (Cloudflare Logpush typically gzips)
    if (obj.key.endsWith('.gz')) {
      // Note: Cloudflare Workers doesn't have built-in gzip decompression
      // You'll need to use a library or decompress client-side
      // For now, assume logs are not gzipped or use uncompressed Logpush
      console.warn(`Skipping gzipped file ${obj.key} (decompression not implemented)`);
      continue;
    }

    const entries = await parseLogFile(content);
    allEntries = allEntries.concat(entries);
  }

  console.log(`Parsed ${allEntries.length} log entries`);

  // Analyze
  const stats = analyzeLogs(allEntries);
  const blocklist = generateBlocklist(stats);

  console.log(`Analysis: ${stats.size} unique IPs, ${blocklist.length} blocklisted`);

  return { stats, blocklist };
}

/**
 * Cron handler - runs daily
 */
export async function handleDailyLogAnalysis(env: Env): Promise<Response> {
  console.log('Starting daily log analysis...');

  const bucket = env.DOCUMENTS;
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Analyze yesterday's logs
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateParts = yesterday.toISOString().split('T');
    const date = dateParts[0]; // YYYY-MM-DD
    if (!date) {
      throw new Error('Failed to generate date string');
    }

    const { stats, blocklist } = await processLogsForDate(bucket, date);

    // Write results
    await writeAnalysisResults(bucket, date, stats, blocklist);

    return new Response(
      JSON.stringify({
        ok: true,
        date,
        summary: {
          totalIPs: stats.size,
          blocklisted: blocklist.length,
        },
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Log analysis failed:', error);
    return new Response(
      JSON.stringify({
        error: 'Analysis failed',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
