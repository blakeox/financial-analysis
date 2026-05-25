import type { CalculatorConfig } from '../../types';

export const supply_chain_financeCalculator: CalculatorConfig = {
  id: 'supply-chain-finance',
  title: 'Supply Chain Finance Optimizer',
  description:
    'Optimize supply chain finance with dynamic discounting, reverse factoring, inventory financing, and working capital solutions',
  category: 'business',
  icon: '🔗',
  color: 'indigo',
  keywords: ['supply chain finance', 'reverse factoring', 'dynamic discounting', 'working capital'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is reverse factoring?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Reverse factoring (supply chain finance) allows suppliers to receive early payment on invoices at a discount, while buyers extend payment terms, improving working capital for both parties.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Supply Chain Finance', href: '/calculator/supply-chain-finance' },
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
      id: 'annualRevenue',
      name: 'annualRevenue',
      type: 'number',
      label: 'Annual Revenue ($)',
      min: 0,
      required: true,
    },
    {
      id: 'accountsPayable',
      name: 'accountsPayable',
      type: 'number',
      label: 'Accounts Payable ($)',
      min: 0,
      required: true,
    },
    {
      id: 'accountsReceivable',
      name: 'accountsReceivable',
      type: 'number',
      label: 'Accounts Receivable ($)',
      min: 0,
      required: true,
    },
    {
      id: 'inventory',
      name: 'inventory',
      type: 'number',
      label: 'Inventory ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'supply-chain-finance',
  analysisType: 'supply-chain-finance',
};
