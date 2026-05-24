import type { CalculatorConfig } from '../../types';

export const hsa_optimizationCalculator: CalculatorConfig = {
  id: 'hsa-optimization',
  title: 'HSA Optimization Calculator',
  description:
    'Maximize Health Savings Account tax benefits with triple tax advantage analysis and contribution optimization',
  category: 'personal',
  icon: '🏥',
  color: 'green',
  keywords: ['HSA', 'health savings account', 'tax benefits', 'healthcare', 'retirement'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the triple tax advantage of an HSA?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'HSAs offer triple tax advantage: contributions are tax-deductible, growth is tax-free, and withdrawals for qualified medical expenses are tax-free.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'HSA Optimization', href: '/calculator/hsa-optimization' },
  ],
  formFields: [
    { id: 'age', name: 'age', type: 'number', label: 'Age', min: 18, max: 100, required: true },
    {
      id: 'filingStatus',
      name: 'filingStatus',
      type: 'select',
      label: 'Filing Status',
      required: true,
      options: [
        { value: 'single', label: 'Single' },
        { value: 'married-joint', label: 'Married Filing Jointly' },
        { value: 'married-separate', label: 'Married Filing Separately' },
        { value: 'head-of-household', label: 'Head of Household' },
      ],
    },
    {
      id: 'annualContribution',
      name: 'annualContribution',
      type: 'number',
      label: 'Annual Contribution ($)',
      min: 0,
      required: true,
    },
    {
      id: 'federalTaxRate',
      name: 'federalTaxRate',
      type: 'number',
      label: 'Federal Tax Rate (%)',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: 'hsa-optimization',
  analysisType: 'hsa-optimization',
};
