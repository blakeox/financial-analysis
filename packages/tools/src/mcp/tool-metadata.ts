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
    keywords: [
      'lease',
      'rent',
      'tenant',
      'landlord',
      'commercial',
      'enhanced',
      'cam',
      'escalation',
    ],
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
    keywords: [
      'amortization',
      'mortgage',
      'loan payment',
      'principal',
      'schedule',
      'payment breakdown',
    ],
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
    keywords: [
      'portfolio',
      'investment',
      'diversif',
      'asset allocation',
      'rebalance',
      'stocks',
      'etf',
    ],
    category: 'investment',
    outputFields: ['allocation', 'expectedReturn', 'risk', 'sharpeRatio'],
    promptHint: 'Portfolio optimization and asset allocation',
  },
  calculate_capm: {
    keywords: [
      'capm',
      'expected return',
      'beta',
      'risk free',
      'market risk premium',
      'equity cost',
    ],
    category: 'investment',
    outputFields: ['expectedReturn'],
    promptHint: 'CAPM expected return / cost of equity calculation',
  },
  analyze_risk_adjusted_returns: {
    keywords: [
      'sharpe',
      'sortino',
      'risk adjusted',
      'risk-adjusted',
      'volatility',
      'downside deviation',
    ],
    category: 'investment',
    outputFields: ['sharpeRatio', 'sortinoRatio'],
    promptHint: 'Sharpe and Sortino ratios from historical returns',
  },
  simulate_investment_monte_carlo: {
    keywords: [
      'monte carlo',
      'simulation',
      'probabilistic',
      'distribution',
      'percentile',
      'scenarios',
    ],
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
    keywords: [
      'npv',
      'irr',
      'net present value',
      'internal rate of return',
      'payback',
      'sensitivity',
    ],
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
    keywords: [
      'rent',
      'buy',
      'renting',
      'buying',
      'home purchase',
      'housing decision',
      'apartment',
      'homeowner',
    ],
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

  // Expanded Financial Planning, Tax, and Business Tools
  analyze_1031_exchange: {
    keywords: ['1031', 'exchange', 'like-kind'],
    category: 'tax',
    promptHint:
      'Analyze 1031 like-kind exchange opportunities with tax deferral calculations, identification rules, and replacement property analysis',
  },
  analyze_401k_match: {
    keywords: ['401k', 'match', 'employer'],
    category: 'retirement',
    promptHint:
      'Maximize 401(k) employer match, analyze vesting schedule, optimize contribution strategy, and calculate tax benefits',
  },
  analyze_529_optimizer: {
    keywords: ['529', 'optimizer', 'college', 'education'],
    category: 'retirement',
    promptHint:
      'Optimize 529 plan contributions, compare state plans, analyze financial aid impact, and project education funding',
  },
  analyze_accounts_payable_optimization: {
    keywords: ['accounts', 'payable', 'optimization'],
    category: 'business',
    promptHint:
      'Optimize accounts payable with early payment discounts, payment term analysis, cash flow optimization, and vendor relationship management',
  },
  analyze_accounts_receivable_aging: {
    keywords: ['accounts', 'receivable', 'aging'],
    category: 'business',
    promptHint:
      'Analyze accounts receivable aging, calculate DSO, forecast bad debt, optimize collection strategies, and improve credit policy',
  },
  analyze_auto_loan_analysis: {
    keywords: ['auto', 'loan', 'analysis'],
    category: 'loan',
    promptHint:
      'Run a comprehensive auto loan analysis with optional lease comparison, refinancing scenarios, total cost of ownership (TCO), and a detailed payment schedule',
  },
  analyze_business_expansion_loan: {
    keywords: ['business', 'expansion', 'loan'],
    category: 'loan',
    promptHint:
      'Comprehensive business expansion loan analysis including debt capacity assessment, cash flow projections with loan payments, DSCR analysis, risk assessment, loan term optimization, and scenario analysis for businesses seeking growth financing',
  },
  analyze_business_succession_planning: {
    keywords: ['business', 'succession', 'planning'],
    category: 'business',
    promptHint:
      'Business succession planning with valuation, buy-sell agreements, estate tax planning, gifting strategies, and transition scenarios',
  },
  analyze_capital_structure: {
    keywords: ['capital', 'structure'],
    category: 'business',
    promptHint:
      'Optimize capital structure with WACC optimization, optimal debt/equity ratio, credit rating impact, and dividend policy analysis',
  },
  analyze_car_lease_vs_buy: {
    keywords: ['car', 'lease', 'vs', 'buy'],
    category: 'loan',
    promptHint:
      'Compare car leasing vs buying with total cost analysis, mileage considerations, early termination scenarios, and opportunity cost',
  },
  analyze_charitable_giving: {
    keywords: ['charitable', 'giving'],
    category: 'tax',
    promptHint:
      'Optimize charitable giving strategies with donor-advised funds, QCDs, appreciated securities, and tax deduction maximization',
  },
  analyze_credit_risk: {
    keywords: ['credit', 'risk'],
    category: 'business',
    promptHint:
      'Credit risk analysis with Probability of Default (PD), Loss Given Default (LGD), Expected Loss (EL), and stress testing',
  },
  analyze_credit_score_impact: {
    keywords: ['credit', 'score', 'impact'],
    category: 'loan',
    promptHint:
      'Analyze credit score impact of actions, project score changes, optimize credit utilization, and provide improvement recommendations',
  },
  analyze_cryptocurrency_tax: {
    keywords: ['cryptocurrency', 'tax'],
    category: 'tax',
    promptHint:
      'Calculate cryptocurrency tax obligations with FIFO/LIFO/HIFO methods, wash sale analysis, staking/mining income, and DeFi transactions',
  },
  analyze_depreciation: {
    keywords: ['depreciation'],
    category: 'business',
    promptHint:
      'Calculate depreciation using multiple methods (straight-line, declining balance, MACRS, Section 179, bonus depreciation) with tax impact analysis',
  },
  analyze_disability_insurance: {
    keywords: ['disability', 'insurance'],
    category: 'insurance',
    promptHint:
      'Analyze disability insurance needs, assess coverage gaps, compare own-occupation vs any-occupation definitions, and optimize policy selection',
  },
  analyze_emergency_fund: {
    keywords: ['emergency', 'fund'],
    category: 'budgeting',
    promptHint:
      'Calculate emergency fund target, build timeline, withdrawal scenarios, and savings recommendations',
  },
  analyze_employee_stock_options: {
    keywords: ['employee', 'stock', 'options'],
    category: 'investment',
    promptHint:
      'Value employee stock options with Black-Scholes, analyze tax implications (ISO vs NSO), optimize exercise strategies, and project scenarios',
  },
  analyze_equipment_lease_vs_buy: {
    keywords: ['equipment', 'lease', 'vs', 'buy'],
    category: 'loan',
    promptHint:
      'Compare equipment leasing vs purchasing with tax implications, NPV/IRR analysis, and cash flow comparison',
  },
  analyze_estate_planning: {
    keywords: ['estate', 'planning'],
    category: 'tax',
    promptHint:
      'Estate tax planning, inheritance projections, trust analysis, and gift tax optimization',
  },
  analyze_financial_ratios: {
    keywords: ['financial', 'ratios'],
    category: 'business',
    promptHint:
      'Comprehensive financial ratio analysis with liquidity, profitability, efficiency, leverage, and market ratios with industry benchmarking',
  },
  analyze_fire_calculator: {
    keywords: ['fire', 'calculator'],
    category: 'retirement',
    promptHint:
      'Calculate Financial Independence (FIRE) number, retirement date, Coast FIRE, Barista FIRE, and savings strategies',
  },
  analyze_franchise_roi: {
    keywords: ['franchise', 'roi'],
    category: 'business',
    promptHint:
      'Analyze franchise investment ROI with initial costs, ongoing fees, revenue projections, break-even analysis, and profitability scenarios',
  },
  analyze_heloc: {
    keywords: ['heloc', 'home', 'equity'],
    category: 'loan',
    promptHint:
      'Analyze Home Equity Line of Credit (HELOC) options, compare to refinancing and personal loans, calculate payments, tax implications, and risk assessment',
  },
  analyze_hsa_optimization: {
    keywords: ['hsa', 'optimization', 'health', 'savings'],
    category: 'retirement',
    promptHint:
      'Maximize Health Savings Account tax benefits with triple tax advantage analysis, contribution limits, retirement healthcare planning, and tax savings projections',
  },
  analyze_international_tax_planning: {
    keywords: ['international', 'tax', 'planning'],
    category: 'tax',
    promptHint:
      'International tax planning with foreign tax credits, tax treaties, transfer pricing, controlled foreign corporations, and BEPS compliance',
  },
  analyze_inventory_optimization: {
    keywords: ['inventory', 'optimization'],
    category: 'business',
    promptHint:
      'Optimize inventory levels with EOQ, safety stock calculations, ABC analysis, reorder points, and total cost optimization',
  },
  analyze_lbo: {
    keywords: ['lbo', 'leveraged', 'buyout'],
    category: 'valuation',
    promptHint:
      'Leveraged buyout analysis with IRR, MOIC, debt paydown, exit scenarios, and risk assessment',
  },
  analyze_life_insurance_reassessment: {
    keywords: ['life', 'insurance', 'reassessment'],
    category: 'insurance',
    promptHint:
      'Reassess life insurance coverage needs, analyze coverage gaps, optimize policies, and compare term vs permanent insurance',
  },
  analyze_long_term_care: {
    keywords: ['long', 'term', 'care'],
    category: 'insurance',
    promptHint:
      'Analyze long-term care insurance needs, compare self-funding vs insurance, assess hybrid strategies, and estimate lifetime care costs',
  },
  analyze_net_worth: {
    keywords: ['net', 'worth'],
    category: 'budgeting',
    promptHint:
      'Track net worth over time with asset/liability breakdown, projections, milestones, and debt analysis',
  },
  analyze_portfolio_optimization: {
    keywords: ['portfolio', 'optimization'],
    category: 'investment',
    promptHint:
      'Portfolio optimization with mean-variance optimization, efficient frontier, asset allocation, and rebalancing recommendations',
  },
  analyze_project_finance: {
    keywords: ['project', 'finance'],
    category: 'business',
    promptHint:
      'Project finance analysis with NPV, IRR, payback period, sensitivity analysis, and risk assessment',
  },
  analyze_real_estate_investment: {
    keywords: ['real', 'estate', 'investment'],
    category: 'investment',
    promptHint:
      'Real estate investment analysis with cap rate, cash-on-cash return, NOI, IRR, and projected returns',
  },
  analyze_refinancing: {
    keywords: ['refinancing'],
    category: 'loan',
    promptHint:
      'Comprehensive mortgage refinancing analysis with break-even point, interest savings, payment comparison, and net benefit calculation',
  },
  analyze_retirement_planning: {
    keywords: ['retirement', 'planning'],
    category: 'retirement',
    promptHint:
      'Advanced retirement planning analysis including multi-account projections, Social Security optimization, tax-advantaged strategies, withdrawal strategies, healthcare cost planning, and estate planning considerations',
  },
  analyze_revenue_recognition: {
    keywords: ['revenue', 'recognition'],
    category: 'business',
    promptHint:
      'ASC 606 compliant revenue recognition analysis with performance obligation allocation, deferred revenue, and contract asset calculations',
  },
  analyze_roth_vs_traditional_ira: {
    keywords: ['roth', 'vs', 'traditional', 'ira', 'conversion'],
    category: 'retirement',
    promptHint:
      'Compare Roth vs Traditional IRA strategies with tax bracket analysis, conversion scenarios, and withdrawal optimization',
  },
  analyze_social_security: {
    keywords: ['social', 'security'],
    category: 'retirement',
    promptHint:
      'Optimize Social Security claiming strategy with break-even analysis, spousal benefits, survivor benefits, and lifetime benefit projections',
  },
  analyze_startup_financial_model: {
    keywords: ['startup', 'financial', 'model'],
    category: 'business',
    promptHint:
      'Comprehensive startup financial model with revenue projections, burn rate, runway, unit economics, and funding scenarios',
  },
  analyze_supply_chain_finance: {
    keywords: ['supply', 'chain', 'finance'],
    category: 'business',
    promptHint:
      'Optimize supply chain finance with dynamic discounting, reverse factoring, inventory financing, and working capital optimization',
  },
  analyze_tax_loss_harvesting: {
    keywords: ['tax', 'loss', 'harvesting'],
    category: 'tax',
    promptHint:
      'Identify tax-loss harvesting opportunities, calculate tax savings, analyze wash sale rules, and optimize capital gains offset',
  },
  analyze_var: {
    keywords: ['var', 'value-at-risk', 'risk'],
    category: 'investment',
    promptHint:
      'Value at Risk (VaR) calculation using historical, parametric, or Monte Carlo methods with stress testing and backtesting',
  },
  analyze_working_capital: {
    keywords: ['working', 'capital'],
    category: 'business',
    promptHint:
      'Working capital optimization with cash conversion cycle, liquidity analysis, and optimization recommendations',
  },
  calculate_wacc: {
    keywords: ['wacc', 'discount', 'rate'],
    category: 'valuation',
    promptHint: 'Calculate Weighted Average Cost of Capital (WACC)',
  },

  // Journey & Scenario Tools
  analyze_financial_journey: {
    keywords: [
      'financial journey',
      'milestones',
      'life events',
      'seed round',
      'series a',
      'funding',
      'startup',
    ],
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
  return (
    toolMetadata[toolName] || {
      keywords: [],
      category: 'business' as ToolCategory,
      outputFields: [],
      promptHint: 'Financial analysis tool',
    }
  );
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
      lines.push(
        `- ${categoryDescriptions[category]}: use ${tools.slice(0, 3).join(', ')}${tools.length > 3 ? ', ...' : ''}`
      );
    }
  }

  return lines.join('\n');
}
