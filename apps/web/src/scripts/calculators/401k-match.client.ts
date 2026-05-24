/**
 * 401(k) Employer Match Optimizer Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import {
  formatCurrency,
  hideError,
  hideLoading,
  showError,
  showLoading,
} from '../../utils/calculator-utilities';

function parseNumber(form: HTMLFormElement, name: string): number {
  const raw = (form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? '';
  const parsed = Number.parseFloat(raw.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRate(form: HTMLFormElement, name: string): number {
  const pct = parseNumber(form, name);
  return pct > 1 ? pct / 100 : pct;
}

function displayResults(result: unknown): void {
  const summaryCards = document.getElementById('summary-cards');
  const resultsContainer = document.getElementById('results-container');
  const resultsSection = document.getElementById('results-section');

  if (!summaryCards || !resultsContainer || !resultsSection) return;

  const record = result && typeof result === 'object' ? (result as Record<string, unknown>) : {};
  const summary =
    record.summary && typeof record.summary === 'object'
      ? (record.summary as Record<string, unknown>)
      : record;

  const currentMatch = Number(summary.currentMatch) || 0;
  const maximumMatch = Number(summary.maximumMatch) || 0;
  const matchLeft = Number(summary.matchLeftOnTable) || 0;
  const optimalPct = Number(summary.optimalContribution) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Current Match',
      value: formatCurrency(currentMatch),
      meta: 'annual employer contribution',
      tone: 'violet',
    },
    {
      title: 'Maximum Match',
      value: formatCurrency(maximumMatch),
      tone: 'emerald',
    },
    {
      title: 'Left on Table',
      value: formatCurrency(matchLeft),
      meta: matchLeft > 0 ? 'increase contributions' : 'fully captured',
      tone: matchLeft > 0 ? 'orange' : 'emerald',
    },
    {
      title: 'Optimal Contribution',
      value: optimalPct > 0 ? `${(optimalPct * 100).toFixed(1)}%` : '—',
      meta: 'of salary to max match',
      tone: 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function init401kMatchCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const input = {
        planDetails: {
          employerMatch: parseRate(form, 'employerMatch'),
          matchLimit: parseRate(form, 'matchLimit'),
          vestingSchedule:
            (form.elements.namedItem('vestingSchedule') as HTMLSelectElement)?.value || 'immediate',
          vestingYears: 0,
          currentVestingPercentage: 1,
        },
        employeeInfo: {
          annualSalary: parseNumber(form, 'annualSalary'),
          currentContribution: parseRate(form, 'currentContribution'),
          currentBalance: 0,
          yearsOfService: 0,
        },
        analysis: {
          includeMaximization: true,
          includeVestingAnalysis: true,
          includeTaxAnalysis: true,
        },
      };

      const response = await fetch('/api/analyze-401k-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to optimize 401(k) match'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_401k_match', result);
    } catch (error) {
      console.error('401(k) Match error:', error);
      showError(error instanceof Error ? error.message : 'Failed to optimize 401(k) match');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init401kMatchCalculator);
} else {
  init401kMatchCalculator();
}
