/**
 * Build HTML sitemap links from the calculator catalog plus standalone tool pages.
 */
import type { CalculatorConfig } from './types';
import { CALCULATOR_CONFIGS } from './calculator-configs';

export interface SitemapLink {
  name: string;
  href: string;
  description: string;
}

const STANDALONE_PERSONAL_LINKS: SitemapLink[] = [
  {
    name: 'Insurance Needs Calculator',
    href: '/insurance-needs',
    description: 'Life insurance coverage analysis',
  },
  {
    name: 'College Savings Calculator',
    href: '/college-savings',
    description: '529 plan projections',
  },
  {
    name: 'Tax Optimization',
    href: '/tax-optimization',
    description: 'Tax planning and optimization',
  },
  {
    name: 'Retirement Planning',
    href: '/retirement-planning',
    description: 'Multi-account retirement projections',
  },
  {
    name: 'Social Security Optimizer',
    href: '/social-security',
    description: 'Claiming strategy and lifetime benefits',
  },
  {
    name: 'Home Buying Affordability',
    href: '/home-buying-affordability',
    description: 'Mortgage and purchase affordability',
  },
  {
    name: 'Investment Portfolio Analyzer',
    href: '/investment-portfolio',
    description: 'Allocation, drift, and rebalancing',
  },
  {
    name: 'Financial Journey Planner',
    href: '/financial-journey',
    description: 'Multi-stage personal finance roadmap',
  },
];

const STANDALONE_BUSINESS_LINKS: SitemapLink[] = [
  {
    name: 'EBITDA Forecasting',
    href: '/ebitda-forecasting',
    description: 'Business valuation projections',
  },
  {
    name: 'Lease Analysis',
    href: '/lease-analysis',
    description: 'Comprehensive lease comparison',
  },
  {
    name: 'Enhanced Lease Analysis',
    href: '/enhanced-lease',
    description: 'Sensitivity and lease-vs-buy modeling',
  },
  {
    name: 'Commercial Real Estate',
    href: '/commercial-real-estate-lease',
    description: 'NNN and CAM calculations',
  },
  {
    name: 'Cash Flow Analysis',
    href: '/cash-flow-analysis',
    description: 'NPV, IRR, burn rate, and runway',
  },
  {
    name: 'CCA Valuation',
    href: '/cca-analysis',
    description: 'Comparable company analysis',
  },
  {
    name: 'Bond Pricing',
    href: '/bond-pricing',
    description: 'YTM, duration, and convexity',
  },
  {
    name: 'Options Pricing',
    href: '/options-pricing',
    description: 'Black-Scholes and Greeks',
  },
  {
    name: 'DCF Analysis',
    href: '/dcf-analysis',
    description: 'Discounted cash flow valuation hub',
  },
  {
    name: 'Scenario Analysis',
    href: '/scenario-analysis',
    description: 'Multi-model financial scenarios',
  },
  {
    name: 'Business Expansion Loan',
    href: '/business-expansion-loan',
    description: 'Expansion financing and DSCR',
  },
  {
    name: 'Amortization (standalone)',
    href: '/amortization',
    description: 'Detailed payment schedules',
  },
  {
    name: 'M&A Analysis (standalone)',
    href: '/ma-analysis',
    description: 'Deal valuation and synergies',
  },
];

function calculatorToLink(config: CalculatorConfig): SitemapLink {
  return {
    name: config.title,
    href: `/calculator/${config.id}`,
    description: config.description,
  };
}

function sortLinks(links: SitemapLink[]): SitemapLink[] {
  return [...links].sort((a, b) => a.name.localeCompare(b.name));
}

export function getCalculatorSitemapLinksByCategory(): {
  personal: SitemapLink[];
  business: SitemapLink[];
} {
  const personal = sortLinks(
    Object.values(CALCULATOR_CONFIGS)
      .filter((c) => c.category === 'personal')
      .map(calculatorToLink)
  );

  const business = sortLinks(
    Object.values(CALCULATOR_CONFIGS)
      .filter((c) => c.category === 'business')
      .map(calculatorToLink)
  );

  return {
    personal: [...personal, ...sortLinks(STANDALONE_PERSONAL_LINKS)],
    business: [...business, ...sortLinks(STANDALONE_BUSINESS_LINKS)],
  };
}
