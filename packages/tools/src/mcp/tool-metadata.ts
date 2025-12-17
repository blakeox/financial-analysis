/**
 * Centralized Tool Metadata Registry
 * Single source of truth for tool keywords, categories, and output fields.
 * Used by both preFilterTools (function calling) and IntelligentToolSelector.
 */

export type ToolCategory =
  | 'lease'
  | 'loan'
  | 'investment'
  | 'retirement'
  | 'tax'
  | 'insurance'
  | 'budgeting'
  | 'valuation'
  | 'business'
  | 'document'
  | 'scenario';

export interface ToolMetadata {
  /** Keywords that trigger this tool in user queries */
  keywords: string[];
  /** Tool category for grouping in system prompts */
  category: ToolCategory;
  /** Fields this tool may output (for extractModelChanges) */
  outputFields?: string[];
  /** Brief description for system prompt generation */
  promptHint?: string;
}

/**
 * Centralized metadata for all MCP tools.
 * Add new tools here when extending the tool set.
 */
export const toolMetadata: Record<string, ToolMetadata> = {
  // Lease Analysis Tools
  analyze_lease: {
    keywords: ['lease', 'rent', 'tenant', 'landlord', 'commercial'],
    category: 'lease',
    outputFields: ['monthlyRent', 'totalRent', 'effectiveRate'],
    promptHint: 'Basic commercial/residential lease analysis',
  },
  analyze_enhanced_lease: {
    keywords: ['lease', 'rent', 'tenant', 'landlord', 'commercial', 'enhanced', 'cam', 'escalation'],
    category: 'lease',
    outputFields: ['monthlyRent', 'totalRent', 'effectiveRate', 'camCharges', 'escalations'],
    promptHint: 'Comprehensive lease analysis with CAM, escalations, and TI',
  },
  populate_lease_form: {
    keywords: ['populate', 'form', 'fill', 'lease form', 'extract'],
    category: 'lease',
    outputFields: ['formValues'],
    promptHint: 'Populate lease form fields from extracted data',
  },

  // Loan & Amortization Tools
  analyze_amortization: {
    keywords: ['amortization', 'mortgage', 'loan payment', 'principal', 'schedule', 'payment breakdown'],
    category: 'loan',
    outputFields: ['principal', 'annualRate', 'termMonths', 'monthlyPayment', 'totalInterest'],
    promptHint: 'Loan amortization schedules and payment breakdowns',
  },
  analyze_auto_loan: {
    keywords: ['auto', 'car', 'vehicle', 'auto loan', 'car payment', 'car financing'],
    category: 'loan',
    outputFields: ['principal', 'monthlyPayment', 'totalInterest', 'loanTerm'],
    promptHint: 'Auto loan calculations and comparisons',
  },
  analyze_student_loans: {
    keywords: ['student', 'loan', 'education', 'college loan', 'student debt', 'pslf', 'ibr'],
    category: 'loan',
    outputFields: ['monthlyPayment', 'totalPayment', 'forgiveness'],
    promptHint: 'Student loan repayment strategies and forgiveness',
  },
  analyze_debt_payoff: {
    keywords: ['debt', 'payoff', 'snowball', 'avalanche', 'credit card', 'debt free'],
    category: 'loan',
    outputFields: ['monthlyPayment', 'payoffDate', 'totalInterest', 'strategy'],
    promptHint: 'Debt payoff strategies (avalanche vs snowball)',
  },

  // Investment & Portfolio Tools
  analyze_bond_pricing: {
    keywords: ['bond', 'coupon', 'yield', 'maturity', 'fixed income', 'treasury', 'duration'],
    category: 'investment',
    outputFields: ['price', 'yield', 'duration', 'convexity'],
    promptHint: 'Bond pricing, yield calculations, and duration analysis',
  },
  analyze_options_pricing: {
    keywords: ['option', 'call', 'put', 'strike', 'black-scholes', 'derivative', 'greeks'],
    category: 'investment',
    outputFields: ['price', 'delta', 'gamma', 'theta', 'vega'],
    promptHint: 'Options pricing using Black-Scholes and Greeks',
  },
  analyze_investment_portfolio: {
    keywords: ['portfolio', 'investment', 'diversif', 'asset allocation', 'rebalance', 'stocks', 'etf'],
    category: 'investment',
    outputFields: ['allocation', 'expectedReturn', 'risk', 'sharpeRatio'],
    promptHint: 'Portfolio optimization and asset allocation',
  },
  calculate_capm: {
    keywords: ['capm', 'expected return', 'beta', 'risk free', 'market risk premium', 'equity cost'],
    category: 'investment',
    outputFields: ['expectedReturn'],
    promptHint: 'CAPM expected return / cost of equity calculation',
  },
  analyze_risk_adjusted_returns: {
    keywords: ['sharpe', 'sortino', 'risk adjusted', 'risk-adjusted', 'volatility', 'downside deviation'],
    category: 'investment',
    outputFields: ['sharpeRatio', 'sortinoRatio'],
    promptHint: 'Sharpe and Sortino ratios from historical returns',
  },
  simulate_investment_monte_carlo: {
    keywords: ['monte carlo', 'simulation', 'probabilistic', 'distribution', 'percentile', 'scenarios'],
    category: 'investment',
    outputFields: ['endingValue'],
    promptHint: 'Deterministic Monte Carlo simulation for investment outcomes',
  },
  calculate_dividend_reinvestment: {
    keywords: ['dividend', 'drip', 'reinvest', 'compound', 'yield', 'income investing'],
    category: 'investment',
    outputFields: ['endingValue', 'endingShares', 'totalDividends'],
    promptHint: 'Dividend reinvestment (DRIP) growth modeling',
  },
  analyze_fx_hedge: {
    keywords: ['fx', 'forex', 'hedge', 'forward', 'currency', 'interest rate parity', 'irp'],
    category: 'investment',
    outputFields: ['forwardRate', 'hedgedReturn', 'unhedgedReturn'],
    promptHint: 'FX forward rate and hedged vs unhedged return impact',
  },
  calculate_esg_score: {
    keywords: ['esg', 'environmental', 'social', 'governance', 'sustainability', 'impact'],
    category: 'investment',
    outputFields: ['score', 'rating'],
    promptHint: 'Basic ESG score and rating from E/S/G components',
  },
  analyze_p2p_lending: {
    keywords: ['p2p', 'peer to peer', 'peer-to-peer', 'lending', 'default', 'recovery', 'fee'],
    category: 'investment',
    outputFields: ['expectedTotalReturn', 'expectedAnnualizedReturn'],
    promptHint: 'Expected return and loss estimation for P2P lending',
  },
  value_carbon_credits: {
    keywords: ['carbon credit', 'co2', 'co2e', 'offset', 'offsets', 'sequestration'],
    category: 'investment',
    outputFields: ['presentValue', 'futureValue', 'spotValue'],
    promptHint: 'Carbon credit valuation with optional price growth and discounting',
  },

  // Cash Flow & Business Tools
  analyze_cash_flow: {
    keywords: ['cash flow', 'dcf', 'npv', 'irr', 'present value', 'burn rate', 'runway'],
    category: 'business',
    outputFields: ['npv', 'irr', 'paybackPeriod', 'cashFlows'],
    promptHint: 'Cash flow analysis, NPV, and IRR calculations',
  },
  ebitda_forecasting: {
    keywords: ['ebitda', 'earnings', 'forecast', 'operating', 'projection', 'revenue'],
    category: 'business',
    outputFields: ['ebitda', 'revenue', 'margin', 'growthRate'],
    promptHint: 'EBITDA forecasting and projections',
  },
  ebitda_scenario_comparison: {
    keywords: ['ebitda', 'scenario', 'compare', 'operating', 'sensitivity'],
    category: 'business',
    outputFields: ['scenarios', 'comparison', 'variance'],
    promptHint: 'Compare multiple EBITDA scenarios',
  },
  calculate_npv_irr: {
    keywords: ['npv', 'irr', 'net present value', 'internal rate of return', 'payback', 'sensitivity'],
    category: 'valuation',
    outputFields: ['npv', 'irr', 'paybackPeriod'],
    promptHint: 'Dedicated NPV/IRR calculator with optional sensitivity analysis',
  },
  analyze_break_even: {
    keywords: ['break even', 'break-even', 'fixed costs', 'variable costs', 'contribution margin'],
    category: 'business',
    outputFields: ['breakEvenUnits', 'breakEvenRevenue'],
    promptHint: 'Break-even analysis in units and revenue',
  },

  // Valuation Tools
  analyze_dcf_valuation: {
    keywords: ['dcf', 'valuation', 'discount', 'cash flow', 'terminal value', 'wacc'],
    category: 'valuation',
    outputFields: ['enterpriseValue', 'equityValue', 'impliedPrice', 'wacc'],
    promptHint: 'DCF valuation with WACC and terminal value',
  },
  analyze_cca_valuation: {
    keywords: ['comparable', 'cca', 'multiples', 'valuation', 'peer', 'trading comps'],
    category: 'valuation',
    outputFields: ['impliedValue', 'evEbitda', 'peRatio', 'peerGroup'],
    promptHint: 'Comparable company analysis and trading multiples',
  },
  analyze_ma_deal: {
    keywords: ['m&a', 'merger', 'acquisition', 'deal', 'synergy', 'accretion', 'dilution'],
    category: 'valuation',
    outputFields: ['dealValue', 'synergies', 'accretionDilution', 'proForma'],
    promptHint: 'M&A deal analysis including synergies and integration',
  },

  // Retirement & Savings Tools
  analyze_retirement_savings: {
    keywords: ['retirement', '401k', 'ira', 'pension', 'retire', 'roth', 'social security'],
    category: 'retirement',
    outputFields: ['retirementBalance', 'monthlyIncome', 'withdrawalRate'],
    promptHint: 'Retirement planning and savings projections',
  },
  analyze_savings_goal: {
    keywords: ['savings', 'save', 'goal', 'target', 'compound interest', 'emergency fund'],
    category: 'retirement',
    outputFields: ['monthlyContribution', 'futureValue', 'timeToGoal'],
    promptHint: 'Savings goal planning with compound interest',
  },
  analyze_college_savings: {
    keywords: ['college', '529', 'education', 'tuition', 'esa', 'financial aid'],
    category: 'retirement',
    outputFields: ['monthlyContribution', 'projectedBalance', 'coveragePercent'],
    promptHint: 'College savings with 529 and ESA plans',
  },

  // Home & Real Estate Tools
  analyze_home_buying_affordability: {
    keywords: ['home', 'house', 'afford', 'buy', 'mortgage', 'down payment', 'pmi'],
    category: 'loan',
    outputFields: ['maxPrice', 'monthlyPayment', 'downPayment', 'dti'],
    promptHint: 'Home buying affordability and mortgage options',
  },
  analyze_rent_vs_buy: {
    keywords: ['rent', 'buy', 'renting', 'buying', 'home purchase', 'housing decision', 'apartment', 'homeowner'],
    category: 'loan',
    outputFields: ['rentCost', 'buyCost', 'breakEvenYears', 'recommendation'],
    promptHint: 'Compare renting vs buying a home',
  },

  // Tax & Insurance Tools
  analyze_tax_optimization: {
    keywords: ['tax', 'deduction', 'bracket', 'optimize', 'capital gains', 'tax loss'],
    category: 'tax',
    outputFields: ['taxLiability', 'effectiveRate', 'savings', 'strategies'],
    promptHint: 'Tax optimization strategies and deductions',
  },
  analyze_insurance_needs: {
    keywords: ['insurance', 'coverage', 'life insurance', 'policy', 'disability', 'long-term care'],
    category: 'insurance',
    outputFields: ['coverageNeeded', 'premium', 'deathBenefit'],
    promptHint: 'Life, disability, and LTC insurance needs',
  },

  // Budgeting Tools
  optimize_budget: {
    keywords: ['budget', 'expense', 'income', 'spending', 'savings rate', 'category'],
    category: 'budgeting',
    outputFields: ['totalIncome', 'totalExpenses', 'surplus', 'savingsRate'],
    promptHint: 'Budget optimization and expense tracking',
  },

  // Journey & Scenario Tools
  analyze_financial_journey: {
    keywords: ['financial journey', 'milestones', 'life events', 'seed round', 'series a', 'funding', 'startup'],
    category: 'scenario',
    outputFields: ['milestones', 'projections', 'recommendations'],
    promptHint: 'Multi-stage financial journey and life event planning',
  },
  interactive_financial_model: {
    keywords: ['interactive', 'model', 'scenario', 'what-if', 'modify'],
    category: 'scenario',
    outputFields: ['modelState', 'changes'],
    promptHint: 'Interactive financial model management',
  },
  multi_model_scenario_analysis: {
    keywords: ['scenario', 'multi', 'compare', 'analysis', 'sensitivity', 'monte carlo'],
    category: 'scenario',
    outputFields: ['scenarios', 'comparison', 'probability'],
    promptHint: 'Multi-model scenario comparison and analysis',
  },

  // Document Management Tools
  cache_document: {
    keywords: ['document', 'cache', 'store', 'website', 'url', 'fetch'],
    category: 'document',
    outputFields: ['documentId', 'cached'],
    promptHint: 'Cache a website or document for later retrieval',
  },
  search_documents: {
    keywords: ['search', 'document', 'find', 'query', 'semantic'],
    category: 'document',
    outputFields: ['results', 'matches'],
    promptHint: 'Search cached documents semantically',
  },
  get_document: {
    keywords: ['get', 'retrieve', 'document', 'fetch'],
    category: 'document',
    outputFields: ['content', 'metadata'],
    promptHint: 'Retrieve a specific cached document',
  },
  clear_expired_documents: {
    keywords: ['clear', 'expired', 'document', 'cleanup', 'admin'],
    category: 'document',
    outputFields: ['cleared', 'count'],
    promptHint: 'Clear expired documents (admin)',
  },
};

/**
 * Get tool metadata by name, with safe fallback
 */
export function getToolMetadata(toolName: string): ToolMetadata {
  return toolMetadata[toolName] || {
    keywords: [],
    category: 'business' as ToolCategory,
    outputFields: [],
    promptHint: 'Financial analysis tool',
  };
}

/**
 * Get all tool names by category
 */
export function getToolsByCategory(category: ToolCategory): string[] {
  return Object.entries(toolMetadata)
    .filter(([, meta]) => meta.category === category)
    .map(([name]) => name);
}

/**
 * Get unique categories from metadata
 */
export function getAllCategories(): ToolCategory[] {
  const categories = new Set<ToolCategory>();
  for (const meta of Object.values(toolMetadata)) {
    categories.add(meta.category);
  }
  return [...categories];
}

/**
 * Get category descriptions for system prompts
 */
export const categoryDescriptions: Record<ToolCategory, string> = {
  lease: 'Lease analysis (commercial, residential, CAM, escalations)',
  loan: 'Loans and mortgages (amortization, auto, student, home buying)',
  investment: 'Investment analysis (bonds, options, portfolio)',
  retirement: 'Retirement and savings (401k, IRA, college savings)',
  tax: 'Tax optimization and strategies',
  insurance: 'Insurance needs analysis',
  budgeting: 'Budget optimization and expense tracking',
  valuation: 'Business valuation (DCF, CCA, M&A)',
  business: 'Business analysis (cash flow, EBITDA, forecasting)',
  document: 'Document caching and retrieval',
  scenario: 'Scenario analysis and financial journeys',
};

/**
 * Build dynamic tool category list for system prompts
 */
export function buildToolCategoryPrompt(): string {
  const lines: string[] = ['Available tool categories:'];
  
  for (const category of getAllCategories()) {
    const tools = getToolsByCategory(category);
    if (tools.length > 0) {
      lines.push(`- ${categoryDescriptions[category]}: use ${tools.slice(0, 3).join(', ')}${tools.length > 3 ? ', ...' : ''}`);
    }
  }
  
  return lines.join('\n');
}
