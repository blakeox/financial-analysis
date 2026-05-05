import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@financial-analysis/ui';
import React, { useEffect, useState } from 'react';
import { FinancialAnalysisEngine } from '../scripts/analysis/financial-analysis-engine';

declare global {
  interface Window {
    injectAnalysisData?: (data: Record<string, unknown>) => void;
  }
}

// Define DetailedAnalysis interface locally since it's not exported
interface DetailedAnalysis {
  summary: Record<string, unknown>;
  insights: Array<{
    category: 'financial' | 'risk' | 'opportunity' | 'optimization';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    category: 'immediate' | 'short-term' | 'long-term';
    title: string;
    description: string;
    potentialSavings?: number;
    effort: 'low' | 'medium' | 'high';
  }>;
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    factors: Array<{ factor: string; risk: 'low' | 'medium' | 'high'; description: string }>;
  };
  optimizationOpportunities: Array<{
    area: string;
    currentValue: number;
    optimizedValue: number;
    potentialImprovement: number;
    description: string;
  }>;
}

interface EnhancedAnalysisResultsProps {
  modelType: string;
  modelData: Record<string, unknown>;
  className?: string;
}

export const EnhancedAnalysisResults: React.FC<EnhancedAnalysisResultsProps> = ({
  modelType,
  modelData,
  className = '',
}) => {
  console.log('EnhancedAnalysisResults component mounted', { modelType, modelData, className });

  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Debug activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab);
  }, [activeTab]);

  // Debug component mount
  useEffect(() => {
    console.log('EnhancedAnalysisResults mounted with props:', { modelType, modelData });
  }, []);

  // Add a direct data injection method for debugging
  useEffect(() => {
    // Expose a global method for direct data injection
    window.injectAnalysisData = (data: Record<string, unknown>) => {
      console.log('EnhancedAnalysisResults: Direct data injection called with:', data);
      setCurrentModelData(data);
      generateAnalysis();
    };

    // Also listen for any custom events that might be missed
    const handleAnyAnalysisEvent = (event: CustomEvent) => {
      console.log(
        'EnhancedAnalysisResults: Received any analysis event:',
        event.type,
        event.detail
      );
      if (event.detail && typeof event.detail === 'object') {
        setCurrentModelData(event.detail as Record<string, unknown>);
        generateAnalysis();
      }
    };

    // Listen for multiple event types
    const eventTypes = [
      'analysis-result-updated',
      'data-updated',
      'amortization-analysis-ready',
      'analysis-data-ready',
      'calculator-completed',
    ];

    eventTypes.forEach((eventType) => {
      document.addEventListener(eventType, handleAnyAnalysisEvent as EventListener);
      window.addEventListener(eventType, handleAnyAnalysisEvent as EventListener);
    });

    return () => {
      eventTypes.forEach((eventType) => {
        document.removeEventListener(eventType, handleAnyAnalysisEvent as EventListener);
        window.removeEventListener(eventType, handleAnyAnalysisEvent as EventListener);
      });
      delete window.injectAnalysisData;
    };
  }, []);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentModelData, setCurrentModelData] = useState<Record<string, unknown>>(modelData);

  // Don't set sample data - wait for real data from the calculator

  useEffect(() => {
    if (modelData && Object.keys(modelData).length > 0) {
      setCurrentModelData(modelData);
      generateAnalysis();
    }
  }, [modelData, modelType]);

  // Listen for analysis result updates
  useEffect(() => {
    const handleAnalysisUpdate = (event: CustomEvent) => {
      console.log('EnhancedAnalysisResults: Received analysis update event', event.detail);
      const { modelType: updatedModelType, result: updatedResult } = event.detail;
      console.log('EnhancedAnalysisResults: Model type match?', updatedModelType === modelType);
      if (updatedModelType === modelType) {
        console.log('EnhancedAnalysisResults: Updating model data', updatedResult);
        setCurrentModelData(updatedResult);
        generateAnalysis();
      } else {
        console.log('EnhancedAnalysisResults: Model type mismatch, ignoring event');
      }
    };

    const handleDataUpdate = (event: CustomEvent) => {
      console.log('EnhancedAnalysisResults: Received direct data update event', event.detail);
      setCurrentModelData(event.detail);
      generateAnalysis();
    };

    const handleGlobalAnalysisReady = (event: CustomEvent) => {
      console.log('EnhancedAnalysisResults: Received global analysis ready event', event.detail);
      if (modelType === 'amortization') {
        setCurrentModelData(event.detail);
        generateAnalysis();
      }
    };

    console.log('EnhancedAnalysisResults: Setting up event listeners for modelType:', modelType);
    document.addEventListener('analysis-result-updated', handleAnalysisUpdate as EventListener);
    document.addEventListener('data-updated', handleDataUpdate as EventListener);
    window.addEventListener(
      'amortization-analysis-ready',
      handleGlobalAnalysisReady as EventListener
    );

    return () => {
      console.log('EnhancedAnalysisResults: Cleaning up event listeners');
      document.removeEventListener(
        'analysis-result-updated',
        handleAnalysisUpdate as EventListener
      );
      document.removeEventListener('data-updated', handleDataUpdate as EventListener);
      window.removeEventListener(
        'amortization-analysis-ready',
        handleGlobalAnalysisReady as EventListener
      );
    };
  }, [modelType]);

  const generateAnalysis = async () => {
    console.log('EnhancedAnalysisResults: generateAnalysis called', {
      currentModelData,
      modelType,
    });

    if (!currentModelData || Object.keys(currentModelData).length === 0) {
      console.log('EnhancedAnalysisResults: No model data, skipping analysis');
      return;
    }

    if (
      typeof currentModelData === 'object' &&
      'summary' in currentModelData &&
      'insights' in currentModelData &&
      Array.isArray((currentModelData as unknown as DetailedAnalysis).insights)
    ) {
      console.log('EnhancedAnalysisResults: Using provided comprehensive analysis payload');
      setAnalysis(currentModelData as unknown as DetailedAnalysis);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      let detailedAnalysis: DetailedAnalysis;

      switch (modelType) {
        case 'amortization':
          detailedAnalysis = FinancialAnalysisEngine.analyzeAmortization({
            principal: Number(currentModelData.principal) || 0,
            annualRate: Number(currentModelData.annualRate) || 0,
            termMonths: Number(currentModelData.termMonths) || 0,
            extraPayment: Number(currentModelData.extraPayment) || 0,
            monthlyPayment: Number(currentModelData.monthlyPayment) || undefined,
            totalInterest: Number(currentModelData.totalInterest) || undefined,
            totalPayments: Number(currentModelData.totalPayments) || undefined,
          });
          break;

        case 'lease':
          detailedAnalysis = FinancialAnalysisEngine.analyzeLease({
            principal: Number(currentModelData.principal) || 0,
            annualRate: Number(currentModelData.annualRate) || 0,
            termMonths: Number(currentModelData.termMonths) || 0,
            residualValue: Number(currentModelData.residualValue) || 0,
            monthlyPayment: Number(currentModelData.monthlyPayment) || undefined,
            totalCost: Number(currentModelData.totalCost) || undefined,
          });
          break;

        case 'investment-portfolio':
          detailedAnalysis = FinancialAnalysisEngine.analyzeInvestmentPortfolio({
            currentValue: Number(currentModelData.currentValue) || 0,
            monthlyContribution: Number(currentModelData.monthlyContribution) || 0,
            expectedReturn: Number(currentModelData.expectedReturn) || 0,
            timeHorizon: Number(currentModelData.timeHorizon) || 0,
            riskTolerance:
              (currentModelData.riskTolerance as 'conservative' | 'moderate' | 'aggressive') ||
              'moderate',
          });
          break;

        default:
          // Fallback for other model types
          detailedAnalysis = {
            summary: currentModelData,
            insights: [],
            recommendations: [],
            riskAssessment: { overallRisk: 'low', factors: [] },
            optimizationOpportunities: [],
          };
      }

      setAnalysis(detailedAnalysis);
    } catch (error) {
      console.error('Error generating analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getImpactColor = (impact: 'low' | 'medium' | 'high'): string => {
    switch (impact) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'fa-chip-muted';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      default:
        return 'fa-chip-muted';
    }
  };

  const renderSummaryCards = () => {
    if (!analysis) return null;

    const summaryEntries = Object.entries(analysis.summary);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {summaryEntries.map(([key, value]) => (
          <Card
            key={key}
            className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="fa-meta-copy text-sm capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="fa-panel-title text-2xl">
                    {key.toLowerCase().includes('rate') ||
                    key.toLowerCase().includes('percentage') ||
                    key.toLowerCase().includes('ratio')
                      ? formatPercentage(value)
                      : key.toLowerCase().includes('amount') ||
                          key.toLowerCase().includes('payment') ||
                          key.toLowerCase().includes('cost') ||
                          key.toLowerCase().includes('value')
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
      futureValue: '🚀',
      totalContributions: '💼',
      totalGains: '📈',
      annualizedReturn: '📊',
      residualValue: '🏷️',
      totalCost: '💸',
      costPerMonth: '📅',
      yearsToPayoff: '⏰',
      firstYearInterest: '🔢',
      lastYearInterest: '🔢',
      equityBuildRate: '📈',
      extraPayment: '➕',
      interestToPrincipalRatio: '📊',
      paymentToIncomeRatio: '📊',
    };
    return iconMap[key] || '📋';
  };

  const renderInsights = () => {
    if (!analysis || analysis.insights.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="fa-scenario-title flex items-center">
          <span className="mr-2">💡</span>
          Key Insights
        </h3>
        <div className="space-y-3">
          {analysis.insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${getImpactColor(insight.impact)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="fa-scenario-title mb-1">
                    {insight.title}
                  </h4>
                  <p className="fa-list-copy">{insight.description}</p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}
                  >
                    {insight.impact.toUpperCase()}
                  </span>
                  {insight.actionable && (
                      <span className="fa-chip fa-chip-accent">
                        ACTIONABLE
                      </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!analysis || analysis.recommendations.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="fa-scenario-title flex items-center">
          <span className="mr-2">🎯</span>
          Recommendations
        </h3>
        <div className="space-y-3">
          {analysis.recommendations.map((recommendation, index) => (
            <div key={index} className="fa-subcard p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="fa-scenario-title">
                  {recommendation.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(recommendation.priority)}`}
                  >
                    {recommendation.priority.toUpperCase()}
                  </span>
                  <span className="fa-chip fa-chip-muted">
                    {recommendation.category.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="fa-list-copy mb-2">{recommendation.description}</p>
              <div className="flex items-center justify-between fa-meta-copy text-sm">
                <span>Effort: {recommendation.effort}</span>
                {recommendation.potentialSavings && (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    Potential Savings: {formatCurrency(recommendation.potentialSavings)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRiskAssessment = () => {
    if (!analysis) return null;

    return (
      <div className="space-y-4">
        <h3 className="fa-scenario-title flex items-center">
          <span className="mr-2">⚠️</span>
          Risk Assessment
        </h3>
        <div className="fa-subcard p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="fa-scenario-title">Overall Risk Level</h4>
            <span
              className={`fa-chip-status ${getImpactColor(analysis.riskAssessment.overallRisk)}`}
            >
              {analysis.riskAssessment.overallRisk.toUpperCase()}
            </span>
          </div>
          <div className="space-y-2">
            {analysis.riskAssessment.factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 fa-panel-divider-soft last:border-b-0"
              >
                <span className="fa-list-copy">{factor.factor}</span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(factor.risk)}`}
                  >
                    {factor.risk.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderOptimizationOpportunities = () => {
    if (!analysis || analysis.optimizationOpportunities.length === 0) return null;

    return (
      <div className="space-y-4">
        <h3 className="fa-scenario-title flex items-center">
          <span className="mr-2">🚀</span>
          Optimization Opportunities
        </h3>
        <div className="space-y-3">
          {analysis.optimizationOpportunities.map((opportunity, index) => (
            <div
              key={index}
              className="p-4 bg-linear-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-700"
            >
              <h4 className="fa-scenario-title mb-2">
                {opportunity.area}
              </h4>
              <p className="fa-list-copy mb-3">{opportunity.description}</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="fa-meta-copy">Current:</span>
                  <p className="fa-scenario-title">
                    {typeof opportunity.currentValue === 'number' && opportunity.currentValue > 1000
                      ? formatCurrency(opportunity.currentValue)
                      : formatNumber(opportunity.currentValue)}
                  </p>
                </div>
                <div>
                  <span className="fa-meta-copy">Optimized:</span>
                  <p className="fa-scenario-title">
                    {typeof opportunity.optimizedValue === 'number' &&
                    opportunity.optimizedValue > 1000
                      ? formatCurrency(opportunity.optimizedValue)
                      : formatNumber(opportunity.optimizedValue)}
                  </p>
                </div>
                <div>
                  <span className="fa-meta-copy">Improvement:</span>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(opportunity.potentialImprovement)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'insights', label: 'Insights', icon: '💡' },
    { id: 'recommendations', label: 'Recommendations', icon: '🎯' },
    { id: 'risk', label: 'Risk Assessment', icon: '⚠️' },
    { id: 'optimization', label: 'Optimization', icon: '🚀' },
  ];

  if (isLoading) {
    return (
      <Card className={`shadow-lg ${className}`}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 fa-meta-copy">Generating analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <div className={`enhanced-analysis-results ${className}`}>
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="fa-panel-title text-xl flex items-center">
                  <span className="mr-2">📊</span>
                  Comprehensive Analysis
                </CardTitle>
                <CardDescription>
                  Detailed insights and recommendations for{' '}
                  {modelType.replace(/([A-Z])/g, ' $1').trim()}
                </CardDescription>
              </div>
              <button
                type="button"
                aria-label={isExpanded ? 'Collapse analysis' : 'Expand analysis'}
                onClick={() => setIsExpanded(!isExpanded)}
                className="fa-shell-icon-button h-9 w-9 transition-transform"
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
              <div className="flex flex-wrap gap-2 mb-6 fa-panel-divider">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Tab clicked:', tab.id);
                      setActiveTab(tab.id);
                    }}
                    className={`fa-tab-button cursor-pointer border relative z-20 pointer-events-auto select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                      activeTab === tab.id
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'fa-tab-inactive hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
                    }`}
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Empty State */}
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="fa-scenario-title mb-2">
                    No Analysis Data Yet
                  </h3>
                  <p className="fa-meta-copy mb-4">
                    Run an amortization calculation to see detailed insights, recommendations, and
                    risk assessment.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className={`enhanced-analysis-results ${className}`} data-enhanced-analysis="true">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="fa-panel-title text-xl flex items-center">
                <span className="mr-2">📊</span>
                Comprehensive Analysis
              </CardTitle>
              <CardDescription>
                Detailed insights and recommendations for{' '}
                {modelType.replace(/([A-Z])/g, ' $1').trim()}
              </CardDescription>
            </div>
            <button
              type="button"
              aria-label={isExpanded ? 'Collapse analysis' : 'Expand analysis'}
              onClick={() => setIsExpanded(!isExpanded)}
              className="fa-shell-icon-button h-9 w-9 transition-transform"
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
            <div className="flex flex-wrap gap-2 mb-6 fa-panel-divider">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Tab clicked:', tab.id);
                    setActiveTab(tab.id);
                  }}
                  className={`fa-tab-button cursor-pointer border relative z-20 pointer-events-auto select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'fa-tab-inactive hover:bg-gray-100 dark:hover:bg-gray-800 border-transparent'
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
              {activeTab === 'risk' && renderRiskAssessment()}
              {activeTab === 'optimization' && renderOptimizationOpportunities()}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default EnhancedAnalysisResults;
