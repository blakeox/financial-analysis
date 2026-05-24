import type { CalculatorConfig } from '../../types';

export const cryptocurrency_taxCalculator: CalculatorConfig = {
  id: 'cryptocurrency-tax',
  title: 'Cryptocurrency Tax Calculator',
  description:
    'Calculate cryptocurrency tax obligations with FIFO/LIFO/HIFO methods, wash sale analysis, and DeFi transaction tracking',
  category: 'personal',
  icon: '₿',
  color: 'yellow',
  keywords: ['cryptocurrency', 'crypto tax', 'bitcoin', 'FIFO', 'LIFO', 'capital gains'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How are cryptocurrency transactions taxed?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Cryptocurrency is treated as property by the IRS. Sales, trades, and disposals trigger capital gains/losses. Mining and staking are taxed as ordinary income.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Specialized', href: '/specialized' },
    { name: 'Cryptocurrency Tax', href: '/calculator/cryptocurrency-tax' },
  ],
  formFields: [
    {
      id: 'taxYear',
      name: 'taxYear',
      type: 'number',
      label: 'Tax Year',
      min: 2000,
      max: 2100,
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
      id: 'federalTaxRate',
      name: 'federalTaxRate',
      type: 'number',
      label: 'Federal Tax Rate (%)',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
    },
    {
      id: 'costBasisMethod',
      name: 'costBasisMethod',
      type: 'select',
      label: 'Cost Basis Method',
      required: true,
      options: [
        { value: 'fifo', label: 'FIFO (First In, First Out)' },
        { value: 'lifo', label: 'LIFO (Last In, First Out)' },
        { value: 'hifo', label: 'HIFO (Highest In, First Out)' },
        { value: 'specific-identification', label: 'Specific Identification' },
      ],
    },
  ],
  clientScript: 'cryptocurrency-tax',
  analysisType: 'cryptocurrency-tax',
};
