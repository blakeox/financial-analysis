import type { CalculatorConfig } from '../../types';

export const debt_payoffCalculator: CalculatorConfig = {
  id: 'debt-payoff',
  title: 'Debt Payoff Optimizer',
  description: 'Compare avalanche vs snowball debt payoff strategies with month-by-month schedules',
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
};
