import type { CalculatorConfig } from '../../types';

export const dscrCalculator: CalculatorConfig = {
  id: 'dscr',
  title: 'Debt Service Coverage Ratio (DSCR) Calculator',
  description:
    'Calculate and analyze your Debt Service Coverage Ratio to assess loan eligibility and risk',
  category: 'business',
  icon: '📊',
  color: 'blue',
  keywords: ['DSCR', 'debt service coverage', 'loan eligibility', 'debt ratio'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a good DSCR?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lenders typically require DSCR of 1.25x or higher. A ratio of 1.5x or above is considered excellent and indicates strong debt service capacity.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Tools', href: '/models/business' },
    { name: 'DSCR Calculator', href: '/calculator/dscr' },
  ],
  formFields: [
    {
      id: 'ebitda',
      name: 'ebitda',
      type: 'number',
      label: 'Annual EBITDA ($)',
      step: 10000,
      required: true,
    },
    {
      id: 'annualDebtService',
      name: 'annualDebtService',
      type: 'number',
      label: 'Annual Debt Service ($)',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'existingDebtService',
      name: 'existingDebtService',
      type: 'number',
      label: 'Existing Annual Debt Service ($)',
      min: 0,
      step: 1000,
      default: 0,
    },
    {
      id: 'newLoanPayment',
      name: 'newLoanPayment',
      type: 'number',
      label: 'New Loan Monthly Payment ($) (Optional)',
      min: 0,
      step: 100,
    },
  ],
  clientScript: 'dscr',
  analysisType: 'dscr',
};
