/**
 * Intelligent Tool Selection Service
 * Uses AI to analyze user queries and recommend the best MCP tools
 */

import { LLMRetryHandler } from './llm-retry';

export interface ToolRecommendation {
  primaryTool?: string;
  secondaryTools?: string[];
  reasoning?: string;
  confidence: number;
  suggestedParameters?: Record<string, any>;
}

export class IntelligentToolSelector {
  constructor(
    private ai: any,
    private retry: LLMRetryHandler = new LLMRetryHandler()
  ) {}

  /**
   * Analyze user query and recommend the best tool(s)
   */
  async selectTools(
    userQuery: string,
    availableTools: Array<{ name: string; description: string }>,
    context?: Record<string, any>
  ): Promise<ToolRecommendation> {
    // Build prompt with tool information
    const prompt = this.buildToolSelectionPrompt(userQuery, availableTools, context);

    try {
      // Call AI with retry logic
      const response = await this.retry.callWithRetry(
        async () => {
          return await this.ai.run('@cf/meta/llama-3.1-8b-instruct', { prompt });
        },
        { maxRetries: 2 }
      );

      // Parse response
      const text = response?.response || response?.text || '';
      const parsed = this.parseToolRecommendation(text);

      return parsed;
    } catch (error) {
      console.warn('Intelligent tool selector falling back to keyword map:', error);
      return this.fallbackSelection(userQuery, availableTools);
    }
  }

  /**
   * Build prompt for tool selection
   */
  private buildToolSelectionPrompt(
    userQuery: string,
    availableTools: Array<{ name: string; description: string }>,
    context?: Record<string, any>
  ): string {
    return `You are a financial analysis assistant. Analyze the user's question and recommend the best tool(s) to help them.

User Question: "${userQuery}"

${context ? `Context: ${JSON.stringify(context)}\n` : ''}

Available Tools:
${availableTools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Return ONLY valid JSON in this exact format:
{
  "primaryTool": "tool_name_if_applicable",
  "secondaryTools": ["optional", "tools"],
  "reasoning": "Brief explanation of why this tool was chosen",
  "confidence": 0.0-1.0,
  "suggestedParameters": {key: "value"} if needed
}

If the question is general conversation and doesn't need a tool, set "primaryTool" to null.`;
  }

  /**
   * Parse AI response into tool recommendation
   */
  private parseToolRecommendation(text: string): ToolRecommendation {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          primaryTool: parsed.primaryTool || undefined,
          secondaryTools: parsed.secondaryTools || [],
          reasoning: parsed.reasoning,
          confidence: parsed.confidence || 0.5,
          suggestedParameters: parsed.suggestedParameters || {},
        };
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to parse tool recommendation:', error);
      throw error;
    }
  }

  /**
   * Fallback to pattern matching if AI fails
   */
  private fallbackSelection(
    userQuery: string,
    availableTools: Array<{ name: string; description: string }>
  ): ToolRecommendation {
    const query = userQuery.toLowerCase();

    // Map keywords to tools
    const keywordMap: Record<string, string[]> = {
      lease: ['analyze_lease', 'analyze_enhanced_lease', 'populate_lease_form'],
      amortization: ['analyze_amortization'],
      mortgage: ['analyze_amortization', 'analyze_home_buying_affordability'],
      retirement: ['analyze_retirement_savings', 'analyze_financial_journey'],
      debt: ['analyze_debt_payoff'],
      savings: ['analyze_savings_goal', 'analyze_investment_portfolio'],
      student: ['analyze_student_loans'],
      budget: ['optimize_budget', 'analyze_cash_flow'],
      college: ['analyze_college_savings'],
      home: ['analyze_home_buying_affordability'],
      tax: ['analyze_tax_optimization'],
      insurance: ['analyze_insurance_needs'],
      portfolio: ['analyze_investment_portfolio'],
      ebitda: ['ebitda_forecasting', 'ebitda_scenario_comparison'],
      bond: ['analyze_bond_pricing'],
      option: ['analyze_options_pricing'],
      'cash flow': ['analyze_cash_flow'],
      'burn rate': ['analyze_cash_flow', 'optimize_budget'],
      runway: ['analyze_cash_flow', 'ebitda_forecasting'],
      'revenue projection': ['ebitda_forecasting', 'analyze_cash_flow'],
      projection: ['ebitda_forecasting', 'analyze_cash_flow'],
      forecast: ['ebitda_forecasting', 'analyze_cash_flow'],
      startup: ['analyze_cash_flow', 'ebitda_forecasting', 'analyze_financial_journey'],
      'seed round': ['analyze_financial_journey'],
      'series a': ['analyze_financial_journey', 'analyze_cash_flow'],
      funding: ['analyze_cash_flow', 'analyze_financial_journey'],
      'capital investment': ['analyze_financial_journey'],
      merger: ['analyze_ma_deal'],
      'm&a': ['analyze_ma_deal'],
      acquisition: ['analyze_ma_deal'],
      dcf: ['analyze_dcf_valuation'],
      valuation: ['analyze_dcf_valuation', 'analyze_cca_valuation'],
      comparable: ['analyze_cca_valuation'],
      auto: ['analyze_auto_loan'],
      car: ['analyze_auto_loan'],
    };

    // Find matching tools
    for (const [keyword, tools] of Object.entries(keywordMap)) {
      if (query.includes(keyword)) {
        const matchedTools = tools.filter(name =>
          availableTools.some(t => t.name === name)
        );
        if (matchedTools.length > 0) {
          return {
            primaryTool: matchedTools[0],
            secondaryTools: matchedTools.slice(1),
            reasoning: `Matched keyword: ${keyword}`,
            confidence: 0.6,
          } as ToolRecommendation;
        }
      }
    }

    // No match found
    return {
      confidence: 0.2,
      reasoning: 'No matching tools found',
    } as ToolRecommendation;
  }

  /**
   * Extract parameters from user query for suggested tools
   */
  extractParameters(userQuery: string, toolName: string): Record<string, any> {
    const params: Record<string, any> = {};

    // Extract numbers from query
    const numbers = userQuery.match(/[\d,]+\.?\d*/g);
    if (numbers && numbers.length > 0) {
      // Try to identify what the numbers represent based on tool
      if (toolName.includes('amortization')) {
        if (numbers && numbers.length >= 3) {
          params.principal = parseFloat(numbers[0]?.replace(/,/g, '') || '0');
          params.annualRate = parseFloat(numbers[1]?.replace(/,/g, '') || '0') / 100;
          params.termMonths = parseInt(numbers[2]?.replace(/,/g, '') || '0');
        }
      }
      // Add more parameter extraction logic for other tools
    }

    return params;
  }
}


