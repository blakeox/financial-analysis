import type { CalculatorConfig } from '../../types';

export const varCalculator: CalculatorConfig = {
  id: 'var',
  title: 'Value at Risk (VaR) Calculator',
  description: 'Value at Risk calculation using historical, parametric, or Monte Carlo methods',
  category: 'business',
  icon: '📉',
  color: 'orange',
  keywords: ['var', 'value at risk', 'risk management', 'portfolio risk'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Value at Risk (VaR)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Value at Risk (VaR) is a statistical measure of the potential loss in value of a portfolio over a defined period for a given confidence interval. For example, a 95% VaR of $100,000 means there's a 5% chance of losing more than $100,000.",
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Tools', href: '/models/business' },
    { name: 'VaR Calculator', href: '/calculator/var' },
  ],
  formFields: [
    {
      id: 'positionCount',
      name: 'positionCount',
      type: 'number',
      label: 'Number of Positions',
      min: 1,
      max: 20,
      required: true,
      group: 'Portfolio',
    },
    {
      id: 'confidenceLevel',
      name: 'confidenceLevel',
      type: 'number',
      label: 'Confidence Level (%)',
      min: 90,
      max: 99,
      step: 0.1,
      required: true,
      group: 'Parameters',
    },
    {
      id: 'timeHorizon',
      name: 'timeHorizon',
      type: 'number',
      label: 'Time Horizon (days)',
      min: 1,
      max: 252,
      required: true,
      group: 'Parameters',
    },
    {
      id: 'method',
      name: 'method',
      type: 'select',
      label: 'Method',
      required: true,
      group: 'Parameters',
      options: [
        { value: 'historical', label: 'Historical' },
        { value: 'parametric', label: 'Parametric' },
        { value: 'monte-carlo', label: 'Monte Carlo' },
      ],
    },
  ],
  clientScript: 'var',
  analysisType: 'var',
};
