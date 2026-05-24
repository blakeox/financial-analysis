import type { CalculatorConfig } from '../../types';

export const exchange1031Calculator: CalculatorConfig = {
  id: '1031-exchange',
  title: '1031 Exchange Analyzer',
  description:
    'Analyze 1031 like-kind exchange opportunities for real estate with tax deferral calculations and replacement property analysis',
  category: 'personal',
  icon: '🏘️',
  color: 'green',
  keywords: ['1031 exchange', 'like-kind exchange', 'real estate', 'tax deferral'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a 1031 exchange?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A 1031 exchange allows real estate investors to defer capital gains taxes by exchanging one investment property for another like-kind property.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Specialized', href: '/specialized' },
    { name: '1031 Exchange', href: '/calculator/1031-exchange' },
  ],
  formFields: [
    {
      id: 'salePrice',
      name: 'salePrice',
      type: 'number',
      label: 'Sale Price of Relinquished Property ($)',
      min: 0,
      required: true,
    },
    {
      id: 'adjustedBasis',
      name: 'adjustedBasis',
      type: 'number',
      label: 'Adjusted Basis ($)',
      min: 0,
      required: true,
    },
    {
      id: 'replacementPurchasePrice',
      name: 'replacementPurchasePrice',
      type: 'number',
      label: 'Replacement Property Purchase Price ($)',
      min: 0,
      required: true,
    },
    {
      id: 'capitalGainsRate',
      name: 'capitalGainsRate',
      type: 'number',
      label: 'Capital Gains Tax Rate (%)',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: '1031-exchange',
  analysisType: '1031-exchange',
};
