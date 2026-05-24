import type { CalculatorConfig } from '../../types';

export const financial_ratio_analyzerCalculator: CalculatorConfig = {
  id: 'financial-ratio-analyzer',
  title: 'Financial Ratio Analyzer',
  description:
    'Comprehensive financial ratio analysis including liquidity, profitability, efficiency, leverage, and market ratios',
  category: 'business',
  icon: '📈',
  color: 'purple',
  keywords: ['financial ratios', 'liquidity', 'profitability', 'leverage', 'efficiency ratios'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What are the key financial ratios?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Key ratios include current ratio (liquidity), ROE/ROA (profitability), debt-to-equity (leverage), and inventory turnover (efficiency).',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Financial Ratio Analyzer', href: '/calculator/financial-ratio-analyzer' },
  ],
  formFields: [
    {
      id: 'currentAssets',
      name: 'currentAssets',
      type: 'number',
      label: 'Current Assets ($)',
      min: 0,
      required: true,
    },
    {
      id: 'totalAssets',
      name: 'totalAssets',
      type: 'number',
      label: 'Total Assets ($)',
      min: 0,
      required: true,
    },
    {
      id: 'currentLiabilities',
      name: 'currentLiabilities',
      type: 'number',
      label: 'Current Liabilities ($)',
      min: 0,
      required: true,
    },
    {
      id: 'totalLiabilities',
      name: 'totalLiabilities',
      type: 'number',
      label: 'Total Liabilities ($)',
      min: 0,
      required: true,
    },
    {
      id: 'totalEquity',
      name: 'totalEquity',
      type: 'number',
      label: 'Total Equity ($)',
      required: true,
    },
    {
      id: 'revenue',
      name: 'revenue',
      type: 'number',
      label: 'Revenue ($)',
      min: 0,
      required: true,
    },
    {
      id: 'netIncome',
      name: 'netIncome',
      type: 'number',
      label: 'Net Income ($)',
      required: true,
    },
  ],
  clientScript: 'financial-ratio-analyzer',
  analysisType: 'financial-ratio-analyzer',
};
