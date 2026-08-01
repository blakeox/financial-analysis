import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  textColors,
} from '@financial-analysis/ui';
import type { BadgeVariant } from '@financial-analysis/ui';
import React, { useCallback, useEffect, useState } from 'react';
import { normalizeAnalysisResultEventDetail } from '../scripts/analysis/analysis-event-contract';
import { FinancialAnalysisEngine } from '../scripts/analysis/financial-analysis-engine';

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
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [isExpanded, setIsExpanded] = useState(true);

  const generateAnalysis = useCallback(
    async (data: Record<string, unknown>) => {
      if (!data || Object.keys(data).length === 0) {
        return;
      }

      if (
        typeof data === 'object' &&
        'summary' in data &&
        'insights' in data &&
        Array.isArray((data as unknown as DetailedAnalysis).insights)
      ) {
        setAnalysis(data as unknown as DetailedAnalysis);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const detailedAnalysis = FinancialAnalysisEngine.analyzeForModelType(modelType, data);
        setAnalysis(detailedAnalysis);
      } catch (error) {
        console.error('Error generating analysis:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [modelType]
  );

  useEffect(() => {
    if (modelData && Object.keys(modelData).length > 0) {
      void generateAnalysis(modelData);
    }
  }, [modelData, generateAnalysis]);

  useEffect(() => {
    const handleAnalysisUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      const normalized = normalizeAnalysisResultEventDetail(event.detail);
      if (!normalized || normalized.modelType !== modelType) return;

      const payload =
        normalized.result && typeof normalized.result === 'object'
          ? (normalized.result as Record<string, unknown>)
          : { value: normalized.result };

      void generateAnalysis(payload);
    };

    const handleDataUpdate = (event: Event) => {
      if (!(event instanceof CustomEvent)) return;
      if (!event.detail || typeof event.detail !== 'object') return;
      void generateAnalysis(event.detail as Record<string, unknown>);
    };

    const handleAmortizationReady = (event: Event) => {
      if (!(event instanceof CustomEvent) || modelType !== 'amortization') return;
      if (!event.detail || typeof event.detail !== 'object') return;
      void generateAnalysis(event.detail as Record<string, unknown>);
    };

    document.addEventListener('analysis-result-updated', handleAnalysisUpdate);
    document.addEventListener('data-updated', handleDataUpdate as EventListener);
    window.addEventListener('analysis-result-updated', handleAnalysisUpdate);
    window.addEventListener('amortization-analysis-ready', handleAmortizationReady);

    return () => {
      document.removeEventListener('analysis-result-updated', handleAnalysisUpdate);
      document.removeEventListener('data-updated', handleDataUpdate as EventListener);
      window.removeEventListener('analysis-result-updated', handleAnalysisUpdate);
      window.removeEventListener('amortization-analysis-ready', handleAmortizationReady);
    };
  }, [modelType, generateAnalysis]);

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

  const getImpactVariant = (impact: 'low' | 'medium' | 'high'): BadgeVariant => {
    switch (impact) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default: {
        const _exhaustive: never = impact;
        return _exhaustive;
      }
    }
  };

  const getPriorityVariant = (priority: 'low' | 'medium' | 'high'): BadgeVariant => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default: {
        const _exhaustive: never = priority;
        return _exhaustive;
      }
    }
  };

  const renderSummaryCards = () => {
    if (!analysis) return null;

    const summaryEntries = Object.entries(analysis.summary);
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summaryEntries.map(([key, value]) => (
          <div key={key} className="fa-metric-card fa-metric-card-surface">
            <div className="flex items-center justify-between">
              <div>
                <p className="fa-metric-card-title capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
                <p className="fa-metric-card-value">
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
          </div>
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
            <div key={index} className="fa-callout-info border-l-4 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="fa-scenario-title mb-1">{insight.title}</h4>
                  <p className="fa-list-copy">{insight.description}</p>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <Badge variant={getImpactVariant(insight.impact)}>
                    {insight.impact.toUpperCase()}
                  </Badge>
                  {insight.actionable && <span className="fa-chip fa-chip-accent">ACTIONABLE</span>}
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
                <h4 className="fa-scenario-title">{recommendation.title}</h4>
                <div className="flex items-center space-x-2">
                  <Badge variant={getPriorityVariant(recommendation.priority)}>
                    {recommendation.priority.toUpperCase()}
                  </Badge>
                  <span className="fa-chip fa-chip-muted">
                    {recommendation.category.toUpperCase()}
                  </span>
                </div>
              </div>
              <p className="fa-list-copy mb-2">{recommendation.description}</p>
              <div className={`flex items-center justify-between text-sm ${textColors.muted}`}>
                <span>Effort: {recommendation.effort}</span>
                {recommendation.potentialSavings && (
                  <span className={`font-medium ${textColors.success}`}>
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
            <Badge variant={getImpactVariant(analysis.riskAssessment.overallRisk)}>
              {analysis.riskAssessment.overallRisk.toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-2">
            {analysis.riskAssessment.factors.map((factor, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 fa-panel-divider-soft last:border-b-0"
              >
                <span className="fa-list-copy">{factor.factor}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={getImpactVariant(factor.risk)}>{factor.risk.toUpperCase()}</Badge>
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
            <div key={index} className="fa-callout-success p-4">
              <h4 className="fa-scenario-title mb-2">{opportunity.area}</h4>
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
                  <p className={`font-medium ${textColors.success}`}>
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
      <Card variant="elevated" className={className}>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--fa-brand)] border-t-transparent"
              aria-hidden="true"
            />
            <span className="ml-3 fa-meta-copy">Generating analysis...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <div className={`enhanced-analysis-results ${className}`}>
        <Card variant="elevated">
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
              <Button
                type="button"
                aria-label={isExpanded ? 'Collapse analysis' : 'Expand analysis'}
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
                    type="button"
                    key={tab.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveTab(tab.id);
                    }}
                    variant={activeTab === tab.id ? 'primary' : 'outline'}
                    size="sm"
                    className="rounded-full"
                  >
                    <span className="mr-1">{tab.icon}</span>
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* Empty State */}
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="fa-scenario-title mb-2">No Analysis Data Yet</h3>
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
      <Card variant="elevated">
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
            <Button
              type="button"
              aria-label={isExpanded ? 'Collapse analysis' : 'Expand analysis'}
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
                  type="button"
                  key={tab.id}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveTab(tab.id);
                  }}
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
