/**
 * Analytics Dashboard Component
 * Displays real-time API monitoring and page interaction analytics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { getApiMonitor, type ApiAnalysis, type ApiCallMetrics } from '../lib/api-monitor';
import { formatNumber } from '../lib/formatters';
import { badgeVariants, cn, textColors } from '../lib/classNames';

export interface AnalyticsDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AnalyticsDashboard({
  autoRefresh = true,
  refreshInterval = 5000,
}: AnalyticsDashboardProps) {
  const [analysis, setAnalysis] = useState<ApiAnalysis | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateAnalysis = () => {
      const monitor = getApiMonitor();
      const data = monitor.getAnalysis();
      setAnalysis(data);
      setLastUpdate(new Date());
    };

    // Initial update
    updateAnalysis();

    // Auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(updateAnalysis, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh, refreshInterval]);

  if (!analysis) {
    return (
      <Card variant="subtle">
        <CardContent className="p-6">
          <p className={cn('text-sm', textColors.muted)}>No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="interactive">
          <CardHeader>
            <CardTitle className={cn('text-sm font-medium', textColors.secondary)}>
              Total API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-950 dark:text-white">
              {analysis.totalCalls}
            </p>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <CardTitle className={cn('text-sm font-medium', textColors.secondary)}>
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-3xl font-bold', textColors.success)}>
              {analysis.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <CardTitle className={cn('text-sm font-medium', textColors.secondary)}>
              Avg Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-950 dark:text-white">
              {formatNumber(analysis.averageDuration, 0)}ms
            </p>
          </CardContent>
        </Card>

        <Card variant="interactive">
          <CardHeader>
            <CardTitle className={cn('text-sm font-medium', textColors.secondary)}>
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-3xl font-bold', textColors.accent)}>
              {analysis.cacheHitRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Slowest Calls */}
      {analysis.slowestCalls.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Slowest API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Endpoint
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Method
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Duration
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {analysis.slowestCalls.slice(0, 5).map((call: ApiCallMetrics, i: number) => (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-violet-50/40 dark:hover:bg-violet-950/20"
                    >
                      <td className="px-4 py-2 text-sm font-mono text-slate-900 dark:text-slate-100">
                        {call.endpoint}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                            badgeVariants.primary
                          )}
                        >
                          {call.method}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
                        {call.duration}ms
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                            call.success ? badgeVariants.success : badgeVariants.danger
                          )}
                        >
                          {call.statusCode || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Errors */}
      {analysis.recentErrors.length > 0 && (
        <Card variant="rail">
          <CardHeader>
            <CardTitle className={textColors.danger}>Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.recentErrors.slice(0, 5).map((error: ApiCallMetrics, i: number) => (
                <div
                  key={i}
                  className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 dark:border-rose-900/70 dark:bg-rose-950/30"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm text-slate-950 dark:text-white">
                        {error.method} {error.endpoint}
                      </p>
                      <p className={cn('mt-1 text-xs', textColors.danger)}>{error.errorMessage}</p>
                    </div>
                    <span className={cn('text-xs', textColors.muted)}>
                      {new Date(error.startTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Endpoint Statistics */}
      {analysis.endpointStats.size > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Endpoint Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead>
                  <tr>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Endpoint
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Calls
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Success
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Avg Duration
                    </th>
                    <th
                      className={cn(
                        'px-4 py-2 text-left text-xs font-medium uppercase',
                        textColors.muted
                      )}
                    >
                      Cache Hits
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {Array.from(analysis.endpointStats.values()).map((stats, i) => (
                    <tr
                      key={i}
                      className="transition-colors hover:bg-violet-50/40 dark:hover:bg-violet-950/20"
                    >
                      <td className="px-4 py-2 text-sm font-mono text-slate-900 dark:text-slate-100">
                        {stats.endpoint}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
                        {stats.callCount}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-semibold',
                            stats.successCount === stats.callCount
                              ? badgeVariants.success
                              : badgeVariants.warning
                          )}
                        >
                          {stats.successCount}/{stats.callCount}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200">
                        {formatNumber(stats.averageDuration, 0)}ms
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {stats.cacheHits > 0 ? (
                          <span
                            className={cn(
                              'rounded-full px-2.5 py-1 text-xs font-semibold',
                              badgeVariants.primary
                            )}
                          >
                            {stats.cacheHits}
                          </span>
                        ) : (
                          <span className={textColors.muted}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update */}
      <div className={cn('text-center text-sm', textColors.muted)}>
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}
