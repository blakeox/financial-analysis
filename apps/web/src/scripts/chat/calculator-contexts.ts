/**
 * Calculator Context Definitions for AI Assistant
 * Maps calculator IDs to context information including examples and field mappings
 */

import { CALCULATOR_CONFIGS, type FormFieldConfig } from '../../components/CalculatorTemplate';

export type CalculatorContextKey =
  | 'amortization'
  | 'auto-loan'
  | 'retirement'
  | 'savings-goal'
  | 'debt-payoff'
  | 'student-loans'
  | 'budget'
  | 'dcf-valuation'
  | 'ma-analysis'
  | 'risk-management'
  | 'equipment-lease'
  | 'invest-vs-payoff-debt'
  | 'rent-vs-buy'
  | 'mortgage-scenario-planning'
  | 'side-hustle-income'
  | 'credit-card-payoff'
  | 'break-even'
  | 'cash-flow-forecast'
  | 'business-loan-qualifier'
  | 'pricing-strategy'
  | 'saas-metrics'
  | 'lease'
  | 'ebitda'
  | 'unit-economics'
  | 'business-valuation'
  | 'revenue-forecast'
  | 'roth-vs-traditional-ira'
  | 'business-growth'
  | 'models'
  | 'general'
  | 'startup-planning';

export interface CalculatorContext {
  id: CalculatorContextKey;
  label: string;
  intro: string;
  examples: string[];
  fieldMappings?: Record<string, string>; // Maps user-friendly names to form field IDs
}

function normalizeFieldAlias(alias: string): string {
  return alias
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[%$]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function buildFieldMappingsFromConfig(calculatorId: string): Record<string, string> | undefined {
  const config = CALCULATOR_CONFIGS[calculatorId];
  if (!config) {
    return undefined;
  }

  const mappings: Record<string, string> = {};

  const aliasesForField = (field: FormFieldConfig): string[] => {
    const aliases = new Set<string>([
      field.id,
      field.name,
      field.label,
      ...(field.assistantAliases ?? []),
    ]);

    return Array.from(aliases)
      .map((alias) => normalizeFieldAlias(alias))
      .filter(Boolean);
  };

  for (const field of config.formFields) {
    for (const alias of aliasesForField(field)) {
      mappings[alias] = field.id;
    }
  }

  return Object.keys(mappings).length > 0 ? mappings : undefined;
}

/**
 * Calculator context definitions with AI assistant examples
 */
export const CALCULATOR_CONTEXTS: Record<CalculatorContextKey, CalculatorContext> = {
  // Personal Finance Calculators
  amortization: {
    id: 'amortization',
    label: 'Mortgage/Loan Calculator',
    intro: 'Hi — I can help with mortgage and loan calculations.',
    examples: ['Set interest rate to 4.5%', 'Show a 20-year term', 'What if I put 20% down?'],
    fieldMappings: buildFieldMappingsFromConfig('amortization'),
  },

  'auto-loan': {
    id: 'auto-loan',
    label: 'Auto Loan Calculator',
    intro: 'Hi — I can help calculate auto loan payments.',
    examples: [
      'Set car price to $35,000',
      'Change interest to 3.9%',
      'What if trade-in is $10,000?',
    ],
    fieldMappings: buildFieldMappingsFromConfig('auto-loan'),
  },

  retirement: {
    id: 'retirement',
    label: 'Retirement Calculator',
    intro: 'Hi — I can help plan your retirement savings.',
    examples: [
      'Set current age to 30',
      'Change retirement age to 65',
      'What if I save $500 monthly?',
    ],
    fieldMappings: buildFieldMappingsFromConfig('retirement'),
  },

  'roth-vs-traditional-ira': {
    id: 'roth-vs-traditional-ira',
    label: 'Roth vs Traditional IRA',
    intro: 'Hi — I can help compare Roth and Traditional IRA strategies.',
    examples: [
      'Set current tax rate to 22%',
      'What if retirement tax rate is 15%?',
      'Compare $7,000 annual contributions',
    ],
    fieldMappings: buildFieldMappingsFromConfig('roth-vs-traditional-ira'),
  },

  'savings-goal': {
    id: 'savings-goal',
    label: 'Savings Goal Calculator',
    intro: 'Hi — I can help you reach your savings goals.',
    examples: [
      'Set goal to $50,000',
      'Change timeframe to 5 years',
      'What if I save $800 monthly?',
    ],
    fieldMappings: buildFieldMappingsFromConfig('savings-goal'),
  },

  'debt-payoff': {
    id: 'debt-payoff',
    label: 'Debt Payoff Calculator',
    intro: 'Hi — I can help create a debt payoff strategy.',
    examples: [
      'Add a credit card with $5,000 balance',
      'What if I pay $500 extra monthly?',
      'Compare avalanche vs snowball',
    ],
  },

  'student-loans': {
    id: 'student-loans',
    label: 'Student Loan Calculator',
    intro: 'Hi — I can help analyze student loan repayment options.',
    examples: [
      'Set loan balance to $45,000',
      'Change interest to 5.5%',
      'Compare standard vs income-driven plans',
    ],
    fieldMappings: buildFieldMappingsFromConfig('student-loans'),
  },

  budget: {
    id: 'budget',
    label: 'Budget Planner',
    intro: 'Hi — I can help create and analyze your budget.',
    examples: [
      'Set monthly income to $5,000',
      'Add $1,200 for rent',
      "Check if I'm following 50/30/20 rule",
    ],
  },

  // Investment Calculators
  'dcf-valuation': {
    id: 'dcf-valuation',
    label: 'DCF Valuation',
    intro: 'Hi — I can help with discounted cash flow valuation.',
    examples: [
      'Set initial cash flow to $100,000',
      'Change growth rate to 8%',
      'What if discount rate is 12%?',
    ],
  },

  'ma-analysis': {
    id: 'ma-analysis',
    label: 'M&A Analysis',
    intro: 'Hi — I can help analyze merger and acquisition scenarios.',
    examples: [
      'Set purchase price to $5M',
      'Change synergy value to $500K',
      "What's the payback period?",
    ],
  },

  'risk-management': {
    id: 'risk-management',
    label: 'Risk Management',
    intro: 'Hi — I can help assess investment risks.',
    examples: [
      'Set portfolio value to $100,000',
      'Change risk tolerance to moderate',
      "What's my risk-adjusted return?",
    ],
  },

  // Real Estate Calculators
  'equipment-lease': {
    id: 'equipment-lease',
    label: 'Equipment Lease',
    intro: 'Hi — I can help compare lease vs buy for equipment.',
    examples: [
      'Set equipment cost to $50,000',
      'Change lease term to 36 months',
      'What if monthly payment is $1,500?',
    ],
  },

  'rent-vs-buy': {
    id: 'rent-vs-buy',
    label: 'Rent vs Buy',
    intro: 'Hi — I can help decide between renting and buying a home.',
    examples: [
      'Set home price to $400,000',
      'Change monthly rent to $2,000',
      "What's the break-even point?",
    ],
  },

  'mortgage-scenario-planning': {
    id: 'mortgage-scenario-planning',
    label: 'Mortgage Scenarios',
    intro: 'Hi — I can help compare different mortgage scenarios.',
    examples: [
      'Compare 15 vs 30 year mortgages',
      'What if I put 20% down?',
      'Which scenario saves more?',
    ],
  },

  lease: {
    id: 'lease',
    label: 'Lease Analysis',
    intro: 'Hi — I can help with lease vs purchase analysis.',
    examples: [
      'What if interest rate was 5.5%?',
      'Show a 36-month lease',
      'Compare lease vs buy options',
    ],
  },

  // Business Calculators
  'pricing-strategy': {
    id: 'pricing-strategy',
    label: 'Pricing Strategy',
    intro: 'Hi — I can help optimize your pricing strategy.',
    examples: [
      'Set target margin to 70%',
      'Change cost per unit to $30',
      'What if competitor price is $75?',
    ],
    fieldMappings: buildFieldMappingsFromConfig('pricing-strategy'),
  },

  ebitda: {
    id: 'ebitda',
    label: 'EBITDA Forecasting',
    intro: 'Hi — I can help forecast EBITDA for your business.',
    examples: ['Set revenue to $500,000', 'Change growth rate to 15%', 'What if COGS is 35%?'],
    fieldMappings: {
      revenue: 'annual-revenue',
      growth: 'growth-rate',
      cogs: 'cost-of-goods-sold',
    },
  },

  'break-even': {
    id: 'break-even',
    label: 'Break-Even Analysis',
    intro: 'Hi — I can help calculate your break-even point.',
    examples: [
      'Set fixed costs to $10,000',
      'Change price to $50',
      'What if variable cost is $25?',
    ],
  },

  'cash-flow-forecast': {
    id: 'cash-flow-forecast',
    label: 'Cash Flow Forecast',
    intro: 'Hi — I can help forecast your business cash flow.',
    examples: [
      'Set starting cash to $50,000',
      'Add $20,000 revenue in January',
      'What if expenses increase 10%?',
    ],
  },

  'business-loan-qualifier': {
    id: 'business-loan-qualifier',
    label: 'Business Loan Qualifier',
    intro: 'Hi — I can help check if you qualify for a business loan.',
    examples: [
      'Set annual revenue to $500,000',
      'Change credit score to 720',
      'What loan amount do I qualify for?',
    ],
  },

  'saas-metrics': {
    id: 'saas-metrics',
    label: 'SaaS Metrics',
    intro: 'Hi — I can help analyze SaaS business metrics.',
    examples: ['Set MRR to $50,000', 'Change churn rate to 5%', "What's my LTV/CAC ratio?"],
  },

  'side-hustle-income': {
    id: 'side-hustle-income',
    label: 'Side Hustle Income',
    intro: 'Hi — I can help calculate side hustle profitability.',
    examples: [
      'Set hourly rate to $75',
      'Change hours per week to 10',
      'What are my tax obligations?',
    ],
  },

  'credit-card-payoff': {
    id: 'credit-card-payoff',
    label: 'Credit Card Payoff',
    intro: 'Hi — I can help create a credit card payoff plan.',
    examples: ['Set balance to $8,000', 'Change APR to 18.99%', 'What if I pay $300 monthly?'],
  },

  'invest-vs-payoff-debt': {
    id: 'invest-vs-payoff-debt',
    label: 'Invest vs Pay Off Debt',
    intro: 'Hi — I can help decide: invest or pay off debt?',
    examples: [
      'Set debt balance to $20,000',
      'Change investment return to 8%',
      'Which option is better financially?',
    ],
  },

  // Journey/General
  'unit-economics': {
    id: 'unit-economics',
    label: 'Unit Economics',
    intro: 'Hi — I can help analyze your customer unit economics.',
    examples: [
      'What is a good LTV:CAC ratio?',
      'How can I reduce my payback period?',
      'Is my churn rate too high?',
    ],
    fieldMappings: {
      'marketing spend': 'monthlyMarketingSpend',
      customers: 'newCustomersPerMonth',
      revenue: 'averageMonthlyRevenue',
      churn: 'monthlyChurnRate',
      'churn rate': 'monthlyChurnRate',
      cogs: 'costOfGoodsSoldPercent',
    },
  },

  'business-valuation': {
    id: 'business-valuation',
    label: 'Business Valuation',
    intro: 'Hi — I can help estimate your business value.',
    examples: [
      'What is my business worth?',
      'How do I increase business value?',
      'What multiples apply to my industry?',
    ],
    fieldMappings: {
      revenue: 'annualRevenue',
      'annual revenue': 'annualRevenue',
      ebitda: 'annualEbitda',
      growth: 'revenueGrowthRate',
      'growth rate': 'revenueGrowthRate',
    },
  },

  'revenue-forecast': {
    id: 'revenue-forecast',
    label: 'Revenue Forecast',
    intro: 'Hi — I can help forecast your future revenue.',
    examples: [
      'Project my revenue for next year?',
      'What if growth rate increases to 20%?',
      'Show me seasonal impacts',
    ],
    fieldMappings: {
      'forecast months': 'forecastMonths',
      months: 'forecastMonths',
      growth: 'stream-growth-0',
      'growth rate': 'stream-growth-0',
    },
  },

  'business-growth': {
    id: 'business-growth',
    label: 'Business Growth',
    intro: 'Hi — I can help plan your business growth strategy.',
    examples: [
      'How do I increase my business value?',
      'What are my unit economics?',
      'Project my revenue for next year?',
    ],
  },

  'startup-planning': {
    id: 'startup-planning',
    label: 'Startup Planning',
    intro: 'Hi — I can help with startup financial planning.',
    examples: [
      'Help me create a startup budget',
      'What funding do I need?',
      'Calculate my burn rate',
    ],
  },

  models: {
    id: 'models',
    label: 'Calculator Selection',
    intro: 'Hi — I can help you find the right financial calculator.',
    examples: [
      'What calculators are available?',
      'Show me business tools',
      'I need help with retirement planning',
    ],
  },

  general: {
    id: 'general',
    label: 'General',
    intro: 'Hi — I can help with finance tools and quick analysis.',
    examples: [
      'What tools are available?',
      'Help me calculate a mortgage',
      'Show me business calculators',
    ],
  },
};

/**
 * Detect calculator context from URL path
 */
export function detectCalculatorContext(pathname: string): CalculatorContextKey {
  // Normalize pathname: remove query params, hash, collapse multiple slashes, remove trailing slashes
  let normalizedPath = pathname
    .split('?')[0] // Remove query params
    .split('#')[0] // Remove hash
    .replace(/\/+/g, '/') // Collapse multiple slashes
    .replace(/\/$/, ''); // Remove trailing slash

  // Handle empty path
  if (!normalizedPath || normalizedPath === '/') {
    return 'general';
  }

  // Check journey pages first
  if (normalizedPath.includes('/journey/')) {
    const journeyMatch = normalizedPath.match(/\/journey\/([^/]+)/);
    if (journeyMatch) {
      const journeyId = journeyMatch[1];
      const journeyContextMap: Record<string, CalculatorContextKey> = {
        'startup-planning': 'startup-planning',
        'business-growth': 'business-growth',
        'ma-analysis-journey': 'general',
        'young-professional': 'general',
        'family-planning': 'general',
        'home-buying': 'amortization',
        'debt-freedom': 'general',
        'investment-analysis-journey': 'general',
        'auto-lease-decision': 'auto-loan',
      };
      return journeyContextMap[journeyId] || 'general';
    }
  }

  // Check calculator pages - handle both /calculator/[id] and direct paths
  const calculatorMatch = normalizedPath.match(/\/(calculator\/)?([^/]+)/);
  if (calculatorMatch) {
    const path = calculatorMatch[2];

    // Direct mapping for calculator paths
    const pathToContext: Record<string, CalculatorContextKey> = {
      amortization: 'amortization',
      'auto-loan': 'auto-loan',
      retirement: 'retirement',
      'savings-goal': 'savings-goal',
      'debt-payoff': 'debt-payoff',
      'student-loans': 'student-loans',
      budget: 'budget',
      'dcf-valuation': 'dcf-valuation',
      'ma-analysis': 'ma-analysis',
      'risk-management': 'risk-management',
      'equipment-lease': 'equipment-lease',
      'invest-vs-payoff-debt': 'invest-vs-payoff-debt',
      'rent-vs-buy': 'rent-vs-buy',
      'mortgage-scenario-planning': 'mortgage-scenario-planning',
      'side-hustle-income': 'side-hustle-income',
      'credit-card-payoff': 'credit-card-payoff',
      'break-even': 'break-even',
      'cash-flow-forecast': 'cash-flow-forecast',
      'business-loan-qualifier': 'business-loan-qualifier',
      'pricing-strategy': 'pricing-strategy',
      'saas-metrics': 'saas-metrics',
      'lease-analysis': 'lease',
      'commercial-real-estate-lease': 'lease',
      'ebitda-forecasting': 'ebitda',
      ebitda: 'ebitda',
      'unit-economics': 'unit-economics',
      'business-valuation': 'business-valuation',
      'revenue-forecast': 'revenue-forecast',
      'roth-vs-traditional-ira': 'roth-vs-traditional-ira',
      models: 'models',
    };

    if (pathToContext[path]) {
      return pathToContext[path];
    }
  }

  // Fallback to general
  return 'general';
}

/**
 * Parse natural language field updates
 * E.g., "Set target margin to 70" -> { field: 'target-margin', value: '70' }
 */
export function parseFieldUpdate(
  message: string,
  context: CalculatorContextKey
): {
  field: string | null;
  value: string | null;
  fieldLabel: string | null;
} | null {
  const contextDef = CALCULATOR_CONTEXTS[context];
  if (!contextDef?.fieldMappings) {
    return null;
  }

  // Common patterns for setting values
  const patterns = [
    /(?:set|change|update|make)\s+(.+?)\s+(?:to|at|=)\s+([0-9,.]+%?)/i,
    /(?:what if|try)\s+(.+?)\s+(?:was|is)\s+([0-9,.]+%?)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      const fieldName = normalizeFieldAlias(match[1]);
      const value = match[2].trim();

      // Prefer the most specific alias when several match the same phrase.
      const sortedMappings = Object.entries(contextDef.fieldMappings).sort(
        ([left], [right]) => normalizeFieldAlias(right).length - normalizeFieldAlias(left).length
      );

      for (const [friendlyName, fieldId] of sortedMappings) {
        if (fieldName.includes(normalizeFieldAlias(friendlyName))) {
          return {
            field: fieldId,
            value: value,
            fieldLabel: friendlyName,
          };
        }
      }
    }
  }

  return null;
}
