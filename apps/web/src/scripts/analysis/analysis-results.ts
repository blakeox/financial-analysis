/**
 * Utility for storing and retrieving analysis results
 * This allows the chat panel to access outputs from the current page
 */

import {
  dispatchAnalysisResultUpdated,
  mapToolNameToModelType,
  type AnalysisResultEventDetail,
} from './analysis-event-contract';

export type { AnalysisResultEventDetail } from './analysis-event-contract';
export {
  ANALYSIS_ENGINE_MODEL_TYPES,
  hasAnalysisEngine,
  mapToolNameToModelType,
  normalizeAnalysisResultEventDetail,
} from './analysis-event-contract';

export type AnalysisResults = Record<string, unknown>;

declare global {
  interface Window {
    analysisResults?: AnalysisResults;
  }
}

/**
 * Store analysis result for a specific tool
 */
export function storeAnalysisResult(toolName: string, result: unknown): void {
  if (typeof window === 'undefined') return;

  if (!window.analysisResults) {
    window.analysisResults = {};
  }

  const modelType = mapToolNameToModelType(toolName);
  window.analysisResults[toolName] = result;

  const resultsContainer = document.getElementById('results');
  if (resultsContainer) {
    resultsContainer.setAttribute('data-tool-name', toolName);
    resultsContainer.setAttribute('data-model-type', modelType);
    resultsContainer.setAttribute('data-analysis-result', JSON.stringify(result));
  }

  const detail: AnalysisResultEventDetail = { modelType, result, toolName };
  dispatchAnalysisResultUpdated(detail);

  if (import.meta.env.DEV) {
    console.log(`[AnalysisResults] Stored result for ${toolName} (modelType: ${modelType})`);
  }
}

/**
 * Get analysis result for a specific tool
 */
export function getAnalysisResult(toolName: string): unknown | null {
  if (typeof window === 'undefined') return null;
  return window.analysisResults?.[toolName] ?? null;
}

/**
 * Get all analysis results
 */
export function getAllAnalysisResults(): AnalysisResults {
  if (typeof window === 'undefined') return {};
  return window.analysisResults ?? {};
}

/**
 * Clear analysis result for a specific tool
 */
export function clearAnalysisResult(toolName: string): void {
  if (typeof window === 'undefined') return;

  if (window.analysisResults) {
    delete window.analysisResults[toolName];
  }

  const resultsContainer = document.getElementById('results');
  if (resultsContainer) {
    resultsContainer.removeAttribute('data-tool-name');
    resultsContainer.removeAttribute('data-model-type');
    resultsContainer.removeAttribute('data-analysis-result');
  }
}

/**
 * Clear all analysis results
 */
export function clearAllAnalysisResults(): void {
  if (typeof window === 'undefined') return;
  window.analysisResults = {};
}
