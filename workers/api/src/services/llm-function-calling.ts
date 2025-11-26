/**
 * LLM Function Calling Service
 * Uses Cloudflare's runWithTools for embedded function calling with MCP tools
 */

import { runWithTools, autoTrimTools } from '@cloudflare/ai-utils';
import type { Ai } from '@cloudflare/workers-types';
import type { MCPTool } from '@financial-analysis/tools';

// Model that supports function calling
// Using hermes-2-pro which is recommended in Cloudflare examples
export const FUNCTION_CALLING_MODEL = '@hf/nousresearch/hermes-2-pro-mistral-7b';

export interface FunctionCallingMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
}

export interface ToolCallResult {
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface FunctionCallingResponse {
  content: string;
  toolCalls: ToolCallResult[];
  modelChanges?: Record<string, unknown>;
}

export interface FunctionCallingConfig {
  maxRecursiveToolRuns?: number;
  streamFinalResponse?: boolean;
  verbose?: boolean;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_CONFIG: FunctionCallingConfig = {
  maxRecursiveToolRuns: 3,
  streamFinalResponse: false,
  verbose: false,
  temperature: 0.7,
  maxTokens: 2048,
};

/**
 * Convert MCP tool to Cloudflare function calling format
 * Uses type assertions since MCP tool schemas are JSON Schema compatible
 */
function mcpToolToCloudflareFormat(tool: MCPTool) {
  // MCP tools use JSON Schema which should have type: 'object'
  // Cast through unknown to satisfy strict Cloudflare types
  const inputSchema = tool.inputSchema as unknown as {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };

  return {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object' as const,
      properties: inputSchema.properties || {},
      required: inputSchema.required || [],
    },
    // Cloudflare expects Promise<string>, so we stringify the result
    function: async (args: Record<string, unknown>): Promise<string> => {
      try {
        const result = await tool.execute(args);
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (error) {
        console.error(`Tool ${tool.name} execution error:`, error);
        return JSON.stringify({
          error: true,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  };
}

/**
 * Extract model changes from tool results for GUI updates
 */
function extractModelChanges(toolCalls: ToolCallResult[]): Record<string, unknown> | undefined {
  const changes: Record<string, unknown> = {};
  
  for (const call of toolCalls) {
    // Check if the tool result contains form field updates
    const result = call.result as Record<string, unknown>;
    
    if (result && typeof result === 'object') {
      // Look for common patterns in tool results that indicate field changes
      if ('formValues' in result) {
        Object.assign(changes, result.formValues);
      }
      if ('modelChanges' in result) {
        Object.assign(changes, result.modelChanges);
      }
      // For analysis tools, extract key values that should update the form
      if ('principal' in result) changes.principal = result.principal;
      if ('annualRate' in result) changes.annualRate = result.annualRate;
      if ('termMonths' in result) changes.termMonths = result.termMonths;
      if ('monthlyPayment' in result) changes.monthlyPayment = result.monthlyPayment;
    }
  }
  
  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Pre-filter tools based on user message to reduce token usage
 * This is a simple keyword-based filter to stay within model context limits
 */
function preFilterTools(tools: MCPTool[], userMessage: string): MCPTool[] {
  const message = userMessage.toLowerCase();
  
  // Tool categories with keywords
  const toolKeywords: Record<string, string[]> = {
    'analyze_lease': ['lease', 'rent', 'tenant', 'landlord', 'commercial'],
    'analyze_enhanced_lease': ['lease', 'rent', 'tenant', 'landlord', 'commercial', 'enhanced'],
    'analyze_amortization': ['amortization', 'mortgage', 'loan payment', 'principal', 'schedule'],
    'ebitda_forecasting': ['ebitda', 'earnings', 'forecast', 'operating'],
    'ebitda_scenario_comparison': ['ebitda', 'scenario', 'compare', 'operating'],
    'analyze_bond_pricing': ['bond', 'coupon', 'yield', 'maturity', 'fixed income'],
    'analyze_options_pricing': ['option', 'call', 'put', 'strike', 'black-scholes', 'derivative'],
    'analyze_cash_flow': ['cash flow', 'dcf', 'npv', 'irr', 'present value'],
    'analyze_auto_loan': ['auto', 'car', 'vehicle', 'auto loan'],
    'analyze_debt_payoff': ['debt', 'payoff', 'snowball', 'avalanche', 'credit card'],
    'analyze_savings_goal': ['savings', 'save', 'goal', 'target'],
    'analyze_student_loans': ['student', 'loan', 'education', 'college loan'],
    'analyze_retirement_savings': ['retirement', '401k', 'ira', 'pension', 'retire'],
    'optimize_budget': ['budget', 'expense', 'income', 'spending'],
    'populate_lease_form': ['populate', 'form', 'fill', 'lease form'],
    'analyze_college_savings': ['college', '529', 'education', 'tuition'],
    'analyze_home_buying_affordability': ['home', 'house', 'afford', 'buy', 'mortgage'],
    'analyze_tax_optimization': ['tax', 'deduction', 'bracket', 'optimize'],
    'analyze_insurance_needs': ['insurance', 'coverage', 'life insurance', 'policy'],
    'analyze_investment_portfolio': ['portfolio', 'investment', 'diversif', 'asset allocation'],
    'analyze_financial_journey': ['financial journey', 'milestones', 'life events'],
    'interactive_financial_model': ['interactive', 'model', 'scenario'],
    'multi_model_scenario_analysis': ['scenario', 'multi', 'compare', 'analysis'],
    'analyze_ma_deal': ['m&a', 'merger', 'acquisition', 'deal'],
    'analyze_dcf_valuation': ['dcf', 'valuation', 'discount', 'cash flow'],
    'analyze_cca_valuation': ['comparable', 'cca', 'multiples', 'valuation'],
    'cache_document': ['document', 'cache', 'store'],
    'search_documents': ['search', 'document', 'find'],
    'get_document': ['get', 'retrieve', 'document'],
    'clear_expired_documents': ['clear', 'expired', 'document'],
  };

  // Score each tool based on keyword matches
  const scoredTools = tools.map(tool => {
    const keywords = toolKeywords[tool.name] || [];
    let score = 0;
    
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        score += keyword.length; // Longer matches are more specific
      }
    }
    
    // Also check if tool name or description matches
    if (message.includes(tool.name.replace(/_/g, ' '))) {
      score += 10;
    }
    const descLower = tool.description.toLowerCase();
    for (const word of message.split(/\s+/)) {
      if (word.length > 3 && descLower.includes(word)) {
        score += 2;
      }
    }
    
    return { tool, score };
  });

  // Sort by score and take top matches
  const sorted = scoredTools.sort((a, b) => b.score - a.score);
  
  // Take tools with score > 0, or top 5 if none match
  const filtered = sorted.filter(t => t.score > 0);
  const result = filtered.length > 0 
    ? filtered.slice(0, 8).map(t => t.tool) // Max 8 relevant tools
    : sorted.slice(0, 5).map(t => t.tool);  // Fallback to top 5
  
  console.log('[preFilterTools] User message:', userMessage.substring(0, 100));
  console.log('[preFilterTools] Tools with scores:', sorted.slice(0, 10).map(t => `${t.tool.name}:${t.score}`));
  console.log('[preFilterTools] Selected tools:', result.map(t => t.name));
  return result;
}

/**
 * Function Calling Service class
 */
export class FunctionCallingService {
  private config: FunctionCallingConfig;

  constructor(
    private ai: Ai,
    config?: Partial<FunctionCallingConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a chat with function calling support
   */
  async chat(
    messages: FunctionCallingMessage[],
    tools: MCPTool[],
    systemPrompt?: string
  ): Promise<FunctionCallingResponse> {
    const toolCalls: ToolCallResult[] = [];

    // Build messages array with system prompt
    const fullMessages: FunctionCallingMessage[] = [];
    if (systemPrompt) {
      fullMessages.push({ role: 'system', content: systemPrompt });
    }
    fullMessages.push(...messages);

    // Pre-filter tools based on user message to stay within context limits
    const userMessage = messages.find(m => m.role === 'user')?.content || '';
    const filteredTools = preFilterTools(tools, userMessage);
    console.log(`[FunctionCallingService] Filtered from ${tools.length} to ${filteredTools.length} tools`);

    // Convert MCP tools to Cloudflare format
    const cloudflareTools = filteredTools.map(mcpToolToCloudflareFormat);

    // Add wrapper to track tool calls
    const trackedTools = cloudflareTools.map((tool) => ({
      ...tool,
      function: async (args: Record<string, unknown>) => {
        const result = await tool.function(args);
        toolCalls.push({
          toolName: tool.name,
          arguments: args,
          result,
        });
        return result;
      },
    }));

    try {
      // Debug: Log tools and messages
      console.log('[FunctionCallingService] tools count:', tools.length);
      console.log('[FunctionCallingService] cloudflareTools count:', cloudflareTools.length);
      console.log('[FunctionCallingService] trackedTools count:', trackedTools.length);
      
      // Validate AI binding
      console.log('[FunctionCallingService] ai binding exists:', !!this.ai);
      console.log('[FunctionCallingService] ai binding type:', typeof this.ai);
      if (!this.ai) {
        throw new Error('AI binding is undefined - check worker bindings');
      }
      
      // Log first few tools in detail for debugging
      if (trackedTools.length > 0) {
        const firstTool = trackedTools[0]!;
        console.log('[FunctionCallingService] first tool structure:', JSON.stringify({
          name: firstTool.name,
          description: firstTool.description?.substring(0, 50),
          hasFunction: typeof firstTool.function === 'function',
          hasParameters: !!firstTool.parameters,
          parametersType: firstTool.parameters?.type,
          hasProperties: !!firstTool.parameters?.properties,
          propertiesKeys: firstTool.parameters?.properties ? Object.keys(firstTool.parameters.properties).slice(0, 5) : [],
        }));
      }
      
      console.log('[FunctionCallingService] messages count:', fullMessages.length);
      console.log('[FunctionCallingService] first message role:', fullMessages[0]?.role);

      // Build options, only including defined values
      const options: {
        maxRecursiveToolRuns?: number;
        streamFinalResponse?: boolean;
        verbose?: boolean;
        trimFunction?: typeof autoTrimTools;
      } = {};
      
      if (this.config.maxRecursiveToolRuns !== undefined) {
        options.maxRecursiveToolRuns = this.config.maxRecursiveToolRuns;
      }
      if (this.config.streamFinalResponse !== undefined) {
        options.streamFinalResponse = this.config.streamFinalResponse;
      }
      if (this.config.verbose !== undefined) {
        options.verbose = this.config.verbose;
      }
      // Always use autoTrimTools when we have more than 3 tools to stay within context limits
      // The hermes-2-pro model has a 24k token limit
      if (tools.length > 3) {
        options.trimFunction = autoTrimTools;
      }

      console.log('[FunctionCallingService] options:', JSON.stringify(options));

      // Prepare input for runWithTools
      const runWithToolsInput = {
        messages: fullMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: trackedTools,
      };
      
      console.log('[FunctionCallingService] calling runWithTools with model:', FUNCTION_CALLING_MODEL);
      console.log('[FunctionCallingService] input messages length:', runWithToolsInput.messages.length);
      console.log('[FunctionCallingService] input tools length:', runWithToolsInput.tools.length);

      // Use runWithTools for embedded function calling
      const aiResponse = await runWithTools(
        this.ai,
        FUNCTION_CALLING_MODEL,
        runWithToolsInput,
        options
      );
      
      console.log('[FunctionCallingService] runWithTools response type:', typeof aiResponse);

      // Extract response content
      let content = '';
      if (typeof aiResponse === 'string') {
        content = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object') {
        // Handle various response formats
        const resp = aiResponse as Record<string, unknown>;
        if ('response' in resp && typeof resp.response === 'string') {
          content = resp.response;
        } else if ('content' in resp && typeof resp.content === 'string') {
          content = resp.content;
        } else if (Array.isArray(resp.choices)) {
          const choice = resp.choices[0] as Record<string, unknown>;
          if (choice?.message && typeof choice.message === 'object') {
            const msg = choice.message as Record<string, unknown>;
            content = String(msg.content || '');
          }
        }
      }

      // Extract model changes for GUI updates
      const modelChanges = extractModelChanges(toolCalls);

      const result: FunctionCallingResponse = {
        content,
        toolCalls,
      };
      if (modelChanges) {
        result.modelChanges = modelChanges;
      }
      return result;
    } catch (error) {
      console.error('Function calling error:', error);
      throw error;
    }
  }

  /**
   * Simple chat without function calling (fallback)
   */
  async simpleChat(
    messages: FunctionCallingMessage[],
    systemPrompt?: string
  ): Promise<string> {
    const fullMessages: FunctionCallingMessage[] = [];
    if (systemPrompt) {
      fullMessages.push({ role: 'system', content: systemPrompt });
    }
    fullMessages.push(...messages);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = this.ai as any;
    const response = await ai.run(FUNCTION_CALLING_MODEL, {
      messages: fullMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this.config.temperature,
      max_tokens: this.config.maxTokens,
    });

    if (typeof response === 'string') {
      return response;
    }
    if (response?.response) {
      return response.response;
    }
    return JSON.stringify(response);
  }
}

/**
 * Create a function calling service instance
 */
export function createFunctionCallingService(
  ai: Ai,
  config?: Partial<FunctionCallingConfig>
): FunctionCallingService {
  return new FunctionCallingService(ai, config);
}
