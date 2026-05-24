import type { CalculatorConfig } from '../../types';

export const retirementCalculator: CalculatorConfig = {
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
      assistantAliases: ['current age', 'age'],
    },
    {
      id: 'retirementAge',
      name: 'retirementAge',
      type: 'number',
      label: 'Retirement Age',
      min: 50,
      max: 100,
      required: true,
      assistantAliases: ['retirement age', 'retire at'],
    },
    {
      id: 'annualIncome',
      name: 'annualIncome',
      type: 'number',
      label: 'Current Annual Income',
      min: 0,
      step: 0.01,
      required: true,
      assistantAliases: ['income', 'annual income', 'salary'],
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
      assistantAliases: ['return rate', 'growth rate', 'rate of return'],
    },
  ],
  clientScript: 'retirement',
  analysisType: 'retirement',
};
