/**
 * Journey-Specific Calculator Configurations
 * Provides context-aware calculator configurations for different journey steps
 */

export interface JourneyCalculatorConfig {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'business';
  icon: string;
  color: string;
  keywords: string[];
  formFields: FormFieldConfig[];
  clientScript: string;
  analysisType: string;
  journeyContext?: {
    scenarioId: string;
    stepPurpose: string;
    prefillFromPrevious?: string[];
    customFields?: FormFieldConfig[];
  };
}

export interface FormFieldConfig {
  id: string;
  name: string;
  type: 'number' | 'text' | 'select' | 'checkbox' | 'radio';
  label: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  group?: string;
  journeySpecific?: boolean;
}

// Journey-specific calculator configurations
export const JOURNEY_CALCULATOR_CONFIGS: Record<string, JourneyCalculatorConfig> = {
  // Young Professional Journey
  'young-professional-student-loans': {
    id: 'young-professional-student-loans',
    title: 'Student Loan Strategy',
    description: 'Optimize student loan repayment for early career professionals',
    category: 'personal',
    icon: '🎓',
    color: 'blue',
    keywords: ['student loans', 'early career', 'debt management'],
    formFields: [
      {
        id: 'loanBalance',
        name: 'loanBalance',
        type: 'number',
        label: 'Total Student Loan Balance ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Enter your total outstanding student loan balance',
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Weighted Average Interest Rate (%)',
        min: 0,
        max: 20,
        step: 0.01,
        required: true,
        helpText: 'Your average interest rate across all loans',
      },
      {
        id: 'annualIncome',
        name: 'annualIncome',
        type: 'number',
        label: 'Current Annual Income ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your current gross annual income',
      },
      {
        id: 'familySize',
        name: 'familySize',
        type: 'number',
        label: 'Household Size',
        min: 1,
        max: 20,
        required: true,
        helpText: 'Number of people in your household',
      },
      {
        id: 'repaymentPlan',
        name: 'repaymentPlan',
        type: 'select',
        label: 'Preferred Repayment Strategy',
        required: true,
        options: [
          { value: 'income-driven', label: 'Income-Driven (Lower payments, longer term)' },
          { value: 'standard', label: 'Standard (Higher payments, shorter term)' },
          { value: 'aggressive', label: 'Aggressive (Maximum payments)' },
        ],
      },
    ],
    clientScript: 'student-loans',
    analysisType: 'student-loans',
    journeyContext: {
      scenarioId: 'young-professional',
      stepPurpose: 'debt-optimization',
      customFields: [],
    },
  },

  'young-professional-budget': {
    id: 'young-professional-budget',
    title: 'Emergency Fund & Budget',
    description: 'Create emergency fund strategy and monthly budget for young professionals',
    category: 'personal',
    icon: '💰',
    color: 'green',
    keywords: ['emergency fund', 'budget', 'young professional'],
    formFields: [
      {
        id: 'monthlyIncome',
        name: 'monthlyIncome',
        type: 'number',
        label: 'Monthly Take-Home Income ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your monthly income after taxes',
      },
      {
        id: 'monthlyExpenses',
        name: 'monthlyExpenses',
        type: 'number',
        label: 'Current Monthly Expenses ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your current monthly expenses',
      },
      {
        id: 'emergencyFundGoal',
        name: 'emergencyFundGoal',
        type: 'number',
        label: 'Emergency Fund Goal ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Target emergency fund amount (typically 3-6 months expenses)',
      },
      {
        id: 'currentSavings',
        name: 'currentSavings',
        type: 'number',
        label: 'Current Savings ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your current savings balance',
      },
      {
        id: 'budgetStrategy',
        name: 'budgetStrategy',
        type: 'select',
        label: 'Budget Strategy',
        required: true,
        options: [
          { value: '50-30-20', label: '50/30/20 Rule (Needs/Wants/Savings)' },
          { value: 'zero-based', label: 'Zero-Based Budgeting' },
          { value: 'envelope', label: 'Envelope Method' },
        ],
      },
    ],
    clientScript: 'budget',
    analysisType: 'budget',
    journeyContext: {
      scenarioId: 'young-professional',
      stepPurpose: 'emergency-fund-planning',
      prefillFromPrevious: ['annualIncome'],
    },
  },

  'young-professional-retirement': {
    id: 'young-professional-retirement',
    title: 'Early Retirement Planning',
    description: 'Start retirement planning early with 401(k) optimization and Roth IRA strategy',
    category: 'personal',
    icon: '🏖️',
    color: 'orange',
    keywords: ['retirement', '401k', 'roth ira', 'early career'],
    formFields: [
      {
        id: 'currentAge',
        name: 'currentAge',
        type: 'number',
        label: 'Current Age',
        min: 18,
        max: 65,
        required: true,
        helpText: 'Your current age',
      },
      {
        id: 'retirementAge',
        name: 'retirementAge',
        type: 'number',
        label: 'Target Retirement Age',
        min: 50,
        max: 75,
        required: true,
        helpText: 'When you want to retire',
      },
      {
        id: 'annualIncome',
        name: 'annualIncome',
        type: 'number',
        label: 'Annual Income ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your annual gross income',
      },
      {
        id: 'employerMatch',
        name: 'employerMatch',
        type: 'number',
        label: 'Employer 401(k) Match (%)',
        min: 0,
        max: 10,
        step: 0.1,
        required: true,
        helpText: "Your employer's 401(k) matching percentage",
      },
      {
        id: 'current401kBalance',
        name: 'current401kBalance',
        type: 'number',
        label: 'Current 401(k) Balance ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your current 401(k) balance',
      },
      {
        id: 'monthlyContribution',
        name: 'monthlyContribution',
        type: 'number',
        label: 'Current Monthly Contribution ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Your current monthly 401(k) contribution',
      },
    ],
    clientScript: 'retirement',
    analysisType: 'retirement',
    journeyContext: {
      scenarioId: 'young-professional',
      stepPurpose: 'early-retirement-planning',
      prefillFromPrevious: ['annualIncome'],
    },
  },

  // Family Planning Journey
  'family-planning-mortgage': {
    id: 'family-planning-mortgage',
    title: 'Family Home Affordability',
    description: 'Analyze home buying readiness and affordability for growing families',
    category: 'personal',
    icon: '🏠',
    color: 'purple',
    keywords: ['mortgage', 'home buying', 'family', 'affordability'],
    formFields: [
      {
        id: 'homePrice',
        name: 'homePrice',
        type: 'number',
        label: 'Target Home Price ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: "The price of the home you're considering",
      },
      {
        id: 'downPayment',
        name: 'downPayment',
        type: 'number',
        label: 'Down Payment ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Amount you can put down (typically 20%)',
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Mortgage Interest Rate (%)',
        min: 0,
        max: 15,
        step: 0.01,
        required: true,
        helpText: 'Current mortgage interest rate',
      },
      {
        id: 'loanTerm',
        name: 'loanTerm',
        type: 'select',
        label: 'Loan Term',
        required: true,
        options: [
          { value: '15', label: '15 years' },
          { value: '30', label: '30 years' },
        ],
      },
      {
        id: 'annualIncome',
        name: 'annualIncome',
        type: 'number',
        label: 'Combined Annual Income ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Combined household annual income',
      },
      {
        id: 'monthlyDebts',
        name: 'monthlyDebts',
        type: 'number',
        label: 'Monthly Debt Payments ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Current monthly debt payments (credit cards, car loans, etc.)',
      },
    ],
    clientScript: 'amortization',
    analysisType: 'amortization',
    journeyContext: {
      scenarioId: 'family-planning',
      stepPurpose: 'home-affordability-analysis',
    },
  },

  'family-planning-education': {
    id: 'family-planning-education',
    title: "Children's Education Fund",
    description: "Plan for children's education costs with 529 plans and education savings",
    category: 'personal',
    icon: '🎓',
    color: 'blue',
    keywords: ['education', '529 plan', 'college savings', 'children'],
    formFields: [
      {
        id: 'childAge',
        name: 'childAge',
        type: 'number',
        label: "Child's Current Age",
        min: 0,
        max: 18,
        required: true,
        helpText: 'Current age of the child',
      },
      {
        id: 'collegeAge',
        name: 'collegeAge',
        type: 'number',
        label: 'Age When Starting College',
        min: 18,
        max: 25,
        required: true,
        helpText: 'Age when child will start college',
      },
      {
        id: 'annualCollegeCost',
        name: 'annualCollegeCost',
        type: 'number',
        label: 'Annual College Cost ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Expected annual college cost (including tuition, room, board)',
      },
      {
        id: 'currentSavings',
        name: 'currentSavings',
        type: 'number',
        label: 'Current Education Savings ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Current amount saved for education',
      },
      {
        id: 'monthlyContribution',
        name: 'monthlyContribution',
        type: 'number',
        label: 'Monthly Contribution ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Monthly amount you can contribute',
      },
      {
        id: 'returnRate',
        name: 'returnRate',
        type: 'number',
        label: 'Expected Return Rate (%)',
        min: 0,
        max: 15,
        step: 0.1,
        required: true,
        helpText: 'Expected annual return on education savings',
      },
    ],
    clientScript: 'savings-goal',
    analysisType: 'savings-goal',
    journeyContext: {
      scenarioId: 'family-planning',
      stepPurpose: 'education-funding-planning',
    },
  },

  // Business Journey Calculators
  'startup-planning-budget': {
    id: 'startup-planning-budget',
    title: 'Startup Financial Planning',
    description: 'Create comprehensive financial plan for startup operations and growth',
    category: 'business',
    icon: '🚀',
    color: 'green',
    keywords: ['startup', 'budget', 'financial planning', 'business'],
    formFields: [
      {
        id: 'monthlyRevenue',
        name: 'monthlyRevenue',
        type: 'number',
        label: 'Monthly Revenue ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Current or projected monthly revenue',
      },
      {
        id: 'monthlyExpenses',
        name: 'monthlyExpenses',
        type: 'number',
        label: 'Monthly Operating Expenses ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Monthly operating expenses',
      },
      {
        id: 'cashReserves',
        name: 'cashReserves',
        type: 'number',
        label: 'Current Cash Reserves ($)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Current cash on hand',
      },
      {
        id: 'runwayMonths',
        name: 'runwayMonths',
        type: 'number',
        label: 'Target Runway (months)',
        min: 1,
        max: 36,
        required: true,
        helpText: 'Desired months of runway',
      },
      {
        id: 'growthRate',
        name: 'growthRate',
        type: 'number',
        label: 'Monthly Growth Rate (%)',
        min: -50,
        max: 50,
        step: 0.1,
        required: true,
        helpText: 'Expected monthly revenue growth rate',
      },
    ],
    clientScript: 'budget',
    analysisType: 'budget',
    journeyContext: {
      scenarioId: 'startup-planning',
      stepPurpose: 'startup-financial-planning',
    },
  },

  'ma-analysis-journey-ma': {
    id: 'ma-analysis-journey-ma',
    title: 'M&A Transaction Analysis',
    description: 'Comprehensive M&A analysis including synergy assessment and integration planning',
    category: 'business',
    icon: '🤝',
    color: 'blue',
    keywords: ['mergers', 'acquisitions', 'synergy', 'integration'],
    formFields: [
      {
        id: 'acquirerValue',
        name: 'acquirerValue',
        type: 'number',
        label: 'Acquirer Enterprise Value ($M)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Enterprise value of the acquiring company',
      },
      {
        id: 'targetValue',
        name: 'targetValue',
        type: 'number',
        label: 'Target Enterprise Value ($M)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Enterprise value of the target company',
      },
      {
        id: 'acquisitionPrice',
        name: 'acquisitionPrice',
        type: 'number',
        label: 'Acquisition Price ($M)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Total acquisition price including premium',
      },
      {
        id: 'synergyValue',
        name: 'synergyValue',
        type: 'number',
        label: 'Expected Synergy Value ($M)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Expected value from synergies',
      },
      {
        id: 'integrationCost',
        name: 'integrationCost',
        type: 'number',
        label: 'Integration Costs ($M)',
        min: 0,
        step: 0.01,
        required: true,
        helpText: 'Expected integration and restructuring costs',
      },
      {
        id: 'financingMix',
        name: 'financingMix',
        type: 'select',
        label: 'Financing Mix',
        required: true,
        options: [
          { value: 'all-cash', label: 'All Cash' },
          { value: 'all-stock', label: 'All Stock' },
          { value: 'mixed', label: 'Mixed Cash/Stock' },
        ],
      },
    ],
    clientScript: 'ma-analysis',
    analysisType: 'ma-analysis',
    journeyContext: {
      scenarioId: 'ma-analysis-journey',
      stepPurpose: 'ma-transaction-analysis',
    },
  },
};

/**
 * Get journey-specific calculator configuration
 */
export function getJourneyCalculatorConfig(
  scenarioId: string,
  calculatorId: string
): JourneyCalculatorConfig | null {
  const journeyKey = `${scenarioId}-${calculatorId}`;
  return JOURNEY_CALCULATOR_CONFIGS[journeyKey] || null;
}

/**
 * Get all calculator configurations for a journey
 */
export function getJourneyCalculatorConfigs(scenarioId: string): JourneyCalculatorConfig[] {
  return Object.values(JOURNEY_CALCULATOR_CONFIGS).filter(
    (config) => config.journeyContext?.scenarioId === scenarioId
  );
}

/**
 * Check if a calculator has journey-specific configuration
 */
export function hasJourneySpecificConfig(scenarioId: string, calculatorId: string): boolean {
  return getJourneyCalculatorConfig(scenarioId, calculatorId) !== null;
}



