import type { CalculatorConfig } from '../../types';

export const inventory_optimizationCalculator: CalculatorConfig = {
  id: 'inventory-optimization',
  title: 'Inventory Optimization Calculator',
  description:
    'Optimize inventory levels with EOQ, safety stock calculations, ABC analysis, and reorder point optimization',
  category: 'business',
  icon: '📦',
  color: 'blue',
  keywords: ['inventory', 'EOQ', 'safety stock', 'supply chain', 'ABC analysis'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Economic Order Quantity (EOQ)?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'EOQ is the optimal order quantity that minimizes total inventory costs, balancing ordering costs and holding costs.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Inventory Optimization', href: '/calculator/inventory-optimization' },
  ],
  formFields: [
    {
      id: 'totalInventoryValue',
      name: 'totalInventoryValue',
      type: 'number',
      label: 'Total Inventory Value ($)',
      min: 0,
      required: true,
    },
    {
      id: 'orderingCost',
      name: 'orderingCost',
      type: 'number',
      label: 'Ordering Cost per Order ($)',
      min: 0,
      required: true,
    },
    {
      id: 'holdingCostRate',
      name: 'holdingCostRate',
      type: 'number',
      label: 'Holding Cost Rate (%)',
      min: 0,
      max: 100,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: 'inventory-optimization',
  analysisType: 'inventory-optimization',
};
