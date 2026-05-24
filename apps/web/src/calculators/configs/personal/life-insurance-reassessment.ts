import type { CalculatorConfig } from '../../types';

export const life_insurance_reassessmentCalculator: CalculatorConfig = {
  id: 'life-insurance-reassessment',
  title: 'Life Insurance Reassessment Calculator',
  description:
    'Reassess life insurance coverage needs, analyze gaps, optimize policies, and compare term vs permanent insurance',
  category: 'personal',
  icon: '💼',
  color: 'gray',
  keywords: ['life insurance', 'term life', 'whole life', 'coverage analysis'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How much life insurance do I need?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A common rule is 10-15x your annual income, or enough to cover debts, final expenses, and provide for dependents. Consider your specific financial obligations and goals.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Life Insurance Reassessment', href: '/calculator/life-insurance-reassessment' },
  ],
  formFields: [
    { id: 'age', name: 'age', type: 'number', label: 'Age', min: 18, max: 100, required: true },
    {
      id: 'gender',
      name: 'gender',
      type: 'select',
      label: 'Gender',
      required: true,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ],
    },
    {
      id: 'annualIncome',
      name: 'annualIncome',
      type: 'number',
      label: 'Annual Income ($)',
      min: 0,
      required: true,
    },
    {
      id: 'totalDebt',
      name: 'totalDebt',
      type: 'number',
      label: 'Total Debt ($)',
      min: 0,
      required: true,
    },
    {
      id: 'dependents',
      name: 'dependents',
      type: 'number',
      label: 'Number of Dependents',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'life-insurance-reassessment',
  analysisType: 'life-insurance-reassessment',
};
