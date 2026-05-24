/**
 * Emergency Fund Calculator Client Script
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

  const targetFund = Number(summary.targetFund) || 0;
  const currentFund = Number(summary.currentFund) || 0;
  const shortfall = Number(summary.shortfall) || Math.max(0, targetFund - currentFund);
  const onTrack = Boolean(summary.onTrack ?? currentFund >= targetFund);
  const monthsToBuild = Number(summary.monthsToBuild) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Target Fund',
      value: formatCurrency(targetFund),
      meta: onTrack ? 'Goal met' : `${formatCurrency(shortfall)} remaining`,
      tone: onTrack ? 'emerald' : 'violet',
    },
    {
      title: 'Current Savings',
      value: formatCurrency(currentFund),
      tone: 'violet',
    },
    {
      title: 'Months to Build',
      value: monthsToBuild > 0 ? `${monthsToBuild}` : '—',
      meta: monthsToBuild > 0 ? 'at current savings rate' : 'increase monthly savings',
      tone: monthsToBuild > 0 && monthsToBuild <= 24 ? 'emerald' : 'orange',
    },
    {
      title: 'Status',
      value: onTrack ? 'On track' : 'Building',
      tone: onTrack ? 'emerald' : 'amber',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initEmergencyFundCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const input = {
        currentSituation: {
          monthlyExpenses: parseNumber(form, 'monthlyExpenses'),
          monthlyIncome: parseNumber(form, 'monthlyIncome'),
          currentEmergencyFund: parseNumber(form, 'currentEmergencyFund'),
          dependents: Math.round(parseNumber(form, 'dependents')),
          employmentStatus:
            (form.elements.namedItem('employmentStatus') as HTMLSelectElement)?.value || 'employed',
        },
        goals: {
          targetMonths: Math.round(parseNumber(form, 'targetMonths')) || 6,
          priority: 'build-gradually',
        },
        assumptions: {
          monthlySavings: parseNumber(form, 'monthlySavings'),
          expectedReturn: parseNumber(form, 'expectedReturn') / 100 || 0.02,
        },
        analysis: {
          includeTimeline: true,
          includeScenarios: true,
        },
      };

      const response = await fetch('/api/analyze-emergency-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to calculate emergency fund'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_emergency_fund', result);

      document.getElementById('results')?.classList.remove('hidden');
    } catch (error) {
      console.error('Emergency Fund error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate emergency fund');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmergencyFundCalculator);
  } else {
    initEmergencyFundCalculator();
  }
}
