/**
 * DSCR Calculator Client Script
 */

import { storeAnalysisResult } from '../analysis/analysis-results';
import { renderMetricCards } from '../_shared/metric-card-html';
import { hideError, hideLoading, showError, showLoading } from '../../utils/calculator-utilities';

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
  const ratio = Number(record.ratio) || 0;
  const status = String(record.status ?? 'unknown');
  const margin = Number(record.margin) || 0;
  const targetRatio = Number(record.targetRatio) || 1.25;
  const breakdown =
    record.breakdown && typeof record.breakdown === 'object'
      ? (record.breakdown as Record<string, unknown>)
      : {};

  const toneForStatus =
    status === 'excellent' || status === 'good'
      ? 'emerald'
      : status === 'marginal'
        ? 'amber'
        : 'orange';

  summaryCards.innerHTML = renderMetricCards([
    {
      title: 'DSCR',
      value: `${ratio.toFixed(2)}x`,
      meta: status.replace(/-/g, ' '),
      tone: toneForStatus,
    },
    {
      title: 'Target',
      value: `${targetRatio}x`,
      meta: 'typical lender minimum',
      tone: 'violet',
    },
    {
      title: 'vs Target',
      value: margin >= 0 ? `+${margin.toFixed(2)}x` : `${margin.toFixed(2)}x`,
      meta: margin >= 0 ? 'above target' : 'below target',
      tone: margin >= 0 ? 'emerald' : 'orange',
    },
    {
      title: 'EBITDA',
      value: `$${Number(breakdown.ebitda || 0).toLocaleString()}`,
      meta: 'annual',
      tone: 'violet',
    },
  ]);

  resultsContainer.classList.remove('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initDscrCalculator(): void {
  const form = document.getElementById('calculator-form') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const calculateBtn = document.getElementById('calculate-btn') as HTMLButtonElement | null;

    try {
      showLoading(calculateBtn ?? undefined);
      hideError();

      const newLoanPayment = parseNumber(form, 'newLoanPayment');
      const input = {
        ebitda: parseNumber(form, 'ebitda'),
        annualDebtService: parseNumber(form, 'annualDebtService'),
        existingDebtService: parseNumber(form, 'existingDebtService'),
        newLoanPayment: newLoanPayment > 0 ? newLoanPayment : undefined,
      };

      const response = await fetch('/api/analyze-dscr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error((error as { message?: string }).message || 'Failed to calculate DSCR');
      }

      const result = await response.json();
      displayResults(result);
      storeAnalysisResult('analyze_dscr', result);
    } catch (error) {
      console.error('DSCR error:', error);
      showError(error instanceof Error ? error.message : 'Failed to calculate DSCR');
    } finally {
      hideLoading(calculateBtn ?? undefined);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDscrCalculator);
} else {
  initDscrCalculator();
}
