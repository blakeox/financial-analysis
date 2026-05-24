import type { CalculatorConfig } from '../../types';

export const long_term_careCalculator: CalculatorConfig = {
  id: 'long-term-care',
  title: 'Long-Term Care Planning Calculator',
  description:
    'Analyze long-term care insurance needs, self-funding options, and hybrid strategies',
  category: 'personal',
  icon: '👴',
  color: 'teal',
  keywords: ['long-term care', 'LTC insurance', 'eldercare', 'retirement planning'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do I need long-term care insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Long-term care insurance can protect your assets if you need extended care. Consider it if you have significant assets to protect and want to avoid depleting your savings.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Long-Term Care', href: '/calculator/long-term-care' },
  ],
  formFields: [
    { id: 'age', name: 'age', type: 'number', label: 'Age', min: 40, max: 100, required: true },
    {
      id: 'gender',
      name: 'gender',
      type: 'select',
      label: 'Gender',
      required: true,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
    {
      id: 'healthStatus',
      name: 'healthStatus',
      type: 'select',
      label: 'Health Status',
      required: true,
      options: [
        { value: 'excellent', label: 'Excellent' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' },
      ],
    },
    {
      id: 'annualCareCost',
      name: 'annualCareCost',
      type: 'number',
      label: 'Annual Care Cost ($)',
      min: 0,
      required: true,
    },
    {
      id: 'currentAssets',
      name: 'currentAssets',
      type: 'number',
      label: 'Current Assets ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'long-term-care',
  analysisType: 'long-term-care',
};
