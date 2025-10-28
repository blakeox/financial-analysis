import React, { useEffect, useState } from 'react';

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
      const { toolName, result } = event.detail;

      // Update the most recent analysis with new results
      setAnalyses((prev) => {
        const updated = [...prev];
        const latestIndex = updated.findIndex((a) => a.toolName === toolName);
        if (latestIndex !== -1) {
          updated[latestIndex] = {
            ...updated[latestIndex],
            output: result,
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
      analyze_amortization: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      analyze_lease: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      analyze_enhanced_lease: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      analyze_auto_loan: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      analyze_debt_payoff: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      analyze_savings_goal: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      analyze_student_loans:
        'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      analyze_retirement_savings:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      optimize_budget: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      ebitda_forecasting: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
      analyze_bond_pricing: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
      analyze_options_pricing:
        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      analyze_cash_flow: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    };
    return colorMap[toolName] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
        <div
          className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:shadow-xl transition-all duration-200 z-40"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex -space-x-2">
              {relevantAnalyses.slice(0, 3).map((analysis, index) => (
                <div
                  key={analysis.timestamp}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 border-white dark:border-gray-800 ${getToolColor(analysis.toolName)}`}
                  style={{ zIndex: 10 - index }}
                >
                  {getToolIcon(analysis.toolName)}
                </div>
              ))}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {relevantAnalyses.length} Tool Analysis{relevantAnalyses.length !== 1 ? 'es' : ''}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Click to view details</div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tool Analysis
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getContextDisplayName()}
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
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
              <div
                key={analysis.timestamp}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedAnalysis?.timestamp === analysis.timestamp
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                }`}
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${getToolColor(analysis.toolName)}`}
                  >
                    {getToolIcon(analysis.toolName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {formatToolName(analysis.toolName)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimestamp(analysis.timestamp)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {analysis.insights.length > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {analysis.insights.length} insight
                        {analysis.insights.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Analysis Details */}
          {selectedAnalysis && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Analysis Results
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedAnalysis.analysis}
                  </div>
                </div>

                {selectedAnalysis.insights.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Key Insights
                    </h4>
                    <ul className="space-y-1">
                      {selectedAnalysis.insights.map((insight, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
                        >
                          <span className="text-blue-500 mr-2">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Close Details
                  </button>
                  <button
                    onClick={() => {
                      setAnalyses([]);
                      setSelectedAnalysis(null);
                    }}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                  >
                    Clear All
                  </button>
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
