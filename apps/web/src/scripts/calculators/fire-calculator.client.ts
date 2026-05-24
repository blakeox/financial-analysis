/**
 * FIRE Calculator Client Script
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
  const yearsToFire =
    summary.yearsToFIRE ??
    (record.yearsToFIRE && typeof record.yearsToFIRE === 'object'
      ? (record.yearsToFIRE as Record<string, unknown>).years
      : record.yearsToFIRE);

  const onTrack = Boolean(summary.onTrack);
  const fireNumber = Number(summary.fireNumber ?? record.fireNumber) || 0;

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'FIRE Number',
      value: formatCurrency(fireNumber),
      meta: 'portfolio target',
      tone: 'primary',
      spanCols: 2,
    },
    {
      title: 'Years to FIRE',
      value: typeof yearsToFire === 'number' ? yearsToFire.toFixed(1) : '—',
      meta: summary.projectedRetirementAge
        ? `retire around age ${summary.projectedRetirementAge}`
        : undefined,
      tone: onTrack ? 'emerald' : 'amber',
    },
    {
      title: 'Savings Gap',
      value: formatCurrency(Number(summary.savingsNeeded) || 0),
      meta: onTrack ? 'On track' : 'Additional savings needed',
      tone: onTrack ? 'emerald' : 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initFireCalculator(): void {
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
          age: Math.round(parseNumber(form, 'age')) || 30,
          currentSavings: parseNumber(form, 'currentSavings'),
          annualIncome: parseNumber(form, 'annualIncome'),
          annualExpenses: parseNumber(form, 'annualExpenses'),
          monthlySavings: parseNumber(form, 'monthlySavings'),
        },
        fireGoals: {
          targetAge: Math.round(parseNumber(form, 'targetAge')) || 65,
          annualExpensesInRetirement: parseNumber(form, 'annualExpensesInRetirement'),
          safeWithdrawalRate: parseNumber(form, 'safeWithdrawalRate') / 100 || 0.04,
          fireType: 'traditional',
        },
        assumptions: {
          expectedReturn: parseNumber(form, 'expectedReturn') / 100 || 0.07,
          inflationRate: 0.03,
          incomeGrowth: 0.03,
          expenseReduction: 0,
        },
        analysis: {
          includeProjections: true,
          includeScenarios: true,
          includeExpenseOptimization: true,
        },
      };

      const response = await fetch('/api/analyze-fire-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to calculate FIRE');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_fire_calculator', result);

      document.getElementById('results')?.classList.remove('hidden');
    } catch (error) {
      console.error('FIRE Calculator error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate FIRE');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFireCalculator);
  } else {
    initFireCalculator();
  }
}
