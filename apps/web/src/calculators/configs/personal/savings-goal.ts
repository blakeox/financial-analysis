import type { CalculatorConfig } from '../../types';

export const savings_goalCalculator: CalculatorConfig = {
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
      assistantAliases: ['goal', 'goal amount', 'target'],
    },
    {
      id: 'currentSavings',
      name: 'currentSavings',
      type: 'number',
      label: 'Current Savings ($)',
      min: 0,
      step: 0.01,
      assistantAliases: ['current savings', 'starting savings', 'savings'],
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
      assistantAliases: ['target date', 'timeframe', 'years', 'timeline'],
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
      assistantAliases: ['interest', 'interest rate', 'rate'],
    },
    {
      id: 'inflationRate',
      name: 'inflationRate',
      type: 'number',
      label: 'Inflation Rate (%)',
      min: 0,
      max: 10,
      step: 0.1,
      assistantAliases: ['inflation', 'inflation rate'],
    },
  ],
  clientScript: 'savings-goal',
  analysisType: 'savings-goal',
};
