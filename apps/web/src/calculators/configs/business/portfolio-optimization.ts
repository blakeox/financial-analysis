import type { CalculatorConfig } from '../../types';

export const portfolio_optimizationCalculator: CalculatorConfig = {
  id: 'portfolio-optimization',
  title: 'Portfolio Optimization',
  description: 'Portfolio optimization with mean-variance optimization and efficient frontier',
  category: 'business',
  icon: '📊',
  color: 'blue',
  keywords: ['portfolio optimization', 'efficient frontier', 'asset allocation', 'mean variance'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is portfolio optimization?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Portfolio optimization is the process of selecting the best mix of assets to maximize returns for a given level of risk, or minimize risk for a given level of return, using mathematical models like mean-variance optimization.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Tools', href: '/models/business' },
    { name: 'Portfolio Optimization', href: '/calculator/portfolio-optimization' },
  ],
  formFields: [
    {
      id: 'holdingCount',
      name: 'holdingCount',
      type: 'number',
      label: 'Number of Holdings',
      min: 1,
      max: 20,
      required: true,
      group: 'Portfolio',
    },
    {
      id: 'riskTolerance',
      name: 'riskTolerance',
      type: 'select',
      label: 'Risk Tolerance',
      required: true,
      group: 'Constraints',
      options: [
        { value: 'conservative', label: 'Conservative' },
        { value: 'moderate', label: 'Moderate' },
        { value: 'aggressive', label: 'Aggressive' },
      ],
    },
    {
      id: 'minAllocation',
      name: 'minAllocation',
      type: 'number',
      label: 'Min Allocation (%)',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
      group: 'Constraints',
    },
    {
      id: 'maxAllocation',
      name: 'maxAllocation',
      type: 'number',
      label: 'Max Allocation (%)',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
      group: 'Constraints',
    },
  ],
  clientScript: 'portfolio-optimization',
  analysisType: 'portfolio-optimization',
};
