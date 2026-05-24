/**
 * Multi-Model Scenario Analysis Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

function unwrapScenarioResult(result: unknown): Record<string, unknown> {
  if (!result || typeof result !== 'object') return {};

  const record = result as Record<string, unknown>;
  if (record.scenario) return record;

  const content = record.content;
  if (Array.isArray(content)) {
    for (const item of content) {
      if (item && typeof item === 'object' && 'text' in item) {
        try {
          const parsed = JSON.parse(String((item as { text: string }).text));
          if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>;
        } catch {
          /* ignore non-JSON chunks */
        }
      }
    }
  }

  return record;
}

function buildInput(formData: FormData): Record<string, unknown> {
  return {
    scenarioId: formData.get('scenarioId') || 'young-professional',
    userProfile: {
      age: parseInt((formData.get('userAge') as string) || '35', 10),
      income: parseFloat((formData.get('userIncome') as string) || '0'),
      maritalStatus: 'single',
      dependents: 0,
      riskTolerance: (formData.get('riskTolerance') as string) || 'moderate',
    },
    currentProgress: {
      completedModels: [],
      currentModel: null,
      overallProgress: 0,
    },
    analysisType: 'comprehensive',
  };
}

function displayResults(result: unknown): void {
  const resultsDiv = document.getElementById('scenario-results');
  const contentDiv = document.getElementById('scenario-results-content');
  if (!resultsDiv || !contentDiv) return;

  const record = unwrapScenarioResult(result);
  const scenario =
    record.scenario && typeof record.scenario === 'object'
      ? (record.scenario as Record<string, unknown>)
      : {};
  const progress =
    scenario.progress && typeof scenario.progress === 'object'
      ? (scenario.progress as Record<string, unknown>)
      : {};

  const pct = Number(progress.percentage) || 0;
  const completed = Number(progress.completed) || 0;
  const total = Number(progress.total) || 0;

  contentDiv.innerHTML = renderMetricCards([
    {
      title: 'Scenario',
      value: String(scenario.name ?? scenario.id ?? '—'),
      tone: 'primary',
    },
    {
      title: 'Progress',
      value: `${pct}%`,
      meta: `${completed}/${total} models`,
      tone: pct >= 50 ? 'emerald' : 'amber',
    },
    {
      title: 'Completed',
      value: String(completed),
      tone: 'violet',
    },
    {
      title: 'Remaining',
      value: String(Math.max(0, total - completed)),
      tone: 'orange',
    },
  ]);

  resultsDiv.classList.remove('hidden');
  resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initScenarioAnalysisCalculator(): void {
  const form = document.getElementById('scenario-analysis-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      showLoading();
      hideError();

      const response = await fetch('/api/multi-model-scenario-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildInput(new FormData(form))),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to analyze scenario');
      }

      const result = await response.json();
      const payload = unwrapScenarioResult(result);
      displayResults(payload);
      storeAnalysisResult('multi_model_scenario_analysis', payload);
    } catch (error) {
      console.error('Scenario analysis error:', error);
      showError(error instanceof Error ? error.message : 'Failed to analyze scenario');
    } finally {
      hideLoading();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScenarioAnalysisCalculator);
} else {
  initScenarioAnalysisCalculator();
}
