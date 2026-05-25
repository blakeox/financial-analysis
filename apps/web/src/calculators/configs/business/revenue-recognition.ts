import type { CalculatorConfig } from '../../types';

export const revenue_recognitionCalculator: CalculatorConfig = {
  id: 'revenue-recognition',
  title: 'Revenue Recognition Calculator',
  description:
    'ASC 606 compliant revenue recognition analysis with performance obligation allocation and deferred revenue',
  category: 'business',
  icon: '💰',
  color: 'green',
  keywords: ['revenue recognition', 'ASC 606', 'deferred revenue', 'performance obligations'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is ASC 606?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ASC 606 is the revenue recognition standard that provides a framework for recognizing revenue from contracts with customers.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Revenue Recognition', href: '/calculator/revenue-recognition' },
  ],
  formFields: [
    { id: 'industry', name: 'industry', type: 'text', label: 'Industry', required: true },
    {
      id: 'revenueModel',
      name: 'revenueModel',
      type: 'select',
      label: 'Revenue Model',
      required: true,
      options: [
        { value: 'product', label: 'Product' },
        { value: 'service', label: 'Service' },
        { value: 'subscription', label: 'Subscription' },
        { value: 'licensing', label: 'Licensing' },
      ],
    },
  ],
  clientScript: 'revenue-recognition',
  analysisType: 'revenue-recognition',
};
