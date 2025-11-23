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
}

export class LLMOrchestrator {
  private llm: LLMService;
  private contextManager: ContextManager;
  private toolSelector: IntelligentToolSelector;

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
      toolOutputs = {},
      memoryContext,
      requestId,
      contextLabel,
      negative_constraints,
    } = request;

    // PII Redaction (Phase 2.2)
    const sanitizedMessage = PIIRedactor.redact(message);

    // NEW: Skip keyword-based intent detection, let LLM do semantic matching
    // The LLM sees available tools and intelligently decides if/when to call them
    // This enables natural language variations like:
    // - "What's my monthly payment?" → analyze_amortization
    // - "Project my revenue" → ebitda_forecasting
    // - "How do I pay off debt faster?" → analyze_debt_payoff
    
    return await this.handleLLMQuestion(
      sanitizedMessage,
      context,
      contextData,
      availableTools,
      toolOutputs,
      memoryContext,
      requestId,
      currentModel,
      contextLabel,
      negative_constraints
    );
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
      toolOutputs = {},
      memoryContext,
      requestId,
      contextLabel,
    } = request;

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
