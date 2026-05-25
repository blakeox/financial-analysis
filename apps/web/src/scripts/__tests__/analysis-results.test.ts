import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAllAnalysisResults,
  clearAnalysisResult,
  getAllAnalysisResults,
  getAnalysisResult,
  storeAnalysisResult,
} from '../analysis/analysis-results';

declare global {
  interface Window {
    analysisResults?: Record<string, unknown>;
  }
}

describe('analysis-results', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="results"></div>';
    clearAllAnalysisResults();
  });

  it('stores and retrieves analysis results', () => {
    storeAnalysisResult('analyze_auto', { status: 'ok' });

    expect(getAnalysisResult('analyze_auto')).toEqual({ status: 'ok' });
    expect(getAllAnalysisResults()).toEqual({ analyze_auto: { status: 'ok' } });
  });

  it('syncs DOM dataset and emits event with modelType when storing', () => {
    const listener = vi.fn();
    window.addEventListener('analysis-result-updated', listener);

    storeAnalysisResult('analyze_debt_payoff', { result: 123 });

    const resultsNode = document.getElementById('results');
    expect(resultsNode?.getAttribute('data-tool-name')).toBe('analyze_debt_payoff');
    expect(resultsNode?.getAttribute('data-model-type')).toBe('debt-payoff');
    expect(resultsNode?.getAttribute('data-analysis-result')).toBe(JSON.stringify({ result: 123 }));
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls[0][0].detail).toEqual({
      toolName: 'analyze_debt_payoff',
      modelType: 'debt-payoff',
      result: { result: 123 },
    });
  });

  it('clears a specific result and removes DOM data attributes', () => {
    storeAnalysisResult('analyze_auto', { value: 'foo' });

    clearAnalysisResult('analyze_auto');

    expect(getAnalysisResult('analyze_auto')).toBeNull();
    const resultsNode = document.getElementById('results');
    expect(resultsNode?.getAttribute('data-tool-name')).toBeNull();
    expect(resultsNode?.getAttribute('data-model-type')).toBeNull();
    expect(resultsNode?.getAttribute('data-analysis-result')).toBeNull();
  });

  it('clears all analysis results', () => {
    storeAnalysisResult('first', 1);
    storeAnalysisResult('second', 2);

    clearAllAnalysisResults();

    expect(getAllAnalysisResults()).toEqual({});
    expect(window.analysisResults).toEqual({});
  });
});
