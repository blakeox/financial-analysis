/**
 * LLM Metrics Collector
 * Tracks usage, performance, and quality metrics for LLM operations
 */

import type { KVNamespace } from '@cloudflare/workers-types';

export interface LLMMetrics {
  requestId: string;
  timestamp: number;
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  latency: number; // milliseconds
  cacheHit: boolean;
  success: boolean;
  errorType?: string | undefined;
  retryCount: number;
  intent?: string | undefined;
  cost?: number | undefined; // estimated cost in USD
}

export interface DailyStats {
  date: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  totalTokens: number;
  totalCost: number;
  cacheHitRate: number;
  requestsByModel: Record<string, number>;
  requestsByIntent: Record<string, number>;
}

export class LLMMetricsCollector {
  private readonly RETENTION_DAYS = 7;

  constructor(private kv: KVNamespace) {}

  /**
   * Record a request's metrics
   */
  async recordRequest(metrics: LLMMetrics): Promise<void> {
    const key = `metrics:${metrics.timestamp}:${metrics.requestId}`;
    
    // Store individual metrics
    await this.kv.put(
      key,
      JSON.stringify(metrics),
      { expirationTtl: this.RETENTION_DAYS * 24 * 3600 }
    );

    // Update daily aggregates
    await this.updateDailyStats(metrics);
  }

  /**
   * Update daily statistics
   */
  private async updateDailyStats(metrics: LLMMetrics): Promise<void> {
    const date = new Date(metrics.timestamp).toISOString().split('T')[0];
    const statsKey = `stats:daily:${date}`;
    
    // Get existing stats
    const existing = await this.kv.get(statsKey);
    const stats: DailyStats = existing
      ? JSON.parse(existing)
      : {
          date,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
          totalTokens: 0,
          totalCost: 0,
          cacheHitRate: 0,
          requestsByModel: {},
          requestsByIntent: {},
        };

    // Update stats
    stats.totalRequests++;
    if (metrics.success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }

    // Rolling average for latency
    stats.averageLatency = (stats.averageLatency * (stats.totalRequests - 1) + metrics.latency) / stats.totalRequests;
    
    stats.totalTokens += metrics.totalTokens;
    stats.totalCost += metrics.cost || 0;
    
    // Cache hit rate
    const cacheHits = (stats.cacheHitRate * (stats.totalRequests - 1) + (metrics.cacheHit ? 1 : 0)) / stats.totalRequests;
    stats.cacheHitRate = cacheHits;

    // By model
    stats.requestsByModel[metrics.model] = (stats.requestsByModel[metrics.model] || 0) + 1;

    // By intent
    if (metrics.intent) {
      stats.requestsByIntent[metrics.intent] = (stats.requestsByIntent[metrics.intent] || 0) + 1;
    }

    // Save updated stats
    await this.kv.put(statsKey, JSON.stringify(stats), {
      expirationTtl: this.RETENTION_DAYS * 24 * 3600,
    });
  }

  /**
   * Get daily statistics
   */
  async getDailyStats(date: string): Promise<DailyStats | null> {
    const statsKey = `stats:daily:${date}`;
    const data = await this.kv.get(statsKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Get multi-day statistics
   */
  async getMultiDayStats(startDate: string, endDate: string): Promise<DailyStats[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const stats: DailyStats[] = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      if (dateStr) {
        const dayStats = await this.getDailyStats(dateStr);
        if (dayStats) {
          stats.push(dayStats);
        }
      }
    }

    return stats;
  }

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats(days: number = 7): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    totalCost: number;
    averageCostPerRequest: number;
    cacheHitRate: number;
    topModels: Array<{ model: string; count: number }>;
    topIntents: Array<{ intent: string; count: number }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const endDateStr = endDate.toISOString().split('T')[0];
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const stats = await this.getMultiDayStats(
      startDateStr || '',
      endDateStr || ''
    );

    const aggregated = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalLatency: 0,
      totalCost: 0,
      totalCacheHits: 0,
      byModel: {} as Record<string, number>,
      byIntent: {} as Record<string, number>,
    };

    for (const s of stats) {
      aggregated.totalRequests += s.totalRequests;
      aggregated.successfulRequests += s.successfulRequests;
      aggregated.failedRequests += s.failedRequests;
      aggregated.totalLatency += s.averageLatency * s.totalRequests;
      aggregated.totalCost += s.totalCost;
      aggregated.totalCacheHits += s.cacheHitRate * s.totalRequests;

      for (const [model, count] of Object.entries(s.requestsByModel)) {
        aggregated.byModel[model] = (aggregated.byModel[model] || 0) + count;
      }

      for (const [intent, count] of Object.entries(s.requestsByIntent)) {
        aggregated.byIntent[intent] = (aggregated.byIntent[intent] || 0) + count;
      }
    }

    const averageLatency = aggregated.totalRequests > 0 
      ? aggregated.totalLatency / aggregated.totalRequests 
      : 0;

    const topModels = Object.entries(aggregated.byModel)
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topIntents = Object.entries(aggregated.byIntent)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests: aggregated.totalRequests,
      successfulRequests: aggregated.successfulRequests,
      failedRequests: aggregated.failedRequests,
      averageLatency,
      totalCost: aggregated.totalCost,
      averageCostPerRequest: aggregated.totalRequests > 0 
        ? aggregated.totalCost / aggregated.totalRequests 
        : 0,
      cacheHitRate: aggregated.totalRequests > 0
        ? aggregated.totalCacheHits / aggregated.totalRequests
        : 0,
      topModels,
      topIntents,
    };
  }

  /**
   * Estimate cost based on token usage
   */
  static estimateCost(model: string, promptTokens: number, responseTokens: number): number {
    // Prices per 1M tokens (as of common models, update as needed)
    const prices: Record<string, { input: number; output: number }> = {
      '@cf/meta/llama-3-8b-instruct': { input: 0.05, output: 0.15 },
      '@cf/meta/llama-3.1-8b-instruct': { input: 0.05, output: 0.15 },
      '@hf/meta-llama/Meta-Llama-3-8B-Instruct': { input: 0.05, output: 0.15 },
      default: { input: 0.10, output: 0.30 },
    };

    const modelPrices = prices[model] || prices.default;
    if (!modelPrices) {
      return 0;
    }
    const inputCost = (promptTokens / 1_000_000) * modelPrices.input;
    const outputCost = (responseTokens / 1_000_000) * modelPrices.output;
    
    return inputCost + outputCost;
  }
}

