import type { CalculatorConfig } from '../../types';

export const international_tax_planningCalculator: CalculatorConfig = {
  id: 'international-tax-planning',
  title: 'International Tax Planning Calculator',
  description:
    'Optimize international tax planning with FEIE, FTC, tax treaties, and entity structure analysis for global income',
  category: 'personal',
  icon: '🌍',
  color: 'blue',
  keywords: ['international tax', 'FEIE', 'foreign tax credit', 'tax treaties', 'expat tax'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the Foreign Earned Income Exclusion (FEIE)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'FEIE allows qualifying U.S. expats to exclude up to $120,000 (2024) of foreign earned income from U.S. taxation if they meet physical presence or bona fide residence tests.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Specialized', href: '/specialized' },
    { name: 'International Tax Planning', href: '/calculator/international-tax-planning' },
  ],
  formFields: [
    {
      id: 'citizenship',
      name: 'citizenship',
      type: 'text',
      label: 'Citizenship',
      required: true,
    },
    {
      id: 'residency',
      name: 'residency',
      type: 'text',
      label: 'Country of Residence',
      required: true,
    },
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
      id: 'domesticIncome',
      name: 'domesticIncome',
      type: 'number',
      label: 'Domestic Income ($)',
      min: 0,
      required: true,
    },
    {
      id: 'foreignIncome',
      name: 'foreignIncome',
      type: 'number',
      label: 'Foreign Income ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'international-tax-planning',
  analysisType: 'international-tax-planning',
};
