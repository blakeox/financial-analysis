/**
 * LLM Function Calling Service
 * Uses Cloudflare's runWithTools for embedded function calling with MCP tools
 */

import { runWithTools, autoTrimTools } from '@cloudflare/ai-utils';
import type { Ai } from '@cloudflare/workers-types';
import {
  authorizeMCPCapability,
  getToolMetadata,
  MCPAuthorizationError,
  MCP_SCOPES,
  type MCPAuthorizationContext,
  type MCPTool,
} from '@financial-analysis/tools';

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

const DEFAULT_FUNCTION_CALLING_AUTHORIZATION: MCPAuthorizationContext = {
  source: 'internal',
  subject: 'first-party-chat',
  scopes: [MCP_SCOPES.ANALYSIS_READ],
  mcpAnalysisEnabled: true,
};

/** Timeout for individual tool executions (30 seconds) */
const TOOL_EXECUTION_TIMEOUT_MS = 30000;

/** Converted tool schema type for Cloudflare function calling */
interface CloudflareTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
  function: (args: Record<string, unknown>) => Promise<string>;
}

/** Cache for converted tool schemas to avoid repeated conversions */
const toolSchemaCache = new Map<string, CloudflareTool>();

/** Tool execution metrics */
export interface ToolMetrics {
  toolName: string;
  executionTimeMs: number;
  success: boolean;
  error?: string;
  timedOut?: boolean;
}

/** Collected metrics for current request */
let currentRequestMetrics: ToolMetrics[] = [];

/** Get and reset metrics for current request */
export function getAndResetToolMetrics(): ToolMetrics[] {
  const metrics = [...currentRequestMetrics];
  currentRequestMetrics = [];
  return metrics;
}

/** Conditional logger that respects verbose flag */
function createLogger(verbose: boolean) {
  return {
    debug: (...args: unknown[]) => verbose && console.log(...args),
    info: (...args: unknown[]) => console.log(...args),
    error: (...args: unknown[]) => console.error(...args),
  };
}

/** Global verbose flag - set via FunctionCallingService config */
let globalVerbose = false;

/**
 * Execute a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, toolName: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Tool ${toolName} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Convert MCP tool to Cloudflare function calling format
 * Uses type assertions since MCP tool schemas are JSON Schema compatible
 * Results are cached to avoid repeated conversions
 */
function mcpToolToCloudflareFormat(tool: MCPTool): CloudflareTool {
  // Check cache first
  const cached = toolSchemaCache.get(tool.name);
  if (cached) {
    return cached;
  }

  // MCP tools use JSON Schema which should have type: 'object'
  // Cast through unknown to satisfy strict Cloudflare types
  const inputSchema = tool.inputSchema as unknown as {
    type: 'object';
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };

  const converted = {
    name: tool.name,
    description: tool.description,
    parameters: {
      type: 'object' as const,
      properties: inputSchema.properties || {},
      required: inputSchema.required || [],
    },
    // Cloudflare expects Promise<string>, so we stringify the result
    // Wrapped with timeout to prevent runaway executions
    function: async (args: Record<string, unknown>): Promise<string> => {
      const startTime = Date.now();
      const metrics: ToolMetrics = {
        toolName: tool.name,
        executionTimeMs: 0,
        success: false,
      };

      try {
        const result = await withTimeout(tool.execute(args), TOOL_EXECUTION_TIMEOUT_MS, tool.name);
        metrics.executionTimeMs = Date.now() - startTime;
        metrics.success = true;
        currentRequestMetrics.push(metrics);
        return typeof result === 'string' ? result : JSON.stringify(result);
      } catch (error) {
        metrics.executionTimeMs = Date.now() - startTime;
        metrics.success = false;
        metrics.error = error instanceof Error ? error.message : 'Unknown error';
        metrics.timedOut = error instanceof Error && error.message.includes('timed out');
        currentRequestMetrics.push(metrics);

        if (globalVerbose) {
          console.error(`Tool ${tool.name} execution error:`, error);
        }
        return JSON.stringify({
          error: true,
          message: metrics.error,
          timedOut: metrics.timedOut,
        });
      }
    },
  };

  // Cache the converted tool schema
  toolSchemaCache.set(tool.name, converted);
  return converted;
}

/**
 * Extract model changes from tool results for GUI updates
 * Uses centralized tool metadata to know which fields to extract
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

      // Use centralized metadata to extract tool-specific output fields
      const meta = getToolMetadata(call.toolName);
      if (meta.outputFields) {
        for (const field of meta.outputFields) {
          if (field in result) {
            changes[field] = result[field];
          }
        }
      }
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}

/**
 * Pre-filter tools based on user message to reduce token usage
 * Uses centralized tool metadata for keywords (single source of truth)
 */
function preFilterTools(tools: MCPTool[], userMessage: string): MCPTool[] {
  const message = userMessage.toLowerCase();

  // Score each tool based on keyword matches from centralized metadata
  const scoredTools = tools.map((tool) => {
    const meta = getToolMetadata(tool.name);
    const keywords = meta.keywords;
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
  const filtered = sorted.filter((t) => t.score > 0);
  const result =
    filtered.length > 0
      ? filtered.slice(0, 8).map((t) => t.tool) // Max 8 relevant tools
      : sorted.slice(0, 5).map((t) => t.tool); // Fallback to top 5

  // Only log in verbose mode
  if (globalVerbose) {
    console.log('[preFilterTools] User message:', userMessage.substring(0, 100));
    console.log(
      '[preFilterTools] Tools with scores:',
      sorted.slice(0, 10).map((t) => `${t.tool.name}:${t.score}`)
    );
    console.log(
      '[preFilterTools] Selected tools:',
      result.map((t) => t.name)
    );
  }
  return result;
}

/** Filter model-visible tools through the same policy used by MCP. */
export function filterAuthorizedMCPTools(
  tools: MCPTool[],
  authorization: MCPAuthorizationContext = DEFAULT_FUNCTION_CALLING_AUTHORIZATION
): MCPTool[] {
  return tools.filter((tool) => authorizeMCPCapability(tool.name, authorization).allowed);
}

/**
 * Function Calling Service class
 */
export class FunctionCallingService {
  private config: FunctionCallingConfig;
  private log: ReturnType<typeof createLogger>;

  constructor(
    private ai: Ai,
    config?: Partial<FunctionCallingConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.log = createLogger(this.config.verbose ?? false);
    // Set global verbose for helper functions
    globalVerbose = this.config.verbose ?? false;
  }

  /**
   * Execute a chat with function calling support
   */
  async chat(
    messages: FunctionCallingMessage[],
    tools: MCPTool[],
    systemPrompt?: string,
    authorization: MCPAuthorizationContext = DEFAULT_FUNCTION_CALLING_AUTHORIZATION
  ): Promise<FunctionCallingResponse> {
    const toolCalls: ToolCallResult[] = [];
    const authorizedTools = filterAuthorizedMCPTools(tools, authorization);

    // Build messages array with system prompt
    const fullMessages: FunctionCallingMessage[] = [];
    if (systemPrompt) {
      fullMessages.push({ role: 'system', content: systemPrompt });
    }
    fullMessages.push(...messages);

    // Pre-filter tools based on user message to stay within context limits
    const userMessage = messages.find((m) => m.role === 'user')?.content || '';
    const filteredTools = preFilterTools(authorizedTools, userMessage);
    this.log.debug(
      `[FunctionCallingService] Filtered from ${tools.length} to ${filteredTools.length} tools`
    );

    // Convert MCP tools to Cloudflare format
    const cloudflareTools = filteredTools.map(mcpToolToCloudflareFormat);

    // Add wrapper to track tool calls
    const trackedTools = cloudflareTools.map((tool) => ({
      ...tool,
      function: async (args: Record<string, unknown>) => {
        const decision = authorizeMCPCapability(tool.name, authorization);
        if (!decision.allowed) {
          throw new MCPAuthorizationError(tool.name);
        }
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
      // Debug: Log tools and messages (only in verbose mode)
      this.log.debug('[FunctionCallingService] tools count:', tools.length);
      this.log.debug('[FunctionCallingService] cloudflareTools count:', cloudflareTools.length);
      this.log.debug('[FunctionCallingService] trackedTools count:', trackedTools.length);

      // Validate AI binding
      this.log.debug('[FunctionCallingService] ai binding exists:', !!this.ai);
      this.log.debug('[FunctionCallingService] ai binding type:', typeof this.ai);
      if (!this.ai) {
        throw new Error('AI binding is undefined - check worker bindings');
      }

      // Log first few tools in detail for debugging (only in verbose mode)
      if (this.config.verbose && trackedTools.length > 0) {
        const firstTool = trackedTools[0];
        if (firstTool) {
          this.log.debug(
            '[FunctionCallingService] first tool structure:',
            JSON.stringify({
              name: firstTool.name,
              description: firstTool.description?.substring(0, 50),
              hasFunction: typeof firstTool.function === 'function',
              hasParameters: !!firstTool.parameters,
              parametersType: firstTool.parameters?.type,
              hasProperties: !!firstTool.parameters?.properties,
              propertiesKeys: firstTool.parameters?.properties
                ? Object.keys(firstTool.parameters.properties).slice(0, 5)
                : [],
            })
          );
        }
      }

      this.log.debug('[FunctionCallingService] messages count:', fullMessages.length);
      this.log.debug('[FunctionCallingService] first message role:', fullMessages[0]?.role);

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
      if (authorizedTools.length > 3) {
        options.trimFunction = autoTrimTools;
      }

      this.log.debug('[FunctionCallingService] options:', JSON.stringify(options));

      // Prepare input for runWithTools
      const runWithToolsInput = {
        messages: fullMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: trackedTools,
      };

      this.log.debug(
        '[FunctionCallingService] calling runWithTools with model:',
        FUNCTION_CALLING_MODEL
      );
      this.log.debug(
        '[FunctionCallingService] input messages length:',
        runWithToolsInput.messages.length
      );
      this.log.debug(
        '[FunctionCallingService] input tools length:',
        runWithToolsInput.tools.length
      );

      // Use runWithTools for embedded function calling
      const aiResponse = await runWithTools(
        this.ai,
        FUNCTION_CALLING_MODEL,
        runWithToolsInput,
        options
      );

      this.log.debug('[FunctionCallingService] runWithTools response type:', typeof aiResponse);

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
      this.log.error('Function calling error:', error);
      throw error;
    }
  }

  /**
   * Simple chat without function calling (fallback)
   */
  async simpleChat(messages: FunctionCallingMessage[], systemPrompt?: string): Promise<string> {
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

// Export internals for testing
export const __testing = {
  preFilterTools,
  filterAuthorizedMCPTools,
  extractModelChanges,
  withTimeout,
  TOOL_EXECUTION_TIMEOUT_MS,
};

/** Clear the tool schema cache (useful for testing) */
export function clearToolSchemaCache(): void {
  toolSchemaCache.clear();
}
