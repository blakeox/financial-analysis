import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@financial-analysis/ui';
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
          <Card
            key={key}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')
                      ? formatPercentage(value)
                      : key.toLowerCase().includes('amount') ||
                          key.toLowerCase().includes('payment') ||
                          key.toLowerCase().includes('cost')
                        ? formatCurrency(value)
                        : formatNumber(value)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <span className="mr-2">💡</span>
        Key Insights
      </h3>
      <div className="space-y-3">
        {result.insights.map((insight, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
          >
            <span className="text-blue-500 font-bold">{index + 1}.</span>
            <p className="text-gray-700 dark:text-gray-300">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
        <span className="mr-2">🎯</span>
        Recommendations
      </h3>
      <div className="space-y-3">
        {result.recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
          >
            <span className="text-green-500 font-bold">{index + 1}.</span>
            <p className="text-gray-700 dark:text-gray-300">{recommendation}</p>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">📊</span>
          Visualizations
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {result.charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{chart.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
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
                    <p className="text-gray-600 dark:text-gray-400">
                      {chart.type.charAt(0).toUpperCase() + chart.type.slice(1)} Chart
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {chart.data.length} data points
                    </p>
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">📋</span>
          Detailed Data
        </h3>
        {result.tables.map((table, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{table.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      {table.headers.map((header, headerIndex) => (
                        <th
                          key={headerIndex}
                          className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b border-gray-100 dark:border-gray-800">
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="py-2 px-3 text-gray-700 dark:text-gray-300"
                          >
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
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <span className="mr-2">📊</span>
                Analysis Results
              </CardTitle>
              <CardDescription>
                Comprehensive analysis for {modelType.replace(/([A-Z])/g, ' $1').trim()}
              </CardDescription>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
            </button>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="mr-1">{tab.icon}</span>
                  {tab.label}
                </button>
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
