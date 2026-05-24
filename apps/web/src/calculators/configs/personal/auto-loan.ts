import type { CalculatorConfig } from '../../types';

export const auto_loanCalculator: CalculatorConfig = {
  id: 'auto-loan',
  title: 'Auto Loan Calculator',
  description:
    'Calculate vehicle loan payments with trade-in value, sales tax, fees, and early payoff scenarios',
  category: 'personal',
  icon: '🚗',
  color: 'purple',
  keywords: ['auto loan', 'car loan', 'vehicle financing', 'trade-in'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I calculate my auto loan payment?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Enter your vehicle price, down payment, trade-in value, interest rate, and loan term. The calculator automatically includes sales tax, registration fees, and any rebates.',
        },
      },
      {
        '@type': 'Question',
        name: 'Should I include my trade-in value?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, your trade-in value reduces the amount you need to finance. If you owe more than the trade-in value (negative equity), the calculator adds that amount to your new loan.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Models', href: '/models' },
    { name: 'Auto Loan', href: '/auto-loan' },
  ],
  formFields: [
    {
      id: 'vehiclePrice',
      name: 'vehiclePrice',
      type: 'number',
      label: 'Vehicle Price',
      min: 0,
      step: 0.01,
      required: true,
      assistantAliases: ['price', 'car price', 'vehicle price', 'purchase price'],
    },
    {
      id: 'downPayment',
      name: 'downPayment',
      type: 'number',
      label: 'Down Payment',
      min: 0,
      step: 0.01,
      assistantAliases: ['down payment', 'cash down'],
    },
    {
      id: 'interestRate',
      name: 'interestRate',
      type: 'number',
      label: 'Interest Rate (APR %)',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
      assistantAliases: ['interest', 'interest rate', 'rate', 'apr'],
    },
    {
      id: 'loanTerm',
      name: 'loanTerm',
      type: 'select',
      label: 'Loan Term (months)',
      required: true,
      assistantAliases: ['term', 'loan term', 'months'],
      options: [
        { value: '12', label: '12 months (1 year)' },
        { value: '24', label: '24 months (2 years)' },
        { value: '36', label: '36 months (3 years)' },
        { value: '48', label: '48 months (4 years)' },
        { value: '60', label: '60 months (5 years)' },
        { value: '72', label: '72 months (6 years)' },
        { value: '84', label: '84 months (7 years)' },
      ],
    },
  ],
  clientScript: 'auto-loan',
  analysisType: 'auto-loan',
};
