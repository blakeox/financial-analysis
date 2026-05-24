import type { CalculatorConfig } from '../../types';

export const accounts_receivable_agingCalculator: CalculatorConfig = {
  id: 'accounts-receivable-aging',
  title: 'Accounts Receivable Aging Analysis',
  description:
    'Analyze accounts receivable aging, calculate DSO, forecast bad debt, and optimize collection strategies',
  category: 'business',
  icon: '📋',
  color: 'green',
  keywords: ['accounts receivable', 'DSO', 'collection', 'bad debt', 'aging analysis'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Days Sales Outstanding (DSO)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'DSO measures the average number of days it takes to collect payment after a sale. Lower DSO indicates better cash flow management.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Accounts Receivable Aging', href: '/calculator/accounts-receivable-aging' },
  ],
  formFields: [
    {
      id: 'totalReceivables',
      name: 'totalReceivables',
      type: 'number',
      label: 'Total Receivables ($)',
      min: 0,
      required: true,
    },
    {
      id: 'annualSales',
      name: 'annualSales',
      type: 'number',
      label: 'Annual Sales ($)',
      min: 0,
      required: true,
    },
    {
      id: 'annualCreditSales',
      name: 'annualCreditSales',
      type: 'number',
      label: 'Annual Credit Sales ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'accounts-receivable-aging',
  analysisType: 'accounts-receivable-aging',
};
