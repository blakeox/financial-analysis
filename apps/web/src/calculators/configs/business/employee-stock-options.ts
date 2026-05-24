import type { CalculatorConfig } from '../../types';

export const employee_stock_optionsCalculator: CalculatorConfig = {
  id: 'employee-stock-options',
  title: 'Employee Stock Options Valuator',
  description:
    'Value employee stock options using Black-Scholes, analyze tax implications (ISO vs NSO), and optimize exercise strategies',
  category: 'business',
  icon: '📊',
  color: 'blue',
  keywords: ['stock options', 'ESO', 'ISO', 'NSO', 'Black-Scholes', 'equity compensation'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the difference between ISO and NSO?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Incentive Stock Options (ISO) offer potential tax advantages but have restrictions. Non-Qualified Stock Options (NSO) are more flexible but taxed as ordinary income.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Business Finance', href: '/business' },
    { name: 'Employee Stock Options', href: '/calculator/employee-stock-options' },
  ],
  formFields: [
    { id: 'age', name: 'age', type: 'number', label: 'Age', min: 18, max: 100, required: true },
    {
      id: 'currentSalary',
      name: 'currentSalary',
      type: 'number',
      label: 'Current Salary ($)',
      min: 0,
      required: true,
    },
  ],
  clientScript: 'employee-stock-options',
  analysisType: 'employee-stock-options',
};
