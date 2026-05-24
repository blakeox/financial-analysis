import React, { useEffect, useState } from 'react';
import { Button } from '@financial-analysis/ui';

interface ToolAnalysis {
  toolName: string;
  timestamp: number;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  analysis: string;
  insights: string[];
}

interface ToolAnalysisPanelProps {
  className?: string;
  currentContext?: string;
}

export const ToolAnalysisPanel: React.FC<ToolAnalysisPanelProps> = ({
  className = '',
  currentContext = 'general',
}) => {
  const [analyses, setAnalyses] = useState<ToolAnalysis[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<ToolAnalysis | null>(null);

  useEffect(() => {
    // Listen for tool analysis events
    const handleToolAnalysis = (event: CustomEvent) => {
      const { toolName, input, output, analysis, insights } = event.detail;

      const newAnalysis: ToolAnalysis = {
        toolName,
        timestamp: Date.now(),
        input,
        output,
        analysis,
        insights: insights || [],
      };

      setAnalyses((prev) => [newAnalysis, ...prev.slice(0, 9)]); // Keep last 10 analyses
    };

    // Listen for analysis result updates
    const handleAnalysisUpdate = (event: CustomEvent) => {
      const detail = event.detail as {
        toolName?: string;
        modelType?: string;
        result?: unknown;
      };
      const toolName = detail.toolName ?? detail.modelType;
      const result = detail.result;
      if (!toolName || result === undefined) return;

      // Update the most recent analysis with new results
      setAnalyses((prev) => {
        const updated = [...prev];
        const latestIndex = updated.findIndex((a) => a.toolName === toolName);
        if (latestIndex !== -1) {
          updated[latestIndex] = {
            ...updated[latestIndex],
            output: result as Record<string, unknown>,
            timestamp: Date.now(),
          };
        }
        return updated;
      });
    };

    document.addEventListener('tool-analysis-completed', handleToolAnalysis as EventListener);
    document.addEventListener('analysis-result-updated', handleAnalysisUpdate as EventListener);

    return () => {
      document.removeEventListener('tool-analysis-completed', handleToolAnalysis as EventListener);
      document.removeEventListener(
        'analysis-result-updated',
        handleAnalysisUpdate as EventListener
      );
    };
  }, []);

  const formatToolName = (toolName: string): string => {
    return toolName
      .replace('analyze_', '')
      .replace('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getToolIcon = (toolName: string): string => {
    const iconMap: Record<string, string> = {
      analyze_amortization: '📊',
      analyze_lease: '📋',
      analyze_enhanced_lease: '📋',
      analyze_auto_loan: '🚗',
      analyze_debt_payoff: '💳',
      analyze_savings_goal: '💰',
      analyze_student_loans: '🎓',
      analyze_retirement_savings: '🏦',
      optimize_budget: '📈',
      ebitda_forecasting: '📈',
      analyze_bond_pricing: '📈',
      analyze_options_pricing: '📈',
      analyze_cash_flow: '💵',
    };
    return iconMap[toolName] || '🔧';
  };

  const getToolColor = (toolName: string): string => {
    const colorMap: Record<string, string> = {
      analyze_amortization:
        'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
      analyze_lease: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
      analyze_enhanced_lease:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200',
      analyze_auto_loan:
        'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200',
      analyze_debt_payoff: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200',
      analyze_savings_goal: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
      analyze_student_loans:
        'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200',
      analyze_retirement_savings:
        'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200',
      optimize_budget: 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200',
      ebitda_forecasting: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200',
      analyze_bond_pricing: 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200',
      analyze_options_pricing: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200',
      analyze_cash_flow: 'bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200',
    };
    return colorMap[toolName] || 'fa-chip-muted';
  };

  // Context-aware tool filtering
  const getRelevantTools = (): string[] => {
    const contextToolMap: Record<string, string[]> = {
      amortization: ['analyze_amortization'],
      lease: ['analyze_lease', 'analyze_enhanced_lease'],
      ebitda: ['ebitda_forecasting', 'ebitda_scenario_comparison'],
      'auto-loan': ['analyze_auto_loan'],
      'debt-payoff': ['analyze_debt_payoff'],
      'savings-goal': ['analyze_savings_goal'],
      'student-loans': ['analyze_student_loans'],
      retirement: ['analyze_retirement_savings'],
      budget: ['optimize_budget'],
      'bond-pricing': ['analyze_bond_pricing'],
      'options-pricing': ['analyze_options_pricing'],
      'cash-flow': ['analyze_cash_flow'],
      general: [], // Show all tools in general context
      models: [], // Show all tools in models context
    };

    return contextToolMap[currentContext] || [];
  };

  // Get context display name
  const getContextDisplayName = (): string => {
    const contextNames: Record<string, string> = {
      amortization: 'Amortization',
      lease: 'Lease Analysis',
      ebitda: 'EBITDA Forecasting',
      'auto-loan': 'Auto Loan',
      'debt-payoff': 'Debt Payoff',
      'savings-goal': 'Savings Goal',
      'student-loans': 'Student Loans',
      retirement: 'Retirement Planning',
      budget: 'Budget Optimization',
      'bond-pricing': 'Bond Pricing',
      'options-pricing': 'Options Pricing',
      'cash-flow': 'Cash Flow Analysis',
      general: 'General Tools',
      models: 'All Models',
    };
    return contextNames[currentContext] || 'General Tools';
  };

  // Filter analyses based on current context
  const relevantAnalyses = analyses.filter((analysis) => {
    const relevantTools = getRelevantTools();
    return relevantTools.length === 0 || relevantTools.includes(analysis.toolName);
  });

  if (relevantAnalyses.length === 0) {
    return null;
  }

  return (
    <div className={`tool-analysis-panel ${className}`}>
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          type="button"
          className="fa-card fa-floating-panel fixed bottom-4 right-4 z-40 cursor-pointer p-4 text-left transition-all duration-200 hover:shadow-xl"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2">
              {relevantAnalyses.slice(0, 3).map((analysis, index) => (
                <div
                  key={analysis.timestamp}
                  className={`fa-avatar-badge ${getToolColor(analysis.toolName)}`}
                  style={{ zIndex: 10 - index }}
                >
                  {getToolIcon(analysis.toolName)}
                </div>
              ))}
            </div>
            <div>
              <div className="fa-scenario-title text-sm">
                {relevantAnalyses.length} Tool Analysis{relevantAnalyses.length !== 1 ? 'es' : ''}
              </div>
              <div className="fa-help-copy">Click to view details</div>
            </div>
          </div>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="fa-card fa-floating-panel fixed bottom-4 right-4 z-50 max-h-96 w-96 p-0 shadow-xl">
          <div className="p-4 fa-panel-divider">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="fa-scenario-title">Tool Analysis</h2>
                <p className="fa-help-copy">{getContextDisplayName()}</p>
              </div>
              <button onClick={() => setIsExpanded(false)} className="fa-shell-icon-button h-9 w-9">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {relevantAnalyses.map((analysis) => (
              <button
                type="button"
                key={analysis.timestamp}
                className={`w-full p-4 text-left fa-panel-divider-soft fa-list-row-interactive cursor-pointer ${
                  selectedAnalysis?.timestamp === analysis.timestamp ? 'fa-highlight-card' : ''
                }`}
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`fa-icon-tile fa-icon-tile-sm text-lg ${getToolColor(analysis.toolName)}`}
                  >
                    {getToolIcon(analysis.toolName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="fa-scenario-title truncate text-sm">
                      {formatToolName(analysis.toolName)}
                    </div>
                    <div className="fa-help-copy">{formatTimestamp(analysis.timestamp)}</div>
                  </div>
                  <div className="fa-help-copy">
                    {analysis.insights.length > 0 && (
                      <span className="fa-chip fa-chip-accent">
                        {analysis.insights.length} insight
                        {analysis.insights.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Analysis Details */}
          {selectedAnalysis && (
            <div className="fa-subcard fa-panel-divider-top rounded-t-none">
              <div className="space-y-3">
                <div>
                  <h3 className="fa-scenario-title mb-2 text-sm">Analysis Results</h3>
                  <div className="fa-list-copy text-sm whitespace-pre-wrap">
                    {selectedAnalysis.analysis}
                  </div>
                </div>

                {selectedAnalysis.insights.length > 0 && (
                  <div>
                    <h3 className="fa-scenario-title mb-2 text-sm">Key Insights</h3>
                    <ul className="space-y-1">
                      {selectedAnalysis.insights.map((insight, index) => (
                        <li key={index} className="fa-list-copy text-sm flex items-start">
                          <span className="mr-2 text-violet-500">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <Button
                    onClick={() => setSelectedAnalysis(null)}
                    variant="ghost"
                    size="sm"
                    className="px-0"
                  >
                    Close Details
                  </Button>
                  <Button
                    onClick={() => {
                      setAnalyses([]);
                      setSelectedAnalysis(null);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 dark:text-rose-300 dark:hover:text-rose-200"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ToolAnalysisPanel;
