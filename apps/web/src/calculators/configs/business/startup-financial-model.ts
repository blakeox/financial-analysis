import type { CalculatorConfig } from '../../types';

export const startup_financial_modelCalculator: CalculatorConfig = {
  id: 'startup-financial-model',
  title: 'Startup Financial Model',
  description:
    'Comprehensive startup financial model with revenue projections, burn rate analysis, runway calculation, and funding scenarios',
  category: 'business',
  icon: '🚀',
  color: 'purple',
  keywords: ['startup', 'burn rate', 'runway', 'financial model', 'funding'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is burn rate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Burn rate is the rate at which a company spends its cash reserves, typically measured monthly. It helps determine how long until additional funding is needed.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Startup Financial Model', href: '/calculator/startup-financial-model' },
  ],
  formFields: [
    {
      id: 'companyName',
      name: 'companyName',
      type: 'text',
      label: 'Company Name',
      required: true,
    },
    {
      id: 'currentCash',
      name: 'currentCash',
      type: 'number',
      label: 'Current Cash ($)',
      min: 0,
      required: true,
    },
    {
      id: 'monthlyBurnRate',
      name: 'monthlyBurnRate',
      type: 'number',
      label: 'Monthly Burn Rate ($)',
      min: 0,
      required: true,
    },
    {
      id: 'monthlyRevenue',
      name: 'monthlyRevenue',
      type: 'number',
      label: 'Monthly Revenue ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'startup-financial-model',
  analysisType: 'startup-financial-model',
};
