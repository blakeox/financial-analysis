/**
 * LLM Orchestrator
 * Coordinates LLM services and handles request routing
 */

import type { Ai } from '@cloudflare/workers-types';
import type { ContextManager } from './context-manager';
import { ContextManager as ContextManagerImpl } from './context-manager';
import type { ToolSummary } from './types';
import type { LLMService, LLMRequest } from './llm-service';
import { LLMService as LLMServiceImpl } from './llm-service';
import { IntelligentCache as IntelligentCacheImpl } from './llm-cache';
import { LLMRetryHandler as LLMRetryHandlerImpl } from './llm-retry';
import { LLMMetricsCollector as LLMMetricsCollectorImpl } from './llm-metrics';
import type { Env } from '../types';
import type { DocumentCacheConfig } from './document-cache';
import { IntelligentToolSelector } from './intelligent-tool-selection';
import { PIIRedactor } from './pii-redactor';
import { createMCPTools, type MCPTool } from '@financial-analysis/tools';
import { FunctionCallingService, createFunctionCallingService } from './llm-function-calling';

export interface OrchestrationRequest {
  message: string;
  context: string;
  contextData?: Record<string, unknown>;
  currentModel?: Record<string, unknown>;
  availableTools?: ToolSummary[];
  toolOutputs?: Record<string, unknown>;
  memoryContext?: {
    conversationHistory?: string;
    modelStates?: string;
  };
  requestId?: string;
  contextLabel?: string | null;
  negative_constraints?: string[];
  /** Enable function calling mode for tool execution */
  enableFunctionCalling?: boolean;
}

export interface ToolExecutionResult {
  toolName: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface OrchestrationResponse {
  response: string;
  toolUsed?: string | undefined;
  fromCache?: boolean | undefined;
  metadata?: {
    intent?: string | undefined;
    latency?: number | undefined;
    attempt?: number | undefined;
  } | undefined;
  tooling?: {
    availableTools: string[];
    toolOutputsIncluded: number;
    contextKey: string;
    hasWebsiteContent?: boolean;
    hasConversationHistory?: boolean;
    cacheKey?: string;
  };
  /** Results from function calling tool executions */
  functionCallingResults?: {
    toolsExecuted: ToolExecutionResult[];
    modelChanges?: Record<string, unknown>;
  };
}

export class LLMOrchestrator {
  private llm: LLMService;
  private contextManager: ContextManager;
  private toolSelector: IntelligentToolSelector;
  private functionCalling: FunctionCallingService;
  private mcpTools: MCPTool[];

  constructor(
    ai: Ai,
    env: Pick<Env, 'KV' | 'DOCUMENTS' | 'VECTORIZE'>
  ) {
    // Initialize services
    const cache = env.KV ? new IntelligentCacheImpl(env.KV) : undefined;
    const retry = new LLMRetryHandlerImpl();
    const metrics = env.KV ? new LLMMetricsCollectorImpl(env.KV) : undefined;

    this.llm = new LLMServiceImpl(ai, cache, retry, metrics);
    this.toolSelector = new IntelligentToolSelector(ai);
    
    // Initialize function calling service and MCP tools
    this.functionCalling = createFunctionCallingService(ai, {
      maxRecursiveToolRuns: 3,
      verbose: false,
    });
    this.mcpTools = createMCPTools();
    
    // Initialize context manager with document cache when bindings exist
    const docCacheConfig: DocumentCacheConfig = {};
    let hasDocCacheConfig = false;

    // Pass AI binding for embedding generation
    docCacheConfig.ai = ai;

    if (env.DOCUMENTS) {
      docCacheConfig.r2Bucket = env.DOCUMENTS;
      hasDocCacheConfig = true;
    }
    if (env.VECTORIZE) {
      docCacheConfig.vectorize = env.VECTORIZE;
      hasDocCacheConfig = true;
    }
    if (env.KV) {
      docCacheConfig.kv = env.KV;
      hasDocCacheConfig = true;
    }

    this.contextManager = new ContextManagerImpl(hasDocCacheConfig ? docCacheConfig : undefined);
  }

  /**
   * Main orchestration method
   */
  async handle(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const {
      message,
      context,
      contextData,
      currentModel = {},
      availableTools = [],
      toolOutputs: rawToolOutputs,
      memoryContext,
      requestId,
      contextLabel,
      negative_constraints,
      enableFunctionCalling = false,
    } = request;
    // Handle explicit null values (JS destructuring defaults don't apply to null)
    const toolOutputs = rawToolOutputs ?? {};

    // PII Redaction (Phase 2.2)
    const sanitizedMessage = PIIRedactor.redact(message);

    // Debug logging for function calling
    console.log('[LLMOrchestrator] enableFunctionCalling:', enableFunctionCalling);
    console.log('[LLMOrchestrator] availableTools.length:', availableTools.length);
    console.log('[LLMOrchestrator] mcpTools.length:', this.mcpTools.length);

    // Auto-load MCP tools when function calling is enabled but no tools provided
    // This allows the frontend to simply pass enableFunctionCalling: true
    const effectiveTools = availableTools.length > 0 
      ? availableTools 
      : enableFunctionCalling 
        ? this.mcpTools.map(t => ({ name: t.name, description: t.description }))
        : [];

    console.log('[LLMOrchestrator] effectiveTools.length:', effectiveTools.length);

    // Use function calling when:
    // 1. Explicitly enabled by the request
    // 2. Tools are available (either provided or auto-loaded)
    // 3. No tool outputs already provided (avoid re-executing)
    const shouldUseFunctionCalling = 
      enableFunctionCalling && 
      effectiveTools.length > 0 && 
      Object.keys(toolOutputs).length === 0;

    console.log('[LLMOrchestrator] shouldUseFunctionCalling:', shouldUseFunctionCalling);
    console.log('[LLMOrchestrator] toolOutputs keys:', Object.keys(toolOutputs).length);

    // DEBUG: Add debug info to response
    const debugInfo = {
      enableFunctionCalling,
      availableToolsLength: availableTools.length,
      effectiveToolsLength: effectiveTools.length,
      mcpToolsLength: this.mcpTools.length,
      toolOutputsLength: Object.keys(toolOutputs).length,
      shouldUseFunctionCalling,
    };

    if (shouldUseFunctionCalling) {
      const result = await this.handleWithFunctionCalling(
        sanitizedMessage,
        context,
        contextData,
        effectiveTools,
        memoryContext,
        requestId,
        currentModel,
        contextLabel
      );
      // Add debug info
      (result as unknown as Record<string, unknown>)._orchestratorDebug = debugInfo;
      return result;
    }

    // Fallback to standard LLM handling (context-based, no tool execution)
    const result = await this.handleLLMQuestion(
      sanitizedMessage,
      context,
      contextData,
      effectiveTools,
      toolOutputs,
      memoryContext,
      requestId,
      currentModel,
      contextLabel,
      negative_constraints
    );
    // Add debug info
    (result as unknown as Record<string, unknown>)._orchestratorDebug = debugInfo;
    return result;
  }

  /**
   * Handle request with function calling (tool execution enabled)
   */
  private async handleWithFunctionCalling(
    message: string,
    context: string,
    contextData: Record<string, unknown> | undefined,
    availableTools: ToolSummary[],
    memoryContext: { conversationHistory?: string; modelStates?: string } | undefined,
    requestId: string | undefined,
    currentModel: Record<string, unknown>,
    contextLabel: string | null | undefined
  ): Promise<OrchestrationResponse> {
    // Filter MCP tools to only those available for this request
    const availableToolNames = new Set(availableTools.map(t => t.name));
    const toolsForExecution = this.mcpTools.filter(t => availableToolNames.has(t.name));

    // Build system prompt with context about current model state
    const systemPrompt = this.buildFunctionCallingSystemPrompt(
      context,
      currentModel,
      contextLabel,
      contextData
    );

    // Build conversation messages
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    // Add conversation history if available
    if (memoryContext?.conversationHistory) {
      messages.push({
        role: 'system',
        content: `Previous conversation:\n${memoryContext.conversationHistory}`
      });
    }
    
    messages.push({ role: 'user', content: message });

    try {
      // Execute with function calling
      const fcResponse = await this.functionCalling.chat(messages, toolsForExecution, systemPrompt);

      // Build response with tool execution results
      const toolingMetadata: OrchestrationResponse['tooling'] = {
        availableTools: availableTools.map((tool) => tool.name),
        toolOutputsIncluded: fcResponse.toolCalls.length,
        contextKey: context,
        hasWebsiteContent: false,
        hasConversationHistory: !!memoryContext?.conversationHistory,
      };

      const response: OrchestrationResponse = {
        response: fcResponse.content,
        fromCache: false,
        tooling: toolingMetadata,
        metadata: {
          intent: 'function_calling',
        },
      };

      // Include function calling results if tools were executed
      if (fcResponse.toolCalls.length > 0) {
        response.toolUsed = fcResponse.toolCalls.map(tc => tc.toolName).join(', ');
        const functionResults: OrchestrationResponse['functionCallingResults'] = {
          toolsExecuted: fcResponse.toolCalls.map(tc => ({
            toolName: tc.toolName,
            arguments: tc.arguments,
            result: tc.result,
          })),
        };
        if (fcResponse.modelChanges) {
          functionResults.modelChanges = fcResponse.modelChanges;
        }
        response.functionCallingResults = functionResults;
      }

      return response;
    } catch (error) {
      console.error('Function calling error, falling back to standard LLM:', error);
      const errorDetails = {
        name: error instanceof Error ? error.name : 'unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      console.error('Error details:', errorDetails);
      // Fallback to standard handling on error
      const fallbackResult = await this.handleLLMQuestion(
        message,
        context,
        contextData,
        availableTools,
        {},
        memoryContext,
        requestId,
        currentModel,
        contextLabel,
        undefined
      );
      // Add error info to response for debugging
      (fallbackResult as unknown as Record<string, unknown>)._functionCallingError = {
        fellBackToStandard: true,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
      return fallbackResult;
    }
  }

  /**
   * Build system prompt for function calling
   */
  private buildFunctionCallingSystemPrompt(
    context: string,
    currentModel: Record<string, unknown>,
    contextLabel: string | null | undefined,
    contextData: Record<string, unknown> | undefined
  ): string {
    const parts: string[] = [
      'You are a financial analysis assistant with access to calculation tools.',
      '',
      'CRITICAL: You MUST use the provided tools for ANY financial calculation. Do NOT compute answers manually.',
      'When a user asks about bonds, loans, mortgages, leases, or any financial analysis - ALWAYS call the appropriate tool.',
      '',
      'Available tool categories:',
      '- Bond pricing: use analyze_bond_pricing',
      '- Auto loans: use analyze_auto_loan',
      '- Mortgages/amortization: use analyze_amortization',
      '- Leases: use analyze_lease or analyze_enhanced_lease',
      '- Cash flow/NPV/IRR: use analyze_cash_flow',
      '- Debt payoff: use analyze_debt_payoff',
      '- Options: use analyze_options_pricing',
      '',
      'After calling a tool, explain the results clearly to the user.',
    ];

    if (contextLabel) {
      parts.push(`\nCurrent context: ${contextLabel}`);
    }

    if (context && context !== 'general') {
      parts.push(`\nAnalysis type: ${context}`);
    }

    if (Object.keys(currentModel).length > 0) {
      parts.push(`\nCurrent model values:\n${JSON.stringify(currentModel, null, 2)}`);
    }

    if (contextData && Object.keys(contextData).length > 0) {
      parts.push(`\nAdditional context:\n${JSON.stringify(contextData, null, 2)}`);
    }

    return parts.join('\n');
  }

  /**
   * Handle LLM question intent
   */
  private async handleLLMQuestion(
    message: string,
    context: string,
    contextData: Record<string, unknown> | undefined,
    availableTools: ToolSummary[],
    toolOutputs: Record<string, unknown>,
    memoryContext: { conversationHistory?: string; modelStates?: string } | undefined,
    requestId: string | undefined,
    currentModel: Record<string, unknown>,
    contextLabel: string | null | undefined,
    negative_constraints: string[] | undefined
  ): Promise<OrchestrationResponse> {
    const mergedContextData: Record<string, unknown> = {
      ...(contextData || {}),
    };
    if (Object.keys(currentModel).length > 0) {
      mergedContextData.currentModel = currentModel;
    }
    if (contextLabel) {
      mergedContextData.contextLabel = contextLabel;
    }
    const effectiveContextData =
      Object.keys(mergedContextData).length > 0 ? mergedContextData : undefined;

    // Semantic Tool Selection (Phase 1.3)
    // Use lightweight LLM to filter available tools to only the most relevant ones
    let filteredTools = availableTools;
    if (availableTools.length > 0 && Object.keys(toolOutputs).length === 0) {
      try {
        const recommendation = await this.toolSelector.selectTools(
          message,
          availableTools,
          effectiveContextData
        );

        // Only filter if we have a primary tool and reasonable confidence (> 0.6)
        if (recommendation.primaryTool && recommendation.confidence > 0.6) {
          const keptTools = new Set([
            recommendation.primaryTool,
            ...(recommendation.secondaryTools || []),
          ]);
          filteredTools = availableTools.filter((t) => keptTools.has(t.name));
        }
      } catch (err) {
        console.warn('Tool selection failed, using all tools', err);
      }
    }

    // Build context
    const builtContext = await this.contextManager.build({
      message,
      contextKey: context,
      contextData: effectiveContextData,
      memoryContext,
      availableTools: filteredTools,
      toolOutputs,
      enableAutoRAG: true,
      requestId,
      negative_constraints,
    });

    // Call LLM
    const llmRequest: LLMRequest = {
      prompt: builtContext.prompt,
      systemPrompt: builtContext.systemPrompt,
      metadata: {
        requestId: requestId || undefined,
        context,
        ...(builtContext.cacheKey ? { cacheKey: builtContext.cacheKey } : {}),
      },
    };

    const llmResponse = await this.llm.chat(llmRequest);

    // Return response
    const toolingMetadata: OrchestrationResponse['tooling'] = {
      availableTools: availableTools.map((tool) => tool.name),
      toolOutputsIncluded: builtContext.metadata?.toolOutputsIncluded || 0,
      contextKey: context,
      hasWebsiteContent: builtContext.metadata?.hasWebsiteContent || false,
      hasConversationHistory: builtContext.metadata?.hasConversationHistory || false,
      ...(builtContext.cacheKey ? { cacheKey: builtContext.cacheKey } : {}),
    };

    const response: OrchestrationResponse = {
      response: llmResponse.content,
      fromCache: llmResponse.fromCache,
      tooling: toolingMetadata,
    };
    
    if (llmResponse.latency !== undefined || llmResponse.metadata?.attempt !== undefined) {
      response.metadata = {
        intent: 'llm_question',
        latency: llmResponse.latency || undefined,
        attempt: llmResponse.metadata?.attempt || undefined,
      };
    }
    
    return response;
  }

  /**
   * Stream orchestration response
   */
  async *stream(request: OrchestrationRequest): AsyncIterable<string> {
    const {
      message,
      context,
      contextData,
      currentModel = {},
      availableTools = [],
      toolOutputs: rawToolOutputs,
      memoryContext,
      requestId,
      contextLabel,
    } = request;
    // Handle explicit null values (JS destructuring defaults don't apply to null)
    const toolOutputs = rawToolOutputs ?? {};

    // PII Redaction (Phase 2.2)
    const sanitizedMessage = PIIRedactor.redact(message);

    const mergedContextData: Record<string, unknown> = {
      ...(contextData || {}),
    };
    if (Object.keys(currentModel).length > 0) {
      mergedContextData.currentModel = currentModel;
    }
    if (contextLabel) {
      mergedContextData.contextLabel = contextLabel;
    }
    const effectiveContextData =
      Object.keys(mergedContextData).length > 0 ? mergedContextData : undefined;

    // Semantic Tool Selection (Phase 1.3)
    // Use lightweight LLM to filter available tools to only the most relevant ones
    let filteredTools = availableTools;
    if (availableTools.length > 0 && Object.keys(toolOutputs).length === 0) {
      try {
        const recommendation = await this.toolSelector.selectTools(
          sanitizedMessage,
          availableTools,
          effectiveContextData
        );

        // Only filter if we have a primary tool and reasonable confidence (> 0.6)
        if (recommendation.primaryTool && recommendation.confidence > 0.6) {
          const keptTools = new Set([
            recommendation.primaryTool,
            ...(recommendation.secondaryTools || []),
          ]);
          filteredTools = availableTools.filter((t) => keptTools.has(t.name));
        }
      } catch (err) {
        console.warn('Tool selection failed, using all tools', err);
      }
    }

    // Build context
    const builtContext = await this.contextManager.build({
      message: sanitizedMessage,
      contextKey: context,
      contextData: effectiveContextData,
      memoryContext,
      availableTools: filteredTools,
      toolOutputs,
      enableAutoRAG: true,
      requestId,
    });

    // Call LLM Streaming
    const llmRequest: LLMRequest = {
      prompt: builtContext.prompt,
      systemPrompt: builtContext.systemPrompt,
      metadata: {
        requestId: requestId || undefined,
        context,
        ...(builtContext.cacheKey ? { cacheKey: builtContext.cacheKey } : {}),
      },
    };

    const stream = this.llm.chatStreaming(llmRequest);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }

}
