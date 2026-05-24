import type { CalculatorConfig } from '../../types';

export const student_loansCalculator: CalculatorConfig = {
  id: 'student-loans',
  title: 'Student Loan Analyzer',
  description:
    'Optimize student loan repayment strategies with income-driven plans, refinancing analysis, and forgiveness programs',
  category: 'personal',
  icon: '🎓',
  color: 'blue',
  keywords: ['student loans', 'repayment', 'refinancing', 'forgiveness'],
  faqSchema: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Should I refinance my student loans?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Refinancing can lower your interest rate and monthly payment, but you'll lose federal loan benefits like income-driven repayment and forgiveness programs. Consider your job stability and income before refinancing federal loans.",
        },
      },
      {
        '@type': 'Question',
        name: "What's the best student loan repayment strategy?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The best strategy depends on your situation. Income-driven repayment plans offer lower payments and forgiveness after 20-25 years. Standard repayment saves the most interest. Consider your income, job stability, and forgiveness eligibility.',
        },
      },
    ],
  },
  breadcrumbs: [
    { name: 'Home', href: '/' },
    { name: 'Models', href: '/models' },
    { name: 'Student Loans', href: '/student-loans' },
  ],
  formFields: [
    {
      id: 'loanBalance',
      name: 'loanBalance',
      type: 'number',
      label: 'Total Loan Balance ($)',
      min: 0,
      step: 0.01,
      required: true,
      assistantAliases: ['loan balance', 'balance', 'student loan balance'],
    },
    {
      id: 'interestRate',
      name: 'interestRate',
      type: 'number',
      label: 'Interest Rate (%)',
      min: 0,
      max: 20,
      step: 0.01,
      required: true,
      assistantAliases: ['interest', 'interest rate', 'rate'],
    },
    {
      id: 'annualIncome',
      name: 'annualIncome',
      type: 'number',
      label: 'Annual Income ($)',
      min: 0,
      step: 0.01,
      assistantAliases: ['income', 'annual income', 'salary'],
    },
    {
      id: 'familySize',
      name: 'familySize',
      type: 'number',
      label: 'Family Size',
      min: 1,
      max: 20,
      assistantAliases: ['family size', 'household size'],
    },
    {
      id: 'repaymentPlan',
      name: 'repaymentPlan',
      type: 'select',
      label: 'Repayment Plan',
      required: true,
      assistantAliases: ['plan', 'repayment plan'],
      options: [
        { value: 'standard', label: 'Standard (10 years)' },
        { value: 'extended', label: 'Extended (25 years)' },
        { value: 'income-driven', label: 'Income-Driven Repayment' },
        { value: 'refinance', label: 'Refinance Analysis' },
      ],
    },
  ],
  clientScript: 'student-loans',
  analysisType: 'student-loans',
};
