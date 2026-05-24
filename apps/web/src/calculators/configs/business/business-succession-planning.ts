import type { CalculatorConfig } from '../../types';

export const business_succession_planningCalculator: CalculatorConfig = {
  id: 'business-succession-planning',
  title: 'Business Succession Planning Calculator',
  description:
    'Plan business succession with valuation, buy-sell agreements, tax optimization, and transfer strategies',
  category: 'business',
  icon: '👔',
  color: 'gray',
  keywords: ['business succession', 'buy-sell agreement', 'business transfer', 'estate planning'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is business succession planning?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Business succession planning involves preparing for the transfer of business ownership, whether to family, employees, or third parties, with tax and legal considerations.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Business Succession Planning', href: '/calculator/business-succession-planning' },
  ],
  formFields: [
    {
      id: 'businessName',
      name: 'businessName',
      type: 'text',
      label: 'Business Name',
      required: true,
    },
    {
      id: 'businessValue',
      name: 'businessValue',
      type: 'number',
      label: 'Business Value ($)',
      min: 0,
      required: true,
    },
    {
      id: 'age',
      name: 'age',
      type: 'number',
      label: 'Owner Age',
      min: 18,
      max: 100,
      required: true,
    },
    {
      id: 'expectedRetirementAge',
      name: 'expectedRetirementAge',
      type: 'number',
      label: 'Expected Retirement Age',
      min: 50,
      max: 100,
      required: true,
    },
  ],
  clientScript: 'business-succession-planning',
  analysisType: 'business-succession-planning',
};
