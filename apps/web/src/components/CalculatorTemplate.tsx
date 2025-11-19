/**
 * Calculator Page Template System
 *
 * This system provides reusable components and utilities for creating
 * financial calculator pages with consistent structure and minimal repetition.
 */

// Types for calculator page configuration
export interface CalculatorConfig {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'business';
  icon: string;
  color: string;
  keywords: string[];
  faqSchema: {
    '@context': 'https://schema.org';
    '@type': 'FAQPage';
    mainEntity: Array<{
      '@type': 'Question';
      name: string;
      acceptedAnswer: {
        '@type': 'Answer';
        text: string;
      };
    }>;
  };
  breadcrumbs: Array<{
    name: string;
    href: string;
  }>;
  formFields: FormFieldConfig[];
  clientScript: string;
  analysisType: string;
}

export interface FormFieldConfig {
  id: string;
  name: string;
  type: 'number' | 'text' | 'select' | 'checkbox' | 'radio';
  label: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  group?: string;
  helpText?: string;
}

// Predefined calculator configurations - only including calculators with existing client scripts
export const CALCULATOR_CONFIGS: Record<string, CalculatorConfig> = {
  amortization: {
    id: 'amortization',
    title: 'Amortization Calculator',
    description: 'Calculate loan payments and view detailed amortization schedules',
    category: 'personal',
    icon: '🏠',
    color: 'blue',
    keywords: ['mortgage', 'loan', 'amortization', 'payment schedule'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is an amortization schedule?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'An amortization schedule is a table showing each loan payment over time, breaking down how much goes toward principal versus interest.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do extra payments affect my mortgage?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Extra payments directly reduce your principal balance, which lowers future interest charges and can shorten your loan term significantly.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Amortization', href: '/amortization' },
    ],
    formFields: [
      {
        id: 'principal',
        name: 'principal',
        type: 'number',
        label: 'Loan Amount ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'annualRate',
        name: 'annualRate',
        type: 'number',
        label: 'Annual Interest Rate (%)',
        min: 0,
        max: 50,
        step: 0.01,
        required: true,
      },
      {
        id: 'termMonths',
        name: 'termMonths',
        type: 'number',
        label: 'Loan Term (Months)',
        min: 1,
        max: 600,
        required: true,
        helpText: 'Common: 360 (30yr), 180 (15yr), 60 (5yr)',
      },
      {
        id: 'extraPayment',
        name: 'extraPayment',
        type: 'number',
        label: 'Extra Monthly Payment ($) (Optional)',
        min: 0,
        step: 0.01,
      },
    ],
    clientScript: 'amortization',
    analysisType: 'amortization',
  },

  'auto-loan': {
    id: 'auto-loan',
    title: 'Auto Loan Calculator',
    description:
      'Calculate vehicle loan payments with trade-in value, sales tax, fees, and early payoff scenarios',
    category: 'personal',
    icon: '🚗',
    color: 'purple',
    keywords: ['auto loan', 'car loan', 'vehicle financing', 'trade-in'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I calculate my auto loan payment?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Enter your vehicle price, down payment, trade-in value, interest rate, and loan term. The calculator automatically includes sales tax, registration fees, and any rebates.',
          },
        },
        {
          '@type': 'Question',
          name: 'Should I include my trade-in value?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, your trade-in value reduces the amount you need to finance. If you owe more than the trade-in value (negative equity), the calculator adds that amount to your new loan.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Auto Loan', href: '/auto-loan' },
    ],
    formFields: [
      {
        id: 'vehiclePrice',
        name: 'vehiclePrice',
        type: 'number',
        label: 'Vehicle Price',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'downPayment',
        name: 'downPayment',
        type: 'number',
        label: 'Down Payment',
        min: 0,
        step: 0.01,
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Interest Rate (APR %)',
        min: 0,
        max: 30,
        step: 0.01,
        required: true,
      },
      {
        id: 'loanTerm',
        name: 'loanTerm',
        type: 'select',
        label: 'Loan Term (months)',
        required: true,
        options: [
          { value: '12', label: '12 months (1 year)' },
          { value: '24', label: '24 months (2 years)' },
          { value: '36', label: '36 months (3 years)' },
          { value: '48', label: '48 months (4 years)' },
          { value: '60', label: '60 months (5 years)' },
          { value: '72', label: '72 months (6 years)' },
          { value: '84', label: '84 months (7 years)' },
        ],
      },
    ],
    clientScript: 'auto-loan',
    analysisType: 'auto-loan',
  },

  retirement: {
    id: 'retirement',
    title: 'Retirement Calculator',
    description:
      'Plan your retirement with projections for savings growth, employer matching, and inflation-adjusted goals',
    category: 'personal',
    icon: '🏖️',
    color: 'orange',
    keywords: ['retirement', '401k', 'IRA', 'pension', 'savings'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How much should I save for retirement?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Financial experts recommend saving 10-15% of your gross income for retirement. If starting late, you may need to save 20-25%.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is a good retirement savings goal?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A common rule is to have 25x your annual expenses saved by retirement (the 4% withdrawal rule).',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Retirement', href: '/retirement' },
    ],
    formFields: [
      {
        id: 'currentAge',
        name: 'currentAge',
        type: 'number',
        label: 'Current Age',
        min: 18,
        max: 100,
        required: true,
      },
      {
        id: 'retirementAge',
        name: 'retirementAge',
        type: 'number',
        label: 'Retirement Age',
        min: 50,
        max: 100,
        required: true,
      },
      {
        id: 'annualIncome',
        name: 'annualIncome',
        type: 'number',
        label: 'Current Annual Income',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'returnRate',
        name: 'returnRate',
        type: 'number',
        label: 'Return Rate %',
        min: 0,
        max: 20,
        step: 0.1,
        required: true,
      },
    ],
    clientScript: 'retirement',
    analysisType: 'retirement',
  },

  'savings-goal': {
    id: 'savings-goal',
    title: 'Savings Goal Planner',
    description:
      'Plan and track progress toward financial goals with compound interest calculations, inflation adjustments, and alternative scenarios',
    category: 'personal',
    icon: '💰',
    color: 'green',
    keywords: ['savings', 'goals', 'compound interest', 'financial planning'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I calculate how much to save each month?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Enter your savings goal amount, target date, current savings, and expected interest rate. Our calculator shows exactly how much you need to save monthly to reach your goal, accounting for compound interest growth.',
          },
        },
        {
          '@type': 'Question',
          name: "What's a realistic savings interest rate?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'High-yield savings accounts currently offer 4-5% APY. Money market accounts and short-term CDs offer similar rates. For longer-term goals (5+ years), consider investment accounts which historically return 7-10% annually but with more risk.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Savings Goal', href: '/savings-goal' },
    ],
    formFields: [
      {
        id: 'goalAmount',
        name: 'goalAmount',
        type: 'number',
        label: 'Goal Amount ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'currentSavings',
        name: 'currentSavings',
        type: 'number',
        label: 'Current Savings ($)',
        min: 0,
        step: 0.01,
      },
      {
        id: 'targetDate',
        name: 'targetDate',
        type: 'number',
        label: 'Target Date (years from now)',
        min: 0.1,
        max: 50,
        step: 0.1,
        required: true,
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Expected Interest Rate (%)',
        min: 0,
        max: 20,
        step: 0.1,
        required: true,
      },
      {
        id: 'inflationRate',
        name: 'inflationRate',
        type: 'number',
        label: 'Inflation Rate (%)',
        min: 0,
        max: 10,
        step: 0.1,
      },
    ],
    clientScript: 'savings-goal',
    analysisType: 'savings-goal',
  },

  'debt-payoff': {
    id: 'debt-payoff',
    title: 'Debt Payoff Optimizer',
    description:
      'Compare avalanche vs snowball debt payoff strategies with month-by-month schedules',
    category: 'personal',
    icon: '💳',
    color: 'red',
    keywords: ['debt payoff', 'avalanche', 'snowball', 'debt elimination'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "What's the difference between avalanche and snowball methods?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The avalanche method pays off debts with the highest interest rates first, saving the most money. The snowball method pays off the smallest debts first, providing psychological motivation through quick wins.',
          },
        },
        {
          '@type': 'Question',
          name: 'Which debt payoff strategy saves more money?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The avalanche method typically saves more money in interest because it targets high-interest debts first. However, the snowball method can be more motivating and help people stick to their debt payoff plan.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Debt Payoff', href: '/debt-payoff' },
    ],
    formFields: [
      {
        id: 'debts',
        name: 'debts',
        type: 'text',
        label: 'Debt Information',
        helpText: 'Enter each debt as: balance,interest_rate,minimum_payment (one per line)',
      },
      {
        id: 'extraPayment',
        name: 'extraPayment',
        type: 'number',
        label: 'Extra Monthly Payment ($)',
        min: 0,
        step: 0.01,
      },
      {
        id: 'strategy',
        name: 'strategy',
        type: 'select',
        label: 'Payoff Strategy',
        required: true,
        options: [
          { value: 'avalanche', label: 'Avalanche (Highest Interest First)' },
          { value: 'snowball', label: 'Snowball (Smallest Balance First)' },
          { value: 'compare', label: 'Compare Both Strategies' },
        ],
      },
    ],
    clientScript: 'debt-payoff',
    analysisType: 'debt-payoff',
  },

  'student-loans': {
    id: 'student-loans',
    title: 'Student Loan Analyzer',
    description:
      'Optimize student loan repayment strategies with income-driven plans, refinancing analysis, and forgiveness programs',
    category: 'personal',
    icon: '🎓',
    color: 'blue',
    keywords: ['student loans', 'repayment', 'refinancing', 'forgiveness'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Should I refinance my student loans?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Refinancing can lower your interest rate and monthly payment, but you'll lose federal loan benefits like income-driven repayment and forgiveness programs. Consider your job stability and income before refinancing federal loans.",
          },
        },
        {
          '@type': 'Question',
          name: "What's the best student loan repayment strategy?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The best strategy depends on your situation. Income-driven repayment plans offer lower payments and forgiveness after 20-25 years. Standard repayment saves the most interest. Consider your income, job stability, and forgiveness eligibility.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Student Loans', href: '/student-loans' },
    ],
    formFields: [
      {
        id: 'loanBalance',
        name: 'loanBalance',
        type: 'number',
        label: 'Total Loan Balance ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Interest Rate (%)',
        min: 0,
        max: 20,
        step: 0.01,
        required: true,
      },
      {
        id: 'annualIncome',
        name: 'annualIncome',
        type: 'number',
        label: 'Annual Income ($)',
        min: 0,
        step: 0.01,
      },
      {
        id: 'familySize',
        name: 'familySize',
        type: 'number',
        label: 'Family Size',
        min: 1,
        max: 20,
      },
      {
        id: 'repaymentPlan',
        name: 'repaymentPlan',
        type: 'select',
        label: 'Repayment Plan',
        required: true,
        options: [
          { value: 'standard', label: 'Standard (10 years)' },
          { value: 'extended', label: 'Extended (25 years)' },
          { value: 'income-driven', label: 'Income-Driven Repayment' },
          { value: 'refinance', label: 'Refinance Analysis' },
        ],
      },
    ],
    clientScript: 'student-loans',
    analysisType: 'student-loans',
  },

  budget: {
    id: 'budget',
    title: 'Budget Optimizer',
    description:
      'Create comprehensive budgets with expense tracking, savings goals, and financial health analysis',
    category: 'personal',
    icon: '📊',
    color: 'green',
    keywords: ['budget', 'expenses', 'savings', 'financial planning'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "What's the 50/30/20 budget rule?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The 50/30/20 rule allocates 50% of income to needs (housing, food, utilities), 30% to wants (entertainment, dining), and 20% to savings and debt repayment. This provides a balanced approach to budgeting.',
          },
        },
        {
          '@type': 'Question',
          name: 'How much should I save each month?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Financial experts recommend saving 20% of your income, but start with what you can afford. Even 5-10% can make a significant difference over time. Focus on building an emergency fund first, then retirement savings.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Budget', href: '/budget' },
    ],
    formFields: [
      {
        id: 'monthlyIncome',
        name: 'monthlyIncome',
        type: 'number',
        label: 'Monthly Income ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'housing',
        name: 'housing',
        type: 'number',
        label: 'Housing Costs ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'utilities',
        name: 'utilities',
        type: 'number',
        label: 'Utilities ($)',
        min: 0,
        step: 0.01,
      },
      {
        id: 'food',
        name: 'food',
        type: 'number',
        label: 'Food & Groceries ($)',
        min: 0,
        step: 0.01,
      },
      {
        id: 'transportation',
        name: 'transportation',
        type: 'number',
        label: 'Transportation ($)',
        min: 0,
        step: 0.01,
      },
      {
        id: 'savingsGoal',
        name: 'savingsGoal',
        type: 'number',
        label: 'Monthly Savings Goal ($)',
        min: 0,
        step: 0.01,
      },
    ],
    clientScript: 'budget',
    analysisType: 'budget',
  },

  // Business Calculators
  'dcf-valuation': {
    id: 'dcf-valuation',
    title: 'DCF Valuation Calculator',
    description:
      'Detailed discounted cash flow analysis with sensitivity analysis and scenario modeling for accurate business valuation',
    category: 'business',
    icon: '📊',
    color: 'blue',
    keywords: [
      'dcf',
      'valuation',
      'discounted cash flow',
      'business valuation',
      'investment analysis',
    ],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is DCF valuation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'DCF (Discounted Cash Flow) valuation estimates the intrinsic value of a business by projecting future cash flows and discounting them back to present value using an appropriate discount rate.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I determine the discount rate for DCF?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "The discount rate is typically the company's weighted average cost of capital (WACC), which reflects the cost of both debt and equity financing. It should account for the risk profile of the business.",
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'DCF Valuation', href: '/dcf-valuation' },
    ],
    formFields: [
      {
        id: 'revenue',
        name: 'revenue',
        type: 'number',
        label: 'Current Revenue ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'revenueGrowth',
        name: 'revenueGrowth',
        type: 'number',
        label: 'Revenue Growth Rate (%)',
        min: 0,
        max: 100,
        step: 0.1,
        required: true,
      },
      {
        id: 'ebitdaMargin',
        name: 'ebitdaMargin',
        type: 'number',
        label: 'EBITDA Margin (%)',
        min: 0,
        max: 100,
        step: 0.1,
        required: true,
      },
      {
        id: 'taxRate',
        name: 'taxRate',
        type: 'number',
        label: 'Tax Rate (%)',
        min: 0,
        max: 100,
        step: 0.1,
        required: true,
      },
      {
        id: 'capex',
        name: 'capex',
        type: 'number',
        label: 'Annual CapEx ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'workingCapitalChange',
        name: 'workingCapitalChange',
        type: 'number',
        label: 'Working Capital Change ($)',
        step: 1000,
        required: true,
      },
      {
        id: 'terminalGrowthRate',
        name: 'terminalGrowthRate',
        type: 'number',
        label: 'Terminal Growth Rate (%)',
        min: 0,
        max: 10,
        step: 0.1,
        required: true,
      },
      {
        id: 'discountRate',
        name: 'discountRate',
        type: 'number',
        label: 'Discount Rate (%)',
        min: 0,
        max: 50,
        step: 0.1,
        required: true,
      },
      {
        id: 'projectionYears',
        name: 'projectionYears',
        type: 'number',
        label: 'Projection Years',
        min: 3,
        max: 20,
        required: true,
      },
      {
        id: 'sharesOutstanding',
        name: 'sharesOutstanding',
        type: 'number',
        label: 'Shares Outstanding',
        min: 0,
        step: 1000,
        required: true,
      },
    ],
    clientScript: 'dcf-valuation',
    analysisType: 'dcf-valuation',
  },

  'ma-analysis': {
    id: 'ma-analysis',
    title: 'M&A Analysis Calculator',
    description:
      'Comprehensive merger and acquisition analysis including valuation, synergy assessment, and integration planning',
    category: 'business',
    icon: '🤝',
    color: 'purple',
    keywords: ['m&a', 'merger', 'acquisition', 'synergy', 'accretion', 'dilution'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is accretion/dilution analysis?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Accretion/dilution analysis determines whether a merger or acquisition will increase (accretion) or decrease (dilution) the acquiring company's earnings per share after the transaction.",
          },
        },
        {
          '@type': 'Question',
          name: 'How do you calculate synergies in M&A?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Synergies are calculated by identifying cost savings (reduced overhead, economies of scale) and revenue enhancements (cross-selling, market expansion) that result from combining the two companies.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'M&A Analysis', href: '/ma-analysis' },
    ],
    formFields: [
      {
        id: 'acquirerRevenue',
        name: 'acquirerRevenue',
        type: 'number',
        label: 'Acquirer Revenue ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'acquirerEBITDA',
        name: 'acquirerEBITDA',
        type: 'number',
        label: 'Acquirer EBITDA ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'acquirerShares',
        name: 'acquirerShares',
        type: 'number',
        label: 'Acquirer Shares Outstanding',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'acquirerSharePrice',
        name: 'acquirerSharePrice',
        type: 'number',
        label: 'Acquirer Share Price ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'targetRevenue',
        name: 'targetRevenue',
        type: 'number',
        label: 'Target Revenue ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'targetEBITDA',
        name: 'targetEBITDA',
        type: 'number',
        label: 'Target EBITDA ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'targetShares',
        name: 'targetShares',
        type: 'number',
        label: 'Target Shares Outstanding',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'targetSharePrice',
        name: 'targetSharePrice',
        type: 'number',
        label: 'Target Share Price ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'offerPrice',
        name: 'offerPrice',
        type: 'number',
        label: 'Offer Price per Share ($)',
        min: 0,
        step: 0.01,
        required: true,
      },
      {
        id: 'cashPercentage',
        name: 'cashPercentage',
        type: 'number',
        label: 'Cash Percentage (%)',
        min: 0,
        max: 100,
        step: 1,
        required: true,
      },
      {
        id: 'revenueSynergies',
        name: 'revenueSynergies',
        type: 'number',
        label: 'Annual Revenue Synergies ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'costSynergies',
        name: 'costSynergies',
        type: 'number',
        label: 'Annual Cost Synergies ($)',
        min: 0,
        step: 1000,
        required: true,
      },
    ],
    clientScript: 'ma-analysis',
    analysisType: 'ma-analysis',
  },

  'risk-management': {
    id: 'risk-management',
    title: 'Risk Management Calculator',
    description:
      'Comprehensive risk analysis including Value at Risk (VaR), stress testing, and portfolio risk optimization',
    category: 'business',
    icon: '⚠️',
    color: 'red',
    keywords: ['risk management', 'var', 'value at risk', 'stress testing', 'portfolio risk'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Value at Risk (VaR)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'VaR is a statistical measure that estimates the maximum potential loss of a portfolio over a specific time period with a given confidence level. It helps quantify downside risk.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is stress testing in risk management?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Stress testing evaluates how a portfolio would perform under extreme market conditions or specific adverse scenarios, helping identify potential vulnerabilities.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Risk Management', href: '/risk-management' },
    ],
    formFields: [
      {
        id: 'portfolioValue',
        name: 'portfolioValue',
        type: 'number',
        label: 'Portfolio Value ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'expectedReturn',
        name: 'expectedReturn',
        type: 'number',
        label: 'Expected Annual Return (%)',
        min: -100,
        max: 100,
        step: 0.1,
        required: true,
      },
      {
        id: 'volatility',
        name: 'volatility',
        type: 'number',
        label: 'Annual Volatility (%)',
        min: 0,
        max: 100,
        step: 0.1,
        required: true,
      },
      {
        id: 'confidenceLevel',
        name: 'confidenceLevel',
        type: 'number',
        label: 'Confidence Level (%)',
        min: 90,
        max: 99.9,
        step: 0.1,
        required: true,
      },
      {
        id: 'timeHorizon',
        name: 'timeHorizon',
        type: 'number',
        label: 'Time Horizon (days)',
        min: 1,
        max: 365,
        required: true,
      },
      {
        id: 'recessionScenario',
        name: 'recessionScenario',
        type: 'number',
        label: 'Recession Scenario (%)',
        min: -100,
        max: 0,
        step: 1,
        required: true,
      },
      {
        id: 'inflationScenario',
        name: 'inflationScenario',
        type: 'number',
        label: 'Inflation Scenario (%)',
        min: -100,
        max: 100,
        step: 1,
        required: true,
      },
      {
        id: 'marketCrashScenario',
        name: 'marketCrashScenario',
        type: 'number',
        label: 'Market Crash Scenario (%)',
        min: -100,
        max: 0,
        step: 1,
        required: true,
      },
    ],
    clientScript: 'risk-management',
    analysisType: 'risk-management',
  },

  'equipment-lease': {
    id: 'equipment-lease',
    title: 'Equipment Lease Calculator',
    description:
      'Equipment and machinery lease analysis with payment schedules, residual value, and lease vs buy comparison',
    category: 'business',
    icon: '🔧',
    color: 'cyan',
    keywords: ['equipment lease', 'machinery', 'finance lease', 'operating lease', 'residual value'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the difference between finance and operating leases?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A finance lease is treated like ownership for accounting purposes and transfers ownership at the end of the lease term. An operating lease is like renting equipment and returns it at the end.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do you calculate residual value for equipment leases?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Residual value is the estimated worth of equipment at lease end, typically 10-30% of original cost. Higher residual values result in lower monthly payments.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Equipment Lease', href: '/calculator/equipment-lease' },
    ],
    formFields: [
      {
        id: 'equipmentCost',
        name: 'equipmentCost',
        type: 'number',
        label: 'Equipment Cost ($)',
        min: 0,
        step: 1000,
        required: true,
      },
      {
        id: 'downPayment',
        name: 'downPayment',
        type: 'number',
        label: 'Down Payment ($)',
        min: 0,
        step: 1000,
      },
      {
        id: 'leaseTerm',
        name: 'leaseTerm',
        type: 'number',
        label: 'Lease Term (months)',
        min: 1,
        max: 120,
        required: true,
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Interest Rate (%)',
        min: 0,
        max: 30,
        step: 0.1,
        required: true,
      },
      {
        id: 'residualValue',
        name: 'residualValue',
        type: 'number',
        label: 'Residual Value ($)',
        min: 0,
        step: 1000,
      },
    ],
    clientScript: 'equipment-lease',
    analysisType: 'equipment-lease',
  },

  'invest-vs-payoff-debt': {
    id: 'invest-vs-payoff-debt',
    title: 'Invest vs Pay Off Debt Calculator',
    description: 'Should you use extra money to pay off debt or invest it? Compare strategies with guaranteed vs expected returns',
    category: 'personal',
    icon: '⚖️',
    color: 'purple',
    keywords: ['invest', 'debt', 'payoff', 'investment', 'strategy', 'financial decision'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Should I invest or pay off debt?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'If your debt interest rate is higher than expected investment returns (typically 7-10%), pay off debt first for a guaranteed return. If debt interest is low (<4%) and you have employer match, invest to capture free money.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Invest vs Pay Debt', href: '/calculator/invest-vs-payoff-debt' },
    ],
    formFields: [
      {
        id: 'extraMoney',
        name: 'extraMoney',
        type: 'number',
        label: 'Extra Money Per Month ($)',
        min: 0,
        step: 50,
        required: true,
        placeholder: '500',
        group: '💰 Available Funds',
        helpText: 'How much extra can you put toward debt or investing?',
      },
      {
        id: 'debtBalance',
        name: 'debtBalance',
        type: 'number',
        label: 'Total Debt Balance ($)',
        min: 0,
        step: 100,
        required: true,
        placeholder: '10000',
        group: '💳 Debt Details',
      },
      {
        id: 'debtInterestRate',
        name: 'debtInterestRate',
        type: 'number',
        label: 'Debt Interest Rate (%)',
        min: 0,
        max: 30,
        step: 0.1,
        required: true,
        placeholder: '18',
        group: '💳 Debt Details',
      },
      {
        id: 'debtMinimumPayment',
        name: 'debtMinimumPayment',
        type: 'number',
        label: 'Minimum Monthly Payment ($)',
        min: 0,
        step: 10,
        required: true,
        placeholder: '200',
        group: '💳 Debt Details',
      },
      {
        id: 'debtType',
        name: 'debtType',
        type: 'select',
        label: 'Debt Type',
        required: true,
        options: [
          { value: 'credit-card', label: 'Credit Card' },
          { value: 'student-loan', label: 'Student Loan' },
          { value: 'auto-loan', label: 'Auto Loan' },
          { value: 'personal-loan', label: 'Personal Loan' },
          { value: 'mortgage', label: 'Mortgage' },
        ],
        group: '💳 Debt Details',
      },
      {
        id: 'expectedInvestmentReturn',
        name: 'expectedInvestmentReturn',
        type: 'number',
        label: 'Expected Investment Return (%)',
        min: 0,
        max: 20,
        step: 0.1,
        placeholder: '10',
        group: '📈 Investment Assumptions',
        helpText: 'S&P 500 historical avg: ~10%',
      },
      {
        id: 'employerMatch',
        name: 'employerMatch',
        type: 'number',
        label: 'Employer Match (%)',
        min: 0,
        max: 10,
        step: 0.5,
        placeholder: '0',
        group: '📈 Investment Assumptions',
        helpText: 'If investing in 401(k) with match',
      },
      {
        id: 'timeHorizonYears',
        name: 'timeHorizonYears',
        type: 'select',
        label: 'Time Horizon',
        required: true,
        options: [
          { value: '5', label: '5 years' },
          { value: '10', label: '10 years' },
          { value: '15', label: '15 years' },
          { value: '20', label: '20 years' },
        ],
        group: '📊 Analysis Settings',
      },
      {
        id: 'hasEmergencyFund',
        name: 'hasEmergencyFund',
        type: 'select',
        label: 'Emergency Fund Status',
        required: true,
        options: [
          { value: 'yes', label: 'Yes (3-6 months saved)' },
          { value: 'no', label: 'No emergency fund yet' },
        ],
        group: '📊 Analysis Settings',
        helpText: 'Critical for this decision',
      },
    ],
    clientScript: 'invest-vs-payoff-debt',
    analysisType: 'invest-vs-payoff-debt',
  },

  'rent-vs-buy': {
    id: 'rent-vs-buy',
    title: 'Rent vs Buy Calculator',
    description: 'Compare the financial impact of renting versus buying a home over time, including equity, tax benefits, and opportunity costs',
    category: 'personal',
    icon: '🏠',
    color: 'blue',
    keywords: ['rent', 'buy', 'homeownership', 'real estate', 'housing decision'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Is it better to rent or buy a home?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'It depends on your local market, how long you plan to stay, home prices, rent costs, and interest rates. Generally, buying makes more sense if you plan to stay 5+ years.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the break-even point for buying vs renting?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'The break-even point is when the total costs of buying (including mortgage, taxes, maintenance) minus equity built equals the total cost of renting. This typically occurs between 3-7 years depending on market conditions.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Rent vs Buy', href: '/calculator/rent-vs-buy' },
    ],
    formFields: [
      {
        id: 'homePrice',
        name: 'homePrice',
        type: 'number',
        label: 'Home Price ($)',
        min: 0,
        step: 1000,
        required: true,
        placeholder: '500000',
        group: '🏠 Home Purchase Details',
      },
      {
        id: 'downPayment',
        name: 'downPayment',
        type: 'number',
        label: 'Down Payment ($)',
        min: 0,
        step: 1000,
        required: true,
        placeholder: '100000',
        group: '🏠 Home Purchase Details',
        helpText: '20% avoids PMI',
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
        placeholder: '6.5',
        group: '🏠 Home Purchase Details',
      },
      {
        id: 'loanTermYears',
        name: 'loanTermYears',
        type: 'select',
        label: 'Loan Term',
        required: true,
        options: [
          { value: '15', label: '15 years' },
          { value: '20', label: '20 years' },
          { value: '30', label: '30 years' },
        ],
        group: '🏠 Home Purchase Details',
      },
      {
        id: 'propertyTaxRate',
        name: 'propertyTaxRate',
        type: 'number',
        label: 'Property Tax Rate (%)',
        min: 0,
        max: 5,
        step: 0.1,
        placeholder: '1.2',
        group: '💰 Ownership Costs',
        helpText: 'Annual property tax as % of home value',
      },
      {
        id: 'homeInsurance',
        name: 'homeInsurance',
        type: 'number',
        label: 'Home Insurance ($/month)',
        min: 0,
        step: 10,
        placeholder: '150',
        group: '💰 Ownership Costs',
      },
      {
        id: 'hoaFees',
        name: 'hoaFees',
        type: 'number',
        label: 'HOA Fees ($/month)',
        min: 0,
        step: 10,
        placeholder: '0',
        group: '💰 Ownership Costs',
      },
      {
        id: 'maintenanceRate',
        name: 'maintenanceRate',
        type: 'number',
        label: 'Annual Maintenance (%)',
        min: 0,
        max: 5,
        step: 0.1,
        placeholder: '1',
        group: '💰 Ownership Costs',
        helpText: 'Typically 1% of home value per year',
      },
      {
        id: 'monthlyRent',
        name: 'monthlyRent',
        type: 'number',
        label: 'Monthly Rent ($)',
        min: 0,
        step: 50,
        required: true,
        placeholder: '2500',
        group: '🏢 Rental Details',
      },
      {
        id: 'rentIncreaseRate',
        name: 'rentIncreaseRate',
        type: 'number',
        label: 'Annual Rent Increase (%)',
        min: 0,
        max: 20,
        step: 0.1,
        placeholder: '3',
        group: '🏢 Rental Details',
      },
      {
        id: 'rentersInsurance',
        name: 'rentersInsurance',
        type: 'number',
        label: 'Renters Insurance ($/month)',
        min: 0,
        step: 5,
        placeholder: '20',
        group: '🏢 Rental Details',
      },
      {
        id: 'yearsToAnalyze',
        name: 'yearsToAnalyze',
        type: 'select',
        label: 'Analysis Period',
        required: true,
        options: [
          { value: '3', label: '3 years' },
          { value: '5', label: '5 years' },
          { value: '7', label: '7 years' },
          { value: '10', label: '10 years' },
          { value: '15', label: '15 years' },
        ],
        group: '📊 Analysis Settings',
        helpText: 'How long do you plan to stay?',
      },
      {
        id: 'appreciationRate',
        name: 'appreciationRate',
        type: 'number',
        label: 'Home Appreciation Rate (%)',
        min: -5,
        max: 15,
        step: 0.1,
        placeholder: '3',
        group: '📊 Analysis Settings',
        helpText: 'Historical average: 3-4% annually',
      },
      {
        id: 'investmentReturnRate',
        name: 'investmentReturnRate',
        type: 'number',
        label: 'Investment Return Rate (%)',
        min: 0,
        max: 20,
        step: 0.1,
        placeholder: '7',
        group: '📊 Analysis Settings',
        helpText: 'Return on invested down payment savings',
      },
      {
        id: 'marginalTaxRate',
        name: 'marginalTaxRate',
        type: 'number',
        label: 'Marginal Tax Rate (%)',
        min: 0,
        max: 50,
        step: 1,
        placeholder: '22',
        group: '📊 Analysis Settings',
        helpText: 'For mortgage interest deduction',
      },
      {
        id: 'closingCostRate',
        name: 'closingCostRate',
        type: 'number',
        label: 'Closing Costs (%)',
        min: 0,
        max: 10,
        step: 0.1,
        placeholder: '3',
        group: '💵 Transaction Costs (Optional)',
        helpText: 'Typically 2-5% of home price',
      },
      {
        id: 'sellingCostRate',
        name: 'sellingCostRate',
        type: 'number',
        label: 'Selling Costs (%)',
        min: 0,
        max: 10,
        step: 0.1,
        placeholder: '6',
        group: '💵 Transaction Costs (Optional)',
        helpText: 'Agent commissions typically 5-6%',
      },
    ],
    clientScript: 'rent-vs-buy',
    analysisType: 'rent-vs-buy',
  },

  'mortgage-scenario-planning': {
    id: 'mortgage-scenario-planning',
    title: 'Mortgage Scenario Planner',
    description: 'Compare multiple mortgage options, early payoff strategies, and refinancing scenarios',
    category: 'personal',
    icon: '🏡',
    color: 'green',
    keywords: ['mortgage', 'scenario', 'compare', 'early payoff', 'refinance', 'loan comparison'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How should I compare different mortgage options?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Compare monthly payments, total interest, and total cost over the life of the loan. Also consider refinancing and early payoff scenarios to see which option saves the most money long-term.',
          },
        },
        {
          '@type': 'Question',
          name: 'When should I refinance my mortgage?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Consider refinancing when you can get a lower interest rate that saves enough to cover closing costs within a reasonable timeframe, typically 2-3 years.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Mortgage Scenario Planner', href: '/mortgage-scenario-planning' },
    ],
    formFields: [
      {
        id: 'homePrice',
        name: 'homePrice',
        type: 'number',
        label: 'Home Price',
        min: 0,
        step: 1000,
        required: true,
        group: '📋 Loan Basics',
        placeholder: '500000',
      },
      {
        id: 'loanTerm',
        name: 'loanTerm',
        type: 'select',
        label: 'Loan Term',
        required: true,
        options: [
          { value: '15', label: '15 years' },
          { value: '20', label: '20 years' },
          { value: '30', label: '30 years' },
        ],
        group: '📋 Loan Basics',
      },
      {
        id: 'scenario1Down',
        name: 'scenario1Down',
        type: 'number',
        label: 'Down Payment',
        min: 0,
        step: 1000,
        required: true,
        group: '💰 Option A: Conservative Approach',
        placeholder: '100000',
        helpText: '20%+ avoids PMI',
      },
      {
        id: 'scenario1Rate',
        name: 'scenario1Rate',
        type: 'number',
        label: 'Interest Rate (%)',
        min: 0,
        max: 30,
        step: 0.01,
        required: true,
        group: '💰 Option A: Conservative Approach',
        placeholder: '6.5',
        helpText: 'Shop 3-5 lenders for best rate',
      },
      {
        id: 'scenario1Extra',
        name: 'scenario1Extra',
        type: 'number',
        label: 'Extra Monthly Payment (Optional)',
        min: 0,
        step: 100,
        group: '💰 Option A: Conservative Approach',
        placeholder: '0',
        helpText: 'Even $100-200 saves thousands in interest',
      },
      {
        id: 'scenario2Down',
        name: 'scenario2Down',
        type: 'number',
        label: 'Down Payment',
        min: 0,
        step: 1000,
        required: true,
        group: '🏠 Option B: Alternative Approach',
        placeholder: '75000',
        helpText: 'Compare different down payment amount',
      },
      {
        id: 'scenario2Rate',
        name: 'scenario2Rate',
        type: 'number',
        label: 'Interest Rate (%)',
        min: 0,
        max: 30,
        step: 0.01,
        required: true,
        group: '🏠 Option B: Alternative Approach',
        placeholder: '7.0',
        helpText: 'Try a different rate to see impact',
      },
      {
        id: 'scenario2Extra',
        name: 'scenario2Extra',
        type: 'number',
        label: 'Extra Monthly Payment (Optional)',
        min: 0,
        step: 100,
        group: '🏠 Option B: Alternative Approach',
        placeholder: '0',
        helpText: 'Compare aggressive payoff strategy',
      },
      {
        id: 'refinanceRate',
        name: 'refinanceRate',
        type: 'number',
        label: 'Refinance Rate (%)',
        min: 0,
        max: 30,
        step: 0.01,
        group: '🔄 Refinancing (Optional)',
        helpText: 'If provided, compare refinancing after 5 years at this rate',
        placeholder: '5.5',
      },
      {
        id: 'grossMonthlyIncome',
        name: 'grossMonthlyIncome',
        type: 'number',
        label: 'Gross Monthly Income (Optional)',
        min: 0,
        step: 1000,
        group: '💵 Affordability Check (Optional)',
        helpText: 'Check if payments are within recommended debt-to-income ratios',
        placeholder: '10000',
      },
    ],
    clientScript: 'mortgage-scenario-planning',
    analysisType: 'mortgage-scenario-planning',
  },

  'side-hustle-income': {
    id: 'side-hustle-income',
    title: 'Side Hustle Income Calculator',
    description: 'Calculate true after-tax income from freelance/gig work including self-employment tax, quarterly estimated taxes, and business deductions',
    category: 'personal',
    icon: '💰',
    color: 'yellow',
    keywords: ['freelance', 'self-employed', 'side hustle', 'gig economy', '1099', 'taxes'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How much is self-employment tax?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Self-employment tax is 15.3% (12.4% Social Security + 2.9% Medicare) on 92.35% of your net profit. This covers both employee and employer portions of FICA.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Side Hustle Income', href: '/calculator/side-hustle-income' },
    ],
    formFields: [
      {
        id: 'monthlyRevenue',
        name: 'monthlyRevenue',
        type: 'number',
        label: 'Monthly Revenue ($)',
        min: 0,
        step: 100,
        required: true,
        placeholder: '5000',
        group: '💼 Business Income',
        helpText: 'Gross revenue before expenses',
      },
      {
        id: 'hoursPerWeek',
        name: 'hoursPerWeek',
        type: 'number',
        label: 'Hours Per Week',
        min: 0,
        step: 1,
        required: true,
        placeholder: '20',
        group: '💼 Business Income',
      },
      {
        id: 'businessExpenses',
        name: 'businessExpenses',
        type: 'number',
        label: 'Monthly Business Expenses ($)',
        min: 0,
        step: 50,
        placeholder: '500',
        group: '💼 Business Income',
        helpText: 'Deductible expenses: software, equipment, mileage, etc.',
      },
      {
        id: 'filingStatus',
        name: 'filingStatus',
        type: 'select',
        label: 'Filing Status',
        required: true,
        options: [
          { value: 'single', label: 'Single' },
          { value: 'married', label: 'Married Filing Jointly' },
          { value: 'head-of-household', label: 'Head of Household' },
        ],
        group: '📋 Tax Info',
      },
      {
        id: 'otherIncome',
        name: 'otherIncome',
        type: 'number',
        label: 'Other Annual Income ($)',
        min: 0,
        step: 1000,
        placeholder: '0',
        group: '📋 Tax Info',
        helpText: 'W-2 wages, investment income, etc.',
      },
      {
        id: 'stateTaxRate',
        name: 'stateTaxRate',
        type: 'number',
        label: 'State Tax Rate (%)',
        min: 0,
        max: 15,
        step: 0.1,
        placeholder: '5',
        group: '📋 Tax Info',
      },
      {
        id: 'selfEmploymentTaxDeduction',
        name: 'selfEmploymentTaxDeduction',
        type: 'select',
        label: 'Deduct Half of SE Tax?',
        options: [
          { value: 'yes', label: 'Yes (recommended)' },
          { value: 'no', label: 'No' },
        ],
        group: '💡 Deductions (Optional)',
        helpText: 'You can deduct 50% of SE tax',
      },
      {
        id: 'qbiDeduction',
        name: 'qbiDeduction',
        type: 'select',
        label: 'Qualify for QBI Deduction?',
        options: [
          { value: 'yes', label: 'Yes (20% deduction)' },
          { value: 'no', label: 'No' },
        ],
        group: '💡 Deductions (Optional)',
        helpText: 'Qualified Business Income deduction',
      },
    ],
    clientScript: 'side-hustle-income',
    analysisType: 'side-hustle-income',
  },

  'credit-card-payoff': {
    id: 'credit-card-payoff',
    title: 'Credit Card Payoff Calculator',
    description: 'Optimize credit card debt payoff with balance transfer analysis, utilization impact, and escape the minimum payment trap',
    category: 'personal',
    icon: '💳',
    color: 'red',
    keywords: ['credit card', 'debt', 'payoff', 'balance transfer', '0% APR', 'utilization'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Should I do a balance transfer?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Balance transfers to 0% APR cards can save thousands in interest if you pay off the balance during the promotional period. Watch out for transfer fees (typically 3-5%) and ensure you can pay it off before the promo ends.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Models', href: '/models' },
      { name: 'Credit Card Payoff', href: '/calculator/credit-card-payoff' },
    ],
    formFields: [
      {
        id: 'balance',
        name: 'balance',
        type: 'number',
        label: 'Card Balance ($)',
        min: 0,
        step: 50,
        required: true,
        placeholder: '5000',
        group: '💳 Current Card',
      },
      {
        id: 'interestRate',
        name: 'interestRate',
        type: 'number',
        label: 'Interest Rate (% APR)',
        min: 0,
        max: 35,
        step: 0.1,
        required: true,
        placeholder: '18.99',
        group: '💳 Current Card',
      },
      {
        id: 'creditLimit',
        name: 'creditLimit',
        type: 'number',
        label: 'Credit Limit ($)',
        min: 0,
        step: 100,
        required: true,
        placeholder: '10000',
        group: '💳 Current Card',
        helpText: 'For utilization calculation',
      },
      {
        id: 'minimumPaymentPercent',
        name: 'minimumPaymentPercent',
        type: 'number',
        label: 'Minimum Payment (%)',
        min: 1,
        max: 10,
        step: 0.1,
        placeholder: '2',
        group: '💳 Current Card',
        helpText: 'Typically 2-3% of balance',
      },
      {
        id: 'monthlyPayment',
        name: 'monthlyPayment',
        type: 'number',
        label: 'Your Monthly Payment ($)',
        min: 0,
        step: 25,
        required: true,
        placeholder: '200',
        group: '💰 Payoff Plan',
      },
      {
        id: 'balanceTransferOffer',
        name: 'balanceTransferOffer',
        type: 'select',
        label: 'Balance Transfer Offer Available?',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
        ],
        group: '🔄 Balance Transfer (Optional)',
      },
      {
        id: 'transferAPR',
        name: 'transferAPR',
        type: 'number',
        label: 'Transfer Promo APR (%)',
        min: 0,
        max: 10,
        step: 0.1,
        placeholder: '0',
        group: '🔄 Balance Transfer (Optional)',
        helpText: 'Often 0% for intro period',
      },
      {
        id: 'transferFee',
        name: 'transferFee',
        type: 'number',
        label: 'Transfer Fee (%)',
        min: 0,
        max: 10,
        step: 0.1,
        placeholder: '3',
        group: '🔄 Balance Transfer (Optional)',
        helpText: 'Typically 3-5% of balance',
      },
      {
        id: 'transferPromoPeriod',
        name: 'transferPromoPeriod',
        type: 'select',
        label: 'Promo Period (months)',
        options: [
          { value: '6', label: '6 months' },
          { value: '12', label: '12 months' },
          { value: '15', label: '15 months' },
          { value: '18', label: '18 months' },
          { value: '21', label: '21 months' },
        ],
        group: '🔄 Balance Transfer (Optional)',
      },
    ],
    clientScript: 'credit-card-payoff',
    analysisType: 'credit-card-payoff',
  },
  
  // ============================================================================
  // BUSINESS CALCULATORS
  // ============================================================================
  
  'break-even': {
    id: 'break-even',
    title: 'Break-Even Analysis Calculator',
    description: 'Calculate your break-even point in units and revenue, analyze contribution margin, and understand when your business becomes profitable',
    category: 'business',
    icon: '📊',
    color: 'blue',
    keywords: ['break-even', 'contribution margin', 'fixed costs', 'variable costs', 'profitability', 'margin of safety'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is break-even analysis?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Break-even analysis determines the sales volume needed to cover all costs. It shows when you stop losing money and start making profit.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is contribution margin?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Contribution margin is the selling price minus variable costs per unit. It represents how much each unit sold contributes toward covering fixed costs.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Business Tools', href: '/models/business' },
      { name: 'Break-Even Analysis', href: '/calculator/break-even' },
    ],
    formFields: [
      { id: 'fixedCosts', name: 'fixedCosts', type: 'number', label: 'Fixed Costs (Monthly)', placeholder: '50000', min: 0, step: 100, required: true, helpText: 'Rent, salaries, insurance - costs that don\'t change with volume' },
      { id: 'variableCostPerUnit', name: 'variableCostPerUnit', type: 'number', label: 'Variable Cost per Unit', placeholder: '25', min: 0, step: 0.01, required: true, helpText: 'Materials, direct labor - costs that vary with each unit produced' },
      { id: 'sellingPricePerUnit', name: 'sellingPricePerUnit', type: 'number', label: 'Selling Price per Unit', placeholder: '50', min: 0, step: 0.01, required: true, helpText: 'Price you charge customers for one unit' },
      { id: 'currentSalesUnits', name: 'currentSalesUnits', type: 'number', label: 'Current Sales (Units/Month)', placeholder: '2000', min: 0, helpText: 'Optional: Your current monthly sales volume' },
      { id: 'targetProfit', name: 'targetProfit', type: 'number', label: 'Target Monthly Profit', placeholder: '20000', min: 0, helpText: 'Optional: Desired monthly profit goal' },
    ],
    clientScript: 'break-even',
    analysisType: 'break-even',
  },
  
  'cash-flow-forecast': {
    id: 'cash-flow-forecast',
    title: 'Cash Flow Forecasting Calculator',
    description: 'Project your cash flow for the next 12 months including AR/AP timing, working capital needs, and cash runway analysis',
    category: 'business',
    icon: '💵',
    color: 'green',
    keywords: ['cash flow', 'forecasting', 'working capital', 'burn rate', 'runway', 'AR', 'AP', 'DSO', 'DPO'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Why is cash flow more important than profit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can be profitable on paper but run out of cash due to timing differences. Cash flow shows actual money in/out and determines if you can pay bills.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is cash runway?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cash runway is how many months your business can operate before running out of cash, assuming current burn rate continues.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Business Tools', href: '/models/business' },
      { name: 'Cash Flow Forecast', href: '/calculator/cash-flow-forecast' },
    ],
    formFields: [
      { id: 'startingCash', name: 'startingCash', type: 'number', label: 'Starting Cash Balance', placeholder: '100000', min: 0, step: 100, required: true },
      { id: 'monthlyRevenue', name: 'monthlyRevenue', type: 'number', label: 'Monthly Revenue', placeholder: '50000', min: 0, step: 100, required: true },
      { id: 'revenueGrowthRate', name: 'revenueGrowthRate', type: 'number', label: 'Revenue Growth Rate (%/year)', placeholder: '20', min: -100, max: 1000, step: 0.1, required: true },
      { id: 'averageCollectionDays', name: 'averageCollectionDays', type: 'number', label: 'Days to Collect Payment (DSO)', placeholder: '45', min: 0, max: 365, step: 1, required: true, helpText: 'How long customers take to pay invoices' },
      { id: 'monthlyExpenses', name: 'monthlyExpenses', type: 'number', label: 'Monthly Expenses', placeholder: '40000', min: 0, step: 100, required: true },
      { id: 'expenseGrowthRate', name: 'expenseGrowthRate', type: 'number', label: 'Expense Growth Rate (%/year)', placeholder: '10', min: -100, max: 1000, step: 0.1, required: true },
      { id: 'averagePaymentDays', name: 'averagePaymentDays', type: 'number', label: 'Days to Pay Vendors (DPO)', placeholder: '30', min: 0, max: 365, step: 1, required: true, helpText: 'How long you take to pay bills' },
    ],
    clientScript: 'cash-flow-forecast',
    analysisType: 'cash-flow-forecast',
  },
  
  'business-loan-qualifier': {
    id: 'business-loan-qualifier',
    title: 'Business Loan Qualifier',
    description: 'Find out which business loans you qualify for including SBA 7(a), SBA 504, bank term loans, and lines of credit',
    category: 'business',
    icon: '🏦',
    color: 'purple',
    keywords: ['business loan', 'SBA', 'DSCR', 'LTV', 'loan qualification', 'financing', 'approval odds'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is DSCR and why does it matter?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Debt Service Coverage Ratio (DSCR) measures your ability to repay debt. Lenders want 1.25+ meaning you earn $1.25 for every $1 of debt payments.',
          },
        },
        {
          '@type': 'Question',
          name: 'What\'s the difference between SBA 7(a) and SBA 504?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SBA 7(a) is flexible for any business purpose up to $5M. SBA 504 is only for real estate/equipment but offers better rates and terms up to $5.5M.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Business Tools', href: '/models/business' },
      { name: 'Loan Qualifier', href: '/calculator/business-loan-qualifier' },
    ],
    formFields: [
      { id: 'loanAmount', name: 'loanAmount', type: 'number', label: 'Desired Loan Amount', placeholder: '250000', min: 1, step: 1000, required: true },
      { id: 'businessRevenue', name: 'businessRevenue', type: 'number', label: 'Annual Business Revenue', placeholder: '500000', min: 1, step: 1000, required: true },
      { id: 'netIncome', name: 'netIncome', type: 'number', label: 'Annual Net Income', placeholder: '80000', min: 1, step: 1000, required: true, helpText: 'Business must be profitable' },
      { id: 'existingDebtPayments', name: 'existingDebtPayments', type: 'number', label: 'Existing Monthly Debt Payments', placeholder: '2000', min: 0, step: 100, required: true },
      { id: 'businessAge', name: 'businessAge', type: 'number', label: 'Business Age (Years)', placeholder: '3', min: 0, max: 100, step: 0.5, required: true },
      { id: 'creditScore', name: 'creditScore', type: 'number', label: 'Credit Score', placeholder: '720', min: 300, max: 850, step: 1, required: true },
      { id: 'collateralValue', name: 'collateralValue', type: 'number', label: 'Collateral Value', placeholder: '300000', min: 0, step: 1000, helpText: 'Optional: Value of assets to secure loan' },
      { id: 'loanPurpose', name: 'loanPurpose', type: 'select', label: 'Loan Purpose', required: true, options: [
        { value: 'working-capital', label: 'Working Capital' },
        { value: 'equipment', label: 'Equipment Purchase' },
        { value: 'real-estate', label: 'Real Estate' },
        { value: 'expansion', label: 'Business Expansion' },
        { value: 'acquisition', label: 'Business Acquisition' },
      ]},
      { id: 'personalGuaranteeAvailable', name: 'personalGuaranteeAvailable', type: 'select', label: 'Personal Guarantee Available?', required: true, options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ]},
    ],
    clientScript: 'business-loan-qualifier',
    analysisType: 'business-loan-qualifier',
  },
  
  'pricing-strategy': {
    id: 'pricing-strategy',
    title: 'Pricing Strategy Calculator',
    description: 'Optimize your product pricing with cost-plus, value-based, and competitive strategies. Find the optimal price point for maximum profit.',
    category: 'business',
    icon: '💲',
    color: 'orange',
    keywords: ['pricing', 'strategy', 'cost-plus', 'value-based', 'pricing optimization', 'profit margin', 'elasticity'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is value-based pricing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Value-based pricing sets price based on what customers are willing to pay for the value delivered, not your costs. Often captures 30-40% more profit than cost-plus.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does price elasticity affect my business?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Price elasticity measures how demand changes when price changes. A 10% price increase with 1.0 elasticity means 10% fewer units sold. Understanding this prevents pricing mistakes.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Business Tools', href: '/models/business' },
      { name: 'Pricing Strategy', href: '/calculator/pricing-strategy' },
    ],
    formFields: [
      { id: 'costPerUnit', name: 'costPerUnit', type: 'number', label: 'Cost per Unit', placeholder: '25', min: 0, step: 0.01, required: true, helpText: 'Your total cost to produce one unit' },
      { id: 'targetMargin', name: 'targetMargin', type: 'number', label: 'Target Margin (%)', placeholder: '40', min: 0, max: 1000, step: 1, required: true, helpText: 'Desired profit margin for cost-plus pricing' },
      { id: 'marketPrice', name: 'marketPrice', type: 'number', label: 'Competitor Market Price', placeholder: '50', min: 0, step: 0.01, required: true, helpText: 'What competitors charge for similar products' },
      { id: 'valueToCustomer', name: 'valueToCustomer', type: 'number', label: 'Value to Customer', placeholder: '100', min: 0, step: 0.01, required: true, helpText: 'Economic value your product creates for customers' },
      { id: 'unitsSoldMonthly', name: 'unitsSoldMonthly', type: 'number', label: 'Units Sold Monthly', placeholder: '500', min: 1, step: 1, required: true, helpText: 'Current or expected monthly sales volume' },
      { id: 'priceElasticity', name: 'priceElasticity', type: 'number', label: 'Price Elasticity', placeholder: '1.0', min: 0, max: 10, step: 0.1, required: true, helpText: '% demand change per % price change (1.0 = elastic, 0.5 = inelastic)' },
    ],
    clientScript: 'pricing-strategy',
    analysisType: 'pricing-strategy',
  },
  
  'saas-metrics': {
    id: 'saas-metrics',
    title: 'SaaS Metrics Dashboard',
    description: 'Track MRR, ARR, churn, CAC, LTV, LTV:CAC ratio, payback period, and Rule of 40 for your SaaS business',
    category: 'business',
    icon: '📈',
    color: 'indigo',
    keywords: ['SaaS', 'MRR', 'ARR', 'churn', 'CAC', 'LTV', 'metrics', 'Rule of 40', 'subscription'],
    faqSchema: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is a good LTV:CAC ratio for SaaS?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'A healthy LTV:CAC ratio is 3:1 or higher. This means customer lifetime value is 3x the cost to acquire them. Below 3:1 suggests unit economics need improvement.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the Rule of 40?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Rule of 40 states that growth rate + profit margin should equal 40% or more. It measures the balance between growth and profitability for SaaS companies.',
          },
        },
      ],
    },
    breadcrumbs: [
      { name: 'Home', href: '/' },
      { name: 'Business Tools', href: '/models/business' },
      { name: 'SaaS Metrics', href: '/calculator/saas-metrics' },
    ],
    formFields: [
      { id: 'activeCustomers', name: 'activeCustomers', type: 'number', label: 'Active Customers', placeholder: '150', min: 1, step: 1, required: true },
      { id: 'averageMonthlyRevenue', name: 'averageMonthlyRevenue', type: 'number', label: 'Average Revenue per Customer', placeholder: '99', min: 0.01, step: 0.01, required: true, helpText: 'Monthly subscription price per customer' },
      { id: 'newCustomersLastMonth', name: 'newCustomersLastMonth', type: 'number', label: 'New Customers Last Month', placeholder: '20', min: 0, step: 1, required: true },
      { id: 'churnedCustomersLastMonth', name: 'churnedCustomersLastMonth', type: 'number', label: 'Churned Customers Last Month', placeholder: '5', min: 0, step: 1, required: true },
      { id: 'salesMarketingSpend', name: 'salesMarketingSpend', type: 'number', label: 'Sales & Marketing Spend (Last Month)', placeholder: '10000', min: 0, step: 100, required: true },
      { id: 'averageCustomerLifetimeMonths', name: 'averageCustomerLifetimeMonths', type: 'number', label: 'Avg Customer Lifetime (Months)', placeholder: '24', min: 1, step: 1, required: true, helpText: 'How long customers stay on average' },
      { id: 'grossMargin', name: 'grossMargin', type: 'number', label: 'Gross Margin (%)', placeholder: '80', min: 0, max: 100, step: 1, required: true, helpText: 'Typical SaaS is 70-85%' },
      { id: 'revenueGrowthRate', name: 'revenueGrowthRate', type: 'number', label: 'Revenue Growth Rate (% Annual)', placeholder: '50', min: -100, max: 1000, step: 1, required: true },
    ],
    clientScript: 'saas-metrics',
    analysisType: 'saas-metrics',
  },
};

// Utility functions for calculator discovery and filtering
export function searchCalculators(query: string): CalculatorConfig[] {
  const searchTerm = query.toLowerCase();
  return Object.values(CALCULATOR_CONFIGS).filter(
    (calc) =>
      calc.title.toLowerCase().includes(searchTerm) ||
      calc.description.toLowerCase().includes(searchTerm) ||
      calc.keywords.some((keyword) => keyword.toLowerCase().includes(searchTerm))
  );
}

export function getCalculatorsByCategory(category: 'personal' | 'business'): CalculatorConfig[] {
  return Object.values(CALCULATOR_CONFIGS).filter((calc) => calc.category === category);
}

export function getCalculatorById(id: string): CalculatorConfig | undefined {
  return CALCULATOR_CONFIGS[id];
}

export function getAllCalculatorIds(): string[] {
  return Object.keys(CALCULATOR_CONFIGS);
}

export function getRandomCalculator(): CalculatorConfig {
  const calculators = Object.values(CALCULATOR_CONFIGS);
  return calculators[Math.floor(Math.random() * calculators.length)];
}

// Enhanced form generation with validation
export function generateFormHTMLWithValidation(fields: FormFieldConfig[]): string {
  const groupedFields = fields.reduce(
    (groups, field) => {
      const group = field.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
      return groups;
    },
    {} as Record<string, FormFieldConfig[]>
  );

  let html = '<form id="calculator-form" class="space-y-6" novalidate>';

  Object.entries(groupedFields).forEach(([groupName, groupFields], _index) => {
    if (groupName !== 'default') {
      const isOptional = groupName.includes('Optional');
      const sectionClass = isOptional 
        ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      html += `<div class="mb-6 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${sectionClass}">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">${groupName}</h3>`;
    }

    html += '<div class="grid grid-cols-1 md:grid-cols-2 gap-6">';

    groupFields.forEach((field) => {
      html += generateFieldHTMLWithValidation(field);
    });

    html += '</div>';

    if (groupName !== 'default') {
      html += '</div>';
    }
  });

  html += `
    <div class="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button type="submit" id="calculate-btn" class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
        📊 Calculate Scenarios
      </button>
      <button type="button" id="reset-btn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        Reset
      </button>
      <button type="button" id="save-btn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        💾 Save
      </button>
    </div>
  </form>`;

  return html;
}

function generateFieldHTMLWithValidation(field: FormFieldConfig): string {
  const baseAttrs = `
    id="${field.id}"
    name="${field.name}"
    ${field.required ? 'required' : ''}
    ${field.min !== undefined ? `min="${field.min}"` : ''}
    ${field.max !== undefined ? `max="${field.max}"` : ''}
    ${field.step !== undefined ? `step="${field.step}"` : ''}
    ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
    data-field-type="${field.type}"
  `.trim();

  let inputHTML = '';

  switch (field.type) {
    case 'number':
      inputHTML = `<input type="number" ${baseAttrs} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">`;
      break;
    case 'text':
      inputHTML = `<input type="text" ${baseAttrs} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">`;
      break;
    case 'select':
      inputHTML = `<select ${baseAttrs} class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">`;
      if (field.options) {
        field.options.forEach((option) => {
          inputHTML += `<option value="${option.value}">${option.label}</option>`;
        });
      }
      inputHTML += '</select>';
      break;
    case 'checkbox':
      inputHTML = `<input type="checkbox" ${baseAttrs} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">`;
      break;
  }

  return `
    <div class="form-field field-container" data-field-id="${field.id}">
      <label for="${field.id}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        ${field.label}
        ${field.required ? '<span class="text-red-500 ml-1">*</span>' : ''}
      </label>
      ${inputHTML}
      ${field.helpText ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${field.helpText}</p>` : ''}
      <div class="field-error text-sm text-red-600 dark:text-red-400 mt-1 hidden"></div>
    </div>
  `;
}

export function generateSoftwareApplicationSchema(config: CalculatorConfig, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.title,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    url: url,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.href,
    })),
  };
}

export function generateFormHTML(fields: FormFieldConfig[]): string {
  const groupedFields = fields.reduce(
    (groups, field) => {
      const group = field.group || 'default';
      if (!groups[group]) groups[group] = [];
      groups[group].push(field);
      return groups;
    },
    {} as Record<string, FormFieldConfig[]>
  );

  let html = '<form id="calculator-form" class="space-y-6">';

  Object.entries(groupedFields).forEach(([groupName, groupFields]) => {
    if (groupName !== 'default') {
      const isOptional = groupName.includes('Optional');
      const sectionClass = isOptional 
        ? 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50' 
        : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
      html += `<div class="mb-6 p-6 rounded-lg border border-gray-200 dark:border-gray-700 ${sectionClass}">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">${groupName}</h3>`;
    }

    // Use a more balanced grid layout
    const fieldCount = groupFields.length;
    let gridClass = 'grid grid-cols-1 gap-6';

    if (fieldCount <= 2) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    } else if (fieldCount <= 4) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 gap-6';
    } else if (fieldCount <= 6) {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    } else {
      gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }

    html += `<div class="${gridClass}">`;

    groupFields.forEach((field) => {
      html += generateFieldHTML(field);
    });

    html += '</div>';

    if (groupName !== 'default') {
      html += '</div>';
    }
  });

  html += `
    <div class="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <button type="submit" id="calculate-btn" class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl">
        📊 Calculate Scenarios
      </button>
      <button type="button" id="reset-btn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        Reset
      </button>
      <button type="button" id="save-scenario-btn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        💾 Save
      </button>
    </div>
  </form>`;

  return html;
}

function generateFieldHTML(field: FormFieldConfig): string {
  const baseAttrs = `
    id="${field.id}"
    name="${field.name}"
    ${field.required ? 'required' : ''}
    ${field.min !== undefined ? `min="${field.min}"` : ''}
    ${field.max !== undefined ? `max="${field.max}"` : ''}
    ${field.step !== undefined ? `step="${field.step}"` : ''}
    ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
  `.trim();

  let inputHTML = '';

  switch (field.type) {
    case 'number':
      inputHTML = `<input type="number" ${baseAttrs} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`;
      break;
    case 'text':
      inputHTML = `<input type="text" ${baseAttrs} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`;
      break;
    case 'select':
      inputHTML = `<select ${baseAttrs} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">`;
      if (field.options) {
        field.options.forEach((option) => {
          inputHTML += `<option value="${option.value}">${option.label}</option>`;
        });
      }
      inputHTML += '</select>';
      break;
    case 'checkbox':
      inputHTML = `<input type="checkbox" ${baseAttrs} class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">`;
      break;
  }

  return `
    <div class="field-container">
      <label for="${field.id}" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        ${field.label}${field.required ? ' <span class="text-red-500">*</span>' : ''}
      </label>
      ${inputHTML}
      ${field.helpText ? `<p class="text-sm text-gray-500 mt-1">${field.helpText}</p>` : ''}
    </div>
  `;
}
