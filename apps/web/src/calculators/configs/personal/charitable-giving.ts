import type { CalculatorConfig } from '../../types';

export const charitable_givingCalculator: CalculatorConfig = {
  id: 'charitable-giving',
  title: 'Charitable Giving Optimizer',
  description:
    'Optimize charitable giving strategies including cash, securities, DAFs, and QCDs for maximum tax benefits',
  category: 'personal',
  icon: '❤️',
  color: 'red',
  keywords: ['charitable giving', 'donations', 'tax deduction', 'DAF', 'QCD'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a Qualified Charitable Distribution (QCD)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A QCD allows IRA owners age 70.5+ to donate up to $100,000 directly to charity, which counts toward RMDs and is excluded from taxable income.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Charitable Giving', href: '/calculator/charitable-giving' },
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
      id: 'annualGivingAmount',
      name: 'annualGivingAmount',
      type: 'number',
      label: 'Annual Giving Amount ($)',
      min: 0,
      required: true,
    },
    {
      id: 'givingMethod',
      name: 'givingMethod',
      type: 'select',
      label: 'Giving Method',
      required: true,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'appreciated-securities', label: 'Appreciated Securities' },
        { value: 'donor-advised-fund', label: 'Donor-Advised Fund' },
        { value: 'qcd', label: 'Qualified Charitable Distribution' },
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
  ],
  clientScript: 'charitable-giving',
  analysisType: 'charitable-giving',
};
