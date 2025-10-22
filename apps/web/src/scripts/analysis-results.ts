/**
 * Utility for storing and retrieving analysis results
 * This allows the chat panel to access outputs from the current page
 */

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
  
  window.analysisResults[toolName] = result;
  
  // Also store in data attribute on results container if it exists
  const resultsContainer = document.getElementById('results');
  if (resultsContainer) {
    resultsContainer.setAttribute('data-tool-name', toolName);
    resultsContainer.setAttribute('data-analysis-result', JSON.stringify(result));
  }
  
  // Notify chat panel of new results
  const event = new CustomEvent('analysis-result-updated', {
    detail: { toolName, result }
  });
  window.dispatchEvent(event);
  
  if (import.meta.env.DEV) {
    console.log(`[AnalysisResults] Stored result for tool: ${toolName}`);
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
