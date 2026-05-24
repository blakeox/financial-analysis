import type { CalculatorConfig } from '../../types';

export const depreciationCalculator: CalculatorConfig = {
  id: 'depreciation',
  title: 'Depreciation Calculator',
  description:
    'Calculate depreciation using multiple methods (straight-line, declining balance, MACRS, Section 179, bonus depreciation)',
  category: 'business',
  icon: '🏭',
  color: 'orange',
  keywords: ['depreciation', 'MACRS', 'Section 179', 'bonus depreciation', 'tax deduction'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Section 179 deduction?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Section 179 allows businesses to deduct the full purchase price of qualifying equipment in the year it is purchased, up to annual limits.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Depreciation', href: '/calculator/depreciation' },
  ],
  formFields: [
    {
      id: 'purchaseCost',
      name: 'purchaseCost',
      type: 'number',
      label: 'Purchase Cost ($)',
      min: 0,
      required: true,
    },
    {
      id: 'usefulLife',
      name: 'usefulLife',
      type: 'number',
      label: 'Useful Life (Years)',
      min: 1,
      max: 50,
      required: true,
    },
    {
      id: 'depreciationMethod',
      name: 'depreciationMethod',
      type: 'select',
      label: 'Depreciation Method',
      required: true,
      options: [
        { value: 'straight-line', label: 'Straight-Line' },
        { value: 'declining-balance', label: 'Declining Balance' },
        { value: 'macrs', label: 'MACRS' },
        { value: 'section-179', label: 'Section 179' },
        { value: 'bonus-depreciation', label: 'Bonus Depreciation' },
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
  clientScript: 'depreciation',
  analysisType: 'depreciation',
};
