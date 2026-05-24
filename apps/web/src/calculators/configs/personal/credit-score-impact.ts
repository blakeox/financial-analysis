import type { CalculatorConfig } from '../../types';

export const credit_score_impactCalculator: CalculatorConfig = {
  id: 'credit-score-impact',
  title: 'Credit Score Impact Analyzer',
  description:
    'Analyze actions that impact credit score including payment history, utilization, credit mix, and new credit inquiries',
  category: 'personal',
  icon: '📊',
  color: 'green',
  keywords: ['credit score', 'credit utilization', 'credit improvement', 'FICO'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What factors affect my credit score?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The main factors are payment history (35%), credit utilization (30%), length of credit history (15%), credit mix (10%), and new credit inquiries (10%).',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Credit Score Impact', href: '/calculator/credit-score-impact' },
  ],
  formFields: [
    {
      id: 'currentScore',
      name: 'currentScore',
      type: 'number',
      label: 'Current Credit Score',
      min: 300,
      max: 850,
      required: true,
    },
    {
      id: 'totalCreditLimit',
      name: 'totalCreditLimit',
      type: 'number',
      label: 'Total Credit Limit ($)',
      min: 0,
      required: true,
    },
    {
      id: 'totalCreditUsed',
      name: 'totalCreditUsed',
      type: 'number',
      label: 'Total Credit Used ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'credit-score-impact',
  analysisType: 'credit-score-impact',
};
