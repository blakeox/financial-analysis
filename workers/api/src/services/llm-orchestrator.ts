/**
 * LLM Orchestrator
 * Coordinates LLM services and handles request routing
 */

// @ts-ignore - Cloudflare Workers types
import type { Ai } from '@cloudflare/workers-types';
import { handleMCPRequest } from '@financial-analysis/tools';
import type { ContextManager } from './context-manager';
import { ContextManager as ContextManagerImpl } from './context-manager';
import type { IntentDetector, IntentDetection, ToolSummary } from './intent-detector';
import { IntentDetector as IntentDetectorImpl } from './intent-detector';
import type { LLMService, LLMRequest } from './llm-service';
import { LLMService as LLMServiceImpl } from './llm-service';
import { IntelligentCache as IntelligentCacheImpl } from './llm-cache';
import { LLMRetryHandler as LLMRetryHandlerImpl } from './llm-retry';
import { LLMMetricsCollector as LLMMetricsCollectorImpl } from './llm-metrics';
import { 
  formatMCPToolAnalysis
} from '../index';

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
}

export interface OrchestrationResponse {
  response: string;
  toolUsed?: string | undefined;
  modelChanges?: Record<string, unknown> | undefined;
  explanation?: string | undefined;
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
  private intentDetector: IntentDetector;

  constructor(
    ai: Ai,
    private env: { KV?: any },
    config?: OrchestratorConfig
  ) {
    // Initialize services
    const cache = env.KV ? new IntelligentCacheImpl(env.KV) : undefined;
    const retry = new LLMRetryHandlerImpl();
    const metrics = env.KV ? new LLMMetricsCollectorImpl(env.KV) : undefined;

    this.llm = new LLMServiceImpl(ai, cache, retry, metrics);
    this.contextManager = new ContextManagerImpl(ai, config?.autoRAGInstanceId);
    this.intentDetector = new IntentDetectorImpl();
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
    } = request;

    // NEW: Skip keyword-based intent detection, let LLM do semantic matching
    // The LLM sees available tools and intelligently decides if/when to call them
    // This enables natural language variations like:
    // - "What's my monthly payment?" → analyze_amortization
    // - "Project my revenue" → ebitda_forecasting
    // - "How do I pay off debt faster?" → analyze_debt_payoff
    
    // Check for explicit field updates first (these are simple pattern matches)
    if (['lease', 'amortization', 'ebitda', 'startup-planning'].includes(context)) {
      const fieldIntent = this.intentDetector.detectFieldUpdate(message.toLowerCase());
      if (fieldIntent && fieldIntent.confidence > 0.6) {
        return await this.handleFieldUpdate(
          fieldIntent,
          currentModel,
          context
        );
      }
    }

    // For everything else, let the LLM intelligently decide
    // It will see available tools and semantic match user intent
    return await this.handleLLMQuestion(
      message,
      context,
      contextData,
      availableTools,
      toolOutputs,
      memoryContext,
      requestId
    );
  }

  // LEGACY: handleToolCall removed - LLM now does semantic tool matching directly

  /**
   * Handle field update intent
   */
  private async handleFieldUpdate(
    intent: IntentDetection,
    currentModel: Record<string, unknown>,
    context: string
  ): Promise<OrchestrationResponse> {
    const parameters = intent.parameters || {};

    if (Object.keys(parameters).length === 0) {
      return {
        response: 'I couldn\'t determine what to update from your message. Could you be more specific?',
        modelChanges: {},
        metadata: { intent: 'field_update' },
      };
    }

    // Apply field mappings if needed
    const modelChanges = this.applyFieldMappings(parameters, context);

    // Generate explanation
    const explanation = this.generateFieldUpdateExplanation(parameters, currentModel);

    return {
      response: 'I\'ve updated the values as requested.',
      modelChanges,
      explanation,
      metadata: { intent: 'field_update' },
    };
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
    requestId: string | undefined
  ): Promise<OrchestrationResponse> {
    // Build context
    const builtContext = await this.contextManager.build({
      message,
      contextKey: context,
      contextData,
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

  /**
   * Apply field mappings based on context
   */
  private applyFieldMappings(
    parameters: Record<string, unknown>,
    context: string
  ): Record<string, unknown> {
    const fieldMappings: Record<string, Record<string, string>> = {
      lease: {
        interestRate: 'annualRate',
        leasePrincipal: 'principal',
        leaseTerm: 'termMonths',
        residual: 'residualValue',
      },
      amortization: {
        interestRate: 'annualRate',
        loanAmount: 'principal',
        term: 'termMonths',
      },
      ebitda: {
        initialRevenue: 'revenue',
        revenueGrowthRate: 'growthRate',
        expenses: 'expenses',
      },
    };

    const mapping = fieldMappings[context];
    if (!mapping) {
      return parameters;
    }

    const mapped: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parameters)) {
      const mappedKey = mapping[key] || key;
      mapped[mappedKey] = value;
    }

    return mapped;
  }

  /**
   * Generate explanation for field update
   */
  private generateFieldUpdateExplanation(
    parameters: Record<string, unknown>,
    currentModel: Record<string, unknown>
  ): string {
    // Get the first field being updated
    const fields = Object.keys(parameters);
    if (fields.length === 0) {
      return 'Field updated';
    }
    const field = fields[0];
    if (!field) {
      return 'Field updated';
    }
    const newValue = parameters[field];
    const oldValue = currentModel[field];

    if (oldValue !== undefined && newValue !== undefined) {
      return `Updated ${field} from ${oldValue} to ${newValue}`;
    }

    if (newValue !== undefined) {
      return `Set ${field} to ${newValue}`;
    }

    return 'Field updated';
  }

  /**
   * Get previous model state
   */
  private getPreviousModelState(
    toolName: string,
    memoryContext: { conversationHistory?: string; modelStates?: string } | undefined
  ): Record<string, unknown> | undefined {
    if (!memoryContext?.modelStates) {
      return undefined;
    }

    try {
      const modelStates = JSON.parse(memoryContext.modelStates);
      return modelStates[toolName];
    } catch {
      return undefined;
    }
  }
}
