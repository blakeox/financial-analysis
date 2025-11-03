/**
 * Message Builder Service
 * Builds prompts from templates with variable substitution and examples
 */

import { buildPrompt } from '../prompts/prompt-templates';

export interface MessageBuildOptions {
  templateName: string;
  variables: Record<string, unknown>;
  examples?: Array<{ input: string; output: string }>;
  outputFormat?: string;
  conversationHistory?: string;
}

export interface BuiltMessage {
  prompt: string;
  systemPrompt?: string | undefined;
  totalLength: number;
}

export class MessageBuilder {
  /**
   * Build a message from a template with variables
   */
  build(options: MessageBuildOptions): BuiltMessage {
    const { templateName, variables, conversationHistory } = options;

    // Build prompt using template
    // Add conversation history to variables if present
    const context = conversationHistory 
      ? { ...variables, conversationHistory }
      : variables;

    const prompt = buildPrompt(templateName, context);

    // Split into system and user prompts if possible
    const { systemPrompt, userPrompt } = this.splitPrompt(prompt);

    return {
      prompt: userPrompt,
      systemPrompt,
      totalLength: prompt.length,
    };
  }

  /**
   * Build a custom message without templates
   */
  buildCustom(options: {
    system?: string;
    user: string;
    examples?: Array<{ input: string; output: string }>;
    context?: Record<string, unknown>;
  }): BuiltMessage {
    const { system, user, examples, context } = options;

    let prompt = '';

    // Add system message if provided
    if (system) {
      prompt += `${system}\n\n`;
    }

    // Add examples if provided
    if (examples && examples.length > 0) {
      prompt += 'Examples:\n';
      for (const ex of examples) {
        prompt += `Input: ${ex.input}\nOutput: ${ex.output}\n\n`;
      }
    }

    // Add user message
    prompt += user;

    // Add context if provided
    if (context && Object.keys(context).length > 0) {
      prompt += `\n\nContext:\n${JSON.stringify(context, null, 2)}`;
    }

    // Split into system and user prompts
    const { systemPrompt, userPrompt } = this.splitPrompt(prompt);

    return {
      prompt: userPrompt,
      systemPrompt,
      totalLength: prompt.length,
    };
  }

  /**
   * Split prompt into system and user parts
   */
  private splitPrompt(prompt: string): { systemPrompt?: string | undefined; userPrompt: string } {
    // Look for system instruction markers
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

    // If we found a system section, split it
    if (systemEndIndex > 0 && systemEndIndex < lines.length - 1) {
      const systemLines = lines.slice(0, systemEndIndex + 1);
      const userLines = lines.slice(systemEndIndex + 1);

      return {
        systemPrompt: systemLines.join('\n'),
        userPrompt: userLines.join('\n').trim(),
      };
    }

    // No clear split, return entire prompt as user
    return {
      userPrompt: prompt.trim(),
    };
  }

  /**
   * Estimate token count for a message
   */
  estimateTokens(text: string): number {
    // Simple estimation: ~4 characters per token on average
    // This is rough and could be improved with actual tokenizer
    return Math.ceil(text.length / 4);
  }

  /**
   * Truncate message to fit within token limit
   */
  truncateToTokens(text: string, maxTokens: number): string {
    const currentTokens = this.estimateTokens(text);
    
    if (currentTokens <= maxTokens) {
      return text;
    }

    // Reduce by excess tokens (rough estimate)
    const excessTokens = currentTokens - maxTokens;
    const excessChars = excessTokens * 4;
    const targetLength = text.length - excessChars;

    return text.substring(0, Math.max(0, targetLength)) + '...';
  }
}

