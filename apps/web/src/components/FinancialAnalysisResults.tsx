import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@financial-analysis/ui';
import React, { useEffect, useState } from 'react';

interface AnalysisResult {
  modelType: string;
  summary: Record<string, unknown>;
  details: Record<string, unknown>;
  insights: string[];
  recommendations: string[];
  charts?: Array<{
    type: 'line' | 'bar' | 'pie' | 'area';
    title: string;
    data: unknown[];
    config?: Record<string, unknown>;
  }>;
  tables?: Array<{
    title: string;
    headers: string[];
    rows: unknown[][];
  }>;
}

interface FinancialAnalysisResultsProps {
  result?: AnalysisResult;
  modelType?: string;
  className?: string;
}

export const FinancialAnalysisResults: React.FC<FinancialAnalysisResultsProps> = ({
  result,
  modelType = 'general',
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isExpanded, setIsExpanded] = useState(false);

  // Listen for analysis result updates
  useEffect(() => {
    const handleAnalysisUpdate = (event: CustomEvent) => {
      const { modelType: updatedModelType, result: updatedResult } = event.detail;
      if (updatedModelType === modelType) {
        // Update the result if it matches our model type
        console.log('Analysis result updated:', updatedResult);
      }
    };

    document.addEventListener('analysis-result-updated', handleAnalysisUpdate as EventListener);
    return () => {
      document.removeEventListener(
        'analysis-result-updated',
        handleAnalysisUpdate as EventListener
      );
    };
  }, [modelType]);

  if (!result) {
    return null;
  }

  const formatCurrency = (value: unknown): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return String(value);
  };

  const formatPercentage = (value: unknown): string => {
    if (typeof value === 'number') {
      return `${(value * 100).toFixed(2)}%`;
    }
    return String(value);
  };

  const formatNumber = (value: unknown): string => {
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US').format(value);
    }
    return String(value);
  };

  const renderSummaryCards = () => {
    const summaryEntries = Object.entries(result.summary);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryEntries.map(([key, value]) => (
          <Card key={key} variant="interactive" className="fa-highlight-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="fa-meta-copy text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="fa-panel-title text-2xl">
                    {key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')
                      ? formatPercentage(value)
                      : key.toLowerCase().includes('amount') ||
                          key.toLowerCase().includes('payment') ||
                          key.toLowerCase().includes('cost')
                        ? formatCurrency(value)
                        : formatNumber(value)}
                  </p>
                </div>
                <div className="fa-icon-tile fa-icon-tile-lg fa-icon-tile-info">
                  <span className="text-xl">{getSummaryIcon(key)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const getSummaryIcon = (key: string): string => {
    const iconMap: Record<string, string> = {
      monthlyPayment: '💰',
      totalInterest: '📈',
      totalPayments: '💳',
      annualRate: '📊',
      principal: '🏦',
      termMonths: '📅',
      paymentCount: '🔢',
      interestRate: '📊',
      loanAmount: '🏦',
      remainingBalance: '⚖️',
      equity: '🏠',
      savings: '💎',
      roi: '📈',
      npv: '💵',
      irr: '📊',
    };
    return iconMap[key] || '📋';
  };

  const renderInsights = () => (
    <div className="space-y-4">
      <h3 className="fa-scenario-title flex items-center">
        <span className="mr-2">💡</span>
        Key Insights
      </h3>
      <div className="space-y-3">
        {result.insights.map((insight, index) => (
          <div key={index} className="fa-highlight-card flex items-start space-x-3 p-3">
            <span className="font-bold text-violet-500">{index + 1}.</span>
            <p className="fa-list-copy">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      <h3 className="fa-scenario-title flex items-center">
        <span className="mr-2">🎯</span>
        Recommendations
      </h3>
      <div className="space-y-3">
        {result.recommendations.map((recommendation, index) => (
          <div key={index} className="fa-highlight-card flex items-start space-x-3 p-3">
            <span className="font-bold text-emerald-500">{index + 1}.</span>
            <p className="fa-list-copy">{recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCharts = () => {
    if (!result.charts || result.charts.length === 0) {
      return null;
    }

    return (
      <div className="space-y-6">
        <h3 className="fa-scenario-title flex items-center">
          <span className="mr-2">📊</span>
          Visualizations
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {result.charts.map((chart, index) => (
            <Card key={index} variant="elevated">
              <CardHeader>
                <CardTitle className="fa-scenario-title text-lg">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="fa-subcard h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">
                      {chart.type === 'line'
                        ? '📈'
                        : chart.type === 'bar'
                          ? '📊'
                          : chart.type === 'pie'
                            ? '🥧'
                            : '📊'}
                    </div>
                    <p className="fa-meta-copy">
                      {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart
                    </p>
                    <p className="fa-help-copy mt-1">{chart.data.length} data points</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTables = () => {
    if (!result.tables || result.tables.length === 0) {
      return null;
    }

    return (
      <div className="space-y-6">
        <h3 className="fa-scenario-title flex items-center">
          <span className="mr-2">📋</span>
          Detailed Data
        </h3>
        {result.tables.map((table, index) => (
          <Card key={index} variant="elevated">
            <CardHeader>
              <CardTitle className="fa-scenario-title text-lg">{table.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="fa-panel-divider">
                      {table.headers.map((header, headerIndex) => (
                        <th key={headerIndex} className="fa-scenario-title py-2 px-3 text-left">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="py-2 px-3 fa-list-copy">
                            {typeof cell === 'number' && cellIndex > 0
                              ? cellIndex === 1 &&
                                table.headers[cellIndex].toLowerCase().includes('rate')
                                ? formatPercentage(cell)
                                : cellIndex === 1 &&
                                    (table.headers[cellIndex].toLowerCase().includes('amount') ||
                                      table.headers[cellIndex].toLowerCase().includes('payment'))
                                  ? formatCurrency(cell)
                                  : formatNumber(cell)
                              : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'recommendations', label: 'Recommendations', icon: '🎯' },
    { id: 'charts', label: 'Charts', icon: '📈' },
    { id: 'tables', label: 'Data', icon: '📋' },
  ];

  return (
    <div className={`financial-analysis-results ${className}`}>
      <Card variant="elevated" className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="fa-panel-title flex items-center text-xl">
                <span className="mr-2">📊</span>
                Analysis Results
              </CardTitle>
              <CardDescription>
                Comprehensive analysis for {modelType.replace(/([A-Z])/g, ' $1').trim()}
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full p-0 transition-transform"
            >
              <svg
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 fa-panel-divider">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  variant={activeTab === tab.id ? 'primary' : 'outline'}
                  size="sm"
                  className="rounded-full"
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
              {activeTab === 'summary' && renderSummaryCards()}
              {activeTab === 'insights' && renderInsights()}
              {activeTab === 'recommendations' && renderRecommendations()}
              {activeTab === 'charts' && renderCharts()}
              {activeTab === 'tables' && renderTables()}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FinancialAnalysisResults;
