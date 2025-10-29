/**
 * Journey Analysis Results Component
 * Provides AI-powered analysis of completed financial journeys
 */

import { useEffect, useState } from 'react';

interface JourneyModel {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface JourneyData {
  name: string;
  description: string;
  models: JourneyModel[];
}

interface JourneyAnalysisResultsProps {
  scenarioId: string;
  journeyData: JourneyData;
  className?: string;
}

interface AnalysisInsight {
  category: 'summary' | 'insights' | 'recommendations' | 'risks' | 'next-steps';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

interface JourneyAnalysisData {
  overallScore: number;
  keyInsights: AnalysisInsight[];
  recommendations: AnalysisInsight[];
  riskFactors: AnalysisInsight[];
  nextSteps: AnalysisInsight[];
  aiSummary: string;
  completionTime: string;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

export default function JourneyAnalysisResults({
  scenarioId,
  journeyData,
  className = '',
}: JourneyAnalysisResultsProps) {
  const [analysisData, setAnalysisData] = useState<JourneyAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'summary' | 'insights' | 'recommendations' | 'risks' | 'next-steps'
  >('summary');
  const [aiChatOpen, setAiChatOpen] = useState(false);

  useEffect(() => {
    generateJourneyAnalysis();
  }, [scenarioId]);

  const generateJourneyAnalysis = async () => {
    try {
      setLoading(true);

      // Simulate AI analysis generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get journey state from localStorage
      const journeyState = localStorage.getItem(`fanalyx-journey-state-${scenarioId}`);
      const collectedData = journeyState ? JSON.parse(journeyState).collectedData : {};

      // Generate AI-powered analysis
      const analysis = await generateAIAnalysis(scenarioId, journeyData, collectedData);
      setAnalysisData(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async (
    scenarioId: string,
    journey: JourneyData,
    collectedData: Record<string, any>
  ): Promise<JourneyAnalysisData> => {
    // This would integrate with your AI service
    // For now, we'll generate contextual analysis based on the journey type

    const journeyType = scenarioId.toLowerCase();
    let analysis: JourneyAnalysisData;

    switch (true) {
      case journeyType.includes('young-professional'):
        analysis = generateYoungProfessionalAnalysis(collectedData);
        break;
      case journeyType.includes('family-planning'):
        analysis = generateFamilyPlanningAnalysis(collectedData);
        break;
      case journeyType.includes('retirement'):
        analysis = generateRetirementAnalysis(collectedData);
        break;
      case journeyType.includes('startup'):
        analysis = generateStartupAnalysis(collectedData);
        break;
      case journeyType.includes('ma-analysis'):
        analysis = generateMAAnalysis(collectedData);
        break;
      default:
        analysis = generateGenericAnalysis(collectedData);
    }

    return analysis;
  };

  const generateYoungProfessionalAnalysis = (data: Record<string, any>): JourneyAnalysisData => ({
    overallScore: 85,
    dataQuality: 'good',
    completionTime: '12 minutes',
    aiSummary: `Based on your Young Professional journey, you've made excellent progress in understanding your financial foundation. Your student loan analysis shows a manageable debt-to-income ratio, and your budget planning demonstrates good financial discipline. The retirement planning step indicates you're thinking ahead about long-term wealth building.`,
    keyInsights: [
      {
        category: 'insights',
        title: 'Strong Financial Foundation',
        content:
          "Your budget analysis shows you're living within your means with room for savings and debt repayment.",
        priority: 'high',
        icon: '💪',
      },
      {
        category: 'insights',
        title: 'Debt Management Strategy',
        content:
          'Your student loan analysis suggests focusing on income-driven repayment while building emergency savings.',
        priority: 'high',
        icon: '📊',
      },
      {
        category: 'insights',
        title: 'Early Retirement Planning',
        content:
          'Starting retirement planning in your 20s gives you a significant advantage due to compound interest.',
        priority: 'medium',
        icon: '🚀',
      },
    ],
    recommendations: [
      {
        category: 'recommendations',
        title: 'Build Emergency Fund',
        content:
          'Aim for 3-6 months of expenses in a high-yield savings account before aggressive debt repayment.',
        priority: 'high',
        icon: '🛡️',
      },
      {
        category: 'recommendations',
        title: 'Maximize Employer 401(k) Match',
        content:
          "Contribute enough to get your full employer match - it's free money and immediate 100% return.",
        priority: 'high',
        icon: '💰',
      },
      {
        category: 'recommendations',
        title: 'Consider Roth IRA',
        content:
          'After 401(k) match, consider Roth IRA for tax-free growth and flexible withdrawal options.',
        priority: 'medium',
        icon: '📈',
      },
    ],
    riskFactors: [
      {
        category: 'risks',
        title: 'Student Loan Interest',
        content:
          'High interest rates on student loans can significantly impact long-term wealth building.',
        priority: 'medium',
        icon: '⚠️',
      },
      {
        category: 'risks',
        title: 'Limited Investment Experience',
        content:
          'Consider starting with low-cost index funds while learning about investment strategies.',
        priority: 'low',
        icon: '📚',
      },
    ],
    nextSteps: [
      {
        category: 'next-steps',
        title: 'Automate Savings',
        content:
          'Set up automatic transfers to savings and investment accounts to build consistent habits.',
        priority: 'high',
        icon: '⚡',
      },
      {
        category: 'next-steps',
        title: 'Track Progress Monthly',
        content: 'Review your budget and investment performance monthly to stay on track.',
        priority: 'medium',
        icon: '📅',
      },
      {
        category: 'next-steps',
        title: 'Consider Professional Advice',
        content:
          'As your income grows, consider consulting a financial advisor for tax optimization.',
        priority: 'low',
        icon: '👨‍💼',
      },
    ],
  });

  const generateFamilyPlanningAnalysis = (data: Record<string, any>): JourneyAnalysisData => ({
    overallScore: 78,
    dataQuality: 'good',
    completionTime: '15 minutes',
    aiSummary: `Your Family Planning journey shows thoughtful consideration of major life changes. Your budget adjustments for family expenses demonstrate realistic planning, while your savings goals for education and emergencies show excellent foresight. The retirement planning accounts for increased family responsibilities.`,
    keyInsights: [
      {
        category: 'insights',
        title: 'Family Budget Preparedness',
        content:
          'Your budget analysis shows good preparation for increased family expenses and childcare costs.',
        priority: 'high',
        icon: '👨‍👩‍👧‍👦',
      },
      {
        category: 'insights',
        title: 'Education Savings Strategy',
        content:
          'Starting education savings early gives your children significant advantages for college funding.',
        priority: 'high',
        icon: '🎓',
      },
    ],
    recommendations: [
      {
        category: 'recommendations',
        title: 'Life Insurance Review',
        content:
          "Ensure adequate life insurance coverage to protect your family's financial future.",
        priority: 'high',
        icon: '🛡️',
      },
      {
        category: 'recommendations',
        title: '529 Plan Optimization',
        content:
          'Consider state tax benefits and investment options when choosing a 529 education savings plan.',
        priority: 'medium',
        icon: '💰',
      },
    ],
    riskFactors: [
      {
        category: 'risks',
        title: 'Income Volatility',
        content:
          'Family planning often involves career changes - ensure emergency fund covers extended income gaps.',
        priority: 'medium',
        icon: '⚠️',
      },
    ],
    nextSteps: [
      {
        category: 'next-steps',
        title: 'Estate Planning',
        content: 'Create or update wills and consider trusts for family asset protection.',
        priority: 'medium',
        icon: '📋',
      },
    ],
  });

  const generateRetirementAnalysis = (data: Record<string, any>): JourneyAnalysisData => ({
    overallScore: 82,
    dataQuality: 'excellent',
    completionTime: '18 minutes',
    aiSummary: `Your retirement planning journey demonstrates sophisticated understanding of long-term wealth building. The analysis shows strong consideration of multiple income sources, tax optimization strategies, and realistic timeline planning. Your approach balances growth with risk management appropriate for your age and situation.`,
    keyInsights: [
      {
        category: 'insights',
        title: 'Multi-Source Retirement Strategy',
        content:
          'Your plan effectively combines 401(k), IRA, and other investments for diversified retirement income.',
        priority: 'high',
        icon: '🎯',
      },
      {
        category: 'insights',
        title: 'Tax Optimization',
        content:
          'Strategic use of Roth and traditional accounts shows good understanding of tax implications.',
        priority: 'high',
        icon: '📊',
      },
    ],
    recommendations: [
      {
        category: 'recommendations',
        title: 'Catch-Up Contributions',
        content: 'If over 50, maximize catch-up contributions to accelerate retirement savings.',
        priority: 'high',
        icon: '⚡',
      },
      {
        category: 'recommendations',
        title: 'Healthcare Planning',
        content:
          'Factor in healthcare costs and consider Health Savings Accounts (HSAs) for retirement.',
        priority: 'medium',
        icon: '🏥',
      },
    ],
    riskFactors: [
      {
        category: 'risks',
        title: 'Longevity Risk',
        content: 'Plan for longer lifespans and potential healthcare costs in retirement.',
        priority: 'medium',
        icon: '⚠️',
      },
    ],
    nextSteps: [
      {
        category: 'next-steps',
        title: 'Regular Rebalancing',
        content:
          'Review and rebalance your portfolio annually to maintain target asset allocation.',
        priority: 'medium',
        icon: '⚖️',
      },
    ],
  });

  const generateStartupAnalysis = (data: Record<string, any>): JourneyAnalysisData => ({
    overallScore: 75,
    dataQuality: 'good',
    completionTime: '20 minutes',
    aiSummary: `Your startup planning journey shows entrepreneurial thinking with realistic financial planning. The budget analysis accounts for irregular income streams, while savings goals demonstrate understanding of startup capital requirements. The approach balances growth potential with financial stability.`,
    keyInsights: [
      {
        category: 'insights',
        title: 'Cash Flow Management',
        content:
          'Your budget planning shows good understanding of startup cash flow challenges and solutions.',
        priority: 'high',
        icon: '💸',
      },
      {
        category: 'insights',
        title: 'Risk Mitigation',
        content:
          'Emergency fund planning demonstrates prudent risk management for entrepreneurial ventures.',
        priority: 'high',
        icon: '🛡️',
      },
    ],
    recommendations: [
      {
        category: 'recommendations',
        title: 'Separate Business Accounts',
        content:
          'Maintain separate business and personal accounts for better financial tracking and tax purposes.',
        priority: 'high',
        icon: '🏦',
      },
      {
        category: 'recommendations',
        title: 'Professional Network',
        content:
          'Build relationships with accountants, lawyers, and financial advisors familiar with startups.',
        priority: 'medium',
        icon: '🤝',
      },
    ],
    riskFactors: [
      {
        category: 'risks',
        title: 'Income Volatility',
        content: 'Startup income can be highly variable - ensure adequate emergency fund coverage.',
        priority: 'high',
        icon: '⚠️',
      },
    ],
    nextSteps: [
      {
        category: 'next-steps',
        title: 'Business Plan Financials',
        content:
          'Develop detailed financial projections and funding requirements for your business plan.',
        priority: 'high',
        icon: '📋',
      },
    ],
  });

  const generateMAAnalysis = (data: Record<string, any>): JourneyAnalysisData => ({
    overallScore: 88,
    dataQuality: 'excellent',
    completionTime: '25 minutes',
    aiSummary: `Your M&A analysis journey demonstrates sophisticated understanding of corporate finance and valuation methodologies. The DCF analysis shows strong modeling skills, while risk assessment demonstrates comprehensive consideration of deal complexities. The approach balances quantitative analysis with strategic considerations.`,
    keyInsights: [
      {
        category: 'insights',
        title: 'Valuation Methodology',
        content:
          'Your DCF analysis demonstrates strong understanding of intrinsic value calculation and terminal value assumptions.',
        priority: 'high',
        icon: '📊',
      },
      {
        category: 'insights',
        title: 'Risk Assessment Framework',
        content:
          'Comprehensive risk analysis shows good understanding of M&A transaction complexities and mitigation strategies.',
        priority: 'high',
        icon: '🎯',
      },
    ],
    recommendations: [
      {
        category: 'recommendations',
        title: 'Due Diligence Enhancement',
        content:
          'Consider additional due diligence in areas like customer concentration and regulatory compliance.',
        priority: 'high',
        icon: '🔍',
      },
      {
        category: 'recommendations',
        title: 'Integration Planning',
        content: 'Develop detailed integration plans to realize synergies and minimize disruption.',
        priority: 'medium',
        icon: '🔗',
      },
    ],
    riskFactors: [
      {
        category: 'risks',
        title: 'Integration Risk',
        content:
          'Cultural and operational integration challenges can significantly impact deal success.',
        priority: 'high',
        icon: '⚠️',
      },
    ],
    nextSteps: [
      {
        category: 'next-steps',
        title: 'Stakeholder Communication',
        content:
          'Develop communication plans for employees, customers, and investors during the transaction.',
        priority: 'medium',
        icon: '💬',
      },
    ],
  });

  const generateGenericAnalysis = (data: Record<string, any>): JourneyAnalysisData => ({
    overallScore: 80,
    dataQuality: 'good',
    completionTime: '15 minutes',
    aiSummary: `Your financial journey analysis shows thoughtful consideration of multiple financial planning aspects. The comprehensive approach demonstrates good understanding of financial principles and practical application to your specific situation.`,
    keyInsights: [
      {
        category: 'insights',
        title: 'Comprehensive Planning',
        content:
          'Your analysis covers multiple financial planning areas with good depth and consideration.',
        priority: 'high',
        icon: '📋',
      },
    ],
    recommendations: [
      {
        category: 'recommendations',
        title: 'Regular Review',
        content:
          'Schedule regular reviews of your financial plan to adapt to changing circumstances.',
        priority: 'medium',
        icon: '📅',
      },
    ],
    riskFactors: [
      {
        category: 'risks',
        title: 'Market Volatility',
        content: 'Consider market volatility in your long-term planning and risk tolerance.',
        priority: 'medium',
        icon: '⚠️',
      },
    ],
    nextSteps: [
      {
        category: 'next-steps',
        title: 'Professional Guidance',
        content: 'Consider consulting with a financial advisor for personalized recommendations.',
        priority: 'low',
        icon: '👨‍💼',
      },
    ],
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    if (score >= 80) return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
    if (score >= 70)
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 ${className}`}>
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 transition ease-in-out duration-150 cursor-not-allowed">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating AI Analysis...
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Our AI is analyzing your journey data and generating personalized insights...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 ${className}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
            <svg
              className="h-6 w-6 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Analysis Error</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={generateJourneyAnalysis}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analysisData) return null;

  const tabs = [
    { id: 'summary', label: '📊 Summary', icon: '📊' },
    { id: 'insights', label: '💡 Insights', icon: '💡' },
    { id: 'recommendations', label: '🎯 Recommendations', icon: '🎯' },
    { id: 'risks', label: '⚠️ Risks', icon: '⚠️' },
    { id: 'next-steps', label: '🚀 Next Steps', icon: '🚀' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Overall Journey Score
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(analysisData.overallScore)}`}
                >
                  {analysisData.overallScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisData.overallScore}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Completion Time</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {analysisData.completionTime}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Data Quality</div>
                  <div className="text-gray-600 dark:text-gray-400 capitalize">
                    {analysisData.dataQuality}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Steps Completed</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {journeyData.models.length}
                  </div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI Analysis Summary
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {analysisData.aiSummary}
              </p>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-4">
            {analysisData.keyInsights.map((insight, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2">{insight.icon}</span>
                    {insight.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}
                  >
                    {insight.priority} priority
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{insight.content}</p>
              </div>
            ))}
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-4">
            {analysisData.recommendations.map((rec, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2">{rec.icon}</span>
                    {rec.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{rec.content}</p>
              </div>
            ))}
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-4">
            {analysisData.riskFactors.map((risk, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2">{risk.icon}</span>
                    {risk.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(risk.priority)}`}
                  >
                    {risk.priority} priority
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{risk.content}</p>
              </div>
            ))}
          </div>
        );

      case 'next-steps':
        return (
          <div className="space-y-4">
            {analysisData.nextSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <span className="mr-2">{step.icon}</span>
                    {step.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(step.priority)}`}
                  >
                    {step.priority} priority
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{step.content}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <span className="mr-3">🤖</span>
              AI-Powered Journey Analysis
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive analysis of your {journeyData.name} journey
            </p>
          </div>
          <button
            onClick={() => setAiChatOpen(!aiChatOpen)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            Ask AI Questions
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">{renderTabContent()}</div>

      {/* AI Chat Modal */}
      {aiChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ask AI About Your Journey
                </h3>
                <button
                  onClick={() => setAiChatOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    💡 <strong>Suggested Questions:</strong>
                  </p>
                  <ul className="mt-2 text-blue-700 dark:text-blue-300 text-sm space-y-1">
                    <li>• "What should I focus on first based on my analysis?"</li>
                    <li>• "How can I improve my financial score?"</li>
                    <li>• "What are the biggest risks I should address?"</li>
                    <li>• "Can you explain the recommendations in more detail?"</li>
                  </ul>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    🤖 AI Assistant: "I've analyzed your {journeyData.name} journey and I'm ready to
                    answer your questions. What would you like to know more about?"
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Ask a question about your journey analysis..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

