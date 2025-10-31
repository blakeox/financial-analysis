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
  type: 'number' | 'text' | 'select' | 'checkbox';
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
        label: 'Home Price ($)',
        min: 0,
        step: 1000,
        required: true,
        group: 'base-loan',
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
        group: 'base-loan',
      },
      {
        id: 'scenario1Down',
        name: 'scenario1Down',
        type: 'number',
        label: 'Scenario 1: Down Payment ($)',
        min: 0,
        step: 1000,
        required: true,
        group: 'scenario1',
      },
      {
        id: 'scenario1Rate',
        name: 'scenario1Rate',
        type: 'number',
        label: 'Scenario 1: Interest Rate (%)',
        min: 0,
        max: 30,
        step: 0.01,
        required: true,
        group: 'scenario1',
      },
      {
        id: 'scenario1Extra',
        name: 'scenario1Extra',
        type: 'number',
        label: 'Scenario 1: Extra Monthly Payment ($)',
        min: 0,
        step: 100,
        group: 'scenario1',
      },
      {
        id: 'scenario2Down',
        name: 'scenario2Down',
        type: 'number',
        label: 'Scenario 2: Down Payment ($)',
        min: 0,
        step: 1000,
        required: true,
        group: 'scenario2',
      },
      {
        id: 'scenario2Rate',
        name: 'scenario2Rate',
        type: 'number',
        label: 'Scenario 2: Interest Rate (%)',
        min: 0,
        max: 30,
        step: 0.01,
        required: true,
        group: 'scenario2',
      },
      {
        id: 'scenario2Extra',
        name: 'scenario2Extra',
        type: 'number',
        label: 'Scenario 2: Extra Monthly Payment ($)',
        min: 0,
        step: 100,
        group: 'scenario2',
      },
      {
        id: 'refinanceRate',
        name: 'refinanceRate',
        type: 'number',
        label: 'Refinance Rate (%) (Optional)',
        min: 0,
        max: 30,
        step: 0.01,
        group: 'refinance',
        helpText: 'Compare refinancing after 5 years',
      },
    ],
    clientScript: 'mortgage-scenario-planning',
    analysisType: 'mortgage-scenario-planning',
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

  Object.entries(groupedFields).forEach(([groupName, groupFields]) => {
    if (groupName !== 'default') {
      html += `<div class="mb-6"><h3 class="text-lg font-semibold mb-4">${groupName}</h3>`;
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
    <div class="flex space-x-4">
      <button type="submit" id="calculate-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
        Calculate
      </button>
      <button type="button" id="reset-btn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200">
        Reset
      </button>
      <button type="button" id="save-btn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors duration-200">
        Save Scenario
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
      html += `<div class="mb-6"><h3 class="text-lg font-semibold mb-4">${groupName}</h3>`;
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
    <div class="flex flex-wrap gap-4 mt-8">
      <button type="submit" id="calculate-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        Calculate
      </button>
      <button type="button" id="reset-btn" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        Reset
      </button>
      <button type="button" id="save-scenario-btn" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
        Save Scenario
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
