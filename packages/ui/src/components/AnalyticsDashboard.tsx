/**
 * Analytics Dashboard Component
 * Displays real-time API monitoring and page interaction analytics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { getApiMonitor, type ApiAnalysis, type ApiCallMetrics } from '../lib/api-monitor';
import { formatNumber } from '../lib/formatters';

export interface AnalyticsDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function AnalyticsDashboard({ 
  autoRefresh = true, 
  refreshInterval = 5000 
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
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Total API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analysis.totalCalls}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {analysis.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {formatNumber(analysis.averageDuration, 0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Cache Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {analysis.cacheHitRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Slowest Calls */}
      {analysis.slowestCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Slowest API Calls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Endpoint
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analysis.slowestCalls.slice(0, 5).map((call: ApiCallMetrics, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-mono">{call.endpoint}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {call.method}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{call.duration}ms</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            call.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
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
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Recent Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.recentErrors.slice(0, 5).map((error: ApiCallMetrics, i: number) => (
                <div
                  key={i}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm">
                        {error.method} {error.endpoint}
                      </p>
                      <p className="text-xs text-red-600 mt-1">{error.errorMessage}</p>
                    </div>
                    <span className="text-xs text-gray-500">
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
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Endpoint
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Calls
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Success
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Avg Duration
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Cache Hits
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from(analysis.endpointStats.values()).map((stats, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-mono">{stats.endpoint}</td>
                      <td className="px-4 py-2 text-sm">{stats.callCount}</td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            stats.successCount === stats.callCount
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {stats.successCount}/{stats.callCount}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {formatNumber(stats.averageDuration, 0)}ms
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {stats.cacheHits > 0 ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {stats.cacheHits}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
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
      <div className="text-sm text-gray-500 text-center">
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
}
