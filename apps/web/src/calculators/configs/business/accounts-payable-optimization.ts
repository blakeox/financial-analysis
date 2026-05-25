import type { CalculatorConfig } from '../../types';

export const accounts_payable_optimizationCalculator: CalculatorConfig = {
  id: 'accounts-payable-optimization',
  title: 'Accounts Payable Optimization',
  description:
    'Optimize accounts payable management with payment term analysis, early payment discounts, and cash flow optimization',
  category: 'business',
  icon: '💳',
  color: 'teal',
  keywords: ['accounts payable', 'payment terms', 'early payment discount', 'cash flow'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Should I take early payment discounts?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Early payment discounts can provide significant returns if the discount rate exceeds your cost of capital. Calculate the effective annual rate to compare.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Accounts Payable Optimization', href: '/calculator/accounts-payable-optimization' },
  ],
  formFields: [
    {
      id: 'totalPayables',
      name: 'totalPayables',
      type: 'number',
      label: 'Total Payables ($)',
      min: 0,
      required: true,
    },
    {
      id: 'currentCash',
      name: 'currentCash',
      type: 'number',
      label: 'Current Cash ($)',
      min: 0,
      required: true,
    },
    {
      id: 'monthlyCashFlow',
      name: 'monthlyCashFlow',
      type: 'number',
      label: 'Monthly Cash Flow ($)',
      required: true,
    },
    {
      id: 'costOfCapital',
      name: 'costOfCapital',
      type: 'number',
      label: 'Cost of Capital (%)',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: 'accounts-payable-optimization',
  analysisType: 'accounts-payable-optimization',
};
