/**
 * Help Query Interceptor
 * Handles common help queries locally to ensure helpful, specific responses
 */

import type { ToolSummary } from './types';

export interface HelpResponse {
  readonly shouldIntercept: boolean;
  readonly response: string;
}

/**
 * Check if a message is a help query that should be intercepted
 */
export function isHelpQuery(message: string): boolean {
  const normalized = message.trim().toLowerCase();

  const helpPatterns = [
    /^what (tools|calculators|models) (are )?(available|can you use)/i,
    /^what can you (help|do|assist)/i,
    /^show (me )?(all )?(tools|calculators|models)/i,
    /^list (all )?(tools|calculators|models)/i,
    /^available (tools|calculators|models)/i,
    /^what (do|does) (you|this) (do|support)/i,
    /^help$/i,
    /^what.*help/i,
  ];

  return helpPatterns.some((pattern) => pattern.test(normalized));
}

/**
 * Generate a helpful response for help queries
 */
export function generateHelpResponse(
  message: string,
  availableTools: readonly ToolSummary[],
  context: string
): HelpResponse {
  const normalized = message.trim().toLowerCase();

  // Check if this is a help query
  if (!isHelpQuery(message)) {
    return { shouldIntercept: false, response: '' };
  }

  // Organize tools by category
  const toolsByCategory = organizeToolsByCategory(availableTools);

  // Generate response based on query type
  if (/tools|calculators|models.*available/i.test(normalized)) {
    return {
      shouldIntercept: true,
      response: generateToolsListResponse(toolsByCategory, context),
    };
  }

  if (/what can you (help|do|assist)/i.test(normalized)) {
    return {
      shouldIntercept: true,
      response: generateCapabilitiesResponse(toolsByCategory, context),
    };
  }

  // Generic help response
  return {
    shouldIntercept: true,
    response: generateGenericHelpResponse(toolsByCategory, context),
  };
}

/**
 * Organize tools by category
 */
function organizeToolsByCategory(tools: readonly ToolSummary[]): Record<string, ToolSummary[]> {
  const categories: Record<string, ToolSummary[]> = {
    'Personal Finance': [],
    'Business Finance': [],
    'Real Estate': [],
    Investment: [],
    Other: [],
  };

  for (const tool of tools) {
    const description = tool.description.toLowerCase();
    let category = 'Other';

    if (
      description.includes('mortgage') ||
      description.includes('loan') ||
      description.includes('debt') ||
      description.includes('retirement') ||
      description.includes('savings') ||
      description.includes('budget') ||
      description.includes('student')
    ) {
      category = 'Personal Finance';
    } else if (
      description.includes('ebitda') ||
      description.includes('business') ||
      description.includes('revenue') ||
      description.includes('cash flow') ||
      description.includes('npv') ||
      description.includes('irr') ||
      description.includes('payback') ||
      description.includes('break-even') ||
      description.includes('break even') ||
      description.includes('valuation') ||
      description.includes('unit economics') ||
      description.includes('startup')
    ) {
      category = 'Business Finance';
    } else if (
      description.includes('lease') ||
      description.includes('rent') ||
      description.includes('home') ||
      description.includes('property')
    ) {
      category = 'Real Estate';
    } else if (
      description.includes('bond') ||
      description.includes('option') ||
      description.includes('portfolio') ||
      description.includes('investment') ||
      description.includes('capm') ||
      description.includes('sharpe') ||
      description.includes('sortino') ||
      description.includes('var') ||
      description.includes('monte carlo') ||
      description.includes('dividend') ||
      description.includes('fx') ||
      description.includes('forex') ||
      description.includes('hedge') ||
      description.includes('currency') ||
      description.includes('esg') ||
      description.includes('carbon') ||
      description.includes('p2p') ||
      description.includes('lending')
    ) {
      category = 'Investment';
    }

    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(tool);
  }

  return categories;
}

/**
 * Generate tools list response
 */
function generateToolsListResponse(
  toolsByCategory: Record<string, ToolSummary[]>,
  _context: string
): string {
  const totalTools = Object.values(toolsByCategory).reduce((sum, tools) => sum + tools.length, 0);

  if (totalTools === 0) {
    return 'I can help with financial calculations and analysis. What would you like to calculate?';
  }

  let response = `I have access to ${totalTools} financial analysis tools organized by category:\n\n`;

  for (const [category, tools] of Object.entries(toolsByCategory)) {
    if (tools.length === 0) continue;

    const emoji = getCategoryEmoji(category);
    response += `${emoji} ${category} (${tools.length} tool${tools.length > 1 ? 's' : ''}):\n`;

    // Show first 5 tools per category
    const toolsToShow = tools.slice(0, 5);
    for (const tool of toolsToShow) {
      const url = getToolUrl(tool.name);
      const name = formatToolName(tool.name);
      if (url) {
        response += `• ${name} (${url}) - ${tool.description}\n`;
      } else {
        response += `• ${name} - ${tool.description}\n`;
      }
    }

    if (tools.length > 5) {
      response += `• ... and ${tools.length - 5} more\n`;
    }

    response += '\n';
  }

  response +=
    'You can ask me to use any of these tools, or ask for help with a specific calculation. What would you like to do?';

  return response;
}

/**
 * Generate capabilities response
 */
function generateCapabilitiesResponse(
  toolsByCategory: Record<string, ToolSummary[]>,
  _context: string
): string {
  const totalTools = Object.values(toolsByCategory).reduce((sum, tools) => sum + tools.length, 0);

  if (totalTools === 0) {
    return 'I can help with financial calculations, analysis, and planning. What would you like to work on?';
  }

  let response = `I can help you with ${totalTools} different financial analysis tools:\n\n`;

  // List capabilities by category
  const capabilities: string[] = [];

  if (toolsByCategory['Personal Finance'].length > 0) {
    capabilities.push(
      `Personal Finance: Calculate mortgages, loans, retirement savings, debt payoff, and more`
    );
  }

  if (toolsByCategory['Business Finance'].length > 0) {
    capabilities.push(
      `Business Finance: Forecast EBITDA, analyze cash flow, value businesses, and plan growth`
    );
  }

  if (toolsByCategory['Real Estate'].length > 0) {
    capabilities.push(
      `Real Estate: Analyze leases, compare rent vs buy, and calculate mortgage scenarios`
    );
  }

  if (toolsByCategory['Investment'].length > 0) {
    capabilities.push(`Investment: Price bonds, analyze options, and evaluate portfolios`);
  }

  response += capabilities.join('\n');
  response += '\n\n';
  response +=
    'You can ask me to calculate specific scenarios, update model parameters, or explain financial concepts. What would you like to do?';

  return response;
}

/**
 * Generate generic help response
 */
function generateGenericHelpResponse(
  toolsByCategory: Record<string, ToolSummary[]>,
  context: string
): string {
  return generateCapabilitiesResponse(toolsByCategory, context);
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    'Personal Finance': '💰',
    'Business Finance': '📊',
    'Real Estate': '🏠',
    Investment: '📈',
    Other: '🔧',
  };
  return emojiMap[category] || '🔧';
}

/**
 * Get URL for tool
 */
function getToolUrl(toolName: string): string | null {
  // Map tool names to URLs
  const urlMap: Record<string, string> = {
    analyze_amortization: '/amortization',
    analyze_lease: '/lease-analysis',
    analyze_ebitda: '/ebitda-forecasting',
    analyze_auto_loan: '/calculator/auto-loan',
    analyze_retirement: '/calculator/retirement',
    analyze_savings_goal: '/calculator/savings-goal',
    analyze_debt_payoff: '/calculator/debt-payoff',
    analyze_student_loans: '/calculator/student-loans',
    analyze_budget: '/calculator/budget',
    analyze_pricing_strategy: '/calculator/pricing-strategy',
  };

  return urlMap[toolName] || null;
}

/**
 * Format tool name for display
 */
function formatToolName(toolName: string): string {
  // Convert snake_case to Title Case
  return toolName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/analyze /i, '');
}
