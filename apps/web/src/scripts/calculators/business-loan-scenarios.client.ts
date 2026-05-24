/**
 * Business Loan Scenarios Calculator Client Script
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

function getText(form: HTMLFormElement, name: string): string {
  return (form.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() ?? '';
}

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
  const comparison =
    record.comparison && typeof record.comparison === 'object'
      ? (record.comparison as Record<string, unknown>)
      : {};
  const cheapest =
    comparison.cheapest && typeof comparison.cheapest === 'object'
      ? (comparison.cheapest as Record<string, unknown>)
      : {};
  const lowestPayment =
    comparison.lowestPayment && typeof comparison.lowestPayment === 'object'
      ? (comparison.lowestPayment as Record<string, unknown>)
      : {};

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'Lowest Total Cost',
      value: String(cheapest.scenario ?? '—'),
      meta: formatCurrency(Number(cheapest.totalCost) || 0),
      tone: 'emerald',
    },
    {
      title: 'Lowest Payment',
      value: String(lowestPayment.scenario ?? '—'),
      meta: `${formatCurrency(Number(lowestPayment.monthlyPayment) || 0)}/mo`,
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initBusinessLoanScenariosCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const scenarios = [];
      const name1 = getText(form, 'scenario1Name');
      if (name1) {
        scenarios.push({
          name: name1,
          term: Math.round(parseNumber(form, 'scenario1Term')) || 5,
          rate: parseNumber(form, 'scenario1Rate') / 100,
        });
      }
      const name2 = getText(form, 'scenario2Name');
      if (name2) {
        scenarios.push({
          name: name2,
          term: Math.round(parseNumber(form, 'scenario2Term')) || 7,
          rate: parseNumber(form, 'scenario2Rate') / 100,
        });
      }

      const input = {
        loanAmount: parseNumber(form, 'loanAmount'),
        scenarios,
        currentDebtPayments: parseNumber(form, 'currentDebtPayments'),
      };

      const response = await fetch('/api/analyze-business-loan-scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string }).message || 'Failed to compare loan scenarios'
        );
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_business_loan_scenarios', result);

      document.getElementById('results')?.classList.remove('hidden');
    } catch (error) {
      console.error('Loan scenarios error:', error);
      showError(error instanceof Error ? error.message : 'Failed to compare loan scenarios');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBusinessLoanScenariosCalculator);
  } else {
    initBusinessLoanScenariosCalculator();
  }
}
