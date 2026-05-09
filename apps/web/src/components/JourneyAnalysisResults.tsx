/**
 * Journey Analysis Results Component
 * Provides AI-powered analysis of completed financial journeys
 */

import { Button, Card, CardContent, Input } from '@financial-analysis/ui';
import { useEffect, useRef, useState } from 'react';
import type { JourneyScenario } from '../utils/journeyData';

type JourneyCollectedData = Record<string, unknown>;
type TabId = 'summary' | 'insights' | 'recommendations' | 'risks' | 'next-steps';

interface JourneyAnalysisResultsProps {
  scenarioId: string;
  journeyData: JourneyScenario;
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
  const [activeTab, setActiveTab] = useState<TabId>('summary');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const progressFillRef = useRef<HTMLDivElement>(null);

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
      const analysis = await generateAIAnalysis(scenarioId, collectedData);
      setAnalysisData(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = async (
    scenarioId: string,
    collectedData: JourneyCollectedData
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

  const generateYoungProfessionalAnalysis = (_data: JourneyCollectedData): JourneyAnalysisData => ({
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

  const generateFamilyPlanningAnalysis = (_data: JourneyCollectedData): JourneyAnalysisData => ({
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

  const generateRetirementAnalysis = (_data: JourneyCollectedData): JourneyAnalysisData => ({
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

  const generateStartupAnalysis = (_data: JourneyCollectedData): JourneyAnalysisData => ({
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

  const generateMAAnalysis = (_data: JourneyCollectedData): JourneyAnalysisData => ({
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

  const generateGenericAnalysis = (_data: JourneyCollectedData): JourneyAnalysisData => ({
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
    if (score >= 90) return 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/30';
    if (score >= 80) return 'text-violet-600 bg-violet-100 dark:text-violet-300 dark:bg-violet-950/30';
    if (score >= 70)
      return 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/30';
    return 'text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/30';
  };

  const getPriorityColor = (priority: AnalysisInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-rose-600 bg-rose-100 dark:text-rose-300 dark:bg-rose-950/30';
      case 'medium':
        return 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/30';
      case 'low':
        return 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/30';
      default:
        return 'fa-chip-muted';
    }
  };

  if (loading) {
    return (
      <Card variant="elevated" className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="fa-button-primary cursor-not-allowed opacity-90">
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
            <p className="mt-4 fa-meta-copy">
              Our AI is analyzing your journey data and generating personalized insights...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="elevated" className={className}>
        <CardContent className="p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/30">
              <svg
                className="h-6 w-6 text-rose-600 dark:text-rose-300"
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
            <h3 className="fa-scenario-title mb-2">Analysis Error</h3>
            <p className="fa-meta-copy mb-4">{error}</p>
            <Button type="button" onClick={generateJourneyAnalysis}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    if (!analysisData || !progressFillRef.current) return;

    const nextWidth = Math.max(0, Math.min(100, analysisData.overallScore));
    progressFillRef.current.style.width = `${nextWidth}%`;
  }, [analysisData]);

  if (!analysisData) return null;

  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
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
            <div className="fa-highlight-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="fa-scenario-title">Overall Journey Score</h3>
                <span className={`fa-chip-status ${getScoreColor(analysisData.overallScore)}`}>
                  {analysisData.overallScore}/100
                </span>
              </div>
              <div className="fa-progress-track mb-4 w-full">
                <div ref={progressFillRef} className="fa-progress-bar"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="fa-scenario-title">Completion Time</div>
                  <div className="fa-meta-copy">{analysisData.completionTime}</div>
                </div>
                <div className="text-center">
                  <div className="fa-scenario-title">Data Quality</div>
                  <div className="fa-meta-copy capitalize">{analysisData.dataQuality}</div>
                </div>
                <div className="text-center">
                  <div className="fa-scenario-title">Steps Completed</div>
                  <div className="fa-meta-copy">{journeyData.models.length}</div>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="fa-subcard p-6">
              <h3 className="fa-scenario-title mb-4 flex items-center">
                <span className="mr-2">🤖</span>
                AI Analysis Summary
              </h3>
              <p className="fa-list-copy leading-relaxed">{analysisData.aiSummary}</p>
            </div>
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-4">
            {analysisData.keyInsights.map((insight, index) => (
              <div key={index} className="fa-subcard p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="fa-scenario-title flex items-center">
                    <span className="mr-2">{insight.icon}</span>
                    {insight.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}
                  >
                    {insight.priority} priority
                  </span>
                </div>
                <p className="fa-list-copy">{insight.content}</p>
              </div>
            ))}
          </div>
        );

      case 'recommendations':
        return (
          <div className="space-y-4">
            {analysisData.recommendations.map((rec, index) => (
              <div key={index} className="fa-subcard p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="fa-scenario-title flex items-center">
                    <span className="mr-2">{rec.icon}</span>
                    {rec.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}
                  >
                    {rec.priority} priority
                  </span>
                </div>
                <p className="fa-list-copy">{rec.content}</p>
              </div>
            ))}
          </div>
        );

      case 'risks':
        return (
          <div className="space-y-4">
            {analysisData.riskFactors.map((risk, index) => (
              <div key={index} className="fa-subcard p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="fa-scenario-title flex items-center">
                    <span className="mr-2">{risk.icon}</span>
                    {risk.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(risk.priority)}`}
                  >
                    {risk.priority} priority
                  </span>
                </div>
                <p className="fa-list-copy">{risk.content}</p>
              </div>
            ))}
          </div>
        );

      case 'next-steps':
        return (
          <div className="space-y-4">
            {analysisData.nextSteps.map((step, index) => (
              <div key={index} className="fa-subcard p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="fa-scenario-title flex items-center">
                    <span className="mr-2">{step.icon}</span>
                    {step.title}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(step.priority)}`}
                  >
                    {step.priority} priority
                  </span>
                </div>
                <p className="fa-list-copy">{step.content}</p>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card variant="elevated" className={className}>
      {/* Header */}
      <div className="p-6 fa-panel-divider">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="fa-panel-title flex items-center text-2xl">
              <span className="mr-3">🤖</span>
              AI-Powered Journey Analysis
            </h2>
            <p className="fa-meta-copy mt-1">
              Comprehensive analysis of your {journeyData.name} journey
            </p>
          </div>
          <Button type="button" onClick={() => setAiChatOpen(!aiChatOpen)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
            Ask AI Questions
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="fa-panel-divider">
        <nav className="flex flex-wrap gap-2 px-6 py-4">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              size="sm"
              className="rounded-full"
            >
              {tab.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">{renderTabContent()}</div>

      {/* AI Chat Modal */}
      {aiChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card variant="rail" className="max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-6 fa-panel-divider">
              <div className="flex items-center justify-between">
                <h3 className="fa-scenario-title">Ask AI About Your Journey</h3>
                <Button
                  type="button"
                  onClick={() => setAiChatOpen(false)}
                  aria-label="Close AI chat panel"
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full p-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    ></path>
                  </svg>
                </Button>
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="fa-highlight-card p-4">
                  <p className="fa-list-copy text-sm">
                    💡 <strong>Suggested Questions:</strong>
                  </p>
                  <ul className="mt-2 fa-list-copy text-sm space-y-1">
                    <li>• "What should I focus on first based on my analysis?"</li>
                    <li>• "How can I improve my financial score?"</li>
                    <li>• "What are the biggest risks I should address?"</li>
                    <li>• "Can you explain the recommendations in more detail?"</li>
                  </ul>
                </div>
                <div className="fa-subcard p-4">
                  <p className="fa-meta-copy text-sm">
                    🤖 AI Assistant: "I've analyzed your {journeyData.name} journey and I'm ready to
                    answer your questions. What would you like to know more about?"
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 fa-panel-divider-top">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Ask a question about your journey analysis..."
                  className="flex-1"
                />
                <Button type="button">Send</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );
}
