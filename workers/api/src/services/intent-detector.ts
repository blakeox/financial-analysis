/**
 * Intent Detector Service
 * Detects user intent from natural language and routes to appropriate handler
 */

export interface ToolSummary {
  name: string;
  description: string;
}

export type IntentType = 'tool_call' | 'field_update' | 'llm_question' | 'general';

export interface IntentDetection {
  intent: IntentType;
  confidence: number;
  parameters?: Record<string, unknown>;
  suggestedTool?: string;
  suggestedField?: string;
  reasoning?: string;
}

export class IntentDetector {
  // Tool keywords for pattern matching - comprehensive coverage for all journeys
  private readonly toolKeywords: Record<string, string[]> = {
    // Personal Finance Tools
    analyze_savings_goal: ['savings', 'goal', 'save', 'emergency fund', 'down payment'],
    analyze_student_loans: ['student loan', 'loan payoff', 'idr', 'refinanc', 'avalanche', 'snowball'],
    analyze_retirement_savings: ['retirement', '401k', 'ira', 'roth', 'employer match'],
    optimize_budget: ['budget', '50/30/20', 'spending', 'expense', 'financial health'],
    analyze_debt_payoff: ['debt', 'payoff', 'credit card', 'balance transfer'],
    analyze_auto_loan: ['auto loan', 'car loan', 'vehicle'],
    analyze_lease: ['lease', 'leasing'],
    analyze_enhanced_lease: ['commercial lease', 'detailed lease', 'advanced lease'],
    populate_lease_form: ['populate lease', 'fill lease form'],
    analyze_amortization: ['amortization', 'mortgage', 'loan schedule'],
    
    // Business Finance Tools
    analyze_cash_flow: ['cash flow', 'burn rate', 'runway', 'cash projection', 'liquidity'],
    ebitda_forecasting: ['ebitda', 'revenue projection', 'forecast', 'projection', 'financial forecast'],
    ebitda_scenario_comparison: ['scenario', 'compare forecast', 'multiple scenarios'],
    analyze_financial_journey: ['journey', 'multi-stage', 'comprehensive planning'],
    
    // Family Planning Tools
    analyze_college_savings: ['college', '529', 'education fund', 'tuition'],
    analyze_home_buying_affordability: ['home buying', 'affordability', 'house purchase'],
    analyze_tax_optimization: ['tax', 'deduction', 'ira contribution', 'capital gains'],
    analyze_insurance_needs: ['insurance', 'life insurance', 'disability', 'coverage'],
    
    // Investment & Corporate Tools
    analyze_investment_portfolio: ['portfolio', 'investment', 'asset allocation', 'rebalancing'],
    analyze_ma_deal: ['m&a', 'merger', 'acquisition', 'deal', 'synergy'],
    analyze_dcf_valuation: ['dcf', 'discounted cash flow', 'wacc', 'valuation'],
    analyze_cca_valuation: ['cca', 'comparable', 'trading multiple', 'peer group'],
    analyze_bond_pricing: ['bond', 'yield', 'coupon', 'fixed income'],
    analyze_options_pricing: ['options', 'put', 'call', 'black-scholes', 'derivative'],
    
    // Journey & Scenario Tools
    interactive_financial_model: ['interactive model', 'custom model'],
    multi_model_scenario_analysis: ['scenario analysis', 'what-if', 'sensitivity'],
  };

  // Field update patterns
  private readonly fieldPatterns: {
    field: string;
    keywords: string[];
    extractor: (message: string) => unknown | null;
  }[] = [
    {
      field: 'interestRate',
      keywords: ['interest', 'rate', 'apr'],
      extractor: (msg) => this.extractPercentage(msg),
    },
    {
      field: 'amount',
      keywords: ['amount', 'principal', 'loan', 'lease'],
      extractor: (msg) => this.extractCurrency(msg),
    },
    {
      field: 'term',
      keywords: ['term', 'month', 'year', 'duration', 'length'],
      extractor: (msg) => this.extractTerm(msg),
    },
    {
      field: 'revenue',
      keywords: ['revenue', 'sales', 'income'],
      extractor: (msg) => this.extractCurrency(msg),
    },
    {
      field: 'growth',
      keywords: ['growth', 'increase', 'annual'],
      extractor: (msg) => this.extractPercentage(msg),
    },
  ];

  /**
   * Detect intent from user message
   */
  detect(
    message: string,
    context: string,
    availableTools: ToolSummary[]
  ): IntentDetection {
    const lowerMessage = message.toLowerCase();

    // 1. Check for tool call intent
    const toolIntent = this.detectToolIntent(lowerMessage, availableTools);
    if (toolIntent.confidence > 0.6) {
      return toolIntent;
    }

    // 2. Check for field update intent (in specific contexts)
    if (['lease', 'amortization', 'ebitda', 'startup-planning'].includes(context)) {
      const fieldIntent = this.detectFieldUpdate(lowerMessage);
      if (fieldIntent.confidence > 0.6) {
        return fieldIntent;
      }
    }

    // 3. Default to LLM question
    return {
      intent: 'llm_question',
      confidence: 0.5,
      reasoning: 'General question, requires LLM response',
    };
  }

  /**
   * Detect if user wants to call a tool
   */
  private detectToolIntent(
    message: string,
    availableTools: ToolSummary[]
  ): IntentDetection {
    // Match keywords to tools
    for (const [toolName, keywords] of Object.entries(this.toolKeywords)) {
      if (keywords.some((keyword) => message.includes(keyword))) {
        // Verify tool is available
        if (availableTools.some((t) => t.name === toolName)) {
          return {
            intent: 'tool_call',
            confidence: 0.8,
            suggestedTool: toolName,
            reasoning: `User message matches keywords for ${toolName}`,
          };
        }
      }
    }

    return {
      intent: 'tool_call',
      confidence: 0.1,
      reasoning: 'No clear tool match found',
    };
  }

  /**
   * Detect if user wants to update a field
   */
  private detectFieldUpdate(message: string): IntentDetection {
    for (const pattern of this.fieldPatterns) {
      if (pattern.keywords.some((keyword) => message.includes(keyword))) {
        const value = pattern.extractor(message);
        if (value !== null) {
          return {
            intent: 'field_update',
            confidence: 0.8,
            parameters: { [pattern.field]: value },
            suggestedField: pattern.field,
            reasoning: `Detected ${pattern.field} update with value ${value}`,
          };
        }
      }
    }

    return {
      intent: 'field_update',
      confidence: 0.2,
      reasoning: 'Field keywords found but value extraction failed',
    };
  }

  /**
   * Extract percentage from message
   */
  private extractPercentage(message: string): number | null {
    const match = message.match(/(\d+(?:\.\d+)?)%?/);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  }

  /**
   * Extract currency amount from message
   */
  private extractCurrency(message: string): number | null {
    const match = message.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/);
    if (match && match[1]) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return null;
  }

  /**
   * Extract term (months/years) from message
   */
  private extractTerm(message: string): number | null {
    const match = message.match(/(\d+)\s*(month|year)/);
    if (match && match[1] && match[2]) {
      const value = parseInt(match[1]);
      const unit = match[2];
      return unit === 'year' ? value * 12 : value;
    }
    return null;
  }

  /**
   * Get all available intents for a message
   */
  getAllIntents(
    message: string,
    context: string,
    availableTools: ToolSummary[]
  ): IntentDetection[] {
    const lowerMessage = message.toLowerCase();
    const intents: IntentDetection[] = [];

    // Tool intents
    for (const [toolName, keywords] of Object.entries(this.toolKeywords)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        if (availableTools.some((t) => t.name === toolName)) {
          intents.push({
            intent: 'tool_call',
            confidence: 0.8,
            suggestedTool: toolName,
          });
        }
      }
    }

    // Field update intents
    if (['lease', 'amortization', 'ebitda'].includes(context)) {
      for (const pattern of this.fieldPatterns) {
        if (pattern.keywords.some((keyword) => lowerMessage.includes(keyword))) {
          const value = pattern.extractor(message);
          if (value !== null) {
            intents.push({
              intent: 'field_update',
              confidence: 0.8,
              parameters: { [pattern.field]: value },
              suggestedField: pattern.field,
            });
          }
        }
      }
    }

    // Always include LLM question as fallback
    intents.push({
      intent: 'llm_question',
      confidence: 0.3,
    });

    return intents;
  }
}

