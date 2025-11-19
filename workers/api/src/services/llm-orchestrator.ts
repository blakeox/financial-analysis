/**
 * LLM Orchestrator
 * Coordinates LLM services and handles request routing
 */

// @ts-expect-error - Cloudflare Workers types
import type { Ai } from '@cloudflare/workers-types';
import type { ContextManager } from './context-manager';
import { ContextManager as ContextManagerImpl } from './context-manager';
import type { ToolSummary } from './types';
import type { LLMService, LLMRequest } from './llm-service';
import { LLMService as LLMServiceImpl } from './llm-service';
import { IntelligentCache as IntelligentCacheImpl } from './llm-cache';
import { LLMRetryHandler as LLMRetryHandlerImpl } from './llm-retry';
import { LLMMetricsCollector as LLMMetricsCollectorImpl } from './llm-metrics';

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

export interface OrchestratorConfig {
  enableAutoRAG?: boolean;
  autoRAGInstanceId?: string;
  enableCaching?: boolean;
  enableRetry?: boolean;
  enableMetrics?: boolean;
}

export class LLMOrchestrator {
  private llm: LLMService;
  private contextManager: ContextManager;

  constructor(
    ai: Ai,
    private env: { 
      KV?: any; 
      DOCUMENTS?: R2Bucket;
      VECTORIZE?: any;
    },
    config?: OrchestratorConfig
  ) {
    // Initialize services
    const cache = env.KV ? new IntelligentCacheImpl(env.KV) : undefined;
    const retry = new LLMRetryHandlerImpl();
    const metrics = env.KV ? new LLMMetricsCollectorImpl(env.KV) : undefined;

    this.llm = new LLMServiceImpl(ai, cache, retry, metrics);
    
    // Initialize context manager with document cache
    this.contextManager = new ContextManagerImpl(
      ai, 
      config?.autoRAGInstanceId,
      {
        r2Bucket: env.DOCUMENTS,
        vectorize: env.VECTORIZE,
        kv: env.KV,
      }
    );
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
    } = request;

    // NEW: Skip keyword-based intent detection, let LLM do semantic matching
    // The LLM sees available tools and intelligently decides if/when to call them
    // This enables natural language variations like:
    // - "What's my monthly payment?" → analyze_amortization
    // - "Project my revenue" → ebitda_forecasting
    // - "How do I pay off debt faster?" → analyze_debt_payoff
    
    return await this.handleLLMQuestion(
      message,
      context,
      contextData,
      availableTools,
      toolOutputs,
      memoryContext,
      requestId,
      currentModel,
      contextLabel
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
    contextLabel: string | null | undefined
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

    // Build context
    const builtContext = await this.contextManager.build({
      message,
      contextKey: context,
      contextData: effectiveContextData,
      memoryContext,
      availableTools,
      toolOutputs,
      enableAutoRAG: true,
      requestId,
    });

    // Call LLM
    const llmRequest: LLMRequest = {
      prompt: builtContext.prompt,
      systemPrompt: builtContext.systemPrompt,
      metadata: {
        requestId: requestId || undefined,
        context,
        cacheKey: builtContext.cacheKey,
      },
    };

    const llmResponse = await this.llm.chat(llmRequest);

    // Return response
    const toolingMetadata = {
      availableTools: availableTools.map((tool) => tool.name),
      toolOutputsIncluded: builtContext.metadata?.toolOutputsIncluded || 0,
      contextKey: context,
      hasWebsiteContent: builtContext.metadata?.hasWebsiteContent || false,
      hasConversationHistory: builtContext.metadata?.hasConversationHistory || false,
      cacheKey: builtContext.cacheKey,
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

}
