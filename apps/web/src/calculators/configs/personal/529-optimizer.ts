import type { CalculatorConfig } from '../../types';

export const optimizer529Calculator: CalculatorConfig = {
  id: '529-optimizer',
  title: '529 Plan Optimizer',
  description:
    'Optimize 529 plan contributions, compare state plans for tax benefits, and analyze financial aid impact',
  category: 'personal',
  icon: '🎓',
  color: 'blue',
  keywords: ['529 plan', 'college savings', 'education funding', 'financial aid'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do 529 plans affect financial aid?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '529 plans owned by parents are assessed at up to 5.64% of their value for FAFSA purposes, which is more favorable than student-owned assets.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: '529 Plan Optimizer', href: '/calculator/529-optimizer' },
  ],
  formFields: [
    {
      id: 'stateOfResidence',
      name: 'stateOfResidence',
      type: 'text',
      label: 'State of Residence',
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
      id: 'annualContribution',
      name: 'annualContribution',
      type: 'number',
      label: 'Annual Contribution ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: '529-optimizer',
  analysisType: '529-optimizer',
};
