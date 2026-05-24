import type { CalculatorConfig } from '../../types';

export const equipment_leaseCalculator: CalculatorConfig = {
  id: 'equipment-lease',
  title: 'Equipment Lease Calculator',
  description:
    'Equipment and machinery lease analysis with payment schedules, residual value, and lease vs buy comparison',
  category: 'business',
  icon: '🔧',
  color: 'cyan',
  keywords: ['equipment lease', 'machinery', 'finance lease', 'operating lease', 'residual value'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the difference between finance and operating leases?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A finance lease is treated like ownership for accounting purposes and transfers ownership at the end of the lease term. An operating lease is like renting equipment and returns it at the end.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do you calculate residual value for equipment leases?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Residual value is the estimated worth of equipment at lease end, typically 10-30% of original cost. Higher residual values result in lower monthly payments.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Models', href: '/models' },
    { name: 'Equipment Lease', href: '/calculator/equipment-lease' },
  ],
  formFields: [
    {
      id: 'equipmentCost',
      name: 'equipmentCost',
      type: 'number',
      label: 'Equipment Cost ($)',
      min: 0,
      step: 1000,
      required: true,
    },
    {
      id: 'downPayment',
      name: 'downPayment',
      type: 'number',
      label: 'Down Payment ($)',
      min: 0,
      step: 1000,
    },
    {
      id: 'leaseTerm',
      name: 'leaseTerm',
      type: 'number',
      label: 'Lease Term (months)',
      min: 1,
      max: 120,
      required: true,
    },
    {
      id: 'interestRate',
      name: 'interestRate',
      type: 'number',
      label: 'Interest Rate (%)',
      min: 0,
      max: 30,
      step: 0.1,
      required: true,
    },
    {
      id: 'residualValue',
      name: 'residualValue',
      type: 'number',
      label: 'Residual Value ($)',
      min: 0,
      step: 1000,
    },
  ],
  clientScript: 'equipment-lease',
  analysisType: 'equipment-lease',
};
