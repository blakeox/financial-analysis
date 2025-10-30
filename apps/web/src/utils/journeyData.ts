export interface JourneyModel {
  id: string;
  name: string;
  description: string;
  url: string;
  order: number;
  required: boolean;
}

export interface JourneyScenario {
  name: string;
  description: string;
  ageRange: string;
  complexity: string;
  duration: string;
  icon: string;
  color: string;
  models: JourneyModel[];
  workflow: string[];
}

export interface JourneyData {
  [scenarioId: string]: JourneyScenario;
}

export function getJourneyData(): JourneyData {
  return {
    'startup-planning': {
      name: 'Startup Financial Planning',
      description:
        'Complete financial planning journey for startups including initial capital investment, cash flow projections, funding analysis, and growth planning',
      ageRange: 'Startup',
      complexity: 'Beginner',
      duration: '2-3 hours',
      icon: '🚀',
      color: 'blue',
      models: [
        {
          id: 'initial-capital-investment',
          name: 'Initial Capital Investment',
          description: 'Plan initial capital requirements and investment structure',
          url: '/journey/startup-planning/step/initial-capital-investment',
          order: 1,
          required: true,
        },
        {
          id: 'startup-budget',
          name: 'Startup Budget Planning',
          description: 'Create startup budget and cash flow projections',
          url: '/journey/startup-planning/step/startup-budget',
          order: 2,
          required: true,
        },
        {
          id: 'funding-strategy',
          name: 'Funding Strategy',
          description: 'Plan funding milestones and runway',
          url: '/journey/startup-planning/step/funding-strategy',
          order: 3,
          required: true,
        },
        {
          id: 'growth-planning',
          name: 'Growth Planning',
          description: 'Analyze growth scenarios and resource allocation',
          url: '/journey/startup-planning/step/growth-planning',
          order: 4,
          required: false,
        },
      ],
      workflow: [
        'Plan initial capital requirements and investment structure',
        'Create initial budget and cash flow projections',
        'Plan funding milestones and runway',
        'Analyze growth scenarios',
        'Optimize resource allocation',
        'Monitor financial health',
      ],
    },
    'ma-analysis-journey': {
      name: 'M&A Analysis Journey',
      description:
        'Complete M&A analysis journey including valuation, synergy analysis, and risk assessment',
      ageRange: 'Corporate',
      complexity: 'Advanced',
      duration: '4-6 hours',
      icon: '🏢',
      color: 'purple',
      models: [
        {
          id: 'acquisition-analysis',
          name: 'Acquisition Analysis',
          description: 'Complete M&A analysis with accretion/dilution',
          url: '/journey/ma-analysis-journey/step/acquisition-analysis',
          order: 1,
          required: true,
        },
        {
          id: 'target-valuation',
          name: 'Target Valuation',
          description: 'Detailed DCF analysis for target valuation',
          url: '/journey/ma-analysis-journey/step/target-valuation',
          order: 2,
          required: true,
        },
        {
          id: 'integration-planning',
          name: 'Integration Planning',
          description: 'Assess integration and operational risks',
          url: '/journey/ma-analysis-journey/step/integration-planning',
          order: 3,
          required: true,
        },
      ],
      workflow: [
        'Perform initial M&A analysis and accretion/dilution',
        'Conduct detailed DCF valuation of target',
        'Assess integration and operational risks',
        'Analyze synergy opportunities',
        'Create final acquisition recommendation',
      ],
    },
    'young-professional': {
      name: 'Young Professional Journey',
      description:
        'Complete financial planning journey for young professionals including debt management, budgeting, and retirement planning',
      ageRange: '25-35',
      complexity: 'Beginner',
      duration: '2-3 hours',
      icon: '💼',
      color: 'green',
      models: [
        {
          id: 'financial-snapshot',
          name: 'Financial Snapshot',
          description: 'Assess your current financial situation and goals',
          url: '/journey/young-professional/step/financial-snapshot',
          order: 1,
          required: true,
        },
        {
          id: 'debt-strategy',
          name: 'Debt Strategy',
          description: 'Create a plan to tackle student loans and other debt',
          url: '/journey/young-professional/step/debt-strategy',
          order: 2,
          required: true,
        },
        {
          id: 'emergency-fund',
          name: 'Emergency Fund',
          description: 'Build your financial safety net',
          url: '/journey/young-professional/step/emergency-fund',
          order: 3,
          required: true,
        },
        {
          id: 'retirement-start',
          name: 'Retirement Start',
          description: 'Begin building wealth for the future',
          url: '/journey/young-professional/step/retirement-start',
          order: 4,
          required: true,
        },
        {
          id: 'goal-planning',
          name: 'Goal Planning',
          description: 'Plan for major life milestones',
          url: '/journey/young-professional/step/goal-planning',
          order: 5,
          required: false,
        },
      ],
      workflow: [
        'Assess your current financial situation',
        'Create a debt payoff strategy',
        'Build your emergency fund',
        'Start retirement savings',
        'Plan for major life goals',
      ],
    },
    'family-planning': {
      name: 'Family Planning Journey',
      description:
        'Complete financial planning journey for families including budgeting, savings, and retirement planning',
      ageRange: '30-45',
      complexity: 'Intermediate',
      duration: '3-4 hours',
      icon: '👨‍👩‍👧‍👦',
      color: 'orange',
      models: [
        {
          id: 'family-budget',
          name: 'Family Budget Planning',
          description: 'Create comprehensive family budget and expense tracking',
          url: '/journey/family-planning/step/family-budget',
          order: 1,
          required: true,
        },
        {
          id: 'family-savings',
          name: 'Family Savings Strategy',
          description: 'Plan for family financial goals and emergency fund',
          url: '/journey/family-planning/step/family-savings',
          order: 2,
          required: true,
        },
        {
          id: 'family-retirement',
          name: 'Family Retirement Planning',
          description: 'Plan for retirement with family considerations',
          url: '/journey/family-planning/step/family-retirement',
          order: 3,
          required: true,
        },
      ],
      workflow: [
        'Create comprehensive family budget and expense tracking',
        'Plan for family financial goals and emergency fund',
        'Plan for retirement with family considerations',
        'Monitor progress and adjust family financial strategy',
      ],
    },
    'home-buying': {
      name: 'Home Buying Journey',
      description:
        'Complete financial planning journey for purchasing a home including affordability analysis, mortgage planning, and down payment savings',
      ageRange: '25-40',
      complexity: 'Intermediate',
      duration: '2-3 hours',
      icon: '🏠',
      color: 'blue',
      models: [
        {
          id: 'financial-snapshot',
          name: 'Financial Snapshot',
          description: 'Assess your current financial situation for home buying',
          url: '/journey/home-buying/step/financial-snapshot',
          order: 1,
          required: true,
        },
        {
          id: 'debt-strategy',
          name: 'Debt Strategy',
          description: 'Optimize debt management before home purchase',
          url: '/journey/home-buying/step/debt-strategy',
          order: 2,
          required: true,
        },
        {
          id: 'emergency-fund',
          name: 'Emergency Fund',
          description: 'Build emergency fund for home ownership costs',
          url: '/journey/home-buying/step/emergency-fund',
          order: 3,
          required: true,
        },
        {
          id: 'retirement-start',
          name: 'Down Payment Planning',
          description: 'Plan and save for down payment and closing costs',
          url: '/journey/home-buying/step/retirement-start',
          order: 4,
          required: true,
        },
        {
          id: 'goal-planning',
          name: 'Mortgage Planning',
          description: 'Analyze mortgage options and affordability',
          url: '/journey/home-buying/step/goal-planning',
          order: 5,
          required: true,
        },
      ],
      workflow: [
        'Assess your current financial situation',
        'Optimize debt management',
        'Build emergency fund for home ownership',
        'Plan and save for down payment',
        'Analyze mortgage options and affordability',
      ],
    },
    'investment-analysis-journey': {
      name: 'Investment Analysis Journey',
      description:
        'Complete investment analysis journey including DCF valuation, comparable analysis, risk assessment, and portfolio optimization',
      ageRange: 'Corporate',
      complexity: 'Intermediate',
      duration: '3-4 hours',
      icon: '📊',
      color: 'blue',
      models: [
        {
          id: 'dcf-valuation',
          name: 'DCF Valuation',
          description: 'Detailed discounted cash flow analysis',
          url: '/calculator/dcf-valuation',
          order: 1,
          required: true,
        },
        {
          id: 'risk-management',
          name: 'Risk Assessment',
          description: 'Comprehensive risk analysis and portfolio optimization',
          url: '/calculator/risk-management',
          order: 2,
          required: true,
        },
        {
          id: 'ma-analysis',
          name: 'Comparable Analysis',
          description: 'M&A analysis for comparable company valuation',
          url: '/calculator/ma-analysis',
          order: 3,
          required: true,
        },
      ],
      workflow: [
        'Perform DCF valuation analysis',
        'Conduct comprehensive risk assessment',
        'Analyze comparable companies and transactions',
        'Optimize portfolio allocation',
        'Generate final investment recommendation',
      ],
    },
  };
}
