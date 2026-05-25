import type { CalculatorConfig } from '../../types';

export const franchise_roiCalculator: CalculatorConfig = {
  id: 'franchise-roi',
  title: 'Franchise ROI Calculator',
  description:
    'Analyze franchise investment ROI, calculate payback period, project cash flows, and compare franchise opportunities',
  category: 'business',
  icon: '🏪',
  color: 'orange',
  keywords: ['franchise', 'ROI', 'franchise investment', 'business opportunity'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I calculate franchise ROI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Franchise ROI considers initial investment, ongoing fees (royalties, marketing), revenue projections, and operating costs to determine profitability.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Franchise ROI', href: '/calculator/franchise-roi' },
  ],
  formFields: [
    {
      id: 'franchiseName',
      name: 'franchiseName',
      type: 'text',
      label: 'Franchise Name',
      required: true,
    },
    {
      id: 'franchiseFee',
      name: 'franchiseFee',
      type: 'number',
      label: 'Franchise Fee ($)',
      min: 0,
      required: true,
    },
    {
      id: 'initialInvestment',
      name: 'initialInvestment',
      type: 'number',
      label: 'Total Initial Investment ($)',
      min: 0,
      required: true,
    },
    {
      id: 'firstYearRevenue',
      name: 'firstYearRevenue',
      type: 'number',
      label: 'First Year Revenue ($)',
      min: 0,
      required: true,
    },
    {
      id: 'royaltyFee',
      name: 'royaltyFee',
      type: 'number',
      label: 'Royalty Fee (%)',
      min: 0,
      max: 20,
      step: 0.01,
      required: true,
    },
  ],
  clientScript: 'franchise-roi',
  analysisType: 'franchise-roi',
};
