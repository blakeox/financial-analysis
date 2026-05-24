import type { CalculatorConfig } from '../../types';

export const equipment_lease_vs_buyCalculator: CalculatorConfig = {
  id: 'equipment-lease-vs-buy',
  title: 'Equipment Lease vs Buy Calculator',
  description:
    'Compare equipment leasing vs purchasing with tax implications, NPV/IRR analysis, and cash flow comparison',
  category: 'business',
  icon: '⚙️',
  color: 'teal',
  keywords: ['equipment lease', 'equipment purchase', 'lease vs buy', 'capital equipment'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Should I lease or buy equipment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Leasing provides flexibility and preserves capital but may cost more long-term. Buying offers ownership and potential tax benefits but requires upfront capital.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Equipment Lease vs Buy', href: '/calculator/equipment-lease-vs-buy' },
  ],
  formFields: [
    {
      id: 'purchasePrice',
      name: 'purchasePrice',
      type: 'number',
      label: 'Purchase Price ($)',
      min: 0,
      required: true,
    },
    {
      id: 'usefulLife',
      name: 'usefulLife',
      type: 'number',
      label: 'Useful Life (Years)',
      min: 1,
      max: 20,
      required: true,
    },
    {
      id: 'monthlyPayment',
      name: 'monthlyPayment',
      type: 'number',
      label: 'Monthly Lease Payment ($)',
      min: 0,
      required: true,
    },
    {
      id: 'leaseTerm',
      name: 'leaseTerm',
      type: 'number',
      label: 'Lease Term (Years)',
      min: 1,
      max: 10,
      required: true,
    },
    {
      id: 'interestRate',
      name: 'interestRate',
      type: 'number',
      label: 'Purchase Interest Rate (%)',
      min: 0,
      max: 20,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: 'equipment-lease-vs-buy',
  analysisType: 'equipment-lease-vs-buy',
};
