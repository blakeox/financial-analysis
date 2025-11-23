/**
 * LLM Service
 * Unified service for all LLM operations with caching, retry logic, and metrics
 */

import type { Ai } from '@cloudflare/workers-types';
import { estimateTokens } from '../utils/tokens';
import type { IntelligentCache } from './llm-cache';
import type { LLMRetryHandler } from './llm-retry';
import type { LLMMetricsCollector } from './llm-metrics';

export interface LLMRequest {
  prompt: string;
  model?: string | undefined;
  temperature?: number | undefined;
  maxTokens?: number | undefined;
  stream?: boolean | undefined;
  systemPrompt?: string | undefined;
  metadata?: {
    requestId?: string | undefined;
    context?: string | undefined;
    intent?: string | undefined;
    cacheKey?: string | undefined;
  } | undefined;
}

export interface LLMResponse {
  content: string;
  fromCache?: boolean | undefined;
  tokensUsed?: {
    prompt: number;
    response: number;
    total: number;
  } | undefined;
  latency?: number | undefined;
  metadata?: {
    model: string;
    requestId: string;
    attempt?: number | undefined;
  } | undefined;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
  metadata?: {
    model: string;
    requestId: string;
  };
}

export interface LLMConfig {
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  cacheEnabled: boolean;
  cacheTTL: number;
  retryEnabled: boolean;
  metricsEnabled: boolean;
}

const DEFAULT_CONFIG: LLMConfig = {
  defaultModel: '@cf/meta/llama-3.1-8b-instruct',
  defaultTemperature: 0.7,
  defaultMaxTokens: 2048,
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour
  retryEnabled: true,
  metricsEnabled: true,
};

export class LLMService {
  private config: LLMConfig;

  constructor(
    private ai: Ai,
    private cache?: IntelligentCache,
    private retry?: LLMRetryHandler,
    private metrics?: LLMMetricsCollector,
    config?: Partial<LLMConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main chat method - handles caching, retry, and metrics
   */
  async chat(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    const requestId = request.metadata?.requestId || crypto.randomUUID();
    const model = request.model || this.config.defaultModel;
    const temperature = request.temperature ?? this.config.defaultTemperature;
    const maxTokens = request.maxTokens || this.config.defaultMaxTokens;

    // Build full prompt with system message if provided
    const fullPrompt = this.buildPrompt(request);

    // Try cache first
    if (this.config.cacheEnabled && this.cache && request.metadata?.cacheKey) {
      try {
        const cached = await this.cache.get(request.metadata.cacheKey);
        if (cached && cached.value) {
          const latency = Date.now() - startTime;
          
          // Record cache hit metrics
          if (this.config.metricsEnabled && this.metrics) {
            await this.metrics.recordRequest({
              requestId,
              timestamp: startTime,
              model: 'cache',
              promptTokens: 0,
              responseTokens: 0,
              totalTokens: 0,
              latency,
              cacheHit: true,
              success: true,
              retryCount: 0,
              intent: request.metadata.intent || undefined,
            });
          }

          return {
            content: String(cached.value),
            fromCache: true,
            latency,
            metadata: { model: 'cache', requestId },
          };
        }
      } catch (error) {
        // Cache error, continue with LLM call
        console.warn('Cache error:', error);
      }
    }

    // Estimate tokens for metrics
    const promptTokens = estimateTokens(fullPrompt);

    // Call LLM with retry logic
    let llmResponse: string;
    let attempt = 0;

    if (this.config.retryEnabled && this.retry) {
      llmResponse = await this.retry.callWithRetry(
        async () => {
          attempt++;
          return await this.callAI(model, fullPrompt, temperature, maxTokens);
        },
        {
          onRetry: (retryAttempt, error) => {
            console.warn(`LLM retry attempt ${retryAttempt}:`, error.message);
          },
        }
      );
    } else {
      attempt = 1;
      llmResponse = await this.callAI(model, fullPrompt, temperature, maxTokens);
    }

    const latency = Date.now() - startTime;
    const responseTokens = estimateTokens(llmResponse);
    const totalTokens = promptTokens + responseTokens;

    // Record metrics
    if (this.config.metricsEnabled && this.metrics) {
      await this.metrics.recordRequest({
        requestId,
        timestamp: startTime,
        model,
        promptTokens,
        responseTokens,
        totalTokens,
        latency,
        cacheHit: false,
        success: true,
        retryCount: attempt - 1,
        intent: request.metadata?.intent,
      });
    }

    // Cache the response
    if (this.config.cacheEnabled && this.cache && request.metadata?.cacheKey) {
      try {
        await this.cache.set(request.metadata.cacheKey, llmResponse, this.config.cacheTTL);
      } catch (error) {
        // Cache error, continue
        console.warn('Cache set error:', error);
      }
    }

    return {
      content: llmResponse,
      fromCache: false,
      tokensUsed: {
        prompt: promptTokens,
        response: responseTokens,
        total: totalTokens,
      },
      latency,
      metadata: {
        model,
        requestId,
        attempt,
      },
    };
  }

  /**
   * Streaming chat
   */
  async *chatStreaming(request: LLMRequest): AsyncIterable<LLMStreamChunk> {
    const requestId = request.metadata?.requestId || crypto.randomUUID();
    const model = request.model || this.config.defaultModel;
    const temperature = request.temperature ?? this.config.defaultTemperature;
    const maxTokens = request.maxTokens || this.config.defaultMaxTokens;

    const fullPrompt = this.buildPrompt(request);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = this.ai as any;

    try {
      const stream = await ai.run(model, {
        prompt: fullPrompt,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const chunk of stream) {
        // Cloudflare AI stream chunks usually have a 'response' property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = (chunk as any).response;
        if (text) {
          yield {
            content: text,
            done: false,
            metadata: { model, requestId },
          };
        }
      }

      yield {
        content: '',
        done: true,
        metadata: { model, requestId },
      };
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }
  }

  /**
   * Build full prompt from system and user prompts
   */
  private buildPrompt(request: LLMRequest): string {
    if (request.systemPrompt) {
      return `${request.systemPrompt}\n\n${request.prompt}`;
    }
    return request.prompt;
  }

  /**
   * Make the actual AI call
   */
  private async callAI(
    model: string,
    prompt: string,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    // Call Cloudflare Workers AI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ai = this.ai as any;
    const response = await ai.run(model, {
      prompt,
      temperature,
      max_tokens: maxTokens,
    });

    // Extract text response
    // Handle both text and JSON response formats
    if (typeof response === 'string') {
      return response;
    } else if (response && typeof response === 'object') {
      // Handle structured responses
      if ('response' in response) {
        return String(response.response);
      } else if ('description' in response) {
        return String(response.description);
      } else if ('text' in response) {
        return String(response.text);
      }
      // Fallback: try to serialize
      return JSON.stringify(response);
    }

    return String(response);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

