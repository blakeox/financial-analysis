/**
 * LLM Service Factory
 * Creates and configures LLM services for use in endpoints
 */

import type { Env } from '../types';
import { LLMOrchestrator } from './llm-orchestrator';

/**
 * Create a configured LLM orchestrator instance
 */
export function createLLMOrchestrator(env: Env): LLMOrchestrator {
  if (!env.AI) {
    throw new Error('AI binding not configured');
  }

  return new LLMOrchestrator(env.AI, env);
}

/**
 * Check if orchestrator can be created
 */
export function canCreateOrchestrator(env: Env): boolean {
  return !!env.AI;
}
