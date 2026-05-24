import type { CalculatorConfig } from '../../types';

export const amortizationCalculator: CalculatorConfig = {
  id: 'amortization',
  title: 'Amortization Calculator',
  description: 'Calculate loan payments and view detailed amortization schedules',
  category: 'personal',
  icon: '🏠',
  color: 'blue',
  keywords: ['mortgage', 'loan', 'amortization', 'payment schedule'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is an amortization schedule?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'An amortization schedule is a table showing each loan payment over time, breaking down how much goes toward principal versus interest.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do extra payments affect my mortgage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Extra payments directly reduce your principal balance, which lowers future interest charges and can shorten your loan term significantly.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Amortization', href: '/amortization' },
  ],
  formFields: [
    {
      id: 'principal',
      name: 'principal',
      type: 'number',
      label: 'Loan Amount ($)',
      min: 0,
      step: 0.01,
      required: true,
      assistantAliases: ['loan amount', 'amount', 'principal', 'mortgage amount'],
    },
    {
      id: 'annualRate',
      name: 'annualRate',
      type: 'number',
      label: 'Annual Interest Rate (%)',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
      assistantAliases: ['interest', 'interest rate', 'rate', 'apr'],
    },
    {
      id: 'termMonths',
      name: 'termMonths',
      type: 'number',
      label: 'Loan Term (Months)',
      min: 1,
      max: 600,
      required: true,
      helpText: 'Common: 360 (30yr), 180 (15yr), 60 (5yr)',
      assistantAliases: ['term', 'loan term', 'mortgage term'],
    },
    {
      id: 'extraPayment',
      name: 'extraPayment',
      type: 'number',
      label: 'Extra Monthly Payment ($) (Optional)',
      min: 0,
      step: 0.01,
      assistantAliases: ['extra payment', 'extra', 'extra monthly payment'],
    },
  ],
  clientScript: 'amortization',
  analysisType: 'amortization',
};
