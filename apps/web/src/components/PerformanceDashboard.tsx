/**
 * Performance Dashboard React Component
 * Real-time performance monitoring UI with charts and alerts
 */

import React, { useEffect, useRef, useState } from 'react';
import type {
  AlertRule,
  PerformanceDashboard,
  PerformanceMetrics,
  SystemHealth,
} from '../scripts/_shared/performance-dashboard';

interface PerformanceDashboardProps {
  dashboard: PerformanceDashboard;
  className?: string;
}

type TimeRange = '5m' | '15m' | '1h' | '24h';
type PerformanceStats = ReturnType<PerformanceDashboard['getPerformanceStats']>;

interface AlertUpdate {
  id: string;
  name: string;
  severity: AlertRule['severity'];
  timestamp: Date;
  metrics: PerformanceMetrics[];
}

type DashboardUpdate =
  | { type: 'update'; data: { health: SystemHealth; stats: PerformanceStats } }
  | { type: 'alert'; data: AlertUpdate };

export const PerformanceDashboardComponent: React.FC<PerformanceDashboardProps> = ({
  dashboard,
  className = '',
}) => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [alerts, setAlerts] = useState<AlertUpdate[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('15m');

  const selectedRangeRef = useRef<TimeRange>(selectedTimeRange);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Subscribe to dashboard updates
    unsubscribeRef.current = dashboard.subscribe((update: DashboardUpdate) => {
      if (update.type === 'update') {
        setHealth(update.data.health);
        setStats(dashboard.getPerformanceStats(getTimeRangeMs(selectedRangeRef.current)));
      } else if (update.type === 'alert') {
        setAlerts((prev) => [update.data, ...prev.slice(0, 9)]); // Keep last 10 alerts
      }
    });

    // Initial data load
    setHealth(dashboard.getSystemHealth());
    setStats(dashboard.getPerformanceStats(getTimeRangeMs(selectedRangeRef.current)));

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [dashboard]);

  useEffect(() => {
    selectedRangeRef.current = selectedTimeRange;
    setStats(dashboard.getPerformanceStats(getTimeRangeMs(selectedTimeRange)));
  }, [dashboard, selectedTimeRange]);

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'fa-chip-muted';
    }
  };

  const getSeverityColor = (severity: AlertRule['severity']) => {
    switch (severity) {
      case 'low':
        return 'text-blue-600 bg-blue-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'fa-chip-muted';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getTimeRangeMs = (range: TimeRange) => {
    switch (range) {
      case '5m':
        return 300000;
      case '15m':
        return 900000;
      case '1h':
        return 3600000;
      case '24h':
        return 86400000;
      default:
        return 900000;
    }
  };

  if (!health || !stats) {
    return (
      <div className={`performance-dashboard ${className}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full size-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`performance-dashboard ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 fa-panel-divider">
        <div className="flex items-center space-x-3">
          <h3 className="fa-scenario-title">Performance Dashboard</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(health.status)}`}
          >
            {health.status.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as TimeRange)}
            aria-label="Select time range"
            className="fa-input-surface text-sm"
          >
            <option value="5m">Last 5 minutes</option>
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
          </select>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="fa-shell-icon-button h-9 w-9"
          >
            {isExpanded ? (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        <div className="fa-subcard">
          <div className="fa-meta-copy text-sm">Uptime</div>
          <div className="fa-panel-title text-2xl">{formatUptime(health.uptime)}</div>
        </div>

        <div className="fa-subcard">
          <div className="fa-meta-copy text-sm">Response Time</div>
          <div className="fa-panel-title text-2xl">
            {formatDuration(health.responseTime)}
          </div>
        </div>

        <div className="fa-subcard">
          <div className="fa-meta-copy text-sm">Error Rate</div>
          <div className="fa-panel-title text-2xl">
            {(health.errorRate * 100).toFixed(1)}%
          </div>
        </div>

        <div className="fa-subcard">
          <div className="fa-meta-copy text-sm">Throughput</div>
          <div className="fa-panel-title text-2xl">{stats.throughput.toFixed(1)}/s</div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 fa-panel-divider">
          <h4 className="fa-scenario-title mb-2 text-sm">Recent Alerts</h4>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className={`p-2 rounded ${getSeverityColor(alert.severity)}`}>
                <div className="fa-list-copy-strong">{alert.name}</div>
                <div className="text-xs opacity-75">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Performance Stats */}
          <div>
            <h4 className="fa-scenario-title mb-3 text-sm">Performance Statistics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="fa-subcard">
                <div className="fa-meta-copy mb-2 text-sm">Response Time Percentiles</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Average:</span>
                    <span>{formatDuration(stats.averageResponseTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>P95:</span>
                    <span>{formatDuration(stats.p95ResponseTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>P99:</span>
                    <span>{formatDuration(stats.p99ResponseTime)}</span>
                  </div>
                </div>
              </div>

              <div className="fa-subcard">
                <div className="fa-meta-copy mb-2 text-sm">Request Summary</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span>{stats.totalRequests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Successful:</span>
                    <span className="text-green-600">{stats.successfulRequests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Failed:</span>
                    <span className="text-red-600">{stats.failedRequests}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Operations */}
          {stats.topOperations.length > 0 && (
            <div>
              <h4 className="fa-scenario-title mb-3 text-sm">Top Operations</h4>
              <div className="fa-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left fa-help-copy uppercase tracking-wider">Operation</th>
                        <th className="px-4 py-2 text-right fa-help-copy uppercase tracking-wider">Count</th>
                        <th className="px-4 py-2 text-right fa-help-copy uppercase tracking-wider">Avg Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topOperations.map((op, index) => (
                        <tr key={index} className="fa-panel-divider-top">
                          <td className="px-4 py-2 fa-list-copy-strong">{op.operation}</td>
                          <td className="px-4 py-2 text-right fa-list-copy">{op.count}</td>
                          <td className="px-4 py-2 text-right fa-list-copy">{formatDuration(op.avgDuration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Top Errors */}
          {stats.topErrors.length > 0 && (
            <div>
              <h4 className="fa-scenario-title mb-3 text-sm">Top Errors</h4>
              <div className="fa-card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left fa-help-copy uppercase tracking-wider">Error Code</th>
                        <th className="px-4 py-2 text-right fa-help-copy uppercase tracking-wider">Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topErrors.map((error, index) => (
                        <tr key={index} className="fa-panel-divider-top">
                          <td className="px-4 py-2 font-medium text-red-600">{error.errorCode}</td>
                          <td className="px-4 py-2 text-right fa-list-copy">{error.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 fa-panel-divider-top">
            <div className="fa-meta-copy text-sm">
              Last updated: {health.lastUpdated.toLocaleTimeString()}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const data = dashboard.exportMetrics('json');
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="fa-button-primary text-sm"
              >
                Export JSON
              </button>

              <button
                onClick={() => {
                  const data = dashboard.exportMetrics('csv');
                  const blob = new Blob([data], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Export CSV
              </button>

              <button
                onClick={() => dashboard.clearMetrics()}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboardComponent;
