import type { CalculatorConfig } from '../../types';

export const budgetCalculator: CalculatorConfig = {
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
};
