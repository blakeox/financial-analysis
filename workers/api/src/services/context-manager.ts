/**
 * Context Manager Service
 * Builds enriched context for LLM calls from multiple sources
 */

// @ts-ignore - Cloudflare Workers types
import type { Ai } from '@cloudflare/workers-types';
import { buildPrompt } from '../prompts/prompt-templates';
import type { ToolSummary } from './intent-detector';

export interface ContextBuilder {
  message: string;
  contextKey: string;
  contextData?: Record<string, unknown> | undefined;
  memoryContext?: {
    conversationHistory?: string;
    modelStates?: string;
  } | undefined;
  availableTools?: ToolSummary[] | undefined;
  enableAutoRAG?: boolean | undefined;
  requestId?: string | undefined;
}

export interface BuiltContext {
  prompt: string;
  systemPrompt?: string | undefined;
  cacheKey?: string | undefined;
  websiteContent?: string | undefined;
  metadata?: {
    contextKey: string;
    hasWebsiteContent: boolean;
    hasConversationHistory: boolean;
    toolsAvailable: number;
  } | undefined;
}

export class ContextManager {
  constructor(
    private ai?: Ai,
    private autoRAGInstanceId?: string
  ) {}

  /**
   * Build enriched context for LLM
   */
  async build(builder: ContextBuilder): Promise<BuiltContext> {
    const { message, contextKey, contextData, memoryContext, availableTools } = builder;

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
      if (availableTools && availableTools.length > 0) {
        const relevantTools = availableTools
          .filter(tool => {
            const toolName = tool.name.toLowerCase();
            return toolName.includes('cash') || 
                   toolName.includes('ebitda') || 
                   toolName.includes('budget') ||
                   toolName.includes('journey') ||
                   toolName.includes('forecast');
          })
          .map(t => ({
            name: t.name,
            description: t.description
          }));

        if (relevantTools.length > 0) {
          promptContext.relevantTools = relevantTools;
        }
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
        currentFormData?: any;
        results?: any;
        formData?: any;
        cfpGuidance?: string[];
      };

      const promptContext: Record<string, unknown> = {
        userMessage: message,
        calculatorName: mortgageData.calculatorName || 'Mortgage Scenario Planner',
      };

      // Add form data if available
      if (mortgageData.currentFormData) {
        promptContext.currentFormData = mortgageData.currentFormData;
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
      const fullPrompt = buildPrompt('chatAssistant', {
        userMessage: message,
        availableTools: availableTools || [],
      });
      const split = this.splitPrompt(fullPrompt);
      systemPrompt = split.systemPrompt;
      basePrompt = split.userPrompt;

    } else {
      // Calculator-specific contexts - use calculator assistant template
      // This gives AI context about calculator families and how to help
      const fullPrompt = buildPrompt('calculatorAssistant', {
        userMessage: message,
        calculatorContext: contextKey,
      });
      const split = this.splitPrompt(fullPrompt);
      systemPrompt = split.systemPrompt;
      basePrompt = split.userPrompt;
    }

    // Retrieve website content via AutoRAG if enabled
    let websiteContent: string | undefined;
    if (builder.enableAutoRAG && this.ai && this.autoRAGInstanceId) {
      try {
        const aiAutorag = this.ai.autorag(this.autoRAGInstanceId);
        const websiteResponse = await aiAutorag.aiSearch({ query: message });
        
        // Parse AutoRAG results
        if (websiteResponse && typeof websiteResponse === 'object' && !(websiteResponse instanceof Response)) {
          const responseAny = websiteResponse as any;
          let websiteResults: any[] = [];
          
          if (Array.isArray(responseAny.results)) {
            websiteResults = responseAny.results;
          } else if (Array.isArray(responseAny.data)) {
            websiteResults = responseAny.data;
          } else if (Array.isArray(responseAny)) {
            websiteResults = responseAny;
          }

          if (websiteResults.length > 0) {
            const formattedResults = websiteResults
              .map((result: any, idx: number) => {
                const url = result.url || 'Unknown URL';
                const content = result.content || result.text || '';
                const title = result.metadata?.title || 'Page Content';
                
                return `${idx + 1}. **${title}** (${url})\n   ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`;
              })
              .join('\n\n');
            
            websiteContent = `\n\nRelevant information from our website:\n${formattedResults}\n\nUse this information to provide specific, cited guidance.`;
          }
        }
      } catch (error) {
        // AutoRAG failed, continue without website content
        console.warn('AutoRAG failed:', error);
      }
    }

    // Add website content to prompt if available
    if (websiteContent) {
      basePrompt += websiteContent;
    }

    // Generate cache key
    const cacheKey = this.generateCacheKey(contextKey, message, contextData);

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
      if (line.includes('user question:') || line.includes('user message:') || line.includes('context:')) {
        systemEndIndex = i;
        break;
      }
    }

    if (systemEndIndex > 0 && systemEndIndex < lines.length - 1) {
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
    contextData?: Record<string, unknown>
  ): string {
    // Create deterministic cache key
    const messageHash = message.substring(0, 100); // First 100 chars
    const dataHash = contextData ? JSON.stringify(contextData).substring(0, 50) : '';
    
    // Include prompt version to bust cache when prompts are updated
    // Change this version number whenever system prompts are significantly updated
    const promptVersion = 'v3'; // Updated 2025-11-03: Dynamic MCP tool discovery + ChatGPT-style intelligent tool calling
    
    return `${promptVersion}:${contextKey}:${messageHash}:${dataHash}`;
  }
}

