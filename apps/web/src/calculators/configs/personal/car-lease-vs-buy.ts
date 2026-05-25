import type { CalculatorConfig } from '../../types';

export const car_lease_vs_buyCalculator: CalculatorConfig = {
  id: 'car-lease-vs-buy',
  title: 'Car Lease vs Buy Calculator',
  description:
    'Compare car leasing vs buying with comprehensive cost analysis including ownership costs and depreciation',
  category: 'personal',
  icon: '🚗',
  color: 'purple',
  keywords: ['car lease', 'car buy', 'vehicle financing', 'lease vs buy', 'automotive'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Should I lease or buy a car?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Leasing typically works better if you want a new car every few years and drive within mileage limits. Buying is better if you plan to keep the car long-term or drive many miles.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Car Lease vs Buy', href: '/calculator/car-lease-vs-buy' },
  ],
  formFields: [
    { id: 'msrp', name: 'msrp', type: 'number', label: 'MSRP ($)', min: 0, required: true },
    {
      id: 'negotiatedPrice',
      name: 'negotiatedPrice',
      type: 'number',
      label: 'Negotiated Price ($)',
      min: 0,
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
      label: 'Lease Term (Months)',
      min: 24,
      max: 60,
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
    {
      id: 'loanTerm',
      name: 'loanTerm',
      type: 'number',
      label: 'Loan Term (Months)',
      min: 12,
      max: 84,
      required: true,
    },
    {
      id: 'annualInsurance',
      name: 'annualInsurance',
      type: 'number',
      label: 'Annual Insurance ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'car-lease-vs-buy',
  analysisType: 'car-lease-vs-buy',
};
