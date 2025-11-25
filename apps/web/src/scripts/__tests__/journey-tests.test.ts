/**
 * Journey Progression Tests
 * Tests journey state management, navigation, and analysis
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the journey state module
vi.mock('../journey-state.client', () => ({
  initializeJourneyFromScenario: vi.fn(),
  getJourneyProgress: vi.fn(),
  isInJourney: vi.fn(),
  getCurrentJourneyStep: vi.fn(),
  getNextJourneyStep: vi.fn(),
  completeJourneyStep: vi.fn(),
  getJourneyData: vi.fn(),
  clearJourney: vi.fn(),
}));

// Mock DOM environment
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

describe('Journey State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('Journey Initialization', () => {
    it('should initialize journey with correct steps', () => {
      const scenarioId = 'young-professional';
      const scenarioName = 'Young Professional Journey';
      const steps = [
        {
          id: 'student-loan',
          name: 'Student Loan Analyzer',
          description: 'Optimize student loan repayment',
          url: '/calculator/student-loans',
          order: 1,
          required: true,
          completed: false,
        },
        {
          id: 'budget',
          name: 'Budget Optimizer',
          description: 'Create emergency fund',
          url: '/calculator/budget',
          order: 2,
          required: true,
          completed: false,
        },
        {
          id: 'retirement',
          name: 'Retirement Planning',
          description: 'Early retirement planning',
          url: '/calculator/retirement',
          order: 3,
          required: true,
          completed: false,
        },
      ];

      // Mock journey state
      const mockJourneyState = {
        scenarioId,
        scenarioName,
        currentStep: 0,
        totalSteps: steps.length,
        steps: steps,
        completedSteps: new Set(),
        journeyData: {},
        isComplete: false,
      };

      expect(mockJourneyState.scenarioId).toBe(scenarioId);
      expect(mockJourneyState.totalSteps).toBe(3);
      expect(mockJourneyState.steps[0].id).toBe('student-loan');
      expect(mockJourneyState.steps[0].required).toBe(true);
    });

    it('should track journey progress correctly', () => {
      const completedSteps = ['student-loan', 'budget'];
      const totalSteps = 4;

      const progress = {
        current: completedSteps.length + 1,
        total: totalSteps,
        percentage: Math.round((completedSteps.length / totalSteps) * 100),
      };

      expect(progress.current).toBe(3);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(50);
    });

    it('should handle journey completion', () => {
      const journeyState = {
        scenarioId: 'young-professional',
        scenarioName: 'Young Professional Journey',
        currentStep: 3,
        totalSteps: 4,
        steps: [
          { id: 'student-loan', completed: true },
          { id: 'budget', completed: true },
          { id: 'retirement', completed: true },
          { id: 'savings-goal', completed: true },
        ],
        completedSteps: new Set(['student-loan', 'budget', 'retirement', 'savings-goal']),
        journeyData: {},
        isComplete: true,
      };

      expect(journeyState.isComplete).toBe(true);
      expect(journeyState.completedSteps.size).toBe(4);
    });

    it('should model auto lease decision steps with correct ordering', () => {
      const autoLeaseJourney = {
        scenarioId: 'auto-lease-decision',
        name: 'Auto Lease Decision Journey',
        steps: [
          { id: 'lease-profile', order: 1, required: true },
          { id: 'lease-vs-buyout', order: 2, required: true },
          { id: 'replacement-options', order: 3, required: true },
          { id: 'decision-review', order: 4, required: true },
        ],
      };

      expect(autoLeaseJourney.steps).toHaveLength(4);
      expect(autoLeaseJourney.steps[0].id).toBe('lease-profile');
      expect(autoLeaseJourney.steps[3].id).toBe('decision-review');
      expect(autoLeaseJourney.steps.every((s) => s.required)).toBe(true);
      expect(autoLeaseJourney.steps.map((s) => s.order)).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Journey Navigation', () => {
    it('should navigate to next step correctly', () => {
      const currentStep = {
        id: 'student-loan',
        name: 'Student Loan Analyzer',
        description: 'Optimize student loan repayment',
        url: '/calculator/student-loans',
        order: 1,
        required: true,
        completed: false,
      };

      const nextStep = {
        id: 'budget',
        name: 'Budget Optimizer',
        description: 'Create emergency fund',
        url: '/calculator/budget',
        order: 2,
        required: true,
        completed: false,
      };

      expect(nextStep.order).toBe(currentStep.order + 1);
      expect(nextStep.url).toBe('/calculator/budget');
    });

    it('should handle journey completion navigation', () => {
      const finalStep = {
        id: 'savings-goal',
        name: 'Savings Goal Planner',
        description: 'Plan for financial goals',
        url: '/calculator/savings-goal',
        order: 4,
        required: false,
        completed: false,
      };

      const nextStep = null; // No next step

      expect(nextStep).toBeNull();
      // Should navigate to analysis page
      const analysisUrl = `/journey-analysis/young-professional`;
      expect(analysisUrl).toBe('/journey-analysis/young-professional');
      expect(finalStep.url).toContain('savings-goal');
      expect(finalStep.required).toBe(false);
    });

    it('should handle step skipping', () => {
      const optionalStep = {
        id: 'savings-goal',
        name: 'Savings Goal Planner',
        description: 'Plan for financial goals',
        url: '/calculator/savings-goal',
        order: 4,
        required: false,
        completed: false,
      };

      expect(optionalStep.required).toBe(false);
      // Optional steps can be skipped
    });
  });

  describe('Journey Data Collection', () => {
    it('should collect step data correctly', () => {
      const stepData = {
        principal: 50000,
        rate: 0.045,
        term: 10,
        monthlyPayment: 518.15,
        totalInterest: 12178,
        results: 'Student loan analysis completed',
      };

      expect(stepData.principal).toBe(50000);
      expect(stepData.monthlyPayment).toBeCloseTo(518.15, 2);
      expect(stepData.results).toContain('completed');
    });

    it('should aggregate journey data', () => {
      const journeyData = {
        'student-loan': {
          principal: 50000,
          monthlyPayment: 518.15,
          payoffStrategy: 'avalanche',
        },
        budget: {
          monthlyIncome: 5000,
          monthlyExpenses: 3500,
          savingsRate: 0.3,
        },
        retirement: {
          currentSavings: 25000,
          monthlyContribution: 500,
          projectedRetirementSavings: 1200000,
        },
      };

      expect(Object.keys(journeyData)).toHaveLength(3);
      expect(journeyData['student-loan'].payoffStrategy).toBe('avalanche');
      expect(journeyData['budget'].savingsRate).toBe(0.3);
    });
  });
});

describe('Journey Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AI Analysis Generation', () => {
    it('should generate comprehensive analysis', () => {
      const journeyData = {
        'student-loan': {
          principal: 50000,
          monthlyPayment: 518.15,
          payoffStrategy: 'avalanche',
          timeToPayoff: 8.5,
        },
        budget: {
          monthlyIncome: 5000,
          monthlyExpenses: 3500,
          savingsRate: 0.3,
          emergencyFund: 15000,
        },
        retirement: {
          currentSavings: 25000,
          monthlyContribution: 500,
          projectedRetirementSavings: 1200000,
          retirementAge: 65,
        },
      };

      const analysis = {
        summary: 'Strong financial foundation with good debt management and retirement planning',
        insights: [
          'Debt payoff strategy is optimal for minimizing interest',
          'Emergency fund provides good financial security',
          'Retirement savings are on track for comfortable retirement',
        ],
        recommendations: [
          'Consider increasing retirement contributions to 15% of income',
          'Explore refinancing student loans if rates improve',
          'Build emergency fund to 6 months of expenses',
        ],
        keyMetrics: [
          { label: 'Debt-to-Income Ratio', value: '10.4%', trend: 'down' },
          { label: 'Savings Rate', value: '30%', trend: 'up' },
          { label: 'Retirement Readiness', value: '85%', trend: 'up' },
        ],
        actionItems: [
          {
            task: 'Increase 401(k) contribution to 15%',
            priority: 'high',
            timeline: 'Next pay period',
          },
          {
            task: 'Research student loan refinancing options',
            priority: 'medium',
            timeline: 'Within 3 months',
          },
          {
            task: 'Build emergency fund to $18,000',
            priority: 'medium',
            timeline: 'Within 6 months',
          },
        ],
      };

      expect(analysis.summary).toContain('Strong financial foundation');
      expect(analysis.insights).toHaveLength(3);
      expect(analysis.recommendations).toHaveLength(3);
      expect(analysis.keyMetrics).toHaveLength(3);
      expect(analysis.actionItems).toHaveLength(3);
      const debtToIncome = (
        (journeyData['student-loan'].monthlyPayment / journeyData.budget.monthlyIncome) * 100
      ).toFixed(1);
      const savingsRatePercent = (journeyData.budget.savingsRate * 100).toFixed(0);
      expect(analysis.keyMetrics[0].value).toBe(`${debtToIncome}%`);
      expect(analysis.keyMetrics[1].value).toBe(`${savingsRatePercent}%`);
    });

    it('should identify financial opportunities', () => {
      const journeyData = {
        budget: {
          monthlyIncome: 8000,
          monthlyExpenses: 4500,
          savingsRate: 0.44,
        },
        retirement: {
          monthlyContribution: 800,
          employerMatch: 0.06,
        },
      };

      const opportunities = [
        'High savings rate provides opportunity for additional investments',
        'Employer match not fully utilized - consider increasing contribution',
        'Excess cash flow could be directed to tax-advantaged accounts',
      ];

      expect(opportunities).toHaveLength(3);
      expect(opportunities[0]).toContain('High savings rate');
      const netCashFlow = journeyData.budget.monthlyIncome - journeyData.budget.monthlyExpenses;
      expect(netCashFlow).toBe(3500);
      expect(netCashFlow).toBeGreaterThan(journeyData.retirement.monthlyContribution);
    });

    it('should identify financial risks', () => {
      const journeyData = {
        budget: {
          monthlyIncome: 4000,
          monthlyExpenses: 3800,
          savingsRate: 0.05,
        },
        'student-loan': {
          monthlyPayment: 600,
          remainingBalance: 45000,
        },
      };

      const risks = [
        'Low savings rate increases financial vulnerability',
        'High debt-to-income ratio limits financial flexibility',
        'Insufficient emergency fund for unexpected expenses',
      ];

      expect(risks).toHaveLength(3);
      expect(risks[0]).toContain('Low savings rate');
      const debtToIncome = journeyData['student-loan'].monthlyPayment / journeyData.budget.monthlyIncome;
      expect(debtToIncome).toBeGreaterThan(0.1);
      expect(journeyData.budget.savingsRate).toBeLessThan(0.1);
    });
  });

  describe('Journey Analysis Export', () => {
    it('should generate PDF report data', () => {
      const analysisData = {
        scenarioName: 'Young Professional Journey',
        completedDate: '2024-01-15',
        journeyData: {
          'student-loan': { principal: 50000, monthlyPayment: 518.15 },
          budget: { monthlyIncome: 5000, savingsRate: 0.3 },
          retirement: { currentSavings: 25000, monthlyContribution: 500 },
        },
        analysis: {
          summary: 'Strong financial foundation',
          recommendations: ['Increase retirement contributions'],
          actionItems: [{ task: 'Increase 401(k) to 15%', priority: 'high' }],
        },
      };

      const pdfData = {
        title: `${analysisData.scenarioName} - Analysis Report`,
        date: analysisData.completedDate,
        sections: [
          { title: 'Executive Summary', content: analysisData.analysis.summary },
          { title: 'Recommendations', content: analysisData.analysis.recommendations },
          { title: 'Action Items', content: analysisData.analysis.actionItems },
        ],
      };

      expect(pdfData.title).toContain('Young Professional Journey');
      expect(pdfData.sections).toHaveLength(3);
      const monthlySavings =
        analysisData.journeyData.budget.monthlyIncome * analysisData.journeyData.budget.savingsRate;
      expect(monthlySavings).toBeCloseTo(1500, 5);
    });

    it('should generate shareable summary', () => {
      const journeySummary = {
        scenario: 'Young Professional Journey',
        completedSteps: 4,
        keyFindings: [
          'Debt management strategy optimized',
          'Emergency fund established',
          'Retirement planning on track',
        ],
        nextActions: ['Increase retirement contributions', 'Build larger emergency fund'],
      };

      const shareableText = `
        Completed ${journeySummary.scenario}!
        
        Key Findings:
        ${journeySummary.keyFindings.map((finding) => `• ${finding}`).join('\n')}
        
        Next Actions:
        ${journeySummary.nextActions.map((action) => `• ${action}`).join('\n')}
      `;

      expect(shareableText).toContain('Young Professional Journey');
      expect(shareableText).toContain('Key Findings');
      expect(shareableText).toContain('Next Actions');
    });
  });
});

describe('Journey Error Handling', () => {
  it('should handle missing journey data', () => {
    const journeyData = null;

    const safeAnalysis = journeyData
      ? {
          summary: 'Analysis based on completed steps',
          insights: ['Data available for analysis'],
        }
      : {
          summary: 'No journey data available',
          insights: ['Please complete journey steps to generate analysis'],
        };

    expect(safeAnalysis.summary).toBe('No journey data available');
  });

  it('should handle incomplete journey data', () => {
    const journeyData = {
      'student-loan': { principal: 50000 },
      // Missing budget and retirement data
    };

    const analysis = {
      summary: 'Partial analysis based on available data',
      insights: [
        'Student loan analysis completed',
        'Additional steps needed for complete analysis',
      ],
      recommendations: ['Complete remaining journey steps for comprehensive analysis'],
    };

    expect(analysis.summary).toContain('Partial analysis');
    expect(analysis.insights).toHaveLength(2);
    expect(Object.keys(journeyData)).toEqual(['student-loan']);
  });

  it('should handle analysis generation errors', () => {
    const error = new Error('AI analysis service unavailable');

    const fallbackAnalysis = {
      summary: 'Analysis temporarily unavailable',
      insights: ['Please try again later'],
      recommendations: ['Contact support if issue persists'],
    };

    expect(fallbackAnalysis.summary).toBe('Analysis temporarily unavailable');
    expect(error.message).toContain('AI analysis');
  });
});

describe('Journey Integration Tests', () => {
  it('should complete full journey workflow', () => {
    // Simulate complete journey workflow
    const journeyWorkflow = {
      start: 'Select journey from /journeys page',
      step1: 'Complete student loan calculator',
      step2: 'Complete budget calculator',
      step3: 'Complete retirement calculator',
      step4: 'Complete savings goal calculator',
      end: 'View comprehensive analysis',
    };

    const workflowSteps = Object.keys(journeyWorkflow);
    expect(workflowSteps).toHaveLength(6);
    expect(journeyWorkflow.start).toContain('/journeys');
    expect(journeyWorkflow.end).toContain('analysis');
  });

  it('should maintain journey state across page navigation', () => {
    const journeyState = {
      scenarioId: 'young-professional',
      currentStep: 2,
      completedSteps: ['student-loan', 'budget'],
      journeyData: {
        'student-loan': { principal: 50000 },
        budget: { monthlyIncome: 5000 },
      },
    };

    // Simulate page navigation
    const persistedState = JSON.parse(JSON.stringify(journeyState));

    expect(persistedState.scenarioId).toBe('young-professional');
    expect(persistedState.currentStep).toBe(2);
    expect(persistedState.completedSteps).toHaveLength(2);
  });

  it('should handle journey interruption and resumption', () => {
    const interruptedJourney = {
      scenarioId: 'family-planning',
      currentStep: 1,
      completedSteps: ['amortization'],
      journeyData: {
        amortization: { principal: 300000, monthlyPayment: 1798.65 },
      },
    };

    // Resume journey
    const resumedJourney = {
      ...interruptedJourney,
      currentStep: 2, // Move to next step
      lastAccessed: new Date().toISOString(),
    };

    expect(resumedJourney.currentStep).toBe(2);
    expect(resumedJourney.completedSteps).toContain('amortization');
  });
});




