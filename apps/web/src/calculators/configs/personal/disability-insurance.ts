import type { CalculatorConfig } from '../../types';

export const disability_insuranceCalculator: CalculatorConfig = {
  id: 'disability-insurance',
  title: 'Disability Insurance Calculator',
  description:
    'Analyze disability insurance needs, coverage gaps, and policy options with own-occupation vs any-occupation analysis',
  category: 'personal',
  icon: '🛡️',
  color: 'indigo',
  keywords: ['disability insurance', 'income protection', 'disability coverage'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the difference between own-occupation and any-occupation disability insurance?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Own-occupation coverage pays if you cannot work in your specific profession, while any-occupation only pays if you cannot work in any job. Own-occupation is more comprehensive but typically more expensive.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Disability Insurance', href: '/calculator/disability-insurance' },
  ],
  formFields: [
    { id: 'age', name: 'age', type: 'number', label: 'Age', min: 18, max: 65, required: true },
    {
      id: 'annualIncome',
      name: 'annualIncome',
      type: 'number',
      label: 'Annual Income ($)',
      min: 0,
      required: true,
    },
    {
      id: 'monthlyExpenses',
      name: 'monthlyExpenses',
      type: 'number',
      label: 'Monthly Expenses ($)',
      min: 0,
      required: true,
    },
    {
      id: 'benefitAmount',
      name: 'benefitAmount',
      type: 'number',
      label: 'Benefit Amount ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'disability-insurance',
  analysisType: 'disability-insurance',
};
