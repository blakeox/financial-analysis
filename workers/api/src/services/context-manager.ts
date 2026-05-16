/**
 * Context Manager Service
 * Builds enriched context for LLM calls from multiple sources
 */

import { buildPrompt } from '../prompts/prompt-templates';
import type { ToolSummary } from './types';
import { DocumentCache, type DocumentCacheConfig } from './document-cache';

const MAX_TOOL_SUMMARIES = 8;

export interface ContextBuilder {
  message: string;
  contextKey: string;
  contextData?: Record<string, unknown> | undefined;
  memoryContext?:
    | {
        conversationHistory?: string;
        modelStates?: string;
      }
    | undefined;
  availableTools?: ToolSummary[] | undefined;
  toolOutputs?: Record<string, unknown> | undefined;
  enableAutoRAG?: boolean | undefined;
  requestId?: string | undefined;
  negative_constraints?: string[] | undefined;
}

export interface BuiltContext {
  prompt: string;
  systemPrompt?: string | undefined;
  cacheKey?: string | undefined;
  websiteContent?: string | undefined;
  metadata?:
    | {
        contextKey: string;
        hasWebsiteContent: boolean;
        hasConversationHistory: boolean;
        toolsAvailable: number;
        toolOutputsIncluded: number;
        autoragSource?: 'ai-search' | 'cache' | 'live' | 'none';
      }
    | undefined;
}

export class ContextManager {
  private documentCache?: DocumentCache;

  constructor(documentCacheConfig?: DocumentCacheConfig) {
    if (documentCacheConfig) {
      this.documentCache = new DocumentCache(documentCacheConfig);
    }
  }

  /**
   * Build enriched context for LLM
   */
  async build(builder: ContextBuilder): Promise<BuiltContext> {
    const {
      message,
      contextKey,
      contextData,
      memoryContext,
      availableTools,
      toolOutputs,
      negative_constraints,
    } = builder;

    // Start with base prompt
    let basePrompt = '';
    let systemPrompt: string | undefined;

    // Build context-aware prompt based on context key
    if (contextKey === 'startup-planning' && contextData) {
      const phaseData = contextData as {
        phase?: number;
        phaseName?: string;
        description?: string;
        keyFields?: string[];
        helpTopics?: string[];
        currentPhaseData?: Record<string, unknown>;
        previousPhases?: Record<string, unknown>;
      };

      const promptContext: Record<string, unknown> = {
        phase: phaseData.phase || 1,
        phaseName: phaseData.phaseName || 'Startup Planning',
        userMessage: message,
        availableFields: phaseData.keyFields || [],
        helpTopics: phaseData.helpTopics || [],
        negative_constraints,
      };

      // Add conversation history
      if (memoryContext?.conversationHistory) {
        promptContext.conversationHistory = memoryContext.conversationHistory;
      }

      // Add current phase data
      if (phaseData.currentPhaseData) {
        promptContext.currentPhaseData = phaseData.currentPhaseData;
      }

      // Add previous phases
      if (phaseData.previousPhases) {
        promptContext.previousPhases = phaseData.previousPhases;
      }

      // Filter and add relevant tools
      const relevantTools = this.prepareToolList('startup-planning', availableTools);
      if (relevantTools.length > 0) {
        promptContext.availableTools = relevantTools;
      }

      // Build prompt from template
      const fullPrompt = buildPrompt('startupPlanningAssistant', promptContext);

      // Split into system and user
      const split = this.splitPrompt(fullPrompt);
      systemPrompt = split.systemPrompt;
      basePrompt = split.userPrompt;
    } else if (contextKey === 'mortgage-scenario-planning' && contextData) {
      // Mortgage Scenario Planner - CFP Assistant
      const mortgageData = contextData as {
        calculatorType?: string;
        calculatorName?: string;
        currentFormData?: Record<string, unknown>;
        results?: Record<string, unknown>;
        formData?: Record<string, unknown>;
        cfpGuidance?: string[];
      };

      const promptContext: Record<string, unknown> = {
        userMessage: message,
        calculatorName: mortgageData.calculatorName || 'Mortgage Scenario Planner',
        negative_constraints,
      };

      // Add form data if available
      if (mortgageData.currentFormData) {
        promptContext.currentFormData = mortgageData.currentFormData;
      }

      const mortgageTools = this.prepareToolList('mortgage', availableTools);
      if (mortgageTools.length > 0) {
        promptContext.availableTools = mortgageTools;
      }

      // Add results if available
      if (mortgageData.results) {
        promptContext.results = mortgageData.results;
      }

      // Add conversation history
      if (memoryContext?.conversationHistory) {
        promptContext.conversationHistory = memoryContext.conversationHistory;
      }

      // Build prompt from CFP template
      const fullPrompt = buildPrompt('mortgageScenarioCFP', promptContext);
      const split = this.splitPrompt(fullPrompt);
      systemPrompt = split.systemPrompt;
      basePrompt = split.userPrompt;
    } else if (contextKey === 'general' || !contextKey) {
      // General context - use chat assistant template
      // Include available tools so AI can intelligently decide when to use them
      const promptContext: Record<string, unknown> = {
        userMessage: message,
        availableTools: this.prepareToolList('general', availableTools),
        negative_constraints,
        ...contextData, // Include contextData (e.g. currentModel)
      };

      if (memoryContext?.conversationHistory) {
        promptContext.conversationHistory = memoryContext.conversationHistory;
      }

      const fullPrompt = buildPrompt('chatAssistant', promptContext);
      const split = this.splitPrompt(fullPrompt);
      systemPrompt = split.systemPrompt;
      basePrompt = split.userPrompt;
    } else {
      // Calculator-specific contexts - use calculator assistant template
      // This gives AI context about calculator families and how to help
      const promptContext: Record<string, unknown> = {
        userMessage: message,
        calculatorContext: contextKey,
        availableTools: this.prepareToolList(contextKey, availableTools),
        negative_constraints,
        ...contextData, // Include contextData (e.g. currentModel)
      };

      if (memoryContext?.conversationHistory) {
        promptContext.conversationHistory = memoryContext.conversationHistory;
      }

      const fullPrompt = buildPrompt('calculatorAssistant', promptContext);
      const split = this.splitPrompt(fullPrompt);
      systemPrompt = split.systemPrompt;
      basePrompt = split.userPrompt;
    }

    // Retrieve website content via AutoRAG if enabled
    let websiteContent: string | undefined;
    let autoragSource: 'ai-search' | 'cache' | 'live' | 'none' = 'none';

    if (builder.enableAutoRAG && this.documentCache) {
      try {
        // Prefer managed AI Search when configured, otherwise fall back to the legacy cache path.
        const { documents: searchResults, source } = await this.documentCache.searchWithSource(
          message,
          3
        );

        if (searchResults.length > 0) {
          // Format cached results
          const formattedResults = searchResults
            .map((doc, idx) => {
              const title = doc.metadata?.title || 'Cached Content';
              const preview = doc.content.substring(0, 500);
              return `${idx + 1}. **${title}** (${doc.url})\n   ${preview}${doc.content.length > 500 ? '...' : ''}`;
            })
            .join('\n\n');

          websiteContent = `\n\nRelevant information from our website:\n${formattedResults}\n\nUse this information to provide specific, cited guidance.`;
          autoragSource = source;
        }
      } catch (error) {
        // AutoRAG failed, continue without website content
        console.warn('AutoRAG document search failed:', error);
      }
    }

    // Add website content to prompt if available
    if (websiteContent) {
      basePrompt += websiteContent;
    }

    const { sectionText: toolOutputsSection, entryCount: toolOutputsCount } =
      this.buildToolOutputsSection(toolOutputs);
    if (toolOutputsSection) {
      basePrompt += toolOutputsSection;
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(contextKey, message, contextData, toolOutputs);

    return {
      prompt: basePrompt,
      systemPrompt,
      cacheKey,
      websiteContent,
      metadata: {
        contextKey,
        hasWebsiteContent: !!websiteContent,
        hasConversationHistory: !!memoryContext?.conversationHistory,
        toolsAvailable: availableTools?.length || 0,
        toolOutputsIncluded: toolOutputsCount,
        autoragSource,
      },
    };
  }

  /**
   * Split prompt into system and user parts
   */
  private splitPrompt(prompt: string): { systemPrompt?: string | undefined; userPrompt: string } {
    const lines = prompt.split('\n');

    let systemEndIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = (lines[i] || '').toLowerCase();
      // Look for transition markers
      if (
        line.includes('user question:') ||
        line.includes('user message:') ||
        line.includes('context:')
      ) {
        systemEndIndex = i;
        break;
      }
    }

    if (systemEndIndex > 0) {
      const systemLines = lines.slice(0, systemEndIndex);
      const userLines = lines.slice(systemEndIndex);
      const systemPrompt = systemLines.join('\n').trim();

      return {
        systemPrompt: systemPrompt || undefined,
        userPrompt: userLines.join('\n').trim(),
      };
    }

    return {
      userPrompt: prompt.trim(),
    };
  }

  /**
   * Generate cache key from context
   */
  private generateCacheKey(
    contextKey: string,
    message: string,
    contextData?: Record<string, unknown>,
    toolOutputs?: Record<string, unknown>
  ): string {
    // Create deterministic cache key
    const messageHash = message.substring(0, 100); // First 100 chars
    const dataHash = contextData ? JSON.stringify(contextData).substring(0, 50) : '';
    const toolOutputsHash = toolOutputs ? JSON.stringify(toolOutputs).substring(0, 50) : '';

    // Include prompt version to bust cache when prompts are updated
    // Change this version number whenever system prompts are significantly updated
    const promptVersion = 'v7'; // Updated 2026-02-14: Tool outputs included and prompt context enriched

    return `${promptVersion}:${contextKey}:${messageHash}:${dataHash}:${toolOutputsHash}`;
  }

  /**
   * Build a readable summary of recent tool outputs for the prompt
   */
  private buildToolOutputsSection(toolOutputs?: Record<string, unknown>): {
    sectionText?: string;
    entryCount: number;
  } {
    if (!toolOutputs || typeof toolOutputs !== 'object') {
      return { entryCount: 0 };
    }

    const entries = Object.entries(toolOutputs).filter(
      ([, value]) => value !== undefined && value !== null
    );

    if (entries.length === 0) {
      return { entryCount: 0 };
    }

    const formattedEntries = entries.map(([toolName, value]) => {
      const safeName = toolName || 'Unnamed Tool';
      const { payload, metadata } = this.formatToolOutputValue(value);
      return `- ${safeName}${metadata}: ${payload}`;
    });

    return {
      entryCount: entries.length,
      sectionText: `\n\n**Recent MCP Tool Outputs:**\n${formattedEntries.join(
        '\n'
      )}\n\nUse these validated results to ground your response.`,
    };
  }

  /**
   * Format tool output payloads in a compact, readable way
   */
  private formatToolOutputValue(value: unknown): { payload: string; metadata: string } {
    if (value === null) {
      return {
        payload: 'No data returned.',
        metadata: ' (MCP verified result)',
      };
    }

    if (typeof value === 'string') {
      return {
        payload: this.truncate(value.trim(), 500),
        metadata: ' (MCP verified result)',
      };
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return {
        payload: String(value),
        metadata: ' (MCP verified result)',
      };
    }

    try {
      const serialized = JSON.stringify(value, null, 2);
      const metadata = this.buildToolOutputMetadata(value);
      return {
        payload: this.truncate(serialized, 500),
        metadata,
      };
    } catch {
      return {
        payload: '[Unserializable tool output]',
        metadata: ' (MCP verified result)',
      };
    }
  }

  private buildToolOutputMetadata(value: unknown): string {
    if (!value || typeof value !== 'object') {
      return ' (MCP verified result)';
    }

    const record = value as Record<string, unknown>;
    const generatedAt = record.generatedAt;
    if (typeof generatedAt === 'string') {
      return ` (MCP verified result • generated ${generatedAt})`;
    }

    return ' (MCP verified result)';
  }

  private truncate(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }
    return `${value.substring(0, maxLength)}…`;
  }

  private prepareToolList(contextKey: string, availableTools?: ToolSummary[]): ToolSummary[] {
    if (!availableTools || availableTools.length === 0) {
      return [];
    }

    const normalizedKey = contextKey.toLowerCase();
    const tokens = normalizedKey.split(/[\s_-]+/).filter(Boolean);

    const candidates = availableTools.filter((tool) => {
      if (normalizedKey === 'general') {
        return true;
      }
      const toolName = tool.name.toLowerCase();
      const toolDescription = tool.description.toLowerCase();
      return tokens.some((token) => toolName.includes(token) || toolDescription.includes(token));
    });

    const list = candidates.length > 0 ? candidates : availableTools;
    return list.slice(0, MAX_TOOL_SUMMARIES);
  }
}
