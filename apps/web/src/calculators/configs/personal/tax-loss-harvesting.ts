import type { CalculatorConfig } from '../../types';

export const tax_loss_harvestingCalculator: CalculatorConfig = {
  id: 'tax-loss-harvesting',
  title: 'Tax Loss Harvesting Calculator',
  description:
    'Identify tax-loss harvesting opportunities to offset capital gains and optimize tax savings',
  category: 'personal',
  icon: '📉',
  color: 'blue',
  keywords: ['tax loss harvesting', 'capital gains', 'tax optimization', 'investments'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is tax loss harvesting?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tax loss harvesting is the strategy of selling investments at a loss to offset capital gains and reduce your tax liability.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Personal Finance', href: '/personal' },
    { name: 'Tax Loss Harvesting', href: '/calculator/tax-loss-harvesting' },
  ],
  formFields: [
    {
      id: 'totalValue',
      name: 'totalValue',
      type: 'number',
      label: 'Total Portfolio Value ($)',
      min: 0,
      required: true,
    },
    {
      id: 'shortTermRate',
      name: 'shortTermRate',
      type: 'number',
      label: 'Short-Term Capital Gains Rate (%)',
      min: 0,
      max: 50,
      step: 0.01,
      required: true,
    },
    {
      id: 'longTermRate',
      name: 'longTermRate',
      type: 'number',
      label: 'Long-Term Capital Gains Rate (%)',
      min: 0,
      max: 30,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: 'tax-loss-harvesting',
  analysisType: 'tax-loss-harvesting',
};
